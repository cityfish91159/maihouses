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

  // 2. 上傳物件
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
  }
};
