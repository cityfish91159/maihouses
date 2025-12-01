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
  createPropertyWithForm: async (form: PropertyFormInput, images: string[]) => {
    // 確認登入狀態
    const { data: { user } } = await supabase.auth.getUser();
    
    // 若未登入，使用預設 agent_id (開發模式)
    const agentId = user?.id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    // 🏢 如果有填社區名稱，檢查並自動建立社區牆
    let communityId: string | null = null;
    if (form.communityName && form.communityName.trim().length >= 2) {
      const communityName = form.communityName.trim();
      
      // 檢查社區是否已存在
      const { data: existingCommunity } = await supabase
        .from('communities')
        .select('id')
        .eq('name', communityName)
        .single();

      if (existingCommunity) {
        communityId = existingCommunity.id;
      } else {
        // 自動建立新社區牆
        const district = form.address.match(/([^市縣]+[區鄉鎮市])/)?.[1] || '';
        const city = form.address.match(/^(.*?[市縣])/)?.[1] || '台北市';
        
        const { data: newCommunity, error: communityError } = await supabase
          .from('communities')
          .insert({
            name: communityName,
            address: form.address,
            district: district,
            city: city,
            // 初始兩好一公道來自物件資訊
            two_good: [form.advantage1, form.advantage2].filter(Boolean),
            one_fair: form.disadvantage || null,
            features: [form.type].filter(Boolean),
          })
          .select('id')
          .single();

        if (!communityError && newCommunity) {
          communityId = newCommunity.id;
          console.log('✅ 自動建立社區牆:', communityName);
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
        community_name: form.communityName?.trim() || null,
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
    return data;
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
