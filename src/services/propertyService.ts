import { supabase } from '../lib/supabase';
import { Agent, Imported591Data } from '../lib/types';

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

      // 轉換資料格式
      const result = {
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

  // 3. 上傳圖片 (UUID 防撞)
  uploadImages: async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('property-images')
        .upload(fileName, file);

      if (error) {
        console.error('Image upload error:', error);
        return null;
      }

      const { data } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);
        
      return data.publicUrl;
    });

    const results = await Promise.all(uploadPromises);
    return results.filter((url): url is string => !!url);
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
      // 🔧 強化版台灣地址指紋（針對巷弄、郵遞區號、戶號）
      const computeAddressFingerprint = (addr: string): string => {
        let clean = addr;
        // 1. 移除郵遞區號 (3-5碼開頭)
        clean = clean.replace(/^\d{3,5}/, '');
        // 2. 移除「樓」「F」之後的所有字元
        clean = clean.replace(/(\d+[fF樓].*)$/, '');
        // 3. 移除「之X」「-X」戶號
        clean = clean.replace(/[之\-－—]\d+/g, '');
        // 4. 移除「號」字但保留數字
        clean = clean.replace(/號/g, '');
        // 5. 移除空白
        clean = clean.replace(/\s+/g, '');
        return clean;
      };
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
      
      // Step 2: 地址沒找到，用社區名稱模糊比對
      if (!communityId && finalCommunityName.length >= 2) {
        // 先精準比對
        const { data: exactMatch } = await supabase
          .from('communities')
          .select('id, name')
          .eq('name', finalCommunityName)
          .single();

        if (exactMatch) {
          communityId = exactMatch.id;
          console.log('✅ 社區名精準比對成功:', exactMatch.name);
        } else {
          // 模糊比對 (用 ILIKE)
          const { data: fuzzyMatches } = await supabase
            .from('communities')
            .select('id, name')
            .ilike('name', `%${finalCommunityName}%`)
            .limit(1);

          if (fuzzyMatches && fuzzyMatches.length > 0 && fuzzyMatches[0]) {
            // 找到相似的，但房仲沒選擇，所以建新的
            console.log('⚠️ 有相似社區但未選擇:', fuzzyMatches[0].name);
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

    const { data, error } = await supabase
      .from('properties')
      .insert({
        agent_id: agentId,
        title: form.title,
        price: Number(form.price),
        address: form.address,
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
    
    // 🤖 只有新建社區才觸發 AI（節省成本）
    if (isNewCommunity && communityId) {
      fetch('/api/generate-community-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communityId,
          communityName: finalCommunityName,
          address: form.address,
          newReview: {
            pros: [form.advantage1, form.advantage2].filter(Boolean),
            cons: form.disadvantage
          },
          isNew: true
        })
      }).then(r => r.json()).then(data => {
        if (data.error) console.error('AI Community Gen Failed:', data.error);
        else console.log('🤖 AI 社區優化完成');
      }).catch(err => console.error('AI call failed:', err));
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
