# 📊 邁房子 UAG 完整系統指南

## User Activity & Grade - 消費者瀏覽行為追蹤與客戶分級系統

> 版本: v8.0 | 最後更新: 2025/11/29  
> 狀態: 開發完成，待資料庫部署

---

## 📋 目錄

1. [系統架構總覽](#1-系統架構總覽)
2. [數據流程圖](#2-數據流程圖)
3. [客戶分級邏輯](#3-客戶分級邏輯)
4. [前端追蹤代碼](#4-前端追蹤代碼)
5. [後端 API 代碼](#5-後端-api-代碼)
6. [資料庫 Schema](#6-資料庫-schema)
7. [待優化問題清單](#7-待優化問題清單)
8. [部署檢查清單](#8-部署檢查清單)

---

## 1. 系統架構總覽

```
┌─────────────────────────────────────────────────────────────────┐
│                        消費者瀏覽流程                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   消費者 ─────► 物件詳情頁 ─────► 瀏覽行為追蹤                    │
│     │              │                   │                        │
│     │              ▼                   ▼                        │
│     │         property.html      tracker.js                     │
│     │         或 React Page      (前端追蹤器)                    │
│     │                                  │                        │
│     │                                  ▼                        │
│     │                          /api/uag-track                   │
│     │                          (Vercel API)                     │
│     │                                  │                        │
│     │                                  ▼                        │
│     │                          Supabase PostgreSQL              │
│     │                          ┌─────────────────┐              │
│     │                          │  uag_sessions   │ (會話摘要)   │
│     │                          │  uag_events     │ (事件明細)   │
│     │                          │  calculate_grade│ (分級函數)   │
│     │                          └─────────────────┘              │
│     │                                  │                        │
│     ▼                                  ▼                        │
│   業務端 ◄───────────────────── UAG 業務後台                     │
│   (看到分級客戶泡泡)                /maihouses/uag               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 檔案位置對照表

| 功能               | 檔案路徑                            | 說明                       |
| ------------------ | ----------------------------------- | -------------------------- |
| 前端追蹤器 (HTML)  | `/public/js/tracker.js`             | 用於靜態 HTML 頁面         |
| 前端追蹤器 (React) | `/src/pages/PropertyDetailPage.tsx` | React Hook 版本            |
| 後端 API           | `/api/uag-track.js`                 | Vercel Serverless Function |
| 資料庫 Schema      | `/supabase-uag-tracking.sql`        | PostgreSQL 完整腳本        |
| UAG 後台           | `/public/p/uag-dashboard.html`      | 業務儀表板                 |

---

## 2. 數據流程圖

### 2.1 單一物件瀏覽完整流程

```
時間軸 ──────────────────────────────────────────────────────────►

[進入頁面]         [瀏覽中]              [離開頁面]
    │                 │                      │
    ▼                 ▼                      ▼
┌─────────┐    ┌─────────────┐        ┌──────────┐
│page_view│    │ 累積行為    │        │page_exit │
│ 事件    │    │ ─────────── │        │ 事件     │
│         │    │ • 滾動深度  │        │          │
│ 立即送出│    │ • 點擊照片  │        │ 最終狀態 │
└────┬────┘    │ • 停留時間  │        └────┬─────┘
     │         └──────┬──────┘             │
     │                │                    │
     ▼                ▼                    ▼
┌────────────────────────────────────────────────┐
│              /api/uag-track                     │
├────────────────────────────────────────────────┤
│  接收 payload:                                  │
│  {                                              │
│    session_id: "u_abc123xyz",                  │
│    agent_id: "agent_456",                      │
│    fingerprint: "base64...",                   │
│    event: {                                    │
│      type: "page_exit",                        │
│      property_id: "prop_789",                  │
│      district: "西屯區",                        │
│      duration: 85,           // 停留秒數        │
│      actions: {                                │
│        click_photos: 3,                        │
│        click_line: 1,                          │
│        click_call: 0,                          │
│        scroll_depth: 92                        │
│      }                                         │
│    }                                           │
│  }                                              │
└────────────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────┐
│         Supabase: track_uag_event_v8()         │
├────────────────────────────────────────────────┤
│  1. Upsert uag_sessions (建立/更新會話)         │
│  2. Insert uag_events (記錄事件明細)            │
│  3. 聚合計算:                                   │
│     - 總停留時間                                │
│     - 瀏覽物件數                                │
│     - 同區競品停留                              │
│     - 回訪次數                                  │
│  4. calculate_lead_grade() 計算等級            │
│  5. 更新 uag_sessions.grade                    │
└────────────────────────────────────────────────┘
                    │
                    ▼
            回傳: { success: true, grade: "A" }
```

### 2.2 消費者完整瀏覽歷程記錄

```
Session: u_abc123xyz (同一消費者)
═══════════════════════════════════════════════════════════════

[09:15] 進入物件 A (惠宇上晴 12F)
        └─ 停留 45 秒, 滾動 60%, 看照片 2 張
        └─ 分級: C

[09:20] 進入物件 B (惠宇青鳥 8F) - 同社區
        └─ 停留 120 秒, 滾動 95%, 點擊 LINE
        └─ 分級: S (點擊 LINE + 停留 ≥120s)

[09:35] 回到物件 A (惠宇上晴 12F) - 回訪
        └─ 再停留 90 秒, 點擊電話
        └─ 分級維持: S

[10:00] 進入物件 C (大毅琢白 5F) - 不同社區
        └─ 停留 30 秒
        └─ 分級維持: S (只升不降)

═══════════════════════════════════════════════════════════════
最終 Session 狀態:
- grade: S
- total_duration: 285 秒
- property_count: 3
- summary: {
    "district_counts": { "西屯區": 2, "南屯區": 1 },
    "strong_signals": ["click_line", "click_call"]
  }
```

---

## 3. 客戶分級邏輯

### 3.1 分級標準表

| 等級  | 條件                                                               | 說明                  |
| :---: | ------------------------------------------------------------------ | --------------------- |
| **S** | 點擊 LINE/電話 **且** (停留 ≥120秒 **或** 同區其他物件停留 ≥300秒) | 🔥 最高意願，立即跟進 |
| **A** | 停留 ≥90秒 + 滾動 ≥80% **或** 同區競品停留 ≥180秒                  | ⭐ 高度興趣           |
| **B** | 停留 ≥60秒 **或** (回訪 ≥2次 + 停留 ≥30秒)                         | 👀 中度興趣           |
| **C** | 停留 ≥20秒                                                         | 📌 輕度興趣           |
| **F** | 其他                                                               | 路過                  |

### 3.2 加分機制 (District Bonus)

```
若消費者瀏覽了同區 ≥3 個物件:
  • B 級 → 升級為 A 級
  • C 級 → 升級為 B 級

理由：瀏覽多個同區物件表示對該區域有明確購屋意向
```

### 3.3 分級函數 SQL 完整代碼

```sql
CREATE OR REPLACE FUNCTION calculate_lead_grade(
  p_duration INTEGER,          -- 該物件停留秒數
  p_actions JSONB,             -- 行為記錄 {click_line, click_call, scroll_depth...}
  p_revisits INTEGER,          -- 回訪次數
  p_district_count INTEGER,    -- 瀏覽同區物件數
  p_competitor_duration INTEGER DEFAULT 0  -- 同區其他物件總停留秒數
) RETURNS CHAR(1) AS $$
BEGIN
  -- S Grade: 強意願信號 + (長停留 或 競品重度用戶)
  IF (p_actions->>'click_line' = '1' OR p_actions->>'click_call' = '1') THEN
     IF p_duration >= 120 OR p_competitor_duration >= 300 THEN
        RETURN 'S';
     END IF;
  END IF;

  -- A Grade: 深度瀏覽
  IF p_duration >= 90 AND (p_actions->>'scroll_depth')::INT >= 80 THEN
    RETURN 'A';
  END IF;
  IF p_competitor_duration >= 180 AND p_duration >= 10 THEN
    RETURN 'A';
  END IF;

  -- B Grade (含區域加分)
  IF p_duration >= 60 OR (p_revisits >= 2 AND p_duration >= 30) THEN
    IF p_district_count >= 3 THEN
      RETURN 'A'; -- 加分升級
    END IF;
    RETURN 'B';
  END IF;

  -- C Grade (含區域加分)
  IF p_duration >= 20 THEN
    IF p_district_count >= 3 THEN
      RETURN 'B'; -- 加分升級
    END IF;
    RETURN 'C';
  END IF;

  RETURN 'F';
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

---

## 4. 前端追蹤代碼

### 4.1 HTML 頁面用追蹤器 (`/public/js/tracker.js`)

```javascript
// UAG Tracker v8.0 - Ultimate Optimization
// Implements: Enhanced Session Recovery, Event Batching, Fingerprinting

class EnhancedTracker {
  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.fingerprint = this.generateFingerprint();
    this.agentId = this.getAgentId();
    this.batcher = new EventBatcher(this);
    this.enterTime = Date.now();
    this.actions = {
      click_photos: 0,
      click_map: 0,
      click_line: 0,
      click_call: 0,
      scroll_depth: 0,
    };

    this.initListeners();
    this.recoverSession();
    this.trackImmediate('page_view');
  }

  // ═══════════════════════════════════════════════════════════
  // Session 管理 (多重備援)
  // ═══════════════════════════════════════════════════════════

  getOrCreateSessionId() {
    // 優先級：LocalStorage > SessionStorage > Cookie > 新建
    let sid = localStorage.getItem('uag_session');
    if (!sid) sid = sessionStorage.getItem('uag_session_temp');
    if (!sid) sid = this.getCookie('uag_sid');
    if (!sid) {
      sid = `u_${Math.random().toString(36).substr(2, 9)}`;
      this.persistSession(sid);
    }
    return sid;
  }

  persistSession(sid) {
    localStorage.setItem('uag_session', sid);
    sessionStorage.setItem('uag_session_temp', sid);
    this.setCookie('uag_sid', sid, 30); // 30 天有效
  }

  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }

  setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
  }

  // ═══════════════════════════════════════════════════════════
  // Agent ID 追蹤 (業務歸屬)
  // ═══════════════════════════════════════════════════════════

  getAgentId() {
    // 優先從 URL 參數取得 ?aid=xxx
    let aid = new URLSearchParams(location.search).get('aid');
    // 若無，從 localStorage 取得上次的 aid
    if (!aid) aid = localStorage.getItem('uag_last_aid');
    // 記住有效的 aid
    if (aid && aid !== 'unknown') localStorage.setItem('uag_last_aid', aid);
    return aid || 'unknown';
  }

  // ═══════════════════════════════════════════════════════════
  // Fingerprint 指紋 (跨設備識別輔助)
  // ═══════════════════════════════════════════════════════════

  generateFingerprint() {
    try {
      const fp = {
        screen: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        platform: navigator.platform,
        cores: navigator.hardwareConcurrency,
        memory: navigator.deviceMemory,
      };
      return btoa(JSON.stringify(fp));
    } catch (e) {
      return 'unknown_fp';
    }
  }

  // ═══════════════════════════════════════════════════════════
  // Session Recovery (可選功能)
  // ═══════════════════════════════════════════════════════════

  async recoverSession() {
    if (!localStorage.getItem('uag_session_recovered')) {
      try {
        const res = await fetch('/api/session-recovery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fingerprint: this.fingerprint,
            agentId: this.agentId,
          }),
        });
        const data = await res.json();
        if (data.recovered) {
          this.sessionId = data.session_id;
          this.persistSession(this.sessionId);
          localStorage.setItem('uag_session_recovered', 'true');
          console.log('[UAG] Session Recovered:', this.sessionId);
        }
      } catch (e) {
        console.error('Recovery failed', e);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 事件監聽器
  // ═══════════════════════════════════════════════════════════

  initListeners() {
    // 點擊追蹤
    document.addEventListener('click', (e) => {
      const t = e.target.closest('a, button, div');
      if (!t) return;
      const text = (t.innerText || '').toLowerCase();

      // LINE 按鈕
      if (text.includes('line') || t.href?.includes('line.me')) {
        this.actions.click_line++;
        this.trackImmediate('click_line'); // 強信號立即送出
      }
      // 電話按鈕
      if (text.includes('電話') || t.href?.includes('tel:')) {
        this.actions.click_call++;
        this.trackImmediate('click_call'); // 強信號立即送出
      }
      // 照片點擊
      if (t.tagName === 'IMG' || t.classList.contains('photo')) {
        this.actions.click_photos++;
      }
    });

    // 滾動深度追蹤
    window.addEventListener('scroll', () => {
      const depth = Math.round(
        ((window.scrollY + window.innerHeight) / document.body.scrollHeight) * 100
      );
      if (depth > this.actions.scroll_depth) {
        this.actions.scroll_depth = depth;
      }
    });

    // 離開頁面追蹤
    const sendFinal = () => this.trackImmediate('page_exit');
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') sendFinal();
    });
    window.addEventListener('pagehide', sendFinal);
  }

  // ═══════════════════════════════════════════════════════════
  // 事件發送
  // ═══════════════════════════════════════════════════════════

  trackImmediate(type) {
    this.batcher.add(
      {
        type,
        property_id: window.propertyId || location.pathname.split('/').pop(),
        district: window.propertyDistrict || 'unknown',
        duration: Math.round((Date.now() - this.enterTime) / 1000),
        actions: { ...this.actions },
        focus: [],
      },
      true
    );
  }
}

// ═══════════════════════════════════════════════════════════
// 事件批次處理器
// ═══════════════════════════════════════════════════════════

class EventBatcher {
  constructor(tracker) {
    this.tracker = tracker;
    this.queue = [];
    this.timer = null;
  }

  add(event, immediate = false) {
    this.queue.push(event);
    if (immediate || this.queue.length >= 5) {
      this.flush();
    } else {
      this.scheduleFlush();
    }
  }

  scheduleFlush() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), 5000);
  }

  flush() {
    if (this.queue.length === 0) return;

    // 取最新狀態發送 (duration 和 actions 是累積的)
    const latestEvent = this.queue.at(-1);
    this.queue = [];

    const payload = {
      session_id: this.tracker.sessionId,
      agent_id: this.tracker.agentId,
      fingerprint: this.tracker.fingerprint,
      event: latestEvent,
    };

    // 使用 sendBeacon 確保離開頁面也能送出
    const blob = new Blob([JSON.stringify(payload)], {
      type: 'application/json',
    });
    navigator.sendBeacon('/api/uag-track', blob);
  }
}

// 初始化
window.uagTracker = new EnhancedTracker();
```

### 4.2 React Hook 版本 (`/src/pages/PropertyDetailPage.tsx`)

```tsx
// UAG Tracker Hook - 追蹤用戶行為
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
        district: 'unknown', // TODO: 從物件資料取得
        duration: Math.round((Date.now() - enterTime.current) / 1000),
        actions: { ...actions.current },
        focus: []
      }
    };

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

  // 初始化與清理
  useEffect(() => {
    if (!propertyId) return;
    sendEvent('page_view');

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

  // 暴露追蹤方法給組件使用
  return {
    trackPhotoClick: () => { actions.current.click_photos++; },
    trackLineClick: () => { actions.current.click_line = 1; sendEvent('click_line'); },
    trackCallClick: () => { actions.current.click_call = 1; sendEvent('click_call'); }
  };
};

// 使用方式
const { trackPhotoClick, trackLineClick, trackCallClick } = usePropertyTracker(propertyId, agentId);

// 在 JSX 中綁定
<button onClick={trackLineClick}>LINE 諮詢</button>
<button onClick={trackCallClick}>撥打電話</button>
<img onClick={trackPhotoClick} src="..." />
```

### 4.3 在 HTML 頁面引用追蹤器

```html
<!-- property.html 底部 -->
<script>
  // 設定物件資訊供追蹤器使用
  window.propertyId = 'prop_12345';
  window.propertyDistrict = '西屯區';
</script>
<script src="/js/tracker.js"></script>
```

---

## 5. 後端 API 代碼

### 5.1 追蹤 API (`/api/uag-track.js`)

```javascript
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    let data = req.body;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON' });
      }
    }

    const { session_id, agent_id, event, fingerprint } = data;

    // 驗證必要欄位
    if (!session_id || !event) {
      return res.status(400).json({ error: 'Missing required fields: session_id or event' });
    }

    if (typeof event !== 'object' || !event.property_id || !event.duration) {
      return res.status(400).json({ error: 'Invalid event structure' });
    }

    // 呼叫資料庫 RPC 函數
    const { data: result, error } = await supabase.rpc('track_uag_event_v8', {
      p_session_id: session_id,
      p_agent_id: agent_id || 'unknown',
      p_fingerprint: fingerprint || null,
      p_event_data: event,
    });

    if (error) {
      console.error('Supabase RPC Error:', error);
      return res.status(500).json({ error: error.message });
    }

    // S 級客戶即時通知 (可選)
    if (result && result.grade === 'S') {
      console.log(`[UAG] 🔥 S-Grade Lead Detected! Session: ${session_id}`);
      // 可接入 webhook 或推播通知業務
      // await sendWebhookToAgent(agent_id, session_id);
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('UAG Track Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
```

### 5.2 API Payload 規格

```json
// 請求 (POST /api/uag-track)
{
  "session_id": "u_abc123xyz",
  "agent_id": "agent_456",
  "fingerprint": "eyJzY3JlZW4iOi...",
  "event": {
    "type": "page_exit",
    "property_id": "prop_789",
    "district": "西屯區",
    "duration": 85,
    "actions": {
      "click_photos": 3,
      "click_line": 1,
      "click_call": 0,
      "scroll_depth": 92
    },
    "focus": []
  }
}

// 回應
{
  "success": true,
  "grade": "S"
}
```

---

## 6. 資料庫 Schema

### 6.1 完整 SQL 腳本 (`/supabase-uag-tracking.sql`)

```sql
-- ==============================================================================
-- UAG v8.0 Ultimate Optimization Schema
-- Implements: Normalized Events, Session Summary, Materialized Views, Archiving
-- ==============================================================================

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. UAG Sessions (會話摘要表 - 熱數據)
-- ══════════════════════════════════════════════════════════════════════════════
DROP TABLE IF EXISTS public.uag_sessions CASCADE;
CREATE TABLE public.uag_sessions (
    session_id TEXT PRIMARY KEY,
    agent_id TEXT,
    total_duration INTEGER DEFAULT 0,        -- 總停留秒數
    property_count INTEGER DEFAULT 0,        -- 瀏覽物件數
    grade CHAR(1) DEFAULT 'F',               -- 客戶等級 S/A/B/C/F
    last_active TIMESTAMPTZ DEFAULT NOW(),
    summary JSONB DEFAULT '{}'::jsonb,       -- 聚合統計 (district_counts, strong_signals)
    fingerprint TEXT,                        -- 指紋 (跨設備識別)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_grade_time ON public.uag_sessions (grade, last_active DESC);
CREATE INDEX idx_session_fingerprint ON public.uag_sessions (fingerprint);
CREATE INDEX idx_session_agent ON public.uag_sessions (agent_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. UAG Events (事件明細表 - 熱數據)
-- ══════════════════════════════════════════════════════════════════════════════
DROP TABLE IF EXISTS public.uag_events CASCADE;
CREATE TABLE public.uag_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL REFERENCES public.uag_sessions(session_id) ON DELETE CASCADE,
    agent_id TEXT,
    property_id TEXT,                        -- 物件 ID
    district TEXT,                           -- 行政區
    duration INTEGER DEFAULT 0,              -- 該次停留秒數
    actions JSONB DEFAULT '{}'::jsonb,       -- 行為記錄
    focus TEXT[],                            -- 關注區塊 (可選)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_session_time ON public.uag_events (session_id, created_at DESC);
CREATE INDEX idx_property_agent ON public.uag_events (property_id, agent_id);
CREATE INDEX idx_events_created_at ON public.uag_events (created_at);

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. UAG Events Archive (冷數據歸檔)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.uag_events_archive (
    LIKE public.uag_events INCLUDING ALL
);

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. Materialized View: 快速排行榜
-- ══════════════════════════════════════════════════════════════════════════════
DROP MATERIALIZED VIEW IF EXISTS public.uag_lead_rankings;
CREATE MATERIALIZED VIEW public.uag_lead_rankings AS
SELECT
  session_id,
  agent_id,
  grade,
  last_active,
  CASE
    WHEN last_active > NOW() - INTERVAL '3 hours' THEN 'HOT'
    WHEN last_active > NOW() - INTERVAL '24 hours' THEN 'WARM'
    ELSE 'COLD'
  END as temperature,
  ROW_NUMBER() OVER (
    PARTITION BY agent_id
    ORDER BY
      CASE grade WHEN 'S' THEN 1 WHEN 'A' THEN 2 WHEN 'B' THEN 3 WHEN 'C' THEN 4 ELSE 5 END,
      last_active DESC
  ) as rank
FROM public.uag_sessions
WHERE grade IN ('S', 'A', 'B')
WITH DATA;

CREATE INDEX idx_lead_ranking ON public.uag_lead_rankings(agent_id, grade, rank);

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. 分級計算函數
-- ══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION calculate_lead_grade(
  p_duration INTEGER,
  p_actions JSONB,
  p_revisits INTEGER,
  p_district_count INTEGER,
  p_competitor_duration INTEGER DEFAULT 0
) RETURNS CHAR(1) AS $$
BEGIN
  -- S: 強意願 + 長停留
  IF (p_actions->>'click_line' = '1' OR p_actions->>'click_call' = '1') THEN
     IF p_duration >= 120 OR p_competitor_duration >= 300 THEN
        RETURN 'S';
     END IF;
  END IF;

  -- A: 深度瀏覽
  IF p_duration >= 90 AND (p_actions->>'scroll_depth')::INT >= 80 THEN
    RETURN 'A';
  END IF;
  IF p_competitor_duration >= 180 AND p_duration >= 10 THEN
    RETURN 'A';
  END IF;

  -- B: 中度興趣 (含區域加分)
  IF p_duration >= 60 OR (p_revisits >= 2 AND p_duration >= 30) THEN
    IF p_district_count >= 3 THEN RETURN 'A'; END IF;
    RETURN 'B';
  END IF;

  -- C: 輕度興趣 (含區域加分)
  IF p_duration >= 20 THEN
    IF p_district_count >= 3 THEN RETURN 'B'; END IF;
    RETURN 'C';
  END IF;

  RETURN 'F';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ══════════════════════════════════════════════════════════════════════════════
-- 6. 歸檔函數 (定期執行)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION archive_old_history()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE v_count INTEGER;
BEGIN
    WITH archived AS (
      INSERT INTO public.uag_events_archive
      SELECT * FROM public.uag_events WHERE created_at < NOW() - INTERVAL '3 hours'
      RETURNING id
    ),
    deleted AS (
      DELETE FROM public.uag_events WHERE id IN (SELECT id FROM archived)
      RETURNING id
    )
    SELECT COUNT(*) INTO v_count FROM deleted;
    RETURN v_count;
END;
$$;

-- ══════════════════════════════════════════════════════════════════════════════
-- 7. 核心 RPC: 追蹤事件並即時計算等級
-- ══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION track_uag_event_v8(
  p_session_id TEXT,
  p_agent_id TEXT,
  p_fingerprint TEXT,
  p_event_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session public.uag_sessions%ROWTYPE;
    v_new_summary JSONB;
    v_new_total_duration INTEGER;
    v_new_grade CHAR(1);
    v_district TEXT;
    v_pid TEXT;
    v_duration INTEGER;
    v_actions JSONB;
    v_district_count INTEGER;
    v_revisits INTEGER;
    v_competitor_duration INTEGER;
BEGIN
    -- 解析事件資料
    v_pid := p_event_data->>'property_id';
    v_district := p_event_data->>'district';
    v_duration := (p_event_data->>'duration')::INTEGER;
    v_actions := p_event_data->'actions';

    -- 1. Upsert Session
    INSERT INTO public.uag_sessions (session_id, agent_id, fingerprint, last_active)
    VALUES (p_session_id, p_agent_id, p_fingerprint, NOW())
    ON CONFLICT (session_id) DO UPDATE SET
        last_active = NOW(),
        agent_id = COALESCE(EXCLUDED.agent_id, public.uag_sessions.agent_id),
        fingerprint = COALESCE(EXCLUDED.fingerprint, public.uag_sessions.fingerprint)
    RETURNING * INTO v_session;

    -- 2. Insert Event
    INSERT INTO public.uag_events (session_id, agent_id, property_id, district, duration, actions, focus)
    VALUES (p_session_id, p_agent_id, v_pid, v_district, v_duration, v_actions,
            ARRAY(SELECT jsonb_array_elements_text(p_event_data->'focus')));

    -- 3. 更新 Summary
    v_new_summary := COALESCE(v_session.summary, '{}'::jsonb);
    IF v_district IS NOT NULL THEN
        v_new_summary := jsonb_set(
            v_new_summary,
            ARRAY['district_counts', v_district],
            to_jsonb(COALESCE((v_new_summary->'district_counts'->>v_district)::INT, 0) + 1)
        );
    END IF;

    -- 4. 聚合計算
    SELECT SUM(duration), COUNT(DISTINCT property_id), COUNT(*) FILTER (WHERE property_id = v_pid)
    INTO v_new_total_duration, v_district_count, v_revisits
    FROM public.uag_events WHERE session_id = p_session_id;

    SELECT SUM(duration) INTO v_competitor_duration
    FROM public.uag_events
    WHERE session_id = p_session_id AND district = v_district AND property_id != v_pid;

    -- 5. 計算等級
    v_new_grade := calculate_lead_grade(
        (SELECT SUM(duration) FROM public.uag_events WHERE session_id = p_session_id AND property_id = v_pid)::INT,
        v_actions,
        v_revisits,
        (SELECT COUNT(DISTINCT property_id) FROM public.uag_events WHERE session_id = p_session_id AND district = v_district)::INT,
        COALESCE(v_competitor_duration, 0)
    );

    -- 6. 更新 Session (等級只升不降)
    UPDATE public.uag_sessions
    SET
        total_duration = v_new_total_duration,
        property_count = (SELECT COUNT(DISTINCT property_id) FROM public.uag_events WHERE session_id = p_session_id),
        summary = v_new_summary
    WHERE session_id = p_session_id;

    UPDATE public.uag_sessions
    SET grade = v_new_grade
    WHERE session_id = p_session_id
      AND (CASE grade WHEN 'S' THEN 5 WHEN 'A' THEN 4 WHEN 'B' THEN 3 WHEN 'C' THEN 2 ELSE 1 END)
        < (CASE v_new_grade WHEN 'S' THEN 5 WHEN 'A' THEN 4 WHEN 'B' THEN 3 WHEN 'C' THEN 2 ELSE 1 END);

    RETURN jsonb_build_object('success', true, 'grade', v_new_grade);
END;
$$;

-- ══════════════════════════════════════════════════════════════════════════════
-- 8. RLS 政策 (Row Level Security)
-- ══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.uag_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uag_events ENABLE ROW LEVEL SECURITY;

-- 允許匿名寫入 (追蹤用)
CREATE POLICY "Allow anon insert" ON public.uag_sessions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon insert" ON public.uag_events FOR INSERT TO anon WITH CHECK (true);

-- 業務只能看自己的客戶
CREATE POLICY "Agent can read own sessions" ON public.uag_sessions
  FOR SELECT TO authenticated
  USING (agent_id = auth.uid()::text);

CREATE POLICY "Agent can read own events" ON public.uag_events
  FOR SELECT TO authenticated
  USING (agent_id = auth.uid()::text);
```

### 6.2 資料表關聯圖

```
┌─────────────────────────────┐
│       uag_sessions          │
│  (會話摘要 - Primary)        │
├─────────────────────────────┤
│ PK session_id TEXT          │
│    agent_id TEXT            │
│    total_duration INT       │
│    property_count INT       │
│    grade CHAR(1)            │◄─────── S/A/B/C/F
│    last_active TIMESTAMPTZ  │
│    summary JSONB            │◄─────── { district_counts, strong_signals }
│    fingerprint TEXT         │
│    created_at TIMESTAMPTZ   │
└──────────────┬──────────────┘
               │
               │ 1:N
               ▼
┌─────────────────────────────┐
│        uag_events           │
│  (事件明細 - Detail)         │
├─────────────────────────────┤
│ PK id UUID                  │
│ FK session_id TEXT          │──────► References uag_sessions
│    agent_id TEXT            │
│    property_id TEXT         │◄─────── 哪個物件
│    district TEXT            │◄─────── 哪個區
│    duration INT             │◄─────── 停留多久
│    actions JSONB            │◄─────── { click_line, scroll_depth... }
│    focus TEXT[]             │
│    created_at TIMESTAMPTZ   │
└─────────────────────────────┘
               │
               │ Archive (3hr+)
               ▼
┌─────────────────────────────┐
│     uag_events_archive      │
│  (冷數據歸檔)                │
└─────────────────────────────┘
```

---

## 7. 待優化問題清單

### 7.1 高優先級 (必須修復)

| #   | 問題                           | 現狀                              | 解決方案                                                 |
| --- | ------------------------------ | --------------------------------- | -------------------------------------------------------- |
| 1   | **district 未傳遞**            | React 版永遠送 'unknown'          | 從物件資料取得 `property.district` 傳入 tracker          |
| 2   | **UAG Dashboard 查詢欄位錯誤** | 查 `ts`, `event`, `page` (舊欄位) | 改為 `created_at`, `property_id`, `actions`              |
| 3   | **資料庫未部署**               | SQL 只存在檔案中                  | 需在 Supabase Dashboard 執行 `supabase-uag-tracking.sql` |
| 4   | **缺少 session-recovery API**  | 前端會呼叫但 API 不存在           | 新增 `/api/session-recovery.js` 或移除前端呼叫           |

### 7.2 中優先級 (建議優化)

| #   | 問題                             | 現狀                             | 解決方案                           |
| --- | -------------------------------- | -------------------------------- | ---------------------------------- |
| 5   | **重複送出 page_exit**           | 可能送多次                       | 加入 debounce 或 flag 確保只送一次 |
| 6   | **未追蹤地圖點擊**               | actions.click_map 有欄位但沒監聽 | 在 tracker 中加入地圖按鈕監聽      |
| 7   | **Materialized View 未自動刷新** | 需手動 REFRESH                   | 設定 pg_cron 定時刷新              |
| 8   | **歸檔未自動執行**               | archive_old_history() 需手動觸發 | 設定 pg_cron 每小時執行            |

### 7.3 低優先級 (未來增強)

| #   | 功能             | 說明                                             |
| --- | ---------------- | ------------------------------------------------ |
| 9   | S 級客戶即時推播 | 當客戶升級 S 級時，推播通知給業務                |
| 10  | 熱力圖追蹤       | 使用 IntersectionObserver 記錄用戶關注的頁面區塊 |
| 11  | A/B 測試支援     | 記錄實驗分組，分析不同版本轉換率                 |
| 12  | 跨設備合併       | 利用 fingerprint + 登入後 user_id 合併 Session   |

---

## 8. 部署檢查清單

### 8.1 資料庫部署

```bash
# 1. 登入 Supabase Dashboard
# 2. 進入 SQL Editor
# 3. 貼上並執行 supabase-uag-tracking.sql 全部內容
# 4. 確認無錯誤

# 驗證表格建立
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'uag%';

# 預期結果:
# - uag_sessions
# - uag_events
# - uag_events_archive
```

### 8.2 環境變數確認

```bash
# Vercel 環境變數 (Dashboard > Settings > Environment Variables)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxxx  # 注意：使用 SERVICE_ROLE_KEY 而非 ANON_KEY

# 本地開發 (.env)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxxx
```

### 8.3 前端確認

```javascript
// 檢查 tracker.js 是否載入
console.log(window.uagTracker); // 應該有值

// 檢查 Session ID
console.log(localStorage.getItem('uag_session')); // 應該有值

// 手動觸發測試
window.uagTracker.trackImmediate('test_event');
```

### 8.4 API 測試

```bash
# 測試追蹤 API
curl -X POST https://maihouses.vercel.app/api/uag-track \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test_123",
    "agent_id": "agent_456",
    "event": {
      "type": "test",
      "property_id": "prop_789",
      "district": "西屯區",
      "duration": 60,
      "actions": { "scroll_depth": 80 }
    }
  }'

# 預期回應
# {"success":true,"grade":"B"}
```

---

## 📝 附錄：快速啟動指南

### Step 1: 部署資料庫

```
在 Supabase Dashboard 執行 supabase-uag-tracking.sql
```

### Step 2: 設定環境變數

```
在 Vercel Dashboard 設定 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY
```

### Step 3: 確認前端追蹤

```html
<!-- 在物件頁面確保有載入 -->
<script>
  window.propertyId = '物件ID';
  window.propertyDistrict = '行政區';
</script>
<script src="/js/tracker.js"></script>
```

### Step 4: 驗證數據流

```
1. 瀏覽物件頁面
2. 打開 DevTools > Network
3. 確認有發送到 /api/uag-track
4. 在 Supabase > Table Editor > uag_events 確認有資料
```

---

**文件維護者**: Copilot  
**最後更新**: 2025/11/29  
**版本**: v8.0
