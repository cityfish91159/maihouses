# Property Detail Page Complete Code Package

以下是您要求的「詳情頁完整代碼」。這些代碼已經回滾到最乾淨、穩定的版本。

## 1. `src/pages/PropertyDetailPage.tsx` (主頁面)

```tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Home, Heart, Phone, MessageCircle, Hash, MapPin, Share2, ArrowLeft, Shield } from 'lucide-react';
import { AgentTrustCard } from '../components/AgentTrustCard';
import { propertyService, DEFAULT_PROPERTY, PropertyData } from '../services/propertyService';

export const PropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isFavorite, setIsFavorite] = useState(false);
  
  // 初始化直接使用 DEFAULT_PROPERTY，確保第一幀就有畫面，絕不留白
  const [property, setProperty] = useState<PropertyData>(DEFAULT_PROPERTY);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;
      
      try {
        const data = await propertyService.getPropertyByPublicId(id);
        if (data) {
          setProperty(data);
        }
      } catch (error) {
        console.error('Fetch error:', error);
        // 發生錯誤時，保持顯示預設資料，不讓畫面崩壞
      }
    };
    fetchProperty();
  }, [id]);

  // [Safety] 確保有圖片可顯示，防止空陣列導致破圖
  const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1600596542815-27b88e54e6d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

  let displayImage = (property.images && property.images.length > 0 && property.images[0]) 
    ? property.images[0] 
    : FALLBACK_IMAGE;

  // [Double Safety] 前端攔截 picsum
  if (displayImage && displayImage.includes('picsum')) {
    displayImage = FALLBACK_IMAGE;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-800">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 h-16 flex items-center px-4 shadow-sm justify-between">
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div className="flex items-center text-[#003366] font-extrabold text-xl gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#003366] to-[#00A8E8] rounded-lg flex items-center justify-center text-white">
              <Home size={18} />
            </div>
            邁房子
          </div>
        </div>
        
        {/* 僅顯示公開編號 */}
        <div className="flex items-center text-xs font-mono text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <Hash size={12} className="mr-1 text-gray-400"/>
          編號：<span className="font-bold text-[#003366] ml-1">{property.publicId}</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-4 pb-24">
        {/* Image Gallery */}
        <div className="aspect-video bg-slate-200 rounded-2xl overflow-hidden mb-6 relative group">
          <img 
            src={displayImage} 
            alt={property.title}
            onError={(e) => {
              // [Safety] 出錯時統一換成 fallback，不再重複試同一張外部圖
              if (e.currentTarget.src !== FALLBACK_IMAGE) {
                 e.currentTarget.src = FALLBACK_IMAGE;
              }
            }}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1">
            <Home size={12} />
            <span>共 {property.images?.length || 0} 張照片</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                  {property.title}
                </h1>
                <button 
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`p-2 rounded-full transition-all ${isFavorite ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                >
                  <Heart size={24} fill={isFavorite ? "currentColor" : "none"} />
                </button>
              </div>
              
              <div className="flex items-center gap-2 text-slate-500 mt-2 text-sm">
                <MapPin size={16} />
                {property.address}
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#003366]">{property.price}</span>
                <span className="text-lg text-slate-500 font-medium">萬</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {['近捷運', '全新裝潢', '有車位', '高樓層'].map(tag => (
                <span key={tag} className="px-3 py-1 bg-blue-50 text-[#003366] text-xs font-medium rounded-full">
                  {tag}
                </span>
              ))}
            </div>

            <div className="h-px bg-slate-100" />

            {/* Description */}
            <div className="prose prose-slate max-w-none">
              <h3 className="text-lg font-bold text-slate-900 mb-3">物件特色</h3>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>
          </div>

          {/* Sidebar / Agent Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <AgentTrustCard agent={property.agent} />
              
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <h4 className="font-bold text-[#003366] text-sm mb-2 flex items-center gap-2">
                  <Shield size={16} />
                  安心交易保障
                </h4>
                <ul className="space-y-2">
                  <li className="text-xs text-slate-600 flex items-center gap-2">
                    <div className="w-1 h-1 bg-blue-400 rounded-full" />
                    產權調查確認
                  </li>
                  <li className="text-xs text-slate-600 flex items-center gap-2">
                    <div className="w-1 h-1 bg-blue-400 rounded-full" />
                    履約保證專戶
                  </li>
                  <li className="text-xs text-slate-600 flex items-center gap-2">
                    <div className="w-1 h-1 bg-blue-400 rounded-full" />
                    凶宅查詢過濾
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-3 lg:hidden flex gap-3 z-50 pb-safe">
        <button className="flex-1 bg-[#003366] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
          <Phone size={20} />
          聯絡經紀人
        </button>
        <button className="w-12 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center border border-slate-200">
          <MessageCircle size={20} />
        </button>
      </div>
    </div>
  );
};
```

## 2. `src/services/propertyService.ts` (資料服務)

```typescript
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
  images: ['https://images.unsplash.com/photo-1600596542815-27b88e54e6d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
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
```
