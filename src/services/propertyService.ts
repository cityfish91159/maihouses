import { supabase } from "../lib/supabase";
import { Agent, Imported591Data } from "../lib/types";
import {
  computeAddressFingerprint,
  normalizeCommunityName,
} from "../utils/address";
import { logger } from "../lib/logger";
import { z } from "zod";

/**
 * Google 級別防禦性驗證 Schema (SSOT)
 * 確保 Service 層不接受任何非法資料
 */
const PropertyFormSchema = z
  .object({
    title: z.string().min(1, "標題必填").max(100, "標題太長"),
    price: z.string().min(1, "價格必填"),
    address: z.string().min(5, "地址太短").max(200, "地址太長"),
    communityName: z.string().min(1, "社區名稱必填"),
    advantage1: z.string().max(100),
    advantage2: z.string().max(100),
    disadvantage: z.string().min(10, "缺點至少需要 10 個字").max(200),
    highlights: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      // 動態驗證邏輯：若有 AI 亮點標籤，優點字數門檻降低至 2 字 (標籤長度)
      const hasHighlights = (data.highlights?.length || 0) > 0;
      const minAdvLength = hasHighlights ? 2 : 5;
      return (
        data.advantage1.length >= minAdvLength &&
        data.advantage2.length >= minAdvLength
      );
    },
    {
      message:
        "優點描述字數不足 (若無 AI 標籤，優點需至少 5 字；有標籤則需至少 2 字)",
      path: ["advantage1"],
    },
  );

const UPLOAD_CONFIG = {
  CONCURRENCY: 3,
  CACHE_CONTROL: "31536000", // 1 年快取
  BUCKET: "property-images",
} as const;

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
  sourcePlatform?: "MH" | "591";
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

// 定義 Service 介面 (Explicit Interface)
export interface PropertyService {
  getPropertyByPublicId(publicId: string): Promise<PropertyData | null>;
  createProperty(
    data: Imported591Data,
    agentId: string,
  ): Promise<CreatePropertyResult>;
  uploadImages(
    files: File[],
    options?: {
      concurrency?: number;
      onProgress?: (completed: number, total: number) => void;
    },
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
    existingCommunityId?: string,
  ): Promise<CreatePropertyResult>;
  checkCommunityExists(
    name: string,
  ): Promise<{ exists: boolean; community?: { id: string; name: string } }>;
}

// 預設資料 (Fallback Data) - 用於初始化或錯誤時，確保畫面不崩壞
export const DEFAULT_PROPERTY: PropertyData = {
  id: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
  publicId: "MH-100001",
  title: "",
  price: 0,
  address: "",
  description: "",
  images: [],
  size: 0,
  rooms: 0,
  halls: 0,
  bathrooms: 0,
  floorCurrent: "",
  floorTotal: 0,
  features: [],
  advantage1: "",
  advantage2: "",
  disadvantage: "",
  trustEnabled: false,
  agent: {
    id: "",
    internalCode: 0,
    name: "",
    avatarUrl: "",
    company: "",
    trustScore: 0,
    encouragementCount: 0,
  },
};

export const propertyService: PropertyService = {
  // 1. 獲取物件詳情
  getPropertyByPublicId: async (
    publicId: string,
  ): Promise<PropertyData | null> => {
    const coerceNumber = (value: unknown): number | null => {
      if (value == null) return null;
      if (typeof value === "number")
        return Number.isFinite(value) ? value : null;
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return null;
        const parsed = Number(trimmed);
        return Number.isFinite(parsed) ? parsed : null;
      }
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const coerceNonEmptyString = (value: unknown): string | null => {
      if (typeof value !== "string") return null;
      const trimmed = value.trim();
      return trimmed ? trimmed : null;
    };

    try {
      // 嘗試從 Supabase 讀取正式資料
      const { data, error } = await supabase
        .from("properties")
        .select(
          `
          *,
          agent:agents (*)
        `,
        )
        .eq("public_id", publicId)
        .single();

      if (error || !data) {
        logger.warn("查無正式資料，使用預設資料", { error });
        // 如果是開發環境或特定 ID，回傳預設資料以維持畫面
        if (publicId === "MH-100001" || import.meta.env.DEV) {
          return DEFAULT_PROPERTY;
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
          avatarUrl: data.agent.avatar_url || "https://via.placeholder.com/150",
          company: data.agent.company,
          trustScore: data.agent.trust_score,
          encouragementCount: data.agent.encouragement_count,
        },
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
      if (publicId === "MH-100001") {
        if (result.size == null && DEFAULT_PROPERTY.size != null)
          result.size = DEFAULT_PROPERTY.size;
        if (result.rooms == null && DEFAULT_PROPERTY.rooms != null)
          result.rooms = DEFAULT_PROPERTY.rooms;
        if (result.halls == null && DEFAULT_PROPERTY.halls != null)
          result.halls = DEFAULT_PROPERTY.halls;
        if (result.bathrooms == null && DEFAULT_PROPERTY.bathrooms != null)
          result.bathrooms = DEFAULT_PROPERTY.bathrooms;
        if (
          result.floorCurrent == null &&
          DEFAULT_PROPERTY.floorCurrent != null
        )
          result.floorCurrent = DEFAULT_PROPERTY.floorCurrent;
        if (result.floorTotal == null && DEFAULT_PROPERTY.floorTotal != null)
          result.floorTotal = DEFAULT_PROPERTY.floorTotal;
        if (result.features == null && DEFAULT_PROPERTY.features != null)
          result.features = DEFAULT_PROPERTY.features;
        if (result.advantage1 == null && DEFAULT_PROPERTY.advantage1 != null)
          result.advantage1 = DEFAULT_PROPERTY.advantage1;
        if (result.advantage2 == null && DEFAULT_PROPERTY.advantage2 != null)
          result.advantage2 = DEFAULT_PROPERTY.advantage2;
        if (
          result.disadvantage == null &&
          DEFAULT_PROPERTY.disadvantage != null
        )
          result.disadvantage = DEFAULT_PROPERTY.disadvantage;
      }

      return result;
    } catch (e) {
      logger.error("Service Error", { error: e });
      return DEFAULT_PROPERTY;
    }
  },

  // 2. 上傳物件 (舊版 - 保留相容性)
  createProperty: async (data: Imported591Data, agentId: string) => {
    // 不再前端生成 public_id，改由資料庫 Trigger 自動生成 (MH-100002, MH-100003...)
    const { data: result, error } = await supabase
      .from("properties")
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
    },
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
          const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
          const fileName = `${crypto.randomUUID()}.${fileExt}`;

          const { error } = await supabase.storage
            .from(UPLOAD_CONFIG.BUCKET)
            .upload(fileName, file, {
              contentType: file.type,
              cacheControl: UPLOAD_CONFIG.CACHE_CONTROL,
            });

          if (error) {
            logger.error("Image upload error", { error });
            failed.push({ file, error: error.message });
            return null;
          }

          const { data } = supabase.storage
            .from("property-images")
            .getPublicUrl(fileName);

          return data.publicUrl;
        } catch (e: unknown) {
          const errorMessage = e instanceof Error ? e.message : "上傳失敗";
          logger.error("Image upload exception", { error: e });
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
    const fileNames = urls
      .map((url) => url.split("/").pop())
      .filter(Boolean) as string[];

    if (fileNames.length === 0) return;

    const { error } = await supabase.storage
      .from(UPLOAD_CONFIG.BUCKET)
      .remove(fileNames);

    if (error) {
      logger.error("Failed to cleanup images", { error });
      // 這裡不拋出錯誤，因為這是清理流程，不應阻斷主流程的錯誤回報
    }
  },

  // 舊版相容：回傳純 URL 陣列
  uploadImagesLegacy: async (files: File[]): Promise<string[]> => {
    const result = await propertyService.uploadImages(files);
    return result.urls;
  },

  // 4. 建立物件 (新版 - 含結構化欄位 + 社區自動建立)
  // 核心邏輯：地址優先比對 → 社區名模糊比對輔助 → 建新社區(待審核)
  createPropertyWithForm: async (
    form: PropertyFormInput,
    images: string[],
    existingCommunityId?: string,
  ) => {
    // 🛡️ 防禦性驗證：Service 層不信任 Client 資料
    const validation = PropertyFormSchema.safeParse(form);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map((e) => e.message).join(", ");
      throw new Error(`資料驗證失敗: ${errorMsg}`);
    }

    // 確認登入狀態
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 嚴格權限控管：生產環境必須登入
    if (!user && !import.meta.env.DEV) {
      throw new Error("請先登入 (權限不足)");
    }

    // 若未登入且在開發模式，使用預設 agent_id
    const agentId = user?.id || "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

    if (!user && import.meta.env.DEV) {
      logger.warn("[DEV] 使用 Mock Agent ID 發佈物件");
    }

    // 🏢 社區處理邏輯
    let communityId: string | null = existingCommunityId || null;
    let finalCommunityName = form.communityName?.trim() || null;
    let isNewCommunity = false;

    // 「無社區」直接跳過社區處理
    if (finalCommunityName === "無") {
      communityId = null;
      finalCommunityName = "無";
    }
    // 已選擇現有社區，直接使用
    else if (existingCommunityId) {
      // 使用已選擇的社區 ID
    }
    // 需要查找或建立社區
    else if (form.address && finalCommunityName) {
      // 用共用函數計算地址指紋
      const addressFingerprint = computeAddressFingerprint(form.address);

      // Step 1: 用地址指紋精準比對
      if (addressFingerprint.length >= 5) {
        const { data: existingByAddress } = await supabase
          .from("communities")
          .select("id, name")
          .eq("address_fingerprint", addressFingerprint)
          .single();

        if (existingByAddress) {
          communityId = existingByAddress.id;
        }
      }

      // Step 2: 地址沒找到，用社區名稱比對（正規化後比對）
      if (!communityId && finalCommunityName.length >= 2) {
        const normalizedInput = normalizeCommunityName(finalCommunityName);

        // 撈同區域的社區，用正規化後的名稱比對
        const district = form.address.match(/([^市縣]+[區鄉鎮市])/)?.[1] || "";
        const { data: candidates } = await supabase
          .from("communities")
          .select("id, name")
          .eq("district", district)
          .limit(50);

        if (candidates && candidates.length > 0) {
          // 找正規化後完全相同的
          const matched = candidates.find(
            (c) => normalizeCommunityName(c.name) === normalizedInput,
          );
          if (matched) {
            communityId = matched.id;
            finalCommunityName = matched.name; // 用資料庫的名稱
          }
        }

        // 如果還是沒找到，試試精確比對（跨區域）
        if (!communityId) {
          const { data: exactMatch } = await supabase
            .from("communities")
            .select("id, name")
            .eq("name", finalCommunityName)
            .single();

          if (exactMatch) {
            communityId = exactMatch.id;
          }
        }
      }

      // Step 3: 都沒找到，建立新社區（待審核）
      if (!communityId) {
        const district = form.address.match(/([^市縣]+[區鄉鎮市])/)?.[1] || "";
        const city = form.address.match(/^(.*?[市縣])/)?.[1] || "台北市";

        // 🔧 新社區不直接存評價，交給 AI 處理
        const { data: newCommunity, error: communityError } = await supabase
          .from("communities")
          .insert({
            name: finalCommunityName,
            address: form.address,
            address_fingerprint: addressFingerprint,
            district: district,
            city: city,
            is_verified: false,
            completeness_score: 20, // AI 優化後會提升
            features: [form.type].filter(Boolean),
          })
          .select("id")
          .single();

        if (!communityError && newCommunity) {
          communityId = newCommunity.id;
          isNewCommunity = true;
        } else {
          logger.error("建立社區失敗", { error: communityError });
        }
      }
    }

    // 計算地址指紋（不管有沒有社區都存）
    const addressFingerprint = form.address
      ? computeAddressFingerprint(form.address)
      : null;

    const { data, error } = await supabase
      .from("properties")
      .insert({
        agent_id: agentId,
        title: form.title,
        price: Number(form.price),
        address: form.address,
        address_fingerprint: addressFingerprint, // 存起來方便查詢
        community_name: finalCommunityName,
        community_id: communityId,
        size: Number(form.size || 0),
        age: Number(form.age || 0),

        rooms: Number(form.rooms),
        halls: Number(form.halls),
        bathrooms: Number(form.bathrooms),
        floor_current: form.floorCurrent,
        floor_total: Number(form.floorTotal || 0),
        property_type: form.type,

        // 結構化儲存 (HP-2.3: 確保 SSOT)
        advantage_1: form.advantage1,
        advantage_2: form.advantage2,
        disadvantage: form.disadvantage,

        description: form.description,
        images: images,
        // SSOT: features 欄位存儲所有標籤，包含類型與重點膠囊
        features: Array.from(
          new Set([
            form.type,
            ...(form.highlights || []),
            // 只有在沒有 highlights 時才 fallback 到 advantage
            ...(!form.highlights || form.highlights.length === 0
              ? [form.advantage1, form.advantage2]
              : []),
          ]),
        ).filter(Boolean) as string[],

        source_platform: form.sourceExternalId ? "591" : "MH",
        source_external_id: form.sourceExternalId || null,

        // 安心留痕：DB 欄位 trust_enabled，預設 false
        // NASA Safety: 明確轉換為 boolean，防止字串 "true" 誤判
        trust_enabled: form.trustEnabled === true,
      })
      .select()
      .single();

    if (error) throw error;

    // 📝 Audit Log：物件建立成功
    logger.info("Property created", {
      propertyId: data.id,
      publicId: data.public_id,
      agentId: agentId,
      trustEnabled: form.trustEnabled === true,
      isNewCommunity,
      communityId: communityId || null,
    });

    // 📝 把兩好一公道存進 community_reviews（不管新舊社區）
    if (
      communityId &&
      (form.advantage1 || form.advantage2 || form.disadvantage)
    ) {
      await supabase.from("community_reviews").insert({
        community_id: communityId,
        property_id: data.id,
        source: "agent",
        advantage_1: form.advantage1 || null,
        advantage_2: form.advantage2 || null,
        disadvantage: form.disadvantage || null,
      });

      // 🤖 Fire-and-forget：自動觸發 AI 重新總結社區牆（不擋主流程）
      // 每次有新評價進來都會重新聚合，確保 two_good / one_fair 永遠是最新的
      fetch("/api/generate-community-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ communityId }),
      }).catch((err) => logger.warn("AI 總結背景執行中", { error: err }));
    }

    // 回傳包含社區資訊
    return {
      ...data,
      is_new_community: isNewCommunity,
    };
  },

  // 5. 檢查社區是否存在 (供前端即時驗證)
  checkCommunityExists: async (
    name: string,
  ): Promise<{ exists: boolean; community?: { id: string; name: string } }> => {
    if (!name || name.trim().length < 2) return { exists: false };

    const { data } = await supabase
      .from("communities")
      .select("id, name")
      .ilike("name", `%${name.trim()}%`)
      .limit(1)
      .single();

    return data ? { exists: true, community: data } : { exists: false };
  },
};

// =============================================
// P10: 首頁精選房源 API
// =============================================

import type { FeaturedProperty } from "../types/property";

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
    const response = await fetch("/api/home/featured-properties");

    if (!response.ok) {
      logger.warn("[propertyService] API 回應非 200", {
        status: response.status,
      });
      return [];
    }

    const json = await response.json();

    if (json.success && Array.isArray(json.data)) {
      return json.data;
    }

    logger.warn("[propertyService] API 回傳格式錯誤", { json });
    return [];
  } catch (error) {
    logger.error("[propertyService] getFeaturedProperties 失敗", { error });
    return []; // Level 3: 回傳空陣列，讓前端維持顯示初始 Mock
  }
}
