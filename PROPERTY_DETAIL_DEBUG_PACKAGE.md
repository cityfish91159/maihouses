# Property Detail Page - Debug Package (房源詳情頁完整代碼包)

這份文件包含了「房源詳情頁」功能所涉及的所有關鍵代碼，包含前端頁面、服務層、路由設定以及後端資料庫結構。

---

## 1. 前端頁面 (Frontend UI)
**File:** `src/pages/PropertyDetailPage.tsx`
負責顯示房源詳情，包含圖片輪播、資訊展示、經紀人卡片等。
- **關鍵邏輯**: 
    - 使用 `DEFAULT_PROPERTY` 作為初始狀態，確保畫面不留白。
    - `useEffect` 獲取真實資料，並在獲取成功後更新狀態。
    - `displayImage` 包含多重防護，防止圖片破圖或顯示灰色區塊。

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
      
      // 這裡不設 isLoading = true，因為我們希望畫面維持預設狀態直到新資料進來
      // 這樣可以避免畫面閃爍
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
  let displayImage = (property.images && property.images.length > 0 && property.images[0]) 
    ? property.images[0] 
    : DEFAULT_PROPERTY.images[0];

  // [Double Safety] 前端攔截 picsum (因為 picsum 不穩定)
  if (displayImage && displayImage.includes('picsum')) {
    displayImage = DEFAULT_PROPERTY.images[0];
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
              e.currentTarget.src = DEFAULT_PROPERTY.images[0] || 'https://images.unsplash.com/photo-1600596542815-27b88e54e6d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
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

---

## 2. 服務層 (Service Layer)
**File:** `src/services/propertyService.ts`
負責與 Supabase 溝通，獲取資料並進行格式轉換。
- **關鍵邏輯**:
    - `getPropertyByPublicId`: 根據 `MH-xxxx` 編號查詢資料庫。
    - **Hotfix**: 包含針對 `MH-100001` 和 `picsum` 圖片的強制修復邏輯，確保不回傳壞掉的圖片連結。

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

      // [Hotfix] 強制修復 MH-100001 的圖片，以及任何使用 picsum 的圖片
      // 防止資料庫舊資料導致破圖
      if (result.publicId === 'MH-100001' || result.images[0]?.includes('picsum')) {
        console.log('[PropertyService] Detected unstable image source, replacing with Unsplash fallback');
        result.images = DEFAULT_PROPERTY.images;
        result.agent.avatarUrl = DEFAULT_PROPERTY.agent.avatarUrl;
      }

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

---

## 3. 路由設定 (Routing)
**File:** `src/main.tsx`
負責處理路由的 Base Path，解決在 Vercel 上可能出現的白屏問題。
- **關鍵邏輯**: 自動偵測網址是否包含 `/maihouses`，動態設定 `basename`。

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

const rootElement = document.getElementById('root');
if (rootElement) {
  // 智能判斷 basename：如果網址包含 /maihouses 則使用之，否則使用根目錄
  // 這能同時支援 https://.../maihouses/property/1 和 https://.../property/1
  const basename = window.location.pathname.startsWith('/maihouses') 
    ? '/maihouses' 
    : '/';

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter basename={basename}>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}
```

---

## 4. Supabase 客戶端 (Supabase Client)
**File:** `src/lib/supabase.ts`
初始化 Supabase 連線。

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check .env or Vercel settings.')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
```

---

## 5. 資料庫結構 (Database Schema)
**File:** `supabase/migrations/20251127_properties_schema.sql`
定義 `properties` 和 `agents` 資料表結構。

```sql
-- ==============================================================================
-- Properties & Agents Schema (For Property Detail & Upload Pages)
-- ==============================================================================

-- 1. Agents Table (經紀人資料)
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    internal_code SERIAL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    company TEXT,
    trust_score INTEGER DEFAULT 80,
    encouragement_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public agents are viewable by everyone" 
ON public.agents FOR SELECT USING (true);

-- 2. Properties Table (房源資料)
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    public_id TEXT UNIQUE NOT NULL, -- e.g. 'MH-100001'
    title TEXT NOT NULL,
    price NUMERIC NOT NULL,
    address TEXT NOT NULL,
    description TEXT,
    images TEXT[] DEFAULT '{}',
    
    -- Source Info
    source_platform TEXT DEFAULT 'MH', -- 'MH' or '591'
    source_external_id TEXT,
    
    -- Relations
    agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public properties are viewable by everyone" 
ON public.properties FOR SELECT USING (true);

CREATE POLICY "Anyone can insert properties (Demo Purpose)" 
ON public.properties FOR INSERT WITH CHECK (true);
```

---

## 6. 自動編號邏輯 (Auto-increment ID)
**File:** `supabase/migrations/20251127_auto_increment_id.sql`
負責自動生成 `MH-100002` 等編號。

```sql
-- ==============================================================================
-- Auto-increment Public ID Sequence
-- ==============================================================================

-- 1. Create a sequence for property IDs starting from 100002
CREATE SEQUENCE IF NOT EXISTS property_public_id_seq START 100002;

-- 2. Create a function to generate the ID
CREATE OR REPLACE FUNCTION generate_property_public_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate if not provided
    IF NEW.public_id IS NULL THEN
        NEW.public_id := 'MH-' || nextval('property_public_id_seq');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create a trigger to call the function before insert
DROP TRIGGER IF EXISTS set_property_public_id ON public.properties;
CREATE TRIGGER set_property_public_id
    BEFORE INSERT ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION generate_property_public_id();
```

---

## 7. 資料修復腳本 (Data Fix Script)
**File:** `supabase/migrations/20251127_fix_bad_images.sql`
用於修復資料庫中損壞的圖片連結。

```sql
-- ==============================================================================
-- Fix Bad Images (Replace unstable picsum with Unsplash)
-- ==============================================================================

-- 1. Fix Property Images (MH-100001 and others)
UPDATE properties
SET images = ARRAY['https://images.unsplash.com/photo-1600596542815-27b88e54e6d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
WHERE public_id = 'MH-100001' OR images[1] LIKE '%picsum%';

-- 2. Fix Agent Avatars
UPDATE agents
SET avatar_url = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'
WHERE avatar_url LIKE '%picsum%';
```
