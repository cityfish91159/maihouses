import { supabase } from '../lib/supabase';
import { Agent, Imported591Data } from '../lib/types';
import { computeAddressFingerprint, normalizeCommunityName } from '../utils/address';
import { logger } from '../lib/logger';
import { isDemoPropertyId } from '../constants/property';
import { z } from 'zod';

/**
 * Google 級別防禦性驗證 Schema (SSOT)
 * 確保 Service 層不接受任何非法資料
 */
const PropertyFormSchema = z
  .object({
    title: z.string().min(1, '標題必填').max(100, '標題太長'),
    price: z.string().min(1, '價格必填'),
    address: z.string().min(5, '地址太短').max(200, '地址太長'),
    communityName: z.string().min(1, '社區名稱必填'),
    advantage1: z.string().max(100),
    advantage2: z.string().max(100),
    disadvantage: z.string().min(10, '缺點至少需要 10 個字').max(200),
    highlights: z.array(z.string()).optional(),
    trustEnabled: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // 動態驗證邏輯：若有 AI 亮點標籤，優點字數門檻降低至 2 字 (標籤長度)
      const hasHighlights = (data.highlights?.length || 0) > 0;
      const minAdvLength = hasHighlights ? 2 : 5;
      return data.advantage1.length >= minAdvLength && data.advantage2.length >= minAdvLength;
    },
    {
      message: '優點描述字數不足 (若無 AI 標籤，優點需至少 5 字；有標籤則需至少 2 字)',
      path: ['advantage1'],
    }
  );

const UPLOAD_CONFIG = {
  CONCURRENCY: 3,
  CACHE_CONTROL: '31536000', // 1 年快取
  BUCKET: 'property-images',
} as const;

/**
 * BE-1: RPC 回傳結構 Zod Schema
 * 取代 `as` 類型斷言，確保類型安全
 */
const CreatePropertyRpcResultSchema = z.object({
  success: z.boolean(),
  id: z.string().uuid().optional(),
  public_id: z.string().optional(),
  error: z.string().optional(),
});

// 定義物件資料介面
export interface PropertyData {
  id: string;
  publicId: string;
  title: string;
  price: number;
  address: string;
  description: string;
  images: string[];
  agent: Agent;
  sourcePlatform?: 'MH' | '591';
  size?: number;
  rooms?: number;
  halls?: number;
  bathrooms?: number;
  floorCurrent?: string;
  floorTotal?: number;
  features?: string[];
  // 結構化評價欄位
  advantage1?: string;
  advantage2?: string;
  disadvantage?: string;
  // 安心留痕：房仲上傳時選擇是否開啟，影響詳情頁徽章顯示
  trustEnabled?: boolean;
  // 演示用物件（mock/demo）
  isDemo?: boolean;
}

// 上傳表單輸入介面
export interface PropertyFormInput {
  title: string;
  price: string;
  address: string;
  communityName: string; // 社區名稱
  size: string;
  age: string;
  floorCurrent: string;
  floorTotal: string;
  rooms: string;
  halls: string;
  bathrooms: string;
  type: string;
  description: string;
  advantage1: string;
  advantage2: string;
  disadvantage: string;
  highlights?: string[]; // 新增：重點膠囊陣列
  images: string[]; // 新增：圖片 URL 陣列
  sourceExternalId: string;
  // 安心留痕：上傳表單的開關狀態，存入 DB trust_enabled 欄位
  trustEnabled?: boolean;
}

// 定義 Property 建立結果
export interface CreatePropertyResult {
  id: string;
  public_id: string;
  community_id: string | null;
  community_name: string | null;
  is_new_community: boolean;
}

// ============================================
// NASA Safety: 拆分 createPropertyWithForm 的 Helper Functions
// 每個函數控制在 50 行以內，單一職責
// ============================================

/** 驗證表單並取得 agentId */
async function validateAndGetAgent(form: PropertyFormInput): Promise<string> {
  // 🛡️ 防禦性驗證：Service 層不信任 Client 資料
  const validation = PropertyFormSchema.safeParse(form);
  if (!validation.success) {
    const errorMsg = validation.error.issues.map((e) => e.message).join(', ');
    throw new Error(`資料驗證失敗: ${errorMsg}`);
  }

  // 確認登入狀態
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 嚴格權限控管：生產環境必須登入
  if (!user && !import.meta.env.DEV) {
    throw new Error('請先登入 (權限不足)');
  }

  // 若未登入且在開發模式，使用預設 agent_id
  const agentId = user?.id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  if (!user && import.meta.env.DEV) {
    logger.warn('[DEV] 使用 Mock Agent ID 發佈物件');
  }

  return agentId;
}

/** 社區處理結果 */
interface CommunityResolution {
  communityId: string | null;
  communityName: string | null;
  isNewCommunity: boolean;
}

/** 解析或建立社區 */
async function resolveOrCreateCommunity(
  form: PropertyFormInput,
  existingCommunityId?: string
): Promise<CommunityResolution> {
  let communityId: string | null = existingCommunityId || null;
  let finalCommunityName = form.communityName?.trim() || null;
  let isNewCommunity = false;

  // 「無社區」直接跳過
  if (finalCommunityName === '無') {
    return { communityId: null, communityName: '無', isNewCommunity: false };
  }

  // 已選擇現有社區
  if (existingCommunityId) {
    return {
      communityId,
      communityName: finalCommunityName,
      isNewCommunity: false,
    };
  }

  // 需要查找或建立社區
  if (!form.address || !finalCommunityName) {
    return {
      communityId: null,
      communityName: finalCommunityName,
      isNewCommunity: false,
    };
  }

  const addressFingerprint = computeAddressFingerprint(form.address);

  // Step 1: 用地址指紋精準比對
  communityId = await findCommunityByFingerprint(addressFingerprint);

  // Step 2: 用社區名稱比對
  if (!communityId) {
    const result = await findCommunityByName(finalCommunityName, form.address);
    if (result) {
      communityId = result.id;
      finalCommunityName = result.name;
    }
  }

  // Step 3: 建立新社區
  if (!communityId) {
    const newId = await createNewCommunity(form, addressFingerprint);
    if (newId) {
      communityId = newId;
      isNewCommunity = true;
    }
  }

  return { communityId, communityName: finalCommunityName, isNewCommunity };
}

/** 用地址指紋查找社區 */
async function findCommunityByFingerprint(fingerprint: string): Promise<string | null> {
  if (fingerprint.length < 5) return null;

  const { data } = await supabase
    .from('communities')
    .select('id')
    .eq('address_fingerprint', fingerprint)
    .single();

  return data?.id || null;
}

/** 用社區名稱查找社區 */
async function findCommunityByName(
  name: string,
  address: string
): Promise<{ id: string; name: string } | null> {
  if (name.length < 2) return null;

  const normalizedInput = normalizeCommunityName(name);
  const district = address.match(/([^市縣]+[區鄉鎮市])/)?.[1] || '';

  // 同區域比對
  const { data: candidates } = await supabase
    .from('communities')
    .select('id, name')
    .eq('district', district)
    .limit(50);

  if (candidates && candidates.length > 0) {
    const matched = candidates.find((c) => normalizeCommunityName(c.name) === normalizedInput);
    if (matched) return matched;
  }

  // 跨區域精確比對
  const { data: exactMatch } = await supabase
    .from('communities')
    .select('id, name')
    .eq('name', name)
    .single();

  return exactMatch || null;
}

/** 建立新社區 */
async function createNewCommunity(
  form: PropertyFormInput,
  addressFingerprint: string
): Promise<string | null> {
  const district = form.address.match(/([^市縣]+[區鄉鎮市])/)?.[1] || '';
  const city = form.address.match(/^(.*?[市縣])/)?.[1] || '台北市';

  const { data, error } = await supabase
    .from('communities')
    .insert({
      name: form.communityName?.trim(),
      address: form.address,
      address_fingerprint: addressFingerprint,
      district,
      city,
      is_verified: false,
      completeness_score: 20,
      features: [form.type].filter(Boolean),
    })
    .select('id')
    .single();

  if (error) {
    logger.error('建立社區失敗', { error });
    return null;
  }

  return data?.id || null;
}

// ============================================
// 定義 Service 介面 (Explicit Interface)
// NOTE: linkCommunityReview 已移至 RPC fn_create_property_with_review
export interface PropertyService {
  getPropertyByPublicId(publicId: string): Promise<PropertyData | null>;
  createProperty(data: Imported591Data, agentId: string): Promise<CreatePropertyResult>;
  uploadImages(
    files: File[],
    options?: {
      concurrency?: number;
      onProgress?: (completed: number, total: number) => void;
    }
  ): Promise<{
    urls: string[];
    failed: { file: File; error: string }[];
    allSuccess: boolean;
  }>;
  deleteImages(urls: string[]): Promise<void>;
  uploadImagesLegacy(files: File[]): Promise<string[]>;
  createPropertyWithForm(
    form: PropertyFormInput,
    images: string[],
    existingCommunityId?: string
  ): Promise<CreatePropertyResult>;
  checkCommunityExists(
    name: string
  ): Promise<{ exists: boolean; community?: { id: string; name: string } }>;
}

// 預設資料 (Fallback Data) - 用於初始化或錯誤時，確保畫面不崩壞
export const DEFAULT_PROPERTY: PropertyData = {
  id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  publicId: 'MH-100001',
  title: '',
  price: 0,
  address: '',
  description: '',
  images: [],
  size: 0,
  rooms: 0,
  halls: 0,
  bathrooms: 0,
  floorCurrent: '',
  floorTotal: 0,
  features: [],
  advantage1: '',
  advantage2: '',
  disadvantage: '',
  trustEnabled: true,
  isDemo: false,
  agent: {
    id: '',
    internalCode: 0,
    name: '',
    avatarUrl: '',
    company: '',
    trustScore: 0,
    encouragementCount: 0,
  },
};

export const propertyService: PropertyService = {
  // 1. 獲取物件詳情
  getPropertyByPublicId: async (publicId: string): Promise<PropertyData | null> => {
    const isDemo = isDemoPropertyId(publicId);
    const coerceNumber = (value: unknown): number | null => {
      if (value == null) return null;
      if (typeof value === 'number') return Number.isFinite(value) ? value : null;
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return null;
        const parsed = Number(trimmed);
        return Number.isFinite(parsed) ? parsed : null;
      }
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const coerceNonEmptyString = (value: unknown): string | null => {
      if (typeof value !== 'string') return null;
      const trimmed = value.trim();
      return trimmed ? trimmed : null;
    };

    try {
      // 嘗試從 Supabase 讀取正式資料
      const { data, error } = await supabase
        .from('properties')
        .select(
          `
          *,
          agent:agents (*)
        `
        )
        .eq('public_id', publicId)
        .single();

      if (error || !data) {
        logger.warn('查無正式資料，使用預設資料', { error });
        // 如果是開發環境或特定 ID，回傳預設資料以維持畫面
        if (isDemo || import.meta.env.DEV) {
          return { ...DEFAULT_PROPERTY, publicId, isDemo };
        }
        return null;
      }

      const result: PropertyData = {
        id: data.id,
        publicId: data.public_id,
        title: data.title,
        price: Number(data.price),
        address: data.address,
        description: data.description,
        images: data.images || [],
        sourcePlatform: data.source_platform,
        agent: {
          id: data.agent.id,
          internalCode: data.agent.internal_code,
          name: data.agent.name,
          avatarUrl: data.agent.avatar_url || 'https://via.placeholder.com/150',
          company: data.agent.company,
          trustScore: data.agent.trust_score,
          encouragementCount: data.agent.encouragement_count,
        },
        isDemo,
      };

      const size = coerceNumber(data.size);
      if (size != null) result.size = size;

      const rooms = coerceNumber(data.rooms);
      if (rooms != null) result.rooms = rooms;

      const halls = coerceNumber(data.halls);
      if (halls != null) result.halls = halls;

      const bathrooms = coerceNumber(data.bathrooms);
      if (bathrooms != null) result.bathrooms = bathrooms;

      const floorCurrent = coerceNonEmptyString(data.floor_current);
      if (floorCurrent) result.floorCurrent = floorCurrent;

      const floorTotal = coerceNumber(data.floor_total);
      if (floorTotal != null) result.floorTotal = floorTotal;

      if (Array.isArray(data.features)) result.features = data.features;
      if (data.advantage_1) result.advantage1 = data.advantage_1;
      if (data.advantage_2) result.advantage2 = data.advantage_2;
      if (data.disadvantage) result.disadvantage = data.disadvantage;
      // 安心留痕：DB 欄位為 trust_enabled，前端為 trustEnabled
      result.trustEnabled = data.trust_enabled ?? false;

      // 針對 Demo 物件：若 DB 有資料但缺少結構化欄位，回退到 DEFAULT_PROPERTY（只補缺的欄位）
      if (isDemo) {
        if (result.size == null && DEFAULT_PROPERTY.size != null)
          result.size = DEFAULT_PROPERTY.size;
        if (result.rooms == null && DEFAULT_PROPERTY.rooms != null)
          result.rooms = DEFAULT_PROPERTY.rooms;
        if (result.halls == null && DEFAULT_PROPERTY.halls != null)
          result.halls = DEFAULT_PROPERTY.halls;
        if (result.bathrooms == null && DEFAULT_PROPERTY.bathrooms != null)
          result.bathrooms = DEFAULT_PROPERTY.bathrooms;
        if (result.floorCurrent == null && DEFAULT_PROPERTY.floorCurrent != null)
          result.floorCurrent = DEFAULT_PROPERTY.floorCurrent;
        if (result.floorTotal == null && DEFAULT_PROPERTY.floorTotal != null)
          result.floorTotal = DEFAULT_PROPERTY.floorTotal;
        if (result.features == null && DEFAULT_PROPERTY.features != null)
          result.features = DEFAULT_PROPERTY.features;
        if (result.advantage1 == null && DEFAULT_PROPERTY.advantage1 != null)
          result.advantage1 = DEFAULT_PROPERTY.advantage1;
        if (result.advantage2 == null && DEFAULT_PROPERTY.advantage2 != null)
          result.advantage2 = DEFAULT_PROPERTY.advantage2;
        if (result.disadvantage == null && DEFAULT_PROPERTY.disadvantage != null)
          result.disadvantage = DEFAULT_PROPERTY.disadvantage;
      }

      return result;
    } catch (e) {
      logger.error('Service Error', { error: e });
      return { ...DEFAULT_PROPERTY, publicId, isDemo };
    }
  },

  // 2. 上傳物件 (舊版 - 保留相容性)
  createProperty: async (data: Imported591Data, agentId: string) => {
    // 不再前端生成 public_id，改由資料庫 Trigger 自動生成 (MH-100002, MH-100003...)
    const { data: result, error } = await supabase
      .from('properties')
      .insert({
        // public_id: 由 DB 自動生成
        title: data.title,
        price: data.price,
        address: data.address,
        description: data.description,
        images: data.images,
        source_platform: data.sourcePlatform,
        source_external_id: data.sourceExternalId,
        agent_id: agentId,
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  // 3. 上傳圖片 (UUID 防撞 + 並發限制 + 詳細錯誤回報)
  uploadImages: async (
    files: File[],
    options?: {
      concurrency?: number;
      onProgress?: (completed: number, total: number) => void;
    }
  ): Promise<{
    urls: string[];
    failed: { file: File; error: string }[];
    allSuccess: boolean;
  }> => {
    const concurrency = options?.concurrency || UPLOAD_CONFIG.CONCURRENCY;
    const results: string[] = [];
    const failed: { file: File; error: string }[] = [];
    let completed = 0;

    // 分批上傳（控制並發數）
    for (let i = 0; i < files.length; i += concurrency) {
      const batch = files.slice(i, i + concurrency);

      const batchPromises = batch.map(async (file) => {
        try {
          const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
          const fileName = `${crypto.randomUUID()}.${fileExt}`;

          const { error } = await supabase.storage
            .from(UPLOAD_CONFIG.BUCKET)
            .upload(fileName, file, {
              contentType: file.type,
              cacheControl: UPLOAD_CONFIG.CACHE_CONTROL,
            });

          if (error) {
            logger.error('Image upload error', { error });
            failed.push({ file, error: error.message });
            return null;
          }

          const { data } = supabase.storage.from('property-images').getPublicUrl(fileName);

          return data.publicUrl;
        } catch (e: unknown) {
          const errorMessage = e instanceof Error ? e.message : '上傳失敗';
          logger.error('Image upload exception', { error: e });
          failed.push({ file, error: errorMessage });
          return null;
        } finally {
          completed++;
          options?.onProgress?.(completed, files.length);
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter((url): url is string => !!url));
    }

    return {
      urls: results,
      failed,
      allSuccess: failed.length === 0,
    };
  },

  // 3.1 清理圖片 (補償機制)
  deleteImages: async (urls: string[]) => {
    if (!urls || urls.length === 0) return;

    // 從 URL 提取檔案名稱
    // 假設 URL 格式為: .../property-images/filename.jpg
    const fileNames = urls.map((url) => url.split('/').pop()).filter(Boolean) as string[];

    if (fileNames.length === 0) return;

    const { error } = await supabase.storage.from(UPLOAD_CONFIG.BUCKET).remove(fileNames);

    if (error) {
      logger.error('Failed to cleanup images', { error });
      // 這裡不拋出錯誤，因為這是清理流程，不應阻斷主流程的錯誤回報
    }
  },

  // 舊版相容：回傳純 URL 陣列
  uploadImagesLegacy: async (files: File[]): Promise<string[]> => {
    const result = await propertyService.uploadImages(files);
    return result.urls;
  },

  // 4. 建立物件 (NASA Safety 重構版 + Transaction 保護)
  // WHY: 使用 RPC 確保 property INSERT 與 community_review 在同一 Transaction
  createPropertyWithForm: async (
    form: PropertyFormInput,
    images: string[],
    existingCommunityId?: string
  ) => {
    // Step 1: 驗證並取得 agentId (27 行 helper)
    const agentId = await validateAndGetAgent(form);

    // Step 2: 解析或建立社區 (48 行 helper + 子函數)
    const { communityId, communityName, isNewCommunity } = await resolveOrCreateCommunity(
      form,
      existingCommunityId
    );

    // Step 3: 計算地址指紋與 features
    const addressFingerprint = form.address ? computeAddressFingerprint(form.address) : null;

    const features = Array.from(
      new Set([
        form.type,
        ...(form.highlights || []),
        ...(!form.highlights || form.highlights.length === 0
          ? [form.advantage1, form.advantage2]
          : []),
      ])
    ).filter(Boolean) as string[];

    // Step 4: 使用 RPC 原子性建立物件 + 社區評價
    // WHY: Transaction 保護，避免中途失敗導致資料不一致
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'fn_create_property_with_review',
      {
        p_agent_id: agentId,
        p_title: form.title,
        p_price: Number(form.price),
        p_address: form.address,
        p_address_fingerprint: addressFingerprint,
        p_community_name: communityName,
        p_community_id: communityId,
        p_size: Number(form.size || 0),
        p_age: Number(form.age || 0),
        p_rooms: Number(form.rooms),
        p_halls: Number(form.halls),
        p_bathrooms: Number(form.bathrooms),
        p_floor_current: form.floorCurrent,
        p_floor_total: Number(form.floorTotal || 0),
        p_property_type: form.type,
        p_advantage_1: form.advantage1,
        p_advantage_2: form.advantage2,
        p_disadvantage: form.disadvantage,
        p_description: form.description,
        p_images: images,
        p_features: features,
        p_source_platform: form.sourceExternalId ? '591' : 'MH',
        p_source_external_id: form.sourceExternalId || null,
        p_trust_enabled: Boolean(form.trustEnabled),
      }
    );

    if (rpcError) throw rpcError;

    // BE-1: 使用 Zod safeParse 取代 `as` 類型斷言
    const parseResult = CreatePropertyRpcResultSchema.safeParse(rpcResult);
    if (!parseResult.success) {
      logger.error('RPC response validation failed', {
        issues: parseResult.error.issues,
        rawResult: rpcResult,
      });
      throw new Error('RPC 回傳結構驗證失敗');
    }

    const result = parseResult.data;
    if (!result.success) {
      throw new Error(result.error || 'RPC failed');
    }

    // BE-1: 驗證必要欄位存在，success=true 時 id 和 public_id 必須有值
    if (!result.id || !result.public_id) {
      logger.error('RPC success but missing required fields', {
        id: result.id,
        public_id: result.public_id,
      });
      throw new Error('RPC 回傳成功但缺少必要欄位');
    }

    // Step 5: Audit Log
    logger.info('Property created', {
      propertyId: result.id,
      publicId: result.public_id,
      agentId,
      trustEnabled: Boolean(form.trustEnabled),
      isNewCommunity,
      communityId: communityId || null,
    });

    // Step 6: Fire-and-forget AI 總結（非關鍵路徑）
    if (communityId) {
      fetch('/api/generate-community-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communityId }),
      }).catch((err) => logger.warn('AI 總結背景執行中', { error: err }));
    }

    return {
      id: result.id,
      public_id: result.public_id,
      community_id: communityId,
      community_name: communityName,
      is_new_community: isNewCommunity,
    };
  },

  // 5. 檢查社區是否存在 (供前端即時驗證)
  checkCommunityExists: async (
    name: string
  ): Promise<{ exists: boolean; community?: { id: string; name: string } }> => {
    if (!name || name.trim().length < 2) return { exists: false };

    const { data } = await supabase
      .from('communities')
      .select('id, name')
      .ilike('name', `%${name.trim()}%`)
      .limit(1)
      .single();

    return data ? { exists: true, community: data } : { exists: false };
  },
};

// =============================================
// P10: 首頁精選房源 API
// =============================================

import type { FeaturedProperty } from '../types/property';

// Re-export for backward compatibility
export type { FeaturedProperty as FeaturedPropertyForUI };

/**
 * 取得首頁精選房源
 * - 成功: 回傳 6 筆房源 (真實 + Seed 補位)
 * - 失敗: 回傳空陣列 (觸發 Level 3 前端 Mock 保底)
 */
export async function getFeaturedProperties(): Promise<FeaturedProperty[]> {
  try {
    // 這裡建議加上完整的錯誤處理與 Timeout 機制 (可選)
    const response = await fetch('/api/home/featured-properties');

    if (!response.ok) {
      logger.warn('[propertyService] API 回應非 200', {
        status: response.status,
      });
      return [];
    }

    const json = await response.json();

    if (json.success && Array.isArray(json.data)) {
      return json.data;
    }

    logger.warn('[propertyService] API 回傳格式錯誤', { json });
    return [];
  } catch (error) {
    logger.error('[propertyService] getFeaturedProperties 失敗', { error });
    return []; // Level 3: 回傳空陣列，讓前端維持顯示初始 Mock
  }
}
