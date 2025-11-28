# 房仲流程完整技術指南

> 本文件完整說明 MaiHouses 平台的房仲流程：從註冊、上傳房源、到追蹤買家瀏覽行為的完整實作。

**最後更新**: 2024/11/28  
**作者**: GitHub Copilot  
**相關 Commit**: `feat: 完整串接房仲流程 (註冊→上傳→追蹤)`

---

## 📋 目錄

1. [流程總覽](#1-流程總覽)
2. [資料庫 Schema](#2-資料庫-schema)
3. [Auth → Agent 自動同步](#3-auth--agent-自動同步)
4. [房源上傳流程](#4-房源上傳流程)
5. [物件詳情頁追蹤](#5-物件詳情頁追蹤)
6. [UAG Dashboard 統計查詢](#6-uag-dashboard-統計查詢)
7. [API 端點](#7-api-端點)
8. [部署檢查清單](#8-部署檢查清單)

---

## 1. 流程總覽

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           房仲完整用戶旅程                                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐               │
│  │   1. 首頁   │ ───▶ │  2. 註冊    │ ───▶ │  3. UAG    │               │
│  │  /maihouses │      │  /auth.html │      │   /uag     │               │
│  └─────────────┘      └──────┬──────┘      └──────┬──────┘               │
│                              │                     │                     │
│                              ▼                     ▼                     │
│                    ┌─────────────────┐   ┌─────────────────┐             │
│                    │ Supabase Auth   │   │  點擊「上傳房源」 │             │
│                    │ 自動建立 agents │   └────────┬────────┘             │
│                    └─────────────────┘            │                      │
│                                                   ▼                      │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  4. 上傳房源頁 /property/upload                                  │    │
│  │  - 填寫房源資料 + 兩好一公道                                       │    │
│  │  - 上傳圖片到 Supabase Storage                                   │    │
│  │  - 自動綁定當前登入房仲的 agent_id                                 │    │
│  │  - 資料庫自動產生 public_id (MH-100002...)                        │    │
│  └──────────────────────────────┬──────────────────────────────────┘    │
│                                 │                                        │
│                                 ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  5. 物件詳情頁 /property/{public_id}                             │    │
│  │  房仲分享連結: /property/MH-100002?aid={agent_id}                │    │
│  └──────────────────────────────┬──────────────────────────────────┘    │
│                                 │                                        │
│                                 ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  6. 買家瀏覽 → usePropertyTracker 自動追蹤                        │    │
│  │  - page_view / page_exit 事件                                    │    │
│  │  - 停留時間、滾動深度                                              │    │
│  │  - LINE/電話按鈕點擊                                              │    │
│  │  - 所有事件關聯到該房仲的 agent_id                                 │    │
│  └──────────────────────────────┬──────────────────────────────────┘    │
│                                 │                                        │
│                                 ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  7. UAG Dashboard 查看統計 /uag                                  │    │
│  │  - 每個房源被多少人看過                                            │    │
│  │  - 有多少人點了 LINE/電話                                         │    │
│  │  - 平均停留時間                                                   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 資料庫 Schema

### 2.1 核心資料表關聯圖

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   auth.users    │       │     agents      │       │   properties    │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (UUID) PK    │──1:1──│ id (UUID) PK/FK │──1:N──│ id (UUID) PK    │
│ email           │       │ name            │       │ public_id       │
│ raw_user_meta   │       │ company         │       │ title           │
│ created_at      │       │ trust_score     │       │ price           │
└─────────────────┘       │ encouragement   │       │ agent_id (FK)   │
                          └─────────────────┘       │ images[]        │
                                                    └────────┬────────┘
                                                             │
                                                             │ 1:N (via public_id)
                                                             ▼
                                                    ┌─────────────────┐
                                                    │   uag_events    │
                                                    ├─────────────────┤
                                                    │ id (UUID) PK    │
                                                    │ session_id      │
                                                    │ agent_id        │
                                                    │ property_id     │
                                                    │ duration        │
                                                    │ actions (JSONB) │
                                                    │ created_at      │
                                                    └─────────────────┘
```

### 2.2 agents 表（檔案：`supabase/migrations/20251127_properties_schema.sql`）

```sql
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

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public agents are viewable by everyone" 
ON public.agents FOR SELECT USING (true);
```

### 2.3 properties 表

```sql
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    public_id TEXT UNIQUE NOT NULL,           -- 公開編號 'MH-100001'
    title TEXT NOT NULL,
    price NUMERIC NOT NULL,
    address TEXT NOT NULL,
    description TEXT,
    images TEXT[] DEFAULT '{}',
    
    -- 結構化評價欄位（兩好一公道）
    advantage_1 TEXT,
    advantage_2 TEXT,
    disadvantage TEXT,
    
    -- 房屋資訊
    size NUMERIC,
    age INTEGER,
    rooms INTEGER,
    halls INTEGER,
    bathrooms INTEGER,
    floor_current TEXT,
    floor_total INTEGER,
    property_type TEXT,
    features TEXT[],
    
    -- 來源資訊
    source_platform TEXT DEFAULT 'MH',        -- 'MH' or '591'
    source_external_id TEXT,
    
    -- 關聯
    agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.4 uag_events 表（追蹤事件）

```sql
CREATE TABLE public.uag_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    agent_id TEXT,                            -- 追蹤來源房仲
    property_id TEXT,                         -- 對應 properties.public_id
    district TEXT,
    duration INTEGER DEFAULT 0,
    actions JSONB DEFAULT '{}'::jsonb,        -- { click_line: 1, click_call: 0, scroll_depth: 85 }
    focus TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_property_agent ON public.uag_events (property_id, agent_id);
```

---

## 3. Auth → Agent 自動同步

### 3.1 目的
當用戶透過 Supabase Auth 註冊時，自動在 `agents` 表建立對應記錄，確保新房仲可以立即上傳房源。

### 3.2 SQL 檔案
📄 `supabase/migrations/20251128_auth_agents_sync.sql`

```sql
-- ==============================================================================
-- Auth → Agents 自動同步機制
-- 當用戶註冊時，自動在 agents 表建立對應記錄
-- ==============================================================================

-- 1. 建立同步函數
CREATE OR REPLACE FUNCTION public.handle_new_agent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  display_name TEXT;
BEGIN
  -- 從 email 提取顯示名稱 (@ 前的部分)
  display_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    SPLIT_PART(NEW.email, '@', 1),
    '新房仲'
  );

  -- 插入到 agents 表
  INSERT INTO public.agents (id, name, company, trust_score, encouragement_count)
  VALUES (
    NEW.id,                          -- 使用 auth.users 的 id
    display_name,
    '邁房子',                         -- 預設公司
    80,                              -- 初始信任分數
    0                                -- 初始鼓勵數
  )
  ON CONFLICT (id) DO NOTHING;       -- 防止重複

  RETURN NEW;
END;
$$;

-- 2. 建立觸發器
DROP TRIGGER IF EXISTS on_auth_user_created_agent ON auth.users;
CREATE TRIGGER on_auth_user_created_agent
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_agent();

-- 3. 補建現有用戶的 agents 記錄 (一次性遷移)
INSERT INTO public.agents (id, name, company, trust_score, encouragement_count)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'name', SPLIT_PART(email, '@', 1), '房仲') as name,
  '邁房子' as company,
  80 as trust_score,
  0 as encouragement_count
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.agents)
ON CONFLICT (id) DO NOTHING;

-- 4. 確保 agents 表的 RLS 政策正確
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- 所有人都可以查看經紀人資料
CREATE POLICY IF NOT EXISTS "Public agents are viewable by everyone" 
ON public.agents FOR SELECT USING (true);

-- 經紀人可以更新自己的資料
CREATE POLICY IF NOT EXISTS "Agents can update own profile" 
ON public.agents FOR UPDATE USING (auth.uid() = id);
```

### 3.3 執行方式
1. 登入 Supabase Dashboard
2. 進入 SQL Editor
3. 貼上上述 SQL 並執行

### 3.4 驗證
```sql
-- 檢查觸發器是否建立成功
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created_agent';
```

---

## 4. 房源上傳流程

### 4.1 頁面元件
📄 `src/pages/PropertyUploadPage.tsx`

### 4.2 核心邏輯：取得 agent_id 並上傳

```typescript
// src/services/propertyService.ts

export const propertyService = {
  // 建立物件 (含結構化欄位)
  createPropertyWithForm: async (form: PropertyFormInput, images: string[]) => {
    // ✅ 關鍵：確認登入狀態，取得當前用戶 ID
    const { data: { user } } = await supabase.auth.getUser();
    
    // 若未登入，使用預設 agent_id (僅開發模式)
    const agentId = user?.id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    const { data, error } = await supabase
      .from('properties')
      .insert({
        agent_id: agentId,              // ✅ 綁定房仲
        title: form.title,
        price: Number(form.price),
        address: form.address,
        size: Number(form.size || 0),
        age: Number(form.age || 0),
        
        rooms: Number(form.rooms),
        halls: Number(form.halls),
        bathrooms: Number(form.bathrooms),
        floor_current: form.floorCurrent,
        floor_total: Number(form.floorTotal || 0),
        property_type: form.type,
        
        // 結構化儲存 (兩好一公道)
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
    return data;  // 包含自動生成的 public_id
  },

  // 上傳圖片
  uploadImages: async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('property-images')
        .upload(fileName, file);

      if (error) return null;

      const { data } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);
        
      return data.publicUrl;
    });

    const results = await Promise.all(uploadPromises);
    return results.filter((url): url is string => !!url);
  }
};
```

### 4.3 表單介面定義

```typescript
// src/services/propertyService.ts

export interface PropertyFormInput {
  title: string;
  price: string;
  address: string;
  size: string;
  age: string;
  floorCurrent: string;
  floorTotal: string;
  rooms: string;
  halls: string;
  bathrooms: string;
  type: string;
  description: string;
  advantage1: string;      // 優點 1
  advantage2: string;      // 優點 2
  disadvantage: string;    // 公道話（缺點）
  sourceExternalId: string;
}
```

---

## 5. 物件詳情頁追蹤

### 5.1 追蹤 Hook 完整程式碼
📄 `src/pages/PropertyDetailPage.tsx`

```typescript
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

// ============================================================================
// UAG Tracker Hook - 追蹤用戶行為
// ============================================================================
const usePropertyTracker = (propertyId: string, agentId: string) => {
  const enterTime = useRef(Date.now());
  const actions = useRef({ click_photos: 0, click_line: 0, click_call: 0, scroll_depth: 0 });
  const hasSent = useRef(false);

  // 取得或建立 session_id
  const getSessionId = useCallback(() => {
    let sid = localStorage.getItem('uag_session');
    if (!sid) {
      sid = `u_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem('uag_session', sid);
    }
    return sid;
  }, []);

  // 發送追蹤事件
  const sendEvent = useCallback((eventType: string) => {
    const payload = {
      session_id: getSessionId(),
      agent_id: agentId,
      fingerprint: btoa(JSON.stringify({
        screen: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language
      })),
      event: {
        type: eventType,
        property_id: propertyId,
        district: 'unknown',
        duration: Math.round((Date.now() - enterTime.current) / 1000),
        actions: { ...actions.current },
        focus: []
      }
    };

    // 使用 sendBeacon 確保離開頁面時也能送出
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    navigator.sendBeacon('/api/uag-track', blob);
  }, [propertyId, agentId, getSessionId]);

  // 追蹤滾動深度
  useEffect(() => {
    const handleScroll = () => {
      const depth = Math.round((window.scrollY + window.innerHeight) / document.body.scrollHeight * 100);
      if (depth > actions.current.scroll_depth) {
        actions.current.scroll_depth = depth;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 初始化：發送 page_view，離開時發送 page_exit
  useEffect(() => {
    if (!propertyId) return;

    // 發送 page_view
    sendEvent('page_view');

    // 離開頁面時發送 page_exit
    const handleUnload = () => {
      if (!hasSent.current) {
        hasSent.current = true;
        sendEvent('page_exit');
      }
    };

    window.addEventListener('pagehide', handleUnload);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') handleUnload();
    });

    return () => {
      window.removeEventListener('pagehide', handleUnload);
      handleUnload();
    };
  }, [propertyId, sendEvent]);

  // 暴露追蹤方法給元件使用
  return {
    trackPhotoClick: () => { actions.current.click_photos++; },
    trackLineClick: () => { actions.current.click_line = 1; sendEvent('click_line'); },
    trackCallClick: () => { actions.current.click_call = 1; sendEvent('click_call'); }
  };
};
```

### 5.2 在頁面元件中使用

```typescript
export const PropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  
  // 取得 agent_id (從 URL 參數或 localStorage)
  const getAgentId = () => {
    let aid = searchParams.get('aid');
    if (!aid) aid = localStorage.getItem('uag_last_aid');
    if (aid && aid !== 'unknown') localStorage.setItem('uag_last_aid', aid);
    return aid || 'unknown';
  };

  // ✅ 初始化追蹤器
  const tracker = usePropertyTracker(id || '', getAgentId());

  // ... 頁面內容 ...

  return (
    <div>
      {/* 電話按鈕 - 追蹤點擊 */}
      <button onClick={tracker.trackCallClick}>
        聯絡經紀人
      </button>
      
      {/* LINE 按鈕 - 追蹤點擊 */}
      <button onClick={tracker.trackLineClick}>
        LINE 聯繫
      </button>
    </div>
  );
};
```

### 5.3 房仲分享連結格式

房仲分享房源時，應使用帶有 `aid` 參數的連結：

```
https://maihouses.vercel.app/property/MH-100002?aid=a0eebc99-9c0b-4ef8-bb6d-xxx
```

這樣所有買家的瀏覽行為都會歸屬到該房仲。

---

## 6. UAG Dashboard 統計查詢

### 6.1 瀏覽統計 RPC 函數
📄 `supabase/migrations/20251128_property_view_stats.sql`

```sql
-- ==============================================================================
-- 房源瀏覽統計 RPC 函數
-- 用於 UAG Dashboard 顯示房仲的房源被瀏覽情況
-- ==============================================================================

-- 獲取某房仲所有房源的瀏覽統計
CREATE OR REPLACE FUNCTION public.get_agent_property_stats(p_agent_id UUID)
RETURNS TABLE (
  property_id TEXT,
  view_count BIGINT,
  unique_sessions BIGINT,
  total_duration BIGINT,
  line_clicks BIGINT,
  call_clicks BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.property_id,
    COUNT(*)::BIGINT as view_count,
    COUNT(DISTINCT e.session_id)::BIGINT as unique_sessions,
    COALESCE(SUM(e.duration), 0)::BIGINT as total_duration,
    COUNT(CASE WHEN (e.actions->>'click_line')::INT = 1 THEN 1 END)::BIGINT as line_clicks,
    COUNT(CASE WHEN (e.actions->>'click_call')::INT = 1 THEN 1 END)::BIGINT as call_clicks
  FROM public.uag_events e
  INNER JOIN public.properties p ON e.property_id = p.public_id
  WHERE p.agent_id = p_agent_id
  GROUP BY e.property_id
  ORDER BY view_count DESC;
END;
$$;

-- 獲取單一房源的詳細瀏覽記錄
CREATE OR REPLACE FUNCTION public.get_property_view_details(p_property_id TEXT)
RETURNS TABLE (
  session_id TEXT,
  duration INTEGER,
  scroll_depth INTEGER,
  actions JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.session_id,
    e.duration,
    (e.actions->>'scroll_depth')::INTEGER as scroll_depth,
    e.actions,
    e.created_at
  FROM public.uag_events e
  WHERE e.property_id = p_property_id
  ORDER BY e.created_at DESC
  LIMIT 100;
END;
$$;

-- 授權
GRANT EXECUTE ON FUNCTION public.get_agent_property_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_property_view_details(TEXT) TO authenticated;
```

### 6.2 前端服務呼叫
📄 `src/pages/UAG/services/uagService.ts`

```typescript
// 房源瀏覽統計介面
export interface PropertyViewStats {
  property_id: string;
  view_count: number;
  unique_sessions: number;
  total_duration: number;
  line_clicks: number;
  call_clicks: number;
}

export class UAGService {
  // 獲取某房仲所有房源的瀏覽統計
  static async fetchPropertyViewStats(agentId: string): Promise<PropertyViewStats[]> {
    try {
      // 呼叫 Supabase RPC 函數
      const { data, error } = await supabase
        .rpc('get_agent_property_stats', { p_agent_id: agentId });

      if (error) {
        console.warn('PropertyViewStats RPC error, using fallback:', error);
        // Fallback：直接查詢 (效能較差但可用)
        return await UAGService.fetchPropertyViewStatsFallback(agentId);
      }

      return data || [];
    } catch (e) {
      console.error('fetchPropertyViewStats error:', e);
      return [];
    }
  }

  // Fallback 方法：直接從 uag_events 查詢
  private static async fetchPropertyViewStatsFallback(agentId: string): Promise<PropertyViewStats[]> {
    // 先取得該房仲的所有房源 public_id
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('public_id')
      .eq('agent_id', agentId);

    if (propError || !properties?.length) return [];

    const publicIds = properties.map(p => p.public_id);

    // 查詢這些房源的事件統計
    const { data: events, error: evtError } = await supabase
      .from('uag_events')
      .select('property_id, session_id, duration, actions')
      .in('property_id', publicIds);

    if (evtError || !events) return [];

    // 手動聚合
    const statsMap = new Map<string, PropertyViewStats>();
    
    for (const evt of events) {
      const pid = evt.property_id;
      if (!statsMap.has(pid)) {
        statsMap.set(pid, {
          property_id: pid,
          view_count: 0,
          unique_sessions: 0,
          total_duration: 0,
          line_clicks: 0,
          call_clicks: 0
        });
      }
      const stat = statsMap.get(pid)!;
      stat.view_count++;
      stat.total_duration += evt.duration || 0;
      
      const actions = evt.actions as Record<string, number> | null;
      if (actions?.click_line) stat.line_clicks++;
      if (actions?.click_call) stat.call_clicks++;
    }

    // 計算 unique sessions
    const sessionsByProperty = new Map<string, Set<string>>();
    for (const evt of events) {
      if (!sessionsByProperty.has(evt.property_id)) {
        sessionsByProperty.set(evt.property_id, new Set());
      }
      sessionsByProperty.get(evt.property_id)!.add(evt.session_id);
    }

    for (const [pid, sessions] of sessionsByProperty) {
      const stat = statsMap.get(pid);
      if (stat) stat.unique_sessions = sessions.size;
    }

    return Array.from(statsMap.values());
  }
}
```

### 6.3 在 UAG Dashboard 中使用

```typescript
// src/pages/UAG/index.tsx 或相關元件

import { UAGService, PropertyViewStats } from './services/uagService';

function MyListingsStats() {
  const [stats, setStats] = useState<PropertyViewStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const data = await UAGService.fetchPropertyViewStats(user.id);
        setStats(data);
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return <div>載入中...</div>;

  return (
    <div>
      <h3>我的房源統計</h3>
      {stats.map(s => (
        <div key={s.property_id}>
          <span>房源: {s.property_id}</span>
          <span>瀏覽: {s.view_count} 次</span>
          <span>不重複訪客: {s.unique_sessions} 人</span>
          <span>LINE 點擊: {s.line_clicks}</span>
          <span>電話點擊: {s.call_clicks}</span>
        </div>
      ))}
    </div>
  );
}
```

---

## 7. API 端點

### 7.1 追蹤事件 API
📄 `api/uag-track.js`

接收來自前端的追蹤事件，寫入 `uag_events` 表。

**請求格式：**
```json
{
  "session_id": "u_abc123xyz",
  "agent_id": "a0eebc99-9c0b-4ef8-bb6d-xxx",
  "fingerprint": "eyJzY3JlZW4iOiIxOTIweDEwODAiLCJ0aW1lem9uZSI...",
  "event": {
    "type": "page_view",
    "property_id": "MH-100002",
    "district": "信義區",
    "duration": 45,
    "actions": {
      "click_photos": 3,
      "click_line": 0,
      "click_call": 1,
      "scroll_depth": 85
    },
    "focus": []
  }
}
```

---

## 8. 部署檢查清單

### 8.1 Supabase 設定

- [ ] 執行 `supabase/migrations/20251127_properties_schema.sql` (建立 agents, properties 表)
- [ ] 執行 `supabase-uag-tracking.sql` (建立 uag_events 表)
- [ ] 執行 `supabase/migrations/20251128_auth_agents_sync.sql` (Auth 觸發器)
- [ ] 執行 `supabase/migrations/20251128_property_view_stats.sql` (統計 RPC 函數)
- [ ] 確認 Storage bucket `property-images` 已建立且公開

### 8.2 驗證 SQL

```sql
-- 檢查觸發器
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created_agent';

-- 檢查 RPC 函數
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('get_agent_property_stats', 'get_property_view_details');

-- 測試 RPC 函數
SELECT * FROM get_agent_property_stats('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
```

### 8.3 前端環境變數

確認 `.env` 有以下變數：
```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxxx
```

### 8.4 Vercel 環境變數

確認 Vercel Dashboard 有以下變數：
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxxx  # 僅後端使用
```

---

## 📁 相關檔案索引

| 檔案路徑 | 說明 |
|---------|------|
| `src/pages/PropertyDetailPage.tsx` | 物件詳情頁 + 追蹤 Hook |
| `src/pages/PropertyUploadPage.tsx` | 房源上傳頁 |
| `src/services/propertyService.ts` | 房源 CRUD 服務 |
| `src/pages/UAG/services/uagService.ts` | UAG 服務 + 統計查詢 |
| `src/lib/supabase.ts` | Supabase 客戶端 |
| `public/js/tracker.js` | 靜態頁面用追蹤腳本 |
| `api/uag-track.js` | 追蹤事件 API |
| `supabase/migrations/20251127_properties_schema.sql` | 資料表 Schema |
| `supabase/migrations/20251128_auth_agents_sync.sql` | Auth 同步觸發器 |
| `supabase/migrations/20251128_property_view_stats.sql` | 統計 RPC 函數 |

---

## ❓ 常見問題

### Q: 新註冊用戶無法上傳房源？
A: 確認 `on_auth_user_created_agent` 觸發器是否正確執行。檢查 `agents` 表是否有該用戶記錄。

### Q: 追蹤事件沒有寫入？
A: 檢查 `/api/uag-track` API 是否正常運作，以及 `uag_events` 表的 RLS 政策。

### Q: UAG Dashboard 統計為空？
A: 確認 `get_agent_property_stats` RPC 函數已建立，且 `uag_events` 表有資料。

### Q: 圖片上傳失敗？
A: 確認 Supabase Storage 的 `property-images` bucket 已建立，且有正確的 RLS 政策。

---

*本文件為 MaiHouses 房仲流程的完整技術指南，如有問題請聯繫開發團隊。*
