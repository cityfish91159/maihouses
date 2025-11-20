# UAG 精準獲客系統：技術與規則規格書

**文件日期**：2025/11/20
**適用版本**：Optimization v8.0 (Ultimate Optimization)
**用途**：內部會議討論與技術驗收

---

## 1. 系統概述

本系統旨在透過前端行為追蹤與後端規則引擎，將訪客的瀏覽行為轉化為可量化、可變現的「購屋意向等級 (Lead Grade)」。
**v8.0 重大更新**：引入「增量更新 (Incremental Updates)」、「即時歸檔 (Real-time Archiving)」與「智慧快取 (Smart Caching)」，徹底解決資料庫膨脹與查詢效能問題。

---

## 2. 系統架構 (System Architecture v8.0)

為解決高流量下的效能瓶頸與資料庫膨脹，系統採用以下三層結構：

### A. 熱數據層 (Hot Data Layer) - `uag_sessions` & `uag_events`
*   **機制**：前端 `EnhancedTracker` 傳送的事件，透過 RPC `track_uag_event_v8` 進行原子化更新。
*   **優勢**：`uag_sessions` 僅儲存最新的摘要數據 (Duration, Score, Grade)，`uag_events` 儲存最近 3 小時的詳細日誌。
*   **資料保留**：熱數據僅保留 3 小時，確保查詢極快。

### B. 冷數據層 (Cold Data Layer) - `uag_events_archive`
*   **觸發**：透過 Cron Job (`api/archive-handler.js`) 每小時執行一次。
*   **邏輯**：將 `uag_events` 中超過 3 小時的數據移動至 `uag_events_archive` (按月分區)。
*   **用途**：長期歷史分析與稽核，不影響即時儀表板效能。

### C. 快取層 (Caching Layer) - `uag_lead_rankings` (Materialized View)
*   **用途**：專供業務後台 (Admin Dashboard) 查詢。
*   **結構**：Materialized View，預先計算好排序與篩選結果。
*   **效能**：業務篩選「S 級客戶」時，直接讀取 View，無需掃描大表，實現毫秒級回應。

---

## 3. 前端監控方式 (Frontend Monitoring)

**核心腳本**：`public/js/tracker.js` (EnhancedTracker)
**運作原理**：
當使用者進入房源頁面時，腳本會自動初始化並執行以下監控：

### A. 身份與歸屬綁定
*   **Session ID**：多重儲存 (LocalStorage + SessionStorage + Cookie) 防止遺失。
*   **Fingerprint**：瀏覽器指紋識別，用於跨瀏覽器或無痕模式下的 Session 恢復。
*   **Agent ID**：自動抓取網址參數 `?aid=agent_name`，確保歸屬正確。

### B. 行為數據採集
1.  **時間追蹤**：
    *   記錄進入時間 (`enterTime`) 與離開時間。
    *   精確計算有效停留秒數 (`duration`)。
2.  **關鍵互動 (Key Actions)**：
    *   **點擊圖片** (`click_photos`)：意向指標。
    *   **點擊地圖** (`click_map`)：地段意向。
    *   **點擊 LINE/電話** (`click_line`, `click_call`)：**強訊號 (High Intent)**。
    *   **捲動深度** (`scroll_depth`)：閱讀完整度。
3.  **視覺焦點 (Focus)**：
    *   利用 `IntersectionObserver` 偵測使用者停留在「價格區」、「詳情區」還是「圖片區」。

---

## 4. 數據回傳機制 (Data Transmission)

**觸發時機**：
1.  當使用者**離開頁面** (Visibility Change / Unload) 時。
2.  當累積停留時間超過 5 秒或發生關鍵互動時。
3.  **批次傳送 (Batching)**：每 10 秒或累積 5 個事件傳送一次，減少 API 呼叫次數。

**傳輸技術**：
*   使用 `navigator.sendBeacon` API。
*   **優點**：即使瀏覽器分頁已關閉，數據仍能可靠地傳送至後端，不會遺失。

**資料結構 (Payload)**：
```json
{
  "sessionId": "u_x9s8d7",
  "agentId": "agent_007",
  "events": [
      {
        "pid": "prop_123",
        "duration": 125,
        "actions": { "click_line": 1, "scroll_depth": 85 },
        "focus": ["price", "details"]
      }
  ]
}
```

---

## 5. 後端判別方式 (Backend Judgment)

**核心邏輯**：`api/analyze-behavior.js` (v5.0)
**處理流程**：

1.  **聚合查詢**：從 `uag_event_logs` 撈取該 Session 相關的所有事件。
2.  **單一物件評級**：針對每個物件獨立計算等級 (S/A/B/C/F)。
    *   **S 級**：強訊號 (LINE/電話) + 停留 ≥120s + 回訪 ≥2。
    *   **A 級**：深度瀏覽 (停留 ≥90s + 捲動 ≥80%) + 回訪 ≥1。
    *   **B 級**：停留 ≥60s 或 (回訪 ≥2 + 停留 ≥30s)。
    *   **C 級**：停留 ≥20s。
    *   **F 級**：其他。
3.  **商圈加分 (District Bonus)**：
    *   若同商圈瀏覽 ≥3 間，且該物件等級為 B 或 C，則升一級 (B→A, C→B)。
4.  **寫入 Leads 表**：將計算結果寫入 `uag_leads`，供前端快速查詢。

---

## 6. 遊戲規則與分級標準 (Game Rules)

### 單一物件等級判定矩陣 (Per Property)

| 等級 | 定義 (Intent) | 判定條件 (必須滿足) | 收費 (點數) |
| :--- | :--- | :--- | :--- |
| **S (Super-Hot)** | 極高意向 | 滿足其一：<br>1. **強訊號 (LINE/電話)** + 該物件停留 ≥120s<br>2. **強訊號** + 同商圈競品總停留 ≥300s (競品加持) | **20 點** |
| **A (Hot)** | 高意向 | 滿足其一：<br>1. 該物件停留 ≥90s + 捲動 ≥80%<br>2. 同商圈競品總停留 ≥180s + 該物件停留 ≥10s | **10 點** |
| **B (Warm)** | 中度意向 | 滿足其一：<br>• 該物件停留 ≥60s<br>• 該物件回訪 ≥2 次 且 停留 ≥30s | **3 點** |
| **C (Cool)** | 初步瀏覽 | 該物件停留 ≥20 秒 | **1 點** |
| **F (Fill)** | 補量/潛在 | 停留 < 20 秒 | **0.5 點** |

---

## 7. 優化與緩解策略 (Optimization & Mitigation)

### A. 資料庫膨脹對策
*   **正規化 (Normalization)**：不再使用 JSONB Array 儲存無限增長的 History，改用 `uag_event_logs` 表。
*   **冷熱分離**：系統僅查詢最近 7 天 (匿名) 或 30 天 (實名) 的熱資料，舊資料定期歸檔。

### B. Cache 清除 / Session 斷層對策
*   **7 天窗口**：匿名 Session 的判級有效期設為 7 天，超過 7 天視為新客，避免舊資料干擾。
*   **聯絡人綁定 (未來規劃)**：當使用者觸發 LINE/電話時，引導輸入資訊並綁定 `contact_id`，之後即使清除 Cache 也能透過電話號碼歸戶。

---

## 8. 系統架構終極優化 (Ultimate Architecture v7.0)

針對高併發、資料庫膨脹與查詢效能的最終極解決方案。此版本取代 v6.0，採用「增量更新 + 預計算快取」模式，徹底解決效能瓶頸。

### 1. 資料庫結構優化 (Schema Optimization)
核心概念：分離「熱數據 (Sessions)」與「歷史軌跡 (Events)」，並引入「預計算快取 (Cached Stats)」。

```sql
-- 1. Session 表：只存聚合數據與當前狀態 (熱數據)
CREATE TABLE uag_sessions (
  session_id TEXT PRIMARY KEY,
  current_agent_id TEXT,
  
  -- 【關鍵優化】預計算快取：避免每次重算歷史
  -- 結構範例：{ "total_duration": 450, "district_counts": {"北屯": 5}, "strong_signals": 2 }
  cached_stats JSONB DEFAULT '{}'::jsonb,
  
  current_grade TEXT DEFAULT 'F',
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引：支援業務後台秒級篩選
CREATE INDEX idx_grade ON uag_sessions(current_grade);
CREATE INDEX idx_agent_grade ON uag_sessions(current_agent_id, current_grade);
CREATE INDEX idx_last_activity ON uag_sessions(last_activity DESC);

-- 2. Event 表：正規化歷史記錄 (支援分頁與歸檔)
CREATE TABLE uag_events (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT REFERENCES uag_sessions(session_id),
  agent_id TEXT,
  pid TEXT,
  district TEXT,
  duration INT,
  actions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引：支援快速寫入與查詢
CREATE INDEX idx_events_session ON uag_events(session_id);
CREATE INDEX idx_events_created ON uag_events(created_at DESC);
```

### 2. 增量更新邏輯 (Incremental Update)
**核心原則**：前端只送單筆事件，後端只做增量計算，**絕不讀取整個 History**。

**前端 (Tracker)**：
```javascript
// 只送當前這一筆，Payload < 1KB
navigator.sendBeacon('/api/uag-track', JSON.stringify({
  session_id: "u_x9s8d7",
  event: { property_id: "p1", district: "北屯", duration: 10, actions: {...} }
}));
```

**後端 (API)**：
1.  **Insert**：將新事件寫入 `uag_events` (O(1))。
2.  **Update Cache**：讀取 `uag_sessions.cached_stats`，將新事件的數值 (Duration, Actions) 累加進去。
3.  **Calculate**：基於更新後的 `cached_stats` 直接判定等級 (O(1))。
4.  **Upsert**：更新 `uag_sessions` 的 `cached_stats` 與 `current_grade`。

### 3. 業務看板優化 (Materialized View)
針對「排行榜」或「全站統計」等高消耗查詢，使用物化視圖。

```sql
-- 每 5 分鐘刷新一次的業務看板
CREATE MATERIALIZED VIEW agent_dashboard AS
SELECT
  current_agent_id AS agent_id,
  current_grade AS grade,
  COUNT(*) AS lead_count
FROM uag_sessions
WHERE last_activity > NOW() - INTERVAL '30 days'
GROUP BY current_agent_id, current_grade;
```

### 4. 資料庫膨脹解決方案 (Cold/Hot Separation)
*   **冷熱分離**：建立 `uag_events_archive` 表。
*   **定期歸檔**：每天凌晨執行 Cron Job，將 `uag_events` 中超過 30 天的資料移至歸檔表，並從主表刪除。
*   **效果**：主表永遠保持輕量，查詢速度恆定。

### 5. Session 斷層終極解 (Fingerprinting)
結合「瀏覽器指紋」與「後端匹配」來恢復 Session。

```javascript
// 前端：若無 Session ID，先嘗試用指紋恢復
const fp = await getFingerprint(); // UserAgent + Screen + Canvas
const recovered = await fetch('/api/session/recover', { body: { fingerprint: fp } });
if (recovered.sessionId) {
  localStorage.setItem('SESSION_KEY', recovered.sessionId);
}
```

---

## 9. 實時歸檔與智能快取 (Real-time Archiving & Smart Caching v8.0)

針對海量數據的長期維運策略，引入「實時歸檔」與「智能快取層」。

### 1. 實時歸檔機制 (Real-time Archiving)
**目的**：確保熱數據表 (`uag_events`) 永遠保持輕量，提升查詢效能。
**策略**：每 30 分鐘執行一次歸檔，將超過 3 小時的詳細數據移至冷儲存。

```javascript
// api/archive-handler.js
export async function archiveOldHistory() {
  // 將超過 3 小時的詳細數據移到冷儲存
  const result = await sql`
    WITH archived AS (
      INSERT INTO uag_events_archive 
      SELECT * FROM uag_events 
      WHERE created_at < NOW() - INTERVAL '3 hours'
      RETURNING session_id
    )
    DELETE FROM uag_events 
    WHERE id IN (SELECT id FROM archived);
  `;
}
```

### 2. 智能快取層 (Smart Caching Layer)
**目的**：減少資料庫讀取壓力，加速熱門客戶查詢。
**技術**：使用 Redis 或類似的 In-Memory Store。

```javascript
class LeadCache {
  async getHotLeads(agentId) {
    const cacheKey = `hot_leads:${agentId}`;
    let leads = await redis.get(cacheKey);
    
    if (!leads) {
      // 只查詢最近 3 小時的熱數據
      leads = await queryHotLeadsFromDB(agentId);
      await redis.setex(cacheKey, 300, JSON.stringify(leads)); // 5分鐘快取
    }
    return JSON.parse(leads);
  }
}
```

### 3. 快速篩選優化 (Quick Filter Optimization)
**預計算等級索引 (Materialized View)**：
建立 `uag_lead_rankings` 物化視圖，預先計算好每個 Lead 的排名與溫度 (HOT/WARM/COLD)。

```sql
CREATE MATERIALIZED VIEW uag_lead_rankings AS
SELECT 
  session_id,
  agent_id,
  grade,
  CASE 
    WHEN last_active > NOW() - INTERVAL '3 hours' THEN 'HOT'
    ELSE 'COLD'
  END as temperature,
  ROW_NUMBER() OVER (PARTITION BY agent_id ORDER BY grade_rank, last_active DESC) as rank
FROM uag_sessions
WITH DATA;
```

### 4. 多重身份識別策略 (Multi-Identity Recognition)
**前端增強 (Enhanced Tracker)**：
同時使用 `localStorage`, `sessionStorage`, `Cookie` 三重儲存 Session ID，並結合 Fingerprint 進行後端關聯。

```javascript
class EnhancedTracker {
  getOrCreateSessionId() {
    // 優先順序: localStorage -> sessionStorage -> Cookie -> New
    let sid = localStorage.getItem('uag_session') || 
              sessionStorage.getItem('uag_session_temp') || 
              this.getCookie('uag_sid');
              
    if (!sid) {
      sid = `u_${Math.random().toString(36).substr(2, 9)}`;
      this.persistSession(sid); // 同步寫入三處
    }
    return sid;
  }
}
```

### 5. 實時儀表板 (Real-time Dashboard)
**技術**：WebSocket (Socket.io) 推送。
**機制**：當後端計算出 S 級客戶時，即時推送給對應業務的客戶端，無需輪詢。

```javascript
// Server-side
eventEmitter.on('new_lead', async (data) => {
  io.to(`agent_${data.agentId}`).emit('lead_update', {
    type: 'new',
    grade: data.grade,
    sessionId: data.sessionId
  });
});
```
*   **機制**：實作事件隊列 (Event Queue)。
*   **邏輯**：每 10 秒或累積 5 筆事件發送一次 `sendBeacon`。
*   **例外**：`unload` (離開) 與 `click_line` (強訊號) 立即發送。

**3. Session 斷層補救 (Session Recovery)**
*   **Level 1 (指紋)**：記錄 UserAgent + IP + ScreenRes 雜湊，嘗試軟合併 (Soft Merge) 孤兒 Session。
*   **Level 2 (誘因)**：透過「解鎖高清圖」或「降價通知」引導使用者輸入手機或 LINE 登入，將 Session 綁定至穩定 ID。

---
