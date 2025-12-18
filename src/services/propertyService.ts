import { supabase } from '../lib/supabase';
import { Agent, Imported591Data } from '../lib/types';
import { computeAddressFingerprint, normalizeCommunityName } from '../utils/address';

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
}

// 上傳表單輸入介面
export interface PropertyFormInput {
  title: string;
  price: string;
  address: string;
  communityName: string;  // 社區名稱
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
  sourceExternalId: string;
}

// 預設資料 (Fallback Data) - 用於初始化或錯誤時，確保畫面不崩壞
export const DEFAULT_PROPERTY: PropertyData = {
  id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  publicId: 'MH-100001',
  title: '信義區101景觀全新裝潢大三房',
  price: 3680,
  address: '台北市信義區',
  description: '這是一間位於信義區的優質好房，擁有絕佳的101景觀，全新裝潢，即可入住。周邊生活機能完善，交通便利，是您成家的最佳選擇。',
  images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
  size: 34.2,
  rooms: 3,
  halls: 2,
  bathrooms: 2,
  floorCurrent: '12',
  floorTotal: 15,
  features: ['近捷運', '有車位', '全新裝潢'],
  advantage1: '近捷運',
  advantage2: '有車位',
  disadvantage: '臨路低樓層較吵',
  agent: {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    internalCode: 1,
    name: '王小明',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
    company: '邁房子信義店',
    trustScore: 92,
    encouragementCount: 156,
  }
};

export const propertyService = {
  // 1. 獲取物件詳情
  getPropertyByPublicId: async (publicId: string): Promise<PropertyData | null> => {
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
        .select(`
          *,
          agent:agents (*)
        `)
        .eq('public_id', publicId)
        .single();

      if (error || !data) {
        console.warn('查無正式資料，使用預設資料', error);
        // 如果是開發環境或特定 ID，回傳預設資料以維持畫面
        if (publicId === 'MH-100001' || import.meta.env.DEV) {
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
          avatarUrl: data.agent.avatar_url || 'https://via.placeholder.com/150',
          company: data.agent.company,
          trustScore: data.agent.trust_score,
          encouragementCount: data.agent.encouragement_count
        }
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

      // 針對 Demo 物件：若 DB 有資料但缺少結構化欄位，回退到 DEFAULT_PROPERTY（只補缺的欄位）
      if (publicId === 'MH-100001') {
        if (result.size == null) result.size = DEFAULT_PROPERTY.size;
        if (result.rooms == null) result.rooms = DEFAULT_PROPERTY.rooms;
        if (result.halls == null) result.halls = DEFAULT_PROPERTY.halls;
        if (result.bathrooms == null) result.bathrooms = DEFAULT_PROPERTY.bathrooms;
        if (result.floorCurrent == null) result.floorCurrent = DEFAULT_PROPERTY.floorCurrent;
        if (result.floorTotal == null) result.floorTotal = DEFAULT_PROPERTY.floorTotal;
        if (result.features == null) result.features = DEFAULT_PROPERTY.features;
        if (result.advantage1 == null) result.advantage1 = DEFAULT_PROPERTY.advantage1;
        if (result.advantage2 == null) result.advantage2 = DEFAULT_PROPERTY.advantage2;
        if (result.disadvantage == null) result.disadvantage = DEFAULT_PROPERTY.disadvantage;
      }

      return result;
    } catch (e) {
      console.error('Service Error:', e);
      return DEFAULT_PROPERTY;
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
        agent_id: agentId
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  // 3. 上傳圖片 (UUID 防撞 + 並發限制 + 詳細錯誤回報)
  uploadImages: async (files: File[], options?: { 
    concurrency?: number;
    onProgress?: (completed: number, total: number) => void;
  }): Promise<{ 
    urls: string[]; 
    failed: { file: File; error: string }[];
    allSuccess: boolean;
  }> => {
    const concurrency = options?.concurrency || 3; // 預設並發 3
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
            .from('property-images')
            .upload(fileName, file, {
              contentType: file.type,
              cacheControl: '31536000', // 1 年快取
            });

          if (error) {
            console.error('Image upload error:', error);
            failed.push({ file, error: error.message });
            return null;
          }

          const { data } = supabase.storage
            .from('property-images')
            .getPublicUrl(fileName);
          
          return data.publicUrl;
        } catch (e: unknown) {
          const errorMessage = e instanceof Error ? e.message : '上傳失敗';
          console.error('Image upload exception:', e);
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

  // 舊版相容：回傳純 URL 陣列
  uploadImagesLegacy: async (files: File[]): Promise<string[]> => {
    const result = await propertyService.uploadImages(files);
    return result.urls;
  },

  // 4. 建立物件 (新版 - 含結構化欄位 + 社區自動建立)
  // 核心邏輯：地址優先比對 → 社區名模糊比對輔助 → 建新社區(待審核)
  createPropertyWithForm: async (form: PropertyFormInput, images: string[], existingCommunityId?: string) => {
    // 確認登入狀態
    const { data: { user } } = await supabase.auth.getUser();
    
    // 若未登入，使用預設 agent_id (開發模式)
    const agentId = user?.id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    // 🏢 社區處理邏輯
    let communityId: string | null = existingCommunityId || null;
    let finalCommunityName = form.communityName?.trim() || null;
    let isNewCommunity = false;
    
    // 「無社區」直接跳過社區處理
    if (finalCommunityName === '無') {
      communityId = null;
      finalCommunityName = '無';
      console.log('✅ 透天/店面，不歸入社區牆');
    }
    // 已選擇現有社區，直接使用
    else if (existingCommunityId) {
      console.log('✅ 使用已選擇的社區 ID:', existingCommunityId);
    }
    // 需要查找或建立社區
    else if (form.address && finalCommunityName) {
      // 用共用函數計算地址指紋
      const addressFingerprint = computeAddressFingerprint(form.address);
      
      // Step 1: 用地址指紋精準比對
      if (addressFingerprint.length >= 5) {
        const { data: existingByAddress } = await supabase
          .from('communities')
          .select('id, name')
          .eq('address_fingerprint', addressFingerprint)
          .single();

        if (existingByAddress) {
          communityId = existingByAddress.id;
          console.log('✅ 地址比對成功，使用現有社區:', existingByAddress.name);
        }
      }
      
      // Step 2: 地址沒找到，用社區名稱比對（正規化後比對）
      if (!communityId && finalCommunityName.length >= 2) {
        const normalizedInput = normalizeCommunityName(finalCommunityName);
        
        // 撈同區域的社區，用正規化後的名稱比對
        const district = form.address.match(/([^市縣]+[區鄉鎮市])/)?.[1] || '';
        const { data: candidates } = await supabase
          .from('communities')
          .select('id, name')
          .eq('district', district)
          .limit(50);

        if (candidates && candidates.length > 0) {
          // 找正規化後完全相同的
          const matched = candidates.find(c => 
            normalizeCommunityName(c.name) === normalizedInput
          );
          if (matched) {
            communityId = matched.id;
            finalCommunityName = matched.name; // 用資料庫的名稱
            console.log('✅ 社區名正規化比對成功:', matched.name);
          }
        }

        // 如果還是沒找到，試試精確比對（跨區域）
        if (!communityId) {
          const { data: exactMatch } = await supabase
            .from('communities')
            .select('id, name')
            .eq('name', finalCommunityName)
            .single();

          if (exactMatch) {
            communityId = exactMatch.id;
            console.log('✅ 社區名精準比對成功:', exactMatch.name);
          }
        }
      }
      
      // Step 3: 都沒找到，建立新社區（待審核）
      if (!communityId) {
        const district = form.address.match(/([^市縣]+[區鄉鎮市])/)?.[1] || '';
        const city = form.address.match(/^(.*?[市縣])/)?.[1] || '台北市';
        
        // 🔧 新社區不直接存評價，交給 AI 處理
        const { data: newCommunity, error: communityError } = await supabase
          .from('communities')
          .insert({
            name: finalCommunityName,
            address: form.address,
            address_fingerprint: addressFingerprint,
            district: district,
            city: city,
            is_verified: false,
            completeness_score: 20,  // AI 優化後會提升
            features: [form.type].filter(Boolean),
          })
          .select('id')
          .single();

        if (!communityError && newCommunity) {
          communityId = newCommunity.id;
          isNewCommunity = true;
          console.log('✅ 建立新社區（待審核）:', finalCommunityName);
        } else {
          console.error('❌ 建立社區失敗:', communityError);
        }
      }
    }

    // 計算地址指紋（不管有沒有社區都存）
    const addressFingerprint = form.address ? computeAddressFingerprint(form.address) : null;

    const { data, error } = await supabase
      .from('properties')
      .insert({
        agent_id: agentId,
        title: form.title,
        price: Number(form.price),
        address: form.address,
        address_fingerprint: addressFingerprint,  // 存起來方便查詢
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
        
        // 結構化儲存 (關鍵)
        advantage_1: form.advantage1,
        advantage_2: form.advantage2,
        disadvantage: form.disadvantage,
        
        description: form.description,
        images: images,
        features: [form.type, form.advantage1, form.advantage2].filter(Boolean),
        
        source_platform: form.sourceExternalId ? '591' : 'MH',
        source_external_id: form.sourceExternalId || null
      })
      .select()
      .single();

    if (error) throw error;
    
    // 📝 把兩好一公道存進 community_reviews（不管新舊社區）
    if (communityId && (form.advantage1 || form.advantage2 || form.disadvantage)) {
      await supabase.from('community_reviews').insert({
        community_id: communityId,
        property_id: data.id,
        source: 'agent',
        advantage_1: form.advantage1 || null,
        advantage_2: form.advantage2 || null,
        disadvantage: form.disadvantage || null,
      });
      
      // 🤖 Fire-and-forget：自動觸發 AI 重新總結社區牆（不擋主流程）
      // 每次有新評價進來都會重新聚合，確保 two_good / one_fair 永遠是最新的
      fetch('/api/generate-community-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communityId })
      }).catch(err => console.warn('AI 總結背景執行中:', err));
    }
    
    // 回傳包含社區資訊
    return {
      ...data,
      is_new_community: isNewCommunity
    };
  },

  // 5. 檢查社區是否存在 (供前端即時驗證)
  checkCommunityExists: async (name: string): Promise<{ exists: boolean; community?: { id: string; name: string } }> => {
    if (!name || name.trim().length < 2) return { exists: false };
    
    const { data } = await supabase
      .from('communities')
      .select('id, name')
      .ilike('name', `%${name.trim()}%`)
      .limit(1)
      .single();

    return data ? { exists: true, community: data } : { exists: false };
  }
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
      console.warn('[propertyService] API 回應非 200:', response.status);
      return [];
    }
    
    const json = await response.json();
    
    if (json.success && Array.isArray(json.data)) {
      return json.data;
    }
    
    console.warn('[propertyService] API 回傳格式錯誤:', json);
    return [];
  } catch (error) {
    console.error('[propertyService] getFeaturedProperties 失敗:', error);
    return []; // Level 3: 回傳空陣列，讓前端維持顯示初始 Mock
  }
}
