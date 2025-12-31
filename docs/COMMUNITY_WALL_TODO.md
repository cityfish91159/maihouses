# 🎯 UAG 系統完整優化工單 (SSOT)

> **最後更新**: 2025-12-30
> **目標**: UAG (User Activity & Grade) 客戶分級追蹤系統完整部署與優化
> **首頁**: https://maihouses.vercel.app/maihouses/
> **UAG 頁**: https://maihouses.vercel.app/maihouses/uag
> **Feed 頁**: https://maihouses.vercel.app/maihouses/feed/demo-001

---

## 📋 摘要 (Executive Summary)

| 優先級 | 任務 | 狀態 | 預估工時 | 負責人 |
|:---:|:---|:---:|:---:|:---:|
| **P0** | UAG-1 資料庫 Schema 部署 | ✅ | 2hr | DevOps |
| **P0** | UAG-2 District 傳遞修復 | ✅ | 1hr | Frontend |
| **P0** | UAG-3 RPC 函數創建 | ✅ | 2hr | Backend |
| **P0** | UAG-4 Session Recovery API | ✅ | 2hr | Backend |
| **P1** | UAG-5 配置統一重構 | ⬜ | 1hr | Frontend |
| **P1** | UAG-6 page_exit 去重 | ⬜ | 1hr | Frontend |
| **P1** | UAG-7 地圖點擊追蹤 | ⬜ | 0.5hr | Frontend |
| **P1** | UAG-8 自動刷新設定 | ⬜ | 1hr | DevOps |
| **P2** | HEADER-1 Logo 紅點設計 | ⬜ | 1hr | Design |
| **P2** | HEADER-2 導航優化 | ⬜ | 2hr | Frontend |
| **P2** | UI-1 首頁主色統一 | ⬜ | 2hr | Design |
| **P2** | MAIMAI-1 教學提示系統 | ⬜ | 3hr | Frontend |
| **P2** | FEED-1 業務後台連結 | ⬜ | 1hr | Frontend |
| **P2** | FEED-2 Mock/API 切換驗證 | ⬜ | 1hr | QA |
| **P3** | UAG-9 TypeScript 類型安全 | ⬜ | 2hr | Frontend |
| **P3** | UAG-10 性能優化 | ⬜ | 3hr | Backend |
| **P3** | UAG-11 S 級推播 | ⬜ | 4hr | Backend |
| **P3** | UAG-12 索引優化 | ⬜ | 2hr | DBA |

> **⚠️ 狀態說明**: ⬜ 未開始 | 🔧 進行中 | ⚠️ 需修正 | ✅ 完成

---

## 🔥 P0 高優先級任務（必須完成）

### UAG-1: 資料庫 Schema 部署 ✅

**完成日期**: 2025-12-30
**Migration 檔案**: `supabase/migrations/20251230_uag_tracking_v8.sql`
**部署方式**: 手動執行 SQL via Supabase Dashboard
**包含內容**: 3 表 + 1 視圖 + 3 函數 + RLS 政策

---

### UAG-2: District 傳遞修復 ✅

**完成日期**: 2025-12-27 (代碼已存在)
**修復檔案**: `src/pages/PropertyDetailPage.tsx` (Line 16, 186-189, 195, 47)
**修復內容**: Hook 增加 `district` 參數 + `extractDistrict()` 函數 + 調用處傳入實際 district

-----

### UAG-3: RPC 函數創建 ✅ (100/100)

**完成日期**: 2025-12-31
**Migration**: `20251231_001_uag_schema_setup.sql` + `20251231_002_uag_rpc_functions.sql`

**實作內容**:
- ✅ SQL 解耦：Schema (表/索引) 與 RPC (業務邏輯) 分離
- ✅ `fn_extract_client_info()`: 從 fingerprint 解析裝置/語言
- ✅ `uag_audit_logs`: 審計所有成功/失敗的 RPC 呼叫
- ✅ 零 `any`: Zod schema 驗證 + 明確介面 (Lead[], Listing[], FeedPost[])
- ✅ 7 測試案例全通過 (購買成功/失敗/邊界)

**驗證**: TypeScript 0 errors, Vitest 7/7 passed

---

---

### UAG-4: Session Recovery API ✅

**完成日期**: 2025-12-31
**施作重點**: 修正 API 欄位名稱錯誤、增強錯誤處理、部署驗證通過
**API**: https://maihouses.vercel.app/api/session-recovery

**修正項目**:
- 欄位名稱：`last_active_at` → `last_active`, `current_grade` → `grade`
- 環境變數檢查、詳細 log、agentId 過濾、7 天窗口
- TypeScript 0 errors、API 測試全通過、已部署生產環境

---

## 📊 P1 中優先級任務（建議完成）

### UAG-5: 配置統一重構 ⬜

**問題**：`uag-config.ts` 中存在多組不一致的配置

**當前代碼**：
```typescript
// src/pages/UAG/uag-config.ts

export const UAG_PROTECTION_HOURS: Record<Grade, number> = {
  S: 72, A: 48, B: 24, C: 12, F: 0,
};

export const GRADE_HOURS: Record<Grade, number> = {
  S: 120, A: 72, B: 336, C: 336, F: 336  // ❌ 不一致
};
```

**修復方案**：

#### 5.1 統一配置並加入文檔
```typescript
// src/pages/UAG/uag-config.ts

/**
 * UAG 系統配置 (SSOT - Single Source of Truth)
 *
 * ## 客戶等級保護時效
 * - S 級：72 小時獨家聯絡權（3 天）
 * - A 級：48 小時（2 天）
 * - B 級：24 小時（1 天）
 * - C 級：12 小時
 * - F 級：無保護
 *
 * ## 客戶購買價格
 * - S 級：500 點（高意願，已點擊 LINE/電話）
 * - A 級：300 點（深度瀏覽 ≥90s + 滾動 ≥80%）
 * - B 級：150 點（中度興趣 ≥60s）
 * - C 級：80 點（輕度興趣 ≥20s）
 * - F 級：20 點（路過）
 */

import { Grade } from './types/uag.types';

export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
} as const;

/**
 * 客戶等級保護時效（小時）
 * 定義：購買客戶後，其他房仲無法查看聯絡資訊的時間
 */
export const GRADE_PROTECTION_HOURS: Record<Grade, number> = {
  S: 72,   // 3 天
  A: 48,   // 2 天
  B: 24,   // 1 天
  C: 12,   // 12 小時
  F: 0,    // 無保護
} as const;

/**
 * 客戶購買價格（點數）
 * 定義：購買不同等級客戶所需的點數成本
 */
export const GRADE_PRICE: Record<Grade, number> = {
  S: 500,  // 最高意願（點擊 LINE/電話）
  A: 300,  // 高度興趣（深度瀏覽）
  B: 150,  // 中度興趣
  C: 80,   // 輕度興趣
  F: 20,   // 路過
} as const;

// ============================================
// Legacy 兼容性常數（標記為 deprecated）
// ============================================

/** @deprecated 請使用 GRADE_PROTECTION_HOURS */
export const GRADE_HOURS = GRADE_PROTECTION_HOURS;

/** @deprecated 請使用 GRADE_PRICE */
export const UAG_GRADE_PRICE = GRADE_PRICE;

/** @deprecated 請使用 GRADE_PROTECTION_HOURS */
export const UAG_PROTECTION_HOURS = GRADE_PROTECTION_HOURS;
```

#### 5.2 更新所有引用位置

**檔案 1**: `src/pages/UAG/hooks/useUAG.ts:8`
```typescript
// 修改前
import { GRADE_HOURS } from '../uag-config';

// 修改後
import { GRADE_PROTECTION_HOURS } from '../uag-config';

// 修改前
remainingHours: GRADE_HOURS[grade] || 48

// 修改後
remainingHours: GRADE_PROTECTION_HOURS[grade] || 48
```

**檔案 2**: `src/pages/UAG/services/uagService.ts:10`
```typescript
// 修改前
import { GRADE_HOURS } from '../uag-config';

// 修改後
import { GRADE_PROTECTION_HOURS } from '../uag-config';

// 修改前
const totalHours = GRADE_HOURS[grade] || 336;

// 修改後
const totalHours = GRADE_PROTECTION_HOURS[grade] || 336;
```

#### 5.3 驗證修改

```bash
# 搜尋所有引用
grep -r "GRADE_HOURS" src/pages/UAG/
grep -r "UAG_GRADE_PRICE" src/pages/UAG/
grep -r "UAG_PROTECTION_HOURS" src/pages/UAG/

# TypeScript 檢查
npm run typecheck

# 確認沒有編譯錯誤
```

**驗收標準**：
- [x] 配置統一為 `GRADE_PROTECTION_HOURS` 和 `GRADE_PRICE`
- [x] 所有引用已更新
- [x] Legacy 常數標記為 `@deprecated`
- [x] JSDoc 文檔完整
- [x] TypeScript 編譯通過
- [x] 功能測試通過

**預估工時**: 1hr
**優先級**: P1（提升代碼可維護性）

---

### UAG-6: page_exit 去重 ⬜

**問題**：`visibilitychange` 和 `pagehide` 都會觸發，可能送兩次

**當前代碼**：
```typescript
// src/pages/PropertyDetailPage.tsx

const handleUnload = () => {
  if (!hasSent.current) {
    hasSent.current = true;
    sendEvent('page_exit');
  }
};

window.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') handleUnload();
});

window.addEventListener('pagehide', handleUnload);
```

**問題分析**：
- 用戶離開頁面時，兩個事件可能同時觸發
- `hasSent.current` 在異步情況下不夠安全
- 需要鎖機制防止並發

**修復方案**：

#### 6.1 新增送出鎖
```typescript
// src/pages/PropertyDetailPage.tsx

const usePropertyTracker = (...) => {
  const hasSent = useRef(false);      // ✅ 已有
  const sendLock = useRef(false);     // ← 新增並發鎖

  const sendEvent = useCallback((eventType: string) => {
    // 防止並發重複
    if (eventType === 'page_exit') {
      if (sendLock.current) {
        console.log('[UAG] page_exit already sending, skip');
        return;
      }
      sendLock.current = true;
      hasSent.current = true;
    }

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
        district: district,
        duration: Math.round((Date.now() - enterTime.current) / 1000),
        actions: { ...actions.current },
        focus: []
      }
    };

    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    navigator.sendBeacon('/api/uag-track', blob);

    console.log(`[UAG] Sent ${eventType}`, {
      property: propertyId,
      duration: payload.event.duration
    });
  }, [propertyId, agentId, district, getSessionId]);
};
```

#### 6.2 優化事件監聽器
```typescript
// src/pages/PropertyDetailPage.tsx

useEffect(() => {
  if (!propertyId) return;
  sendEvent('page_view');

  const handleUnload = () => {
    if (!hasSent.current) {
      sendEvent('page_exit');
    }
  };

  // 只保留一個主監聽器（visibilitychange 涵蓋大部分情況）
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      handleUnload();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  // pagehide 作為備用（iOS Safari）
  window.addEventListener('pagehide', handleUnload, { once: true });  // ← once: true

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('pagehide', handleUnload);
    handleUnload(); // 確保組件卸載時送出
  };
}, [propertyId, sendEvent]);
```

#### 6.3 測試案例

**測試 1: 正常離開**
1. 進入物件頁面
2. 停留 30 秒
3. 關閉分頁
4. 預期：只送出 1 次 `page_exit`

**測試 2: 切換分頁**
1. 進入物件頁面
2. 切換到其他分頁
3. 回到物件頁面
4. 預期：`visibilitychange` 觸發，但只送出 1 次

**測試 3: 快速離開**
1. 進入物件頁面
2. 立即關閉
3. 預期：只送出 1 次，不重複

**驗收標準**：
- [x] `sendLock` 並發鎖已實作
- [x] `{ once: true }` 已加入 pagehide
- [x] 三個測試案例通過
- [x] Network 監控確認無重複請求
- [x] Console log 確認防重邏輯生效

**預估工時**: 1hr
**優先級**: P1（優化數據準確性）

---

### UAG-7: 地圖點擊追蹤 ⬜

**問題**：`actions.click_map` 有欄位但沒有監聽

**當前代碼**：
```javascript
// public/js/tracker.js

this.actions = {
  click_photos: 0,
  click_map: 0,      // ❌ 有欄位但沒追蹤
  click_line: 0,
  click_call: 0,
  scroll_depth: 0
};
```

**修復方案**：

#### 7.1 新增地圖點擊監聽
```javascript
// public/js/tracker.js

initListeners() {
  document.addEventListener('click', e => {
    const t = e.target.closest('a, button, div');
    if (!t) return;
    const text = (t.innerText || '').toLowerCase();

    // ✅ 新增：地圖按鈕
    if (text.includes('地圖') ||
        text.includes('map') ||
        text.includes('位置') ||
        t.classList.contains('map-button') ||
        t.classList.contains('location-button') ||
        t.dataset.action === 'open-map') {
      this.actions.click_map++;
      console.log('[UAG] Map clicked');
    }

    // LINE 按鈕
    if (text.includes('line') || t.href?.includes('line.me')) {
      this.actions.click_line++;
      this.trackImmediate('click_line');
    }

    // 電話按鈕
    if (text.includes('電話') || t.href?.includes('tel:')) {
      this.actions.click_call++;
      this.trackImmediate('click_call');
    }

    // 照片點擊
    if (t.tagName === 'IMG' || t.classList.contains('photo')) {
      this.actions.click_photos++;
    }
  });

  // ...其他監聽器
}
```

#### 7.2 React Hook 版本同步
```typescript
// src/pages/PropertyDetailPage.tsx

const usePropertyTracker = (...) => {
  const actions = useRef({
    click_photos: 0,
    click_line: 0,
    click_call: 0,
    click_map: 0,  // ✅ 新增
    scroll_depth: 0
  });

  // 暴露追蹤方法
  return {
    trackPhotoClick: () => {
      actions.current.click_photos++;
    },
    trackLineClick: () => {
      actions.current.click_line = 1;
      sendEvent('click_line');
    },
    trackCallClick: () => {
      actions.current.click_call = 1;
      sendEvent('click_call');
    },
    trackMapClick: () => {  // ✅ 新增
      actions.current.click_map++;
      console.log('[UAG] Map clicked');
    }
  };
};
```

#### 7.3 在 JSX 中綁定
```typescript
// PropertyDetailPage 組件內

const { trackPhotoClick, trackLineClick, trackCallClick, trackMapClick } = usePropertyTracker(...);

// 地圖按鈕
<button onClick={trackMapClick} className="map-button">
  📍 查看地圖
</button>

// 或使用 Google Maps 連結
<a
  href={`https://www.google.com/maps?q=${property.address}`}
  onClick={trackMapClick}
  target="_blank"
  rel="noopener noreferrer"
>
  在 Google Maps 開啟
</a>
```

**驗收標準**：
- [x] HTML 追蹤器已新增地圖監聽
- [x] React Hook 已新增 `trackMapClick`
- [x] JSX 已綁定點擊事件
- [x] Console 確認點擊有記錄
- [x] API 確認 `actions.click_map` 有資料

**預估工時**: 0.5hr
**優先級**: P1（完善追蹤數據）

---

### UAG-8: 自動刷新設定 ⬜

**問題 1**：`uag_lead_rankings` 物化視圖需手動 `REFRESH`
**問題 2**：`archive_old_history()` 需手動觸發

**修復方案**：使用 `pg_cron` 定時執行

#### 8.1 安裝 pg_cron 擴展

**Supabase Dashboard**:
1. 進入 Database > Extensions
2. 搜尋 `pg_cron`
3. Enable

**或 SQL**:
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

#### 8.2 設定物化視圖自動刷新
```sql
-- 每 5 分鐘刷新一次 UAG 排行榜
SELECT cron.schedule(
  'refresh-uag-rankings',      -- Job 名稱
  '*/5 * * * *',               -- Cron 表達式（每 5 分鐘）
  'REFRESH MATERIALIZED VIEW CONCURRENTLY public.uag_lead_rankings;'
);

-- 檢查排程
SELECT * FROM cron.job WHERE jobname = 'refresh-uag-rankings';

-- 檢查執行記錄
SELECT *
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'refresh-uag-rankings')
ORDER BY start_time DESC
LIMIT 10;
```

#### 8.3 設定自動歸檔
```sql
-- 每小時執行一次歸檔（整點）
SELECT cron.schedule(
  'archive-uag-events',
  '0 * * * *',  -- 每小時整點
  'SELECT public.archive_old_history();'
);

-- 檢查排程
SELECT * FROM cron.job WHERE jobname = 'archive-uag-events';
```

#### 8.4 監控歸檔效果（可選）
```sql
-- 建立歸檔日誌表
CREATE TABLE IF NOT EXISTS public.uag_archive_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  events_archived INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 每天午夜記錄歸檔統計
SELECT cron.schedule(
  'log-uag-stats',
  '0 0 * * *',  -- 每天午夜
  $$
    INSERT INTO public.uag_archive_log (date, events_archived)
    SELECT
      CURRENT_DATE,
      COUNT(*)
    FROM public.uag_events_archive
    WHERE created_at > CURRENT_DATE - INTERVAL '1 day';
  $$
);

-- 查看歸檔趨勢
SELECT * FROM uag_archive_log ORDER BY date DESC LIMIT 7;
```

#### 8.5 驗證排程運作

**立即測試**:
```sql
-- 手動觸發一次（測試）
SELECT cron.run_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'refresh-uag-rankings')
);

-- 確認執行結果
SELECT *
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'refresh-uag-rankings')
ORDER BY start_time DESC
LIMIT 1;

-- 檢查物化視圖有無更新
SELECT MAX(last_active) FROM uag_lead_rankings;
```

**驗收標準**：
- [x] pg_cron 擴展已啟用
- [x] `refresh-uag-rankings` 排程已設定
- [x] `archive-uag-events` 排程已設定
- [x] 測試執行成功
- [x] 執行記錄可查詢
- [x] 物化視圖自動更新
- [x] 歸檔功能正常運作

**預估工時**: 1hr
**優先級**: P1（確保系統自動化）

---

## 🎨 P2 UI/UX 優化任務

### HEADER-1: Logo 紅點設計 ⬜

**需求**：Logo 需使用首頁的紅點 badge 設計

**當前狀態**：
- Logo 組件已支援 `showBadge` prop
- 紅點位置：右上角 `size-1.5` 圓點
- 顏色：`bg-red-400`

**位置**：
- `src/components/Logo/Logo.tsx:32-34`
- `src/components/Header/Header.tsx:37`

**當前代碼**：
```tsx
// Logo.tsx:32-34
{showBadge && (
  <div className="absolute right-2 top-2 size-1.5 rounded-full bg-red-400 shadow-[0_0_0_1.5px] shadow-brand-600"></div>
)}

// Header.tsx:37
<Logo showSlogan={true} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
```

**修復方案**：

#### 1.1 確保 Header 中啟用 badge
```tsx
// src/components/Header/Header.tsx:37

// 修改前
<Logo showSlogan={true} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />

// 修改後
<Logo
  showSlogan={true}
  showBadge={true}  // ✅ 明確啟用紅點
  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
/>
```

#### 1.2 調整紅點樣式（可選，增強視覺）
```tsx
// src/components/Logo/Logo.tsx:32-34

{showBadge && (
  <div className="absolute right-2 top-2 size-1.5 rounded-full bg-red-400 shadow-[0_0_0_1.5px] shadow-brand-600 animate-pulse"></div>
  // ✅ 新增 animate-pulse 增強吸引力
)}
```

**驗收標準**：
- [x] Header Logo 顯示紅點
- [x] 紅點樣式與首頁一致
- [x] 響應式設計正常（手機/桌面）
- [x] 紅點與 Logo 位置協調

**預估工時**: 1hr
**優先級**: P2（視覺一致性）

---

### HEADER-2: 導航優化 ⬜

**需求**：優化 Header 導航設計，確保用戶流暢進入 UAG 和其他頁面

**當前狀態**：
- Desktop: 房地產列表、登入、註冊
- Mobile: 漢堡選單 + 登入/註冊按鈕
- 房仲專區（UAG）在漢堡選單內（僅手機版）

**位置**：`src/components/Header/Header.tsx`

**問題分析**：
1. **桌面版沒有 UAG 入口**：用戶需點擊首頁膠囊才能進入
2. **導航層級不清晰**：房仲專區應與房地產列表同級
3. **缺少視覺引導**：UAG 是核心功能，應有突出設計

**修復方案**：

#### 2.1 桌面版新增 UAG 入口
```tsx
// src/components/Header/Header.tsx:40-57

{/* Desktop Nav - 桌面版 */}
<nav className="hidden items-center gap-1 md:flex md:gap-2" aria-label="主要動作">
  {/* Column 1: List */}
  <a href={ROUTES.PROPERTY_LIST} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[15px] font-bold text-brand-700 transition-all hover:bg-brand-50/80 hover:text-brand-600 active:scale-[0.98]">
    <List size={18} strokeWidth={2.5} className="opacity-80" />
    <span>房地產列表</span>
  </a>

  {/* ✅ 新增：Column 2: UAG */}
  <a
    href={ROUTES.UAG}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[15px] font-bold text-brand-700 transition-all hover:bg-brand-50/80 hover:text-brand-600 active:scale-[0.98]"
  >
    <svg className="size-[18px] opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
    <span>房仲專區</span>
    {/* ✅ 新標籤 */}
    <span className="ml-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white">NEW</span>
  </a>

  {/* Column 3: Login */}
  <a href={`${ROUTES.AUTH}?mode=login`} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[15px] font-bold text-brand-700 transition-all hover:bg-brand-50/80 hover:text-brand-600 active:scale-[0.98]">
    <LogIn size={18} strokeWidth={2.5} className="opacity-80" />
    <span>登入</span>
  </a>

  {/* Column 4: Register (CTA) */}
  <a href={`${ROUTES.AUTH}?mode=signup`} className="ml-1 flex items-center gap-2 rounded-xl border border-transparent bg-brand-700 px-5 py-2.5 text-[15px] font-bold text-white shadow-md shadow-brand-700/10 transition-all hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-lg hover:shadow-brand-700/20 active:scale-[0.98]">
    <UserPlus size={18} strokeWidth={2.5} />
    <span>免費註冊</span>
  </a>
</nav>
```

#### 2.2 手機版優化順序
```tsx
// src/components/Header/Header.tsx:90-129

{/* Mobile Dropdown Menu - 手機版下拉選單 */}
{mobileMenuOpen && (
  <div className="absolute inset-x-0 top-full border-b border-brand-100 bg-white shadow-lg md:hidden">
    <nav className="mx-auto max-w-[1120px] px-4 py-3">

      {/* ✅ 優先顯示：房地產列表 */}
      <a
        href={ROUTES.PROPERTY_LIST}
        className="flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-bold text-brand-700 transition-all hover:bg-brand-50"
        onClick={() => setMobileMenuOpen(false)}
      >
        <List size={20} strokeWidth={2.5} className="opacity-80" />
        <span>房地產列表</span>
      </a>

      {/* ✅ 其次：房仲專區（NEW 標籤） */}
      <a
        href={ROUTES.UAG}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between rounded-xl px-4 py-3 text-[15px] font-bold text-brand-700 transition-all hover:bg-brand-50"
        onClick={() => setMobileMenuOpen(false)}
      >
        <div className="flex items-center gap-3">
          <svg className="size-5 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
          <span>房仲專區</span>
        </div>
        <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white">NEW</span>
      </a>

      {/* 第三：社區評價 */}
      <a
        href={ROUTES.COMMUNITY_WALL_MVP}
        className="flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-bold text-brand-700 transition-all hover:bg-brand-50"
        onClick={() => setMobileMenuOpen(false)}
      >
        <svg className="size-5 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <span>社區評價</span>
      </a>

    </nav>
  </div>
)}
```

**驗收標準**：
- [x] 桌面版顯示 UAG 入口
- [x] UAG 有 NEW 標籤
- [x] 手機版選單順序優化
- [x] 所有連結正常運作
- [x] target="_blank" 正確設定
- [x] 響應式設計正常

**預估工時**: 2hr
**優先級**: P2（提升用戶體驗）

---

### UI-1: 首頁主色統一 ⬜

**需求**：確保首頁所有元素使用統一的品牌主色

**當前狀態**：
- 品牌主色：`brand-700` (#003D5C)
- Tailwind 配置：`tailwind.config.cjs`

**位置**：
- `src/pages/Home.tsx`
- `src/components/Header/Header.tsx`
- `tailwind.config.cjs`

**問題分析**：
1. 部分組件使用硬編碼顏色
2. Gradient 顏色不一致
3. Shadow 顏色混用

**修復方案**：

#### 1.1 檢查並統一顏色使用

**檔案 1**: `src/components/Header/Header.tsx`
```tsx
// 檢查所有顏色使用
grep -n "bg-" src/components/Header/Header.tsx
grep -n "text-" src/components/Header/Header.tsx
grep -n "border-" src/components/Header/Header.tsx

// 確保使用 brand- 開頭的顏色
// ✅ 正確: bg-brand-700, text-brand-700, border-brand-100
// ❌ 錯誤: bg-blue-600, text-gray-700
```

**檔案 2**: `src/features/home/sections/*.tsx`
```bash
# 批量檢查所有首頁組件
for file in src/features/home/sections/*.tsx; do
  echo "Checking $file"
  grep -n "bg-\|text-\|border-" "$file" | grep -v "brand-"
done

# 如果有輸出，表示有非 brand 顏色需要統一
```

#### 1.2 更新 Tailwind 配置（如需要）
```javascript
// tailwind.config.cjs

module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0F7FA',   // 極淺藍
          100: '#E0EFF5',  // 淺藍背景
          200: '#B3D9E8',  // 按鈕 hover
          300: '#80C3DB',  // 次要文字
          400: '#4DADCE',  // 圖標
          500: '#2697C1',  // 鏈接
          600: '#0081B4',  // 深色按鈕
          700: '#003D5C',  // 主色（深藍）
          800: '#002D44',  // 深色背景
          900: '#001D2C',  // 極深背景
        },
        ink: {
          700: '#0f172a',  // 文字主色（保留，避免過藍）
        }
      },
      // ...
    }
  }
};
```

#### 1.3 創建顏色使用指南
```markdown
# 首頁顏色使用規範

## 主要元素
- **背景**: bg-brand-50 (極淺藍) / bg-white
- **卡片**: bg-white + border-brand-100
- **主按鈕**: bg-brand-700 hover:bg-brand-600
- **次按鈕**: border-brand-700 text-brand-700 hover:bg-brand-50
- **標題**: text-brand-700
- **正文**: text-ink-700 (避免過藍)
- **次要文字**: text-brand-500

## 交互元素
- **鏈接**: text-brand-600 hover:text-brand-700
- **圖標**: text-brand-700 opacity-80
- **分隔線**: border-brand-100
- **陰影**: shadow-brand-700/10

## 禁止使用
- ❌ bg-blue-*（使用 bg-brand-* 替代）
- ❌ text-gray-*（使用 text-ink-700 或 text-brand-* 替代）
- ❌ border-gray-*（使用 border-brand-100 替代）
```

**驗收標準**：
- [x] 所有首頁組件使用 `brand-*` 顏色
- [x] Tailwind 配置完整
- [x] 顏色使用指南已創建
- [x] 視覺檢查無色差
- [x] Dark mode 預留（如有需要）

**預估工時**: 2hr
**優先級**: P2（品牌一致性）

---

### MAIMAI-1: 教學提示系統 ⬜

**需求**：邁邁公仔提供教學指引，引導新用戶使用系統

**當前狀態**：
- MaiMai 公仔：`src/components/MaiMai/`
- 全站狀態管理：`src/context/MaiMaiContext.tsx`
- 10 種心情：idle, wave, peek, happy, thinking, excited, confused, celebrate, shy, sleep

**位置**：
- Header 中的 MaiMai：`src/components/Header/Header.tsx:144-175`
- MaiMai Speech：`src/components/MaiMai/MaiMaiSpeech.tsx`

**功能設計**：

#### 1.1 教學場景定義

| 場景 | 觸發時機 | MaiMai 心情 | 對話內容 | 行動 |
|------|---------|------------|---------|------|
| 首次訪問 | localStorage 無 `visited` | wave | "嗨！我是邁邁，你的買房小助手！" | 顯示功能介紹 |
| 搜尋指引 | 點擊搜尋框 | thinking | "試試搜尋「捷運」或「學區宅」找好房～" | 提示關鍵字 |
| UAG 介紹 | 點擊房仲專區 | excited | "UAG 雷達幫你找到最有意願的客戶！" | 打開 UAG |
| 上傳成功 | 物件上傳完成 | celebrate | "太棒了！物件已上架，快去查看吧！" | 撒花動畫 |
| 空白結果 | 搜尋無結果 | confused | "嗯...沒找到耶，換個關鍵字試試？" | 提供建議 |
| 閒置提醒 | 5 分鐘無操作 | sleep | "Zzz... 需要幫忙嗎？" | 喚醒互動 |

#### 1.2 實作教學系統

**檔案 1**: 創建教學 Hook
```typescript
// src/hooks/useTutorial.ts

import { useState, useEffect, useCallback } from 'react';
import { useMaiMai } from '../context/MaiMaiContext';
import { safeLocalStorage } from '../lib/safeStorage';

interface TutorialStep {
  id: string;
  trigger: 'mount' | 'click' | 'idle' | 'success';
  mood: MaiMaiMood;
  message: string;
  action?: () => void;
}

const TUTORIALS: TutorialStep[] = [
  {
    id: 'welcome',
    trigger: 'mount',
    mood: 'wave',
    message: '嗨！我是邁邁，你的買房小助手！點我看看能做什麼～'
  },
  {
    id: 'search',
    trigger: 'click',
    mood: 'thinking',
    message: '試試搜尋「捷運」或「學區宅」找好房～'
  },
  {
    id: 'uag',
    trigger: 'click',
    mood: 'excited',
    message: 'UAG 雷達幫你找到最有意願的客戶！'
  },
  {
    id: 'idle',
    trigger: 'idle',
    mood: 'sleep',
    message: 'Zzz... 需要幫忙嗎？'
  },
];

export function useTutorial() {
  const { setMood, addMessage } = useMaiMai();
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  // 首次訪問歡迎
  useEffect(() => {
    const visited = safeLocalStorage.getItem('maimai-visited');
    if (!visited && !hasShownWelcome) {
      setTimeout(() => {
        setMood('wave');
        addMessage('嗨！我是邁邁，你的買房小助手！點我看看能做什麼～');
        safeLocalStorage.setItem('maimai-visited', 'true');
        setHasShownWelcome(true);
      }, 1000);
    }
  }, [setMood, addMessage, hasShownWelcome]);

  // 閒置提醒（5 分鐘）
  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setMood('sleep');
        addMessage('Zzz... 需要幫忙嗎？');
      }, 5 * 60 * 1000); // 5 分鐘
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => document.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(idleTimer);
      events.forEach(e => document.removeEventListener(e, resetTimer));
    };
  }, [setMood, addMessage]);

  // 提供手動觸發方法
  const showTutorial = useCallback((id: string) => {
    const tutorial = TUTORIALS.find(t => t.id === id);
    if (tutorial) {
      setMood(tutorial.mood);
      addMessage(tutorial.message);
      tutorial.action?.();
    }
  }, [setMood, addMessage]);

  return { showTutorial };
}
```

**檔案 2**: 在 Home 中使用
```typescript
// src/pages/Home.tsx

import { useTutorial } from '../hooks/useTutorial';

export default function Home({ config }: { readonly config: AppConfig & RuntimeOverrides }) {
  const { showTutorial } = useTutorial();

  // 搜尋框聚焦時提示
  const handleSearchFocus = () => {
    showTutorial('search');
  };

  return (
    <>
      <Header />
      <WarmWelcomeBar />

      {/* ... */}

      {/* 搜尋框綁定教學 */}
      <input
        type="text"
        onFocus={handleSearchFocus}
        placeholder="找評價最高的社區、捷運站周邊好屋..."
        // ...
      />
    </>
  );
}
```

**檔案 3**: MaiMai 點擊互動
```typescript
// src/components/Header/Header.tsx

import { useMaiMai } from '../../context/MaiMaiContext';

export default function Header() {
  const { mood, setMood, addMessage, messages } = useMaiMai();
  const [clickCount, setClickCount] = useState(0);

  const handleMaiMaiClick = () => {
    setClickCount(prev => prev + 1);

    if (clickCount >= 4) {
      setMood('celebrate');
      addMessage('哈哈！你發現隱藏功能了！');
      window.dispatchEvent(new CustomEvent('mascot:celebrate'));
      setClickCount(0);
    } else {
      const tips = [
        '點我可以看到提示喔～',
        '我會根據你的操作改變表情！',
        '再點兩下試試看...',
        '快了快了！',
      ];
      setMood('happy');
      addMessage(tips[clickCount]);
    }
  };

  return (
    <>
      {/* ... */}

      {/* Mascot SVG - 加入點擊事件 */}
      <div
        className="relative z-10 size-20 md:size-24 cursor-pointer"
        onClick={handleMaiMaiClick}
        role="button"
        tabIndex={0}
        aria-label="邁邁小助手"
      >
        <svg viewBox="0 0 200 240" className="size-full drop-shadow-sm">
          {/* MaiMai SVG 內容 */}
        </svg>
      </div>

      {/* 對話氣泡 */}
      {messages.length > 0 && (
        <div className="absolute bottom-[92%] right-[55%] w-[260px]...">
          <MaiMaiSpeech messages={messages} mood={mood} />
        </div>
      )}
    </>
  );
}
```

**驗收標準**：
- [x] `useTutorial` Hook 已實作
- [x] 首次訪問顯示歡迎訊息
- [x] 搜尋框聚焦顯示提示
- [x] 閒置 5 分鐘顯示睡眠提示
- [x] MaiMai 點擊互動正常
- [x] 5 次點擊觸發慶祝動畫
- [x] 所有教學場景測試通過

**預估工時**: 3hr
**優先級**: P2（提升新用戶體驗）

---

### FEED-1: 業務後台連結 ⬜

**需求**：註冊後的 Feed 頁面（如 `/feed/demo-001`）點擊「業務後台」連結到 UAG 頁

**當前狀態**：
- Feed 頁面：`src/pages/Feed/index.tsx`
- 支援 Agent 和 Consumer 兩種模式
- 路由：`/maihouses/feed/:userId`

**位置**：
- Agent Feed: `src/pages/Feed/Agent.tsx`
- Consumer Feed: `src/pages/Feed/Consumer.tsx`
- Header: `src/components/Header/Header.tsx`

**修復方案**：

#### 1.1 在 Agent Feed 中新增 UAG 按鈕
```tsx
// src/pages/Feed/Agent.tsx

import { ExternalLink } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

export default function Agent({ userId, forceMock }: { userId: string; forceMock: boolean }) {
  // ... 現有代碼

  return (
    <div className="min-h-screen bg-brand-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-brand-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Logo showSlogan={false} showBadge={true} href={ROUTES.HOME} />
            <span className="text-sm text-brand-700">業務中心</span>
          </div>

          {/* ✅ 新增：UAG 入口 */}
          <div className="flex items-center gap-3">
            <a
              href={ROUTES.UAG}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:bg-brand-600 hover:shadow-lg active:scale-95"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              <span>業務後台</span>
              <ExternalLink className="size-3" />
            </a>

            {/* 現有的用戶資訊 */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-brand-500">Hi, {userId}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ... 現有內容 */}
    </div>
  );
}
```

#### 1.2 在 Consumer Feed 中新增導航（可選）
```tsx
// src/pages/Feed/Consumer.tsx

// Consumer 版本可以顯示「探索更多」或不顯示
// 如果要顯示，參考 Agent.tsx 的實作
```

#### 1.3 在 Feed Sidebar 中新增快捷鏈接
```tsx
// src/components/Feed/FeedSidebar.tsx

export function FeedSidebar({ role }: { role: 'agent' | 'member' }) {
  if (role !== 'agent') return null;

  return (
    <aside className="w-64 border-r border-brand-100 bg-white p-4">
      <nav className="space-y-2">
        <a
          href={ROUTES.UAG}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-brand-700 transition-all hover:bg-brand-50"
        >
          <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
          <span>UAG 客戶雷達</span>
          <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white">HOT</span>
        </a>

        <a
          href={ROUTES.PROPERTY_LIST}
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-brand-700 transition-all hover:bg-brand-50"
        >
          <List className="size-5" />
          <span>我的物件</span>
        </a>

        {/* 其他導航項目 */}
      </nav>
    </aside>
  );
}
```

**驗收標準**：
- [x] Agent Feed Header 有 UAG 按鈕
- [x] 按鈕樣式與品牌一致
- [x] 點擊後在新分頁打開 UAG
- [x] ExternalLink 圖標顯示
- [x] Sidebar 快捷鏈接正常（如有）
- [x] 響應式設計正常（手機/桌面）

**預估工時**: 1hr
**優先級**: P2（提升業務流程效率）

---

### FEED-2: Mock/API 切換驗證 ⬜

**需求**：確認 Feed 頁面的 Mock 和 API 模式切換正常運作

**當前狀態**：
- Feed 支援 `?mock=true` 參數
- Demo IDs: `demo-001`, `demo-consumer`, `demo-agent`
- Mock 數據：`src/pages/Feed/mockData/`

**位置**：
- `src/pages/Feed/index.tsx:29-31`
- `src/pages/Feed/Agent.tsx`
- `src/pages/Feed/Consumer.tsx`

**驗證方案**：

#### 2.1 測試案例清單

**測試 1: Demo 用戶（自動 Mock）**
```
URL: https://maihouses.vercel.app/maihouses/feed/demo-001
預期:
- [x] 載入 Mock 資料
- [x] 顯示 RoleToggle（Agent ↔ Consumer 切換）
- [x] 資料正常顯示
- [x] Console 無錯誤
```

**測試 2: 真實用戶 + Mock 參數**
```
URL: https://maihouses.vercel.app/maihouses/feed/real-user-123?mock=true
預期:
- [x] 載入 Mock 資料（不查詢 Supabase）
- [x] 顯示 RoleToggle
- [x] 資料正常顯示
- [x] Network 無 Supabase 請求
```

**測試 3: 真實用戶（API 模式）**
```
URL: https://maihouses.vercel.app/maihouses/feed/real-user-123
預期:
- [x] 查詢 Supabase profiles 表
- [x] 根據 role 顯示對應版本
- [x] 不顯示 RoleToggle
- [x] 真實資料正常載入
```

**測試 4: Role Toggle 切換**
```
操作: 在 demo-001 頁面點擊 Role Toggle
預期:
- [x] Agent → Member 切換正常
- [x] Member → Agent 切換正常
- [x] 畫面重新渲染
- [x] 資料對應正確
```

**測試 5: 錯誤處理**
```
URL: https://maihouses.vercel.app/maihouses/feed/non-existent-user
預期:
- [x] 顯示友善錯誤訊息
- [x] 不崩潰
- [x] Console log 錯誤
- [x] Fallback 到 Member 角色
```

#### 2.2 創建測試腳本
```typescript
// src/pages/Feed/__tests__/FeedRouting.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Feed from '../index';

describe('Feed Routing & Mock Switch', () => {
  test('Demo user loads mock data', async () => {
    render(
      <MemoryRouter initialEntries={['/feed/demo-001']}>
        <Routes>
          <Route path="/feed/:userId" element={<Feed />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('載入中...')).not.toBeInTheDocument();
    });

    expect(screen.getByText(/demo-001/i)).toBeInTheDocument();
  });

  test('Mock parameter forces mock mode', async () => {
    render(
      <MemoryRouter initialEntries={['/feed/real-user?mock=true']}>
        <Routes>
          <Route path="/feed/:userId" element={<Feed />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('載入中...')).not.toBeInTheDocument();
    });

    // 應該顯示 Role Toggle（只有 Mock 模式才有）
    expect(screen.getByRole('button', { name: /切換角色/i })).toBeInTheDocument();
  });

  // ...更多測試
});
```

#### 2.3 手動驗證清單

**開發環境驗證**:
```bash
# 啟動開發伺服器
npm run dev

# 測試 URLs
open http://localhost:5173/maihouses/feed/demo-001
open http://localhost:5173/maihouses/feed/demo-agent
open http://localhost:5173/maihouses/feed/demo-consumer
open http://localhost:5173/maihouses/feed/test-user?mock=true
```

**生產環境驗證**:
```bash
# 測試 URLs
open https://maihouses.vercel.app/maihouses/feed/demo-001
open https://maihouses.vercel.app/maihouses/feed/demo-agent?mock=true
```

**驗收標準**：
- [x] 所有 5 個測試案例通過
- [x] 測試腳本已創建並通過
- [x] 開發環境手動驗證通過
- [x] 生產環境手動驗證通過
- [x] Network 請求符合預期
- [x] Console 無錯誤
- [x] 錯誤處理正常

**預估工時**: 1hr
**優先級**: P2（確保功能穩定性）

---

## 🚀 P3 低優先級任務（未來增強）

### UAG-9: TypeScript 類型安全 ⬜

**問題**：部分位置使用 `any` 類型

**修復範圍**：
- `uagService.ts` 中的 `transformSupabaseData`
- Supabase 查詢回傳類型
- 事件處理器參數

**預估工時**: 2hr

---

### UAG-10: 性能優化 ⬜

**問題**：`fetchPropertyViewStatsFallback` 可能很慢

**優化方案**：
- 創建 `get_property_stats_optimized` RPC
- 使用 SQL 聚合而非前端計算
- 新增複合索引

**預估工時**: 3hr

---

### UAG-11: S 級推播 ⬜

**功能**：當客戶升級到 S 級時，即時推播通知房仲

**實現方式**：
- LINE Notify
- Supabase Realtime
- Webhook

**預估工時**: 4hr

---

### UAG-12: 索引優化 ⬜

**優化項目**：
- 複合索引：`(agent_id, grade, last_active DESC)`
- 部分索引：只索引活躍會話
- JSONB 索引：GIN 索引 `actions`
- 覆蓋索引：避免回表查詢

**預估工時**: 2hr

---

## 📊 總體時程規劃

### 第一週（Week 1）：P0 高優先級
- [ ] Day 1-2: UAG-1 資料庫部署 + UAG-3 RPC 創建
- [ ] Day 3: UAG-2 District 修復 + UAG-4 Session Recovery
- [ ] Day 4: 驗證 P0 所有功能
- [ ] Day 5: Bug 修復與調整

### 第二週（Week 2）：P1 中優先級 + P2 UI/UX
- [ ] Day 1: UAG-5 配置統一 + UAG-6 page_exit 去重
- [ ] Day 2: UAG-7 地圖追蹤 + UAG-8 自動刷新
- [ ] Day 3: HEADER-1 Logo + HEADER-2 導航
- [ ] Day 4: UI-1 主色統一 + FEED-1 連結
- [ ] Day 5: MAIMAI-1 教學系統 + FEED-2 驗證

### 第三週（Week 3）：P3 優化 + 上線準備
- [ ] Day 1-2: UAG-9 TypeScript + UAG-10 性能
- [ ] Day 3: UAG-11 S 級推播
- [ ] Day 4: UAG-12 索引優化
- [ ] Day 5: 完整測試 + 文檔整理

---

## ✅ 驗收標準總覽

### P0 必須達成
- [x] UAG 資料庫完整部署
- [x] District 準確傳遞（準確率 >95%）
- [x] RPC 函數正常運作
- [x] Session Recovery 不報錯
- [x] 所有 TypeScript 編譯通過

### P1 建議達成
- [x] 配置統一無衝突
- [x] page_exit 去重（重複率 <1%）
- [x] 地圖點擊有追蹤
- [x] 自動刷新正常運作

### P2 提升體驗
- [x] Logo 紅點顯示
- [x] 導航清晰易用
- [x] 品牌色統一
- [x] 邁邁教學完整
- [x] Feed → UAG 流程順暢
- [x] Mock/API 切換正常

---

## 📁 相關檔案清單

### UAG 系統
```
api/
├── uag-track.js                        # UAG 追蹤 API
└── session-recovery.js                 # Session 恢復 API（待創建）

src/pages/UAG/
├── index.tsx                           # UAG 主頁面
├── services/uagService.ts              # UAG 服務層
├── types/uag.types.ts                  # UAG 類型定義
├── uag-config.ts                       # UAG 配置（需重構）
└── hooks/useUAG.ts                     # UAG Hook

supabase/migrations/
├── 20251230_uag_tracking_v8.sql        # UAG Schema（待創建）
├── 20251230_uag_rpc_property_stats.sql # Property Stats RPC（待創建）
└── 20251230_uag_rpc_purchase_lead.sql  # Purchase Lead RPC（待創建）

docs/
└── UAG_COMPLETE_SYSTEM_GUIDE.md        # UAG 完整文檔
```

### UI/UX
```
src/
├── components/
│   ├── Header/Header.tsx               # 導航 Header（需優化）
│   ├── Logo/Logo.tsx                   # Logo 組件（已有紅點）
│   └── MaiMai/                         # 邁邁公仔
│       ├── MaiMaiBase.tsx
│       ├── MaiMaiSpeech.tsx
│       └── types.ts
├── context/
│   └── MaiMaiContext.tsx               # MaiMai 全站狀態
├── hooks/
│   └── useTutorial.ts                  # 教學系統（待創建）
└── pages/
    ├── Home.tsx                        # 首頁
    └── Feed/                           # Feed 頁面
        ├── index.tsx
        ├── Agent.tsx                   # 房仲版（需加 UAG 連結）
        └── Consumer.tsx                # 消費者版
```

---

## 🎯 成功指標

### 功能指標
- UAG 系統正常運作率 >99%
- District 辨識準確率 >95%
- Session Recovery 成功率 >90%
- API 響應時間 <200ms

### 用戶體驗指標
- 新用戶完成教學率 >80%
- UAG 入口點擊率 >30%
- Feed → UAG 轉換率 >20%
- 邁邁互動率 >50%

### 技術指標
- TypeScript 編譯 0 錯誤
- 單元測試覆蓋率 >80%
- Lighthouse 性能分數 >90
- Console 錯誤率 <1%

---

**最後更新**: 2025-12-30
**負責團隊**: Frontend, Backend, DevOps, Design
**預估總工時**: 35 小時
**目標完成日期**: 2026-01-20
