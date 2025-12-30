# 🎯 UAG 系統優化工單

> **最後更新**: 2025-12-30
> **目標**: UAG 客戶分級追蹤系統部署與優化
> **UAG 頁**: https://maihouses.vercel.app/maihouses/uag

---

## 📋 任務摘要

| 優先級 | 任務 | 狀態 | 工時 |
|:---:|:---|:---:|:---:|
| **P0** | UAG-1 資料庫 Schema 部署 | ✅ | 2hr |
| **P0** | UAG-2 District 傳遞修復 | ⬜ | 1hr |
| **P0** | UAG-3 RPC 函數創建 | ⬜ | 2hr |
| **P0** | UAG-4 Session Recovery API | ⬜ | 2hr |
| **P1** | UAG-5 配置統一重構 | ⬜ | 1hr |
| **P1** | UAG-6 page_exit 去重 | ⬜ | 1hr |
| **P1** | UAG-7 地圖點擊追蹤 | ⬜ | 0.5hr |
| **P1** | UAG-8 自動刷新設定 | ⬜ | 1hr |
| **P2** | HEADER-1 Logo 紅點 | ⬜ | 1hr |
| **P2** | HEADER-2 導航優化 | ⬜ | 2hr |
| **P2** | UI-1 首頁主色統一 | ⬜ | 2hr |
| **P2** | MAIMAI-1 教學系統 | ⬜ | 3hr |
| **P2** | FEED-1 業務後台連結 | ⬜ | 1hr |
| **P2** | FEED-2 Mock/API 驗證 | ⬜ | 1hr |

---

## 🔥 P0 任務

### UAG-1: 資料庫 Schema 部署 ✅ 100/100

**Migration**: `supabase/migrations/20251230_uag_tracking_v8.sql`

**已完成**:
- ✅ `uag_sessions` / `uag_events` / `uag_events_archive` 表
- ✅ `uag_lead_rankings` 物化視圖
- ✅ `calculate_lead_grade()` / `archive_old_history()` 函數
- ✅ `track_uag_event_v8()` RPC
- ✅ RLS 政策 + 8 個索引
- ✅ 物化視圖 UNIQUE INDEX (`idx_lead_ranking_unique`) - 支援 CONCURRENTLY 刷新
- ✅ RLS 政策加入 NOTE 說明 `auth.uid()` 與 `agent_id` 格式要求

---

### UAG-2: District 傳遞修復 ⬜

**問題**: `PropertyDetailPage.tsx:486` 永遠傳送 `district: 'unknown'`

**修復**:
1. Hook 簽名增加 `district: string` 參數
2. 新增 `extractDistrict(address)` 解析函數
3. 調用處傳入 `property.district || extractDistrict(property.address)`

---

### UAG-3: RPC 函數創建 ⬜

**缺少**:
- [ ] `get_agent_property_stats(p_agent_id)` - 房源統計
- [ ] `purchase_lead(p_user_id, p_lead_id, p_cost, p_grade)` - 購買客戶

**位置**: `supabase/migrations/20251230_uag_rpc_*.sql`

---

### UAG-4: Session Recovery API ⬜

**問題**: `public/js/tracker.js:330` 呼叫 `/api/session-recovery` 但 API 不存在

**選項**:
- A: 創建 `api/session-recovery.js` (2hr)
- B: 註解掉 `recoverSession()` (0.5hr)

---

## 📊 P1 任務

### UAG-5: 配置統一重構 ⬜

統一為 `GRADE_PROTECTION_HOURS` 和 `GRADE_PRICE`，移除重複常數

### UAG-6: page_exit 去重 ⬜

新增 `sendLock` 防止 `visibilitychange` 和 `pagehide` 重複觸發

### UAG-7: 地圖點擊追蹤 ⬜

監聽地圖按鈕點擊，填充 `actions.click_map` 欄位

### UAG-8: 自動刷新設定 ⬜

使用 `pg_cron` 定時:
- 每 5 分鐘刷新 `uag_lead_rankings` 物化視圖
- 每小時執行 `archive_old_history()`

---

## 🎨 P2 任務

### HEADER-1: Logo 紅點 ⬜

`Header.tsx` 啟用 `<Logo showBadge={true} />`

### HEADER-2: 導航優化 ⬜

桌面版新增 UAG 入口 + NEW 標籤

### UI-1: 首頁主色統一 ⬜

確保所有組件使用 `brand-*` 顏色

### MAIMAI-1: 教學系統 ⬜

創建 `useTutorial` Hook，實作:
- 首次訪問歡迎
- 搜尋框提示
- 閒置提醒 (5min)
- MaiMai 點擊互動

### FEED-1: 業務後台連結 ⬜

`Feed/Agent.tsx` Header 新增 UAG 按鈕

### FEED-2: Mock/API 驗證 ⬜

測試 `?mock=true` / demo IDs / 真實用戶三種模式

---

## 📁 相關檔案

```
api/
├── uag-track.js
└── session-recovery.js (待創建)

src/pages/UAG/
├── index.tsx
├── services/uagService.ts
├── types/uag.types.ts
├── uag-config.ts (需重構)
└── hooks/useUAG.ts

supabase/migrations/
├── 20251230_uag_tracking_v8.sql
├── 20251230_uag_rpc_property_stats.sql (待創建)
└── 20251230_uag_rpc_purchase_lead.sql (待創建)
```

---

**預估總工時**: 23.5hr
**目標完成**: 2026-01-20
