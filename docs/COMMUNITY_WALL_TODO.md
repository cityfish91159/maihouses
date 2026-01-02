# 🎯 UAG 系統完整優化工單 (SSOT)

> **最後更新**: 2026-01-02
> **目標**: UAG (User Activity & Grade) 客戶分級追蹤系統完整部署與優化 + 私訊系統
> **首頁**: https://maihouses.vercel.app/maihouses/
> **UAG 頁**: https://maihouses.vercel.app/maihouses/uag
> **Feed 頁**: https://maihouses.vercel.app/maihouses/feed/demo-001

---

## 📋 摘要 (Executive Summary)

| 優先級 | 任務 | 狀態 | 預估工時 | 負責人 | 依賴 |
|:---:|:---|:---:|:---:|:---:|:---|
| **P0** | UAG-1 資料庫 Schema 部署 | ✅ | 2hr | DevOps | - |
| **P0** | UAG-2 District 傳遞修復 | ✅ | 1hr | Frontend | - |
| **P0** | UAG-3 RPC 函數創建 | ✅ | 2hr | Backend | UAG-1 |
| **P0** | UAG-4 Session Recovery API | ✅ | 2hr | Backend | UAG-1 |
| **P0** | MSG-1 私訊系統資料模型 | ✅ | 2hr | Backend | - |
| **P0** | MSG-2 鈴鐺通知（消費者+房仲） | ✅ | 2hr | Frontend | MSG-1 |
| **P0** | MSG-3 消費者 Feed 橫條提醒 | ⬜ | 1hr | Frontend | MSG-1 |
| **P0** | MSG-4 對話頁面 | ⬜ | 3hr | Frontend | MSG-1 |
| **P0** | MSG-5 房仲訊息發送介面 | ⬜ | 2hr | Frontend | MSG-1, UAG-13 |
| **P0** | NOTIFY-1 簡訊 API | ⬜ | 2hr | Backend | MSG-1, AUTH-1 |
| **P0** | NOTIFY-2 Web Push 推播 | ⬜ | 2hr | Backend | MSG-1 |
| **P0** | AUTH-1 註冊流程 phone 必填 | ⬜ | 1hr | Frontend | - |
| **P0** | UAG-13 purchase_lead 觸發通知 | ⬜ | 2hr | Backend | MSG-1 |
| **P1** | UAG-5 配置統一重構 | ✅ | 1hr | Frontend | - |
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

## 📊 P0 施作順序圖

```
                    ┌─────────────────────────────────────────────────────┐
                    │                     第一波                          │
                    │  可平行進行，無前置依賴                              │
                    └─────────────────────────────────────────────────────┘
                                           │
            ┌──────────────────────────────┼──────────────────────────────┐
            ▼                              ▼                              ▼
    ┌──────────────┐              ┌──────────────┐              ┌──────────────┐
    │   MSG-1      │              │   AUTH-1     │              │   UAG-7      │
    │ 私訊資料模型 │              │ phone 必填   │              │ 地圖追蹤     │
    │   Backend    │              │  Frontend    │              │  Frontend    │
    └──────┬───────┘              └──────┬───────┘              └──────────────┘
           │                             │
           │                             │
           ▼                             │
    ┌─────────────────────────────────────────────────────────────────────┐
    │                          第二波                                     │
    │  依賴 MSG-1 (私訊資料模型)                                          │
    └─────────────────────────────────────────────────────────────────────┘
           │
           ├─────────────────────────────────────────────────────────────┐
           │                                                             │
           ▼                              ▼                              ▼
    ┌──────────────┐              ┌──────────────┐              ┌──────────────┐
    │   MSG-2      │              │   MSG-3      │              │   MSG-4      │
    │ 鈴鐺通知     │              │ 橫條提醒     │              │ 對話頁面     │
    │ 消費者+房仲  │              │  TxBanner    │              │   Chat       │
    │  Frontend    │              │  Frontend    │              │  Frontend    │
    └──────────────┘              └──────────────┘              └──────────────┘
           │                                                             │
           ▼                                                             │
    ┌──────────────┐                                                     │
    │  UAG-13      │◄────────────────────────────────────────────────────┘
    │ purchase_lead│
    │ 觸發通知     │
    │   Backend    │
    └──────┬───────┘
           │
           ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │                          第三波                                     │
    │  依賴 MSG-1 + UAG-13                                                │
    └─────────────────────────────────────────────────────────────────────┘
           │
           ├───────────────────────────────┬─────────────────────────────┐
           ▼                               ▼                             ▼
    ┌──────────────┐              ┌──────────────┐              ┌──────────────┐
    │   MSG-5      │              │  NOTIFY-1    │◄─────┐       │  NOTIFY-2    │
    │ 房仲發送介面 │              │ 簡訊 API     │      │       │ Web Push     │
    │  Frontend    │              │  Backend     │      │       │   Backend    │
    └──────────────┘              └──────────────┘      │       └──────────────┘
                                                        │
                                               需要 AUTH-1 完成
                                              （profiles.phone）
```

**建議施作優先順序**:
1. **MSG-1** + **AUTH-1** - 可同時進行，是所有功能的基礎
2. **MSG-2** + **MSG-3** + **MSG-4** - 前端 UI 可並行開發
3. **UAG-13** - 串接購買流程與私訊
4. **MSG-5** - 房仲發送介面
5. **NOTIFY-1** + **NOTIFY-2** - 通知功能

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

### UAG-4: Session Recovery API ✅ (100/100)

**完成日期**: 2025-12-31
**API**: `api/session-recovery.ts` → https://maihouses.vercel.app/api/session-recovery

**實作內容**:
- ✅ 修正欄位名稱：`last_active_at` → `last_active`, `current_grade` → `grade`
- ✅ 增強錯誤處理：環境變數檢查、詳細 console.log
- ✅ 優化查詢邏輯：agentId 過濾、7 天時間窗口
- ✅ **TypeScript 純度**: `.js` → `.ts`，定義 `SessionRecoveryRequest/Response` 介面
- ✅ **單元測試**: `api/__tests__/session-recovery.test.ts` (Vitest, 11 cases passed)

**驗證**: TypeScript 0 errors, API 測試 3/3 passed, Vitest 11/11 passed

---

### MSG-1: 私訊系統資料模型 ✅ (100/100)

**目標**: 建立房仲與消費者對話的資料結構
**前置依賴**: 無

**實作紀錄**:
- **完成日期**: 2025-12-31 (Commit `66b1449f` Fixed)
- **文檔同步**: 2026-01-02 (更新資料表設計與 TODO 文件)
- **Migration**:
  - `20251231_003_messaging_schema.sql` (Initial)
  - `20251231_004_fix_messaging_critical_issues.sql` (Fixes)
- **Types**: `src/types/messaging.types.ts`
- **實作項目詳細**:
  - ✅ `conversations` 表 (10 欄位 + 5 索引)
  - ✅ `messages` 表 (7 欄位 + 3 索引)
  - ✅ RLS 政策 (6 條: SELECT/INSERT/UPDATE for both tables)
  - ✅ `fn_create_conversation()` - 建立對話（含 idempotent 檢查）
  - ✅ `fn_send_message()` - 發送訊息 + 更新未讀數 + 自動 active
  - ✅ `fn_mark_messages_read()` - 標記已讀
  - ✅ TypeScript 類型定義 (Conversation, Message, API types)

**✅ 關鍵修復 (Audit Fixes - 2025-12-31)**:
- ✅ **FK Reference**: `uag_leads` → `uag_lead_purchases` (ON DELETE SET NULL)
- ✅ **RLS Pending**: 加入 `session_id` 比對邏輯 (`current_setting('app.session_id')`)
- ✅ **類型統一**: `agent_id TEXT` → `UUID`，移除所有 `::TEXT` 轉換
- ✅ **Idempotent**: `fn_create_conversation` 加入重複檢查

**資料表設計**:

**conversations（對話）**
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | UUID | 對話 ID |
| agent_id | UUID | 房仲 profile_id（修正：TEXT → UUID）|
| consumer_session_id | TEXT | UAG session_id（購買時的匿名識別）|
| consumer_profile_id | UUID | 消費者 profile_id（回覆後填入）|
| property_id | TEXT | 相關物件 |
| lead_id | UUID | FK → uag_lead_purchases（修正：uag_leads → uag_lead_purchases）|
| status | TEXT | pending → active → closed |
| unread_agent | INT | 房仲未讀數 |
| unread_consumer | INT | 消費者未讀數 |
| created_at | TIMESTAMPTZ | 建立時間 |
| updated_at | TIMESTAMPTZ | 更新時間 |

**messages（訊息）**
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | UUID | 訊息 ID |
| conversation_id | UUID | 對話 ID (FK) |
| sender_type | TEXT | 'agent' / 'consumer' |
| sender_id | UUID | profile_id |
| content | TEXT | 訊息內容（可含聯絡資料）|
| created_at | TIMESTAMPTZ | 發送時間 |
| read_at | TIMESTAMPTZ | 已讀時間 |

---

### MSG-2: 鈴鐺通知功能（消費者 + 房仲共用）✅ (100/100)

**完成日期**: 2026-01-02

#### 📁 核心檔案

| 檔案 | 用途 |
|------|------|
| `src/hooks/useNotifications.ts` | 通知 Hook（查詢 + Realtime + 重試） |
| `src/components/layout/NotificationDropdown.tsx` | 下拉選單 UI |
| `src/components/layout/NotificationErrorBoundary.tsx` | 錯誤邊界 |
| `src/components/layout/GlobalHeader.tsx` | 整合鈴鐺入口 |
| `src/constants/messaging.ts` | 配置常數 |
| `src/hooks/__tests__/useNotifications.test.ts` | Hook 測試 (14 cases) |
| `src/components/layout/__tests__/*.test.tsx` | 組件測試 (41 cases) |

#### 🔧 施作流程

```
Week 1: 基礎功能
├── useNotifications Hook
│   ├── Supabase JOIN 查詢（conversations + messages + profiles）
│   ├── 角色判斷（agent/consumer 不同查詢）
│   ├── .limit(50) 防止資料爆炸
│   └── Realtime 訂閱即時更新
├── NotificationDropdown UI
│   ├── 380px 寬，最高 400px 滾動
│   ├── 訊息預覽 + 相對時間 + 未讀 badge
│   └── Empty/Loading/Error 三態
├── GlobalHeader 整合
│   ├── 鈴鐺展開 dropdown
│   ├── 點擊外部關閉
│   └── ErrorBoundary 包裹
└── eslint-disable 修復（role="presentation"）

Week 2: 品質強化
├── 單元測試 55 cases（Hook 14 + Dropdown 26 + ErrorBoundary 15）
├── Stale Data Indicator（isStale + lastUpdated + refresh 按鈕）
├── Keyboard Navigation（Arrow/Tab/Home/End + Focus Trap）
├── AbortController 請求取消
├── Smart Retry（只重試 5xx/網路錯誤，不重試 4xx）
└── Magic Numbers → MESSAGING_CONFIG 常數
```

#### ⚙️ 配置常數 (`src/constants/messaging.ts`)

```typescript
export const MESSAGING_CONFIG = {
  MAX_NOTIFICATIONS_DISPLAY: 20,    // 下拉選單最多顯示項目數
  MESSAGE_PREVIEW_MAX_LENGTH: 40,   // 訊息預覽截斷長度
  STALE_THRESHOLD_MS: 5 * 60 * 1000, // 資料過期閾值（5分鐘）
  QUERY_LIMIT: 50,                  // 單次查詢最大對話數
  RETRY_COUNT: 3,                   // 最大重試次數
  RETRY_INITIAL_DELAY_MS: 1000,     // 初始重試延遲
  UNREAD_BADGE_MAX: 99,             // 未讀數顯示上限
  LOADING_SKELETON_COUNT: 3,        // Loading 骨架數量
};
```

#### 🔑 關鍵設計

**Smart Retry 機制** (`isRetryableError`)：
- ✅ 重試：網路錯誤、5xx、timeout
- ❌ 不重試：4xx（400/401/403/404）、AbortError

**Keyboard Navigation**：
- `↑/↓` 導航項目
- `Home/End` 跳到首尾
- `Tab` Focus Trap（不離開 dropdown）
- `Escape` 關閉

**Stale Indicator**：
- `isStale = error !== null || (lastUpdated > STALE_THRESHOLD_MS)`
- UI 顯示黃色警告 + 重新整理按鈕

#### ✅ 驗證結果

- [x] TypeScript 0 errors
- [x] ESLint 通過
- [x] 55 單元測試全通過
- [x] Vercel 部署成功

#### ⚠️ 後續依賴

- MSG-4（對話頁面）：目前點擊通知跳轉 `/maihouses/chat/:id` 待實作
- NOTIFY-2（Web Push）：可加入瀏覽器推播

---

### MSG-3: 消費者 Feed 橫條提醒 ⚠️ (68/100)

**目標**: TxBanner 擴展支援私訊提醒

**實作完成**: 2026-01-02 (Commit f4c96eb1)
**審查日期**: 2026-01-02 (Commit 693d057d)
**審查評分**: **68/100** ⚠️ 需要大幅改進

---

#### 📁 修改檔案

| 檔案 | 變更 | 狀態 |
|------|------|------|
| `src/constants/strings.ts` | 新增 `MSG_BANNER` section (L21-28) | ✅ |
| `src/components/Feed/TxBanner.tsx` | 擴展支援 `messageNotification` prop | ⚠️ |
| `src/pages/Feed/useConsumer.ts` | 整合 `useNotifications`，新增 `latestNotification` | ⚠️ |
| `src/pages/Feed/Consumer.tsx` | 傳遞 `latestNotification` 至 TxBanner | ✅ |

---

#### 🔑 關鍵設計

- 私訊使用 brand 色系 vs 交易使用 cyan 色系
- MSG-4 未完成，點擊「查看」顯示 toast 提示
- Demo 模式下不顯示私訊通知

---

#### 🚨 審查發現的問題（Google 首席級別標準）

**總評分**: **68/100** ⚠️

##### P0 嚴重問題（必須修復）

1. **Git Commit 管理混亂** (-15分)
   - 問題：f4c96eb1 混入 11 個無關文件（MaiMai、Upload 組件等）
   - 影響：代碼回滾困難、審查困難、違反「一個 commit 一件事」原則
   - 方案：使用 `git rebase -i` 拆分成獨立 commits
   - 驗證：每個 commit 只包含相關文件

2. **完全缺少單元測試** (-12分)
   - 問題：0 個測試（MSG-2 有 55 個測試作為對比）
   - 影響：無法保證功能正確性、重構風險高
   - 方案：創建 `src/components/Feed/__tests__/TxBanner.test.tsx`
   - 必須測試：
     - ✅ 顯示私訊通知
     - ✅ 私訊優先級 > 交易
     - ✅ Demo 模式不顯示私訊
     - ✅ 點擊顯示 toast
     - ✅ 時間格式化（刚刚、5分钟前、1小时前）
     - ✅ 邊界情況（null、undefined、空陣列）
     - ✅ 可訪問性（aria-label）
   - 驗證：`npm test -- TxBanner` 至少 10 個測試通過

3. **ESLint 錯誤** (-3分)
   - 問題：`TxBanner.tsx:94` Tailwind 類名順序錯誤
   - 方案：`npx eslint --fix src/components/Feed/TxBanner.tsx`
   - 驗證：`npx eslint src/components/Feed/TxBanner.tsx --max-warnings=0`

##### P1 重要問題（強烈建議修復）

4. **類型定義不夠嚴格** (-5分)
   - 問題：未使用 optional chaining (`?.`)
   - 位置：TxBanner.tsx:76
   - 方案：`messageNotification?.last_message` 替代 `messageNotification.last_message`

5. **缺少邊界情況處理** (-5分)
   - 問題 1：名字過長未截斷
   - 問題 2：無效時間戳未驗證
   - 方案：加入長度檢查和日期驗證 (`isNaN(time.getTime())`)

6. **缺少性能優化** (-3分)
   - 問題：每次 render 重新計算時間格式
   - 方案：使用 `useMemo` 緩存 `timeLabel`

##### P2 改進建議（建議修復）

7. **缺少可訪問性支持** (-2分)
   - 問題：按鈕缺少 `aria-label`
   - 方案：添加 `aria-label="查看房仲私訊"`

8. **缺少錯誤處理** (-3分)
   - 問題：`useNotifications` 失敗未處理
   - 方案：添加 error 處理和 console.warn

9. **缺少文檔註釋** (-2分)
   - 問題：複雜邏輯缺少 JSDoc
   - 方案：為 `latestNotification` useMemo 添加詳細註釋

---

#### ✅ 驗證結果（初始）

- [x] TypeScript 0 errors
- [x] Build 成功
- [x] 基本功能正常運作

#### ❌ 未達標項目

- [ ] 單元測試（0/10 cases）
- [ ] ESLint 0 warnings（1 warning）
- [ ] Git commit 整潔度
- [ ] 邊界情況處理
- [ ] 性能優化
- [ ] 可訪問性支持
- [ ] 錯誤處理
- [ ] 代碼文檔

---

#### 🎯 改進行動清單

**優先級**: P0 → P1 → P2

1. [ ] 修復 ESLint 錯誤（Tailwind 順序）
2. [ ] 創建單元測試（至少 10 cases）
3. [ ] 使用 optional chaining (`?.`)
4. [ ] 添加邊界處理（名字截斷、日期驗證）
5. [ ] 性能優化（useMemo）
6. [ ] 添加 aria-label
7. [ ] 錯誤處理（useNotifications error）
8. [ ] 完善 JSDoc 註釋
9. [ ] 拆分 Git commits（高級）

**驗收標準**：
- [ ] 評分 > 90/100
- [ ] 單元測試覆蓋率 > 80%
- [ ] ESLint 0 warnings
- [ ] TypeScript strict mode 通過

---

#### 💡 學習重點

這次審查揭示的**核心問題**不是代碼能不能跑，而是：

1. **測試文化缺失** - MSG-2 有測試，MSG-3 沒測試 = 標準不一致
2. **Git 紀律鬆散** - 15 個文件混在一起 commit
3. **防禦性編程不足** - 沒考慮 null/undefined/邊界情況
4. **性能意識薄弱** - 沒使用 useMemo/useCallback
5. **文檔習慣不佳** - 複雜邏輯沒註釋

**Google 級別代碼** = 功能正確 + 測試完整 + 邊界處理 + 性能優化 + 文檔清晰 + Git 整潔

---

**審查完成日期**: 2026-01-02
**下次審查觸發**: 完成改進後重新提交

---

### MSG-4: 對話頁面 ⬜

**目標**: 消費者/房仲查看訊息並回覆的頁面

**路由**:
- 消費者: `/feed/consumer/chat/:conversationId`
- 房仲: `/feed/agent/chat/:conversationId`
（或統一 `/chat/:conversationId`，根據登入身份顯示不同視圖）

**頁面結構**:
```
┌─────────────────────────────────────┐
│ GlobalHeader                        │
├─────────────────────────────────────┤
│ 對方資訊卡（頭像、名稱、公司）      │
│ 物件資訊卡（物件名、地址、圖片）    │
├─────────────────────────────────────┤
│ 訊息列表                            │
│ ┌─ 對方訊息（左對齊）              │
│ └─ 我的訊息（右對齊）              │
├─────────────────────────────────────┤
│ [輸入框] [發送]                     │
└─────────────────────────────────────┘
```

**施作提示**:
- 使用 Supabase Realtime 訂閱新訊息
- 消費者首次回覆時填入 consumer_profile_id
- conversation.status: pending → active

**檔案新增**:
```
src/pages/Chat/
├── index.tsx        # 主頁面
├── ChatHeader.tsx   # 對方資訊 + 物件資訊
├── MessageList.tsx  # 訊息列表
├── MessageInput.tsx # 輸入框
└── useChat.ts       # 資料 hook
```

---

### MSG-5: 房仲訊息發送介面 ⬜

**目標**: 房仲購買客戶後編輯並發送第一則訊息

**觸發點**: UAG 頁面購買成功後

**現有架構**:
```
src/pages/UAG/index.tsx
└── 購買成功後目前只顯示 toast

src/pages/Feed/Agent.tsx
├── Line 56: GlobalHeader mode="agent"
└── 需要增加對話列表入口
```

**流程設計**:
```
購買成功
    ↓
彈出 Modal（訊息編輯框）
    ├── 顯示客戶資訊（匿名：訪客-A3F2）
    ├── 顯示物件資訊
    ├── 訊息輸入框（可輸入聯絡資料）
    └── [發送] [稍後再說]
    ↓
發送後跳轉到對話頁面
```

**房仲 Feed 對話列表**:
- 新增側欄區塊「我的客戶」
- 列表項目：訪客-A3F2 → 惠宇上晴 12F → 等待回覆
- 消費者回覆後：顯示真實姓名 + 對話中

**檔案修改/新增**:
```
修改:
- src/pages/UAG/index.tsx （購買成功彈 Modal）
- src/pages/Feed/Agent.tsx （對話列表入口）
- src/components/Feed/AgentSidebar.tsx （加入對話列表）

新增:
- src/components/UAG/SendMessageModal.tsx
- src/components/Feed/AgentConversationList.tsx
```

---

### NOTIFY-1: 簡訊 API ⬜

**目標**: 平台發送簡訊通知消費者

**前置依賴**: MSG-1（需要 conversations 表）

**API 設計**:
```
POST /api/notify/sms
Body: { conversation_id: UUID }
Response: { success: boolean, message_id?: string }
```

**內部邏輯**:
```javascript
// 1. 從 conversation 取得 consumer_session_id
// 2. 用 session_id 查 uag_sessions 取得 profile_id（如果已註冊）
// 3. 用 profile_id 查 profiles 取得 phone
// 4. 發送簡訊（房仲看不到 phone）
// 5. 記錄發送結果
```

**簡訊內容**:
```
【邁邁房屋】有房仲想聯繫您關於「惠宇上晴」
請至 maihouses.vercel.app/chat/xxx 查看
```

**服務商選項**:
1. 三竹簡訊（Mitake）- 台灣本土
2. Twilio - 國際服務
3. 每簡訊（Messente）

**個資保護**:
- phone 只存 profiles 表
- API 內部讀取，不回傳前端
- 發送記錄只記錄 conversation_id，不記錄 phone

---

### NOTIFY-2: Web Push 推播 ⬜

**目標**: 瀏覽器推播通知消費者

**前置依賴**:
- MSG-1（conversations 表）
- 消費者已授權推播

**技術選項**:
1. Firebase Cloud Messaging (FCM) - 推薦
2. OneSignal
3. 原生 Web Push API

**資料表新增**:
```sql
-- push_subscriptions 表
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id),
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**推播內容**:
```
標題: 邁邁房屋
內容: 有房仲想聯繫您，點擊查看
圖示: /logo-192.png
點擊動作: 開啟對話頁面
```

**施作步驟**:
1. 註冊 Service Worker
2. 請求推播權限
3. 儲存 subscription 到 push_subscriptions
4. 發送推播時查詢 subscription

---

### AUTH-1: 註冊流程 phone 必填 ⬜

**目標**: 消費者註冊時必須填寫手機號碼

**現有架構**:
```
public/auth.html
└── 註冊表單（目前只有 email + password）

profiles 表
└── phone 欄位（目前是 NULL）
```

**修改項目**:

1. **profiles 表** - 新增約束
```sql
ALTER TABLE profiles
ALTER COLUMN phone SET NOT NULL,
ADD CONSTRAINT phone_format CHECK (phone ~ '^09[0-9]{8}$');
```

2. **註冊表單** - 新增欄位
```html
<input type="tel" name="phone" placeholder="0912345678" required>
```

3. **驗證邏輯**
```javascript
// 格式驗證：台灣手機 09xxxxxxxx
const phoneRegex = /^09[0-9]{8}$/;
if (!phoneRegex.test(phone)) {
  throw new Error('請輸入正確的手機號碼');
}
```

**驗證碼（Phase 2）**:
- phone_verified: BOOLEAN DEFAULT false
- 發送 OTP 驗證碼
- 驗證通過後 phone_verified = true

---

### UAG-13: purchase_lead 觸發通知 ⬜

**目標**: 購買成功後自動建立 conversation 並觸發通知

**前置依賴**:
- MSG-1（conversations 表）
- NOTIFY-1（簡訊 API）
- NOTIFY-2（Web Push）

**現有 RPC**:
```
supabase/migrations/20251231_002_uag_rpc_functions.sql
└── purchase_lead() 函數
    └── 目前只扣款 + 建立 lead 記錄
```

**修改邏輯**:
```sql
-- purchase_lead() 內新增
-- 1. 建立 conversation
INSERT INTO conversations (agent_id, consumer_session_id, property_id, lead_id, status)
VALUES (p_agent_id, p_session_id, p_property_id, new_lead_id, 'pending')
RETURNING id INTO new_conversation_id;

-- 2. 返回 conversation_id
RETURN jsonb_build_object(
  'success', true,
  'lead_id', new_lead_id,
  'conversation_id', new_conversation_id  -- 新增
);
```

**前端處理**:
```typescript
// UAG 購買成功後
const result = await purchaseLead(sessionId, propertyId);
if (result.success) {
  // 開啟發送訊息 Modal
  openSendMessageModal(result.conversation_id);
}
```

**通知觸發時機**:
- 房仲「發送」訊息後才觸發（不是購買時）
- 讓房仲有機會編輯訊息內容

---

## 📊 P1 中優先級任務（建議完成）

### UAG-5: 配置統一重構 ✅ (100/100)

**完成日期**: 2025-12-31 (Commit `d9d142ac`)
**最終修復**: 2025-12-31

**實作內容**:
- ✅ 統一 `GRADE_HOURS` = `GRADE_PROTECTION_HOURS` (SSOT)
- ✅ 新增 `GRADE_PRICE`
- ✅ JSDoc 文檔完整
- ✅ 全局替換 `GRADE_HOURS` → `GRADE_PROTECTION_HOURS` (3 檔案)
- ✅ 移除所有 deprecated 代碼區塊
- ✅ TypeScript 編譯通過 (0 errors)
- ✅ ESLint 檢查通過 (修改檔案無 errors)
- ✅ Build 成功 (production ready)

**修復檔案**:
- `src/pages/UAG/uag-config.ts` - 移除 deprecated 區塊
- `src/pages/UAG/hooks/useUAG.ts` - 更新引用
- `src/pages/UAG/services/uagService.ts` - 更新引用
- `src/pages/UAG/components/AssetMonitor.tsx` - 更新引用

**驗證結果**:
- ✅ `npm run typecheck` - 通過
- ✅ `npm run lint` - 通過 (UAG 檔案 0 errors)
- ✅ `npm run build` - 成功
- ✅ 全局搜尋確認無 deprecated 常數殘留

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

**最後更新**: 2026-01-02
**負責團隊**: Frontend, Backend, DevOps, Design
**預估總工時**: 35 小時
**目標完成日期**: 2026-01-20
