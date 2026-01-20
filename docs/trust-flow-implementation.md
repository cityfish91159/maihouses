# 安心留痕 (Trust Flow) 實作工單

> **建立日期**: 2026-01-20
> **優先級**: P1 - 核心功能
> **預估範圍**: 10 個檔案變更 + 1 個資料庫 Migration

---

## 一、商業背景

### 1.1 什麼是安心留痕？

安心留痕是**「房仲與特定消費者之間的交易追蹤」**服務，不是物件的屬性。

```
一個物件 (MH-100001)
    │
    ├── 消費者 A 預約看屋 → 案件 A → 獨立的 M1→M6 進度
    ├── 消費者 B 預約看屋 → 案件 B → 獨立的 M1→M6 進度
    └── 消費者 C 預約看屋 → 案件 C → 獨立的 M1→M6 進度

    最終 1 個成交 (M5) → 只有這個案件收費
```

### 1.2 六階段流程 (M1-M6)

| 階段 | 名稱 | 說明 | 收費 |
|------|------|------|------|
| M1 | 接洽 | 首次電話聯繫 | ❌ |
| M2 | 帶看 | 實地看屋 | ❌ |
| M3 | 出價 | 買方出價 | ❌ |
| M4 | 斡旋 | 價格協商 | ❌ |
| M5 | 成交 | 簽約完成 | ✅ 收費 |
| M6 | 交屋 | 點交完成 | ❌ |

---

## 二、功能需求

### 2.1 物件詳情頁 (`/property/:id`)

**需求**：顯示「安心留痕」徽章（僅當房仲開啟服務時）

```
┌─────────────────────────────────────┐
│ 🛡️ 安心留痕                         │
│ ───────────────────────────────────│
│ 本物件支援安心交易留痕服務          │
│                                     │
│ ✓ 六階段交易追蹤                    │
│ ✓ 每步驟數位留痕                    │
│ ✓ 雙方確認機制                      │
│                                     │
│ 預約看屋後即可啟動專屬追蹤          │
└─────────────────────────────────────┘
```

**注意**：
- ❌ 不顯示任何交易進度（進度屬於消費者個人）
- ❌ 不需要知道消費者是誰
- ✅ 純靜態展示，只看 `trust_enabled` 欄位

---

### 2.2 物件上傳頁 (`/property/upload`)

**需求**：房仲可選擇是否開啟安心留痕服務

```
┌─────────────────────────────────────┐
│ 🛡️ 安心留痕服務                     │
│ ───────────────────────────────────│
│                                     │
│ [Toggle] 開啟安心留痕               │
│                                     │
│ 為消費者提供六階段交易追蹤，        │
│ 提升信任感，增加成交機會。          │
│                                     │
│ 💡 僅在成交時收取服務費             │
└─────────────────────────────────────┘
```

---

### 2.3 物件編輯頁 - 補開安心服務

**需求**：房仲可為已上傳但未開啟的物件「補開」安心留痕

**商業規則**：
| 操作 | 允許？ | 原因 |
|------|--------|------|
| 沒開 → 開 | ✅ 可以 | 房仲想提供更好服務 |
| 開 → 關 | ❌ 不行 | 已開啟的承諾不能反悔 |

**UI 設計**：

**狀態一：尚未開啟（可補開）**
```
┌─────────────────────────────────────┐
│ 🛡️ 安心留痕服務                     │
│ ───────────────────────────────────│
│ 此物件尚未開啟安心留痕              │
│                                     │
│ [開啟安心留痕]                      │
│                                     │
│ ⚠️ 開啟後無法關閉                   │
└─────────────────────────────────────┘
```

**狀態二：已開啟（不可關閉）**
```
┌─────────────────────────────────────┐
│ 🛡️ 安心留痕服務                     │
│ ───────────────────────────────────│
│ ✓ 已開啟                            │
│                                     │
│ 此物件支援安心交易留痕服務          │
│ 開啟時間：2026-01-15                │
└─────────────────────────────────────┘
```

---

### 2.4 Trust Room (`/trust-room`)

**需求**：未登入消費者看到註冊引導區塊

```
┌─────────────────────────────────────┐
│ 💡 註冊邁房子會員                   │
│ ───────────────────────────────────│
│                                     │
│ ✓ 在個人頁面管理所有交易            │
│ ✓ 即時接收進度更新通知              │
│ ✓ 永久保存交易紀錄                  │
│                                     │
│ [立即註冊]  [稍後再說]              │
└─────────────────────────────────────┘
```

---

### 2.5 LINE 查詢功能

**需求**：消費者可在 LINE 輸入「我的交易」查詢所有案件

**回覆格式**：
```
📋 您目前有 2 筆進行中的交易：

1️⃣ 信義區三房美寓
   房仲：王小明
   進度：M3 出價
   [查看詳情]

2️⃣ 大安區景觀宅
   房仲：李小華
   進度：M2 帶看
   [查看詳情]
```

---

### 2.6 推播通知

**需求**：案件進度更新時，透過 LINE 通知消費者

**觸發時機**：
- 房仲推進步驟（M1→M2, M2→M3...）
- 房仲標記步驟完成

---

### 2.7 Feed 頁面多筆交易管理

**需求**：消費者與房仲都能在 Feed 頁面看到所有進行中的交易

#### 消費者視角 (`/feed/:userId`)

```
┌─────────────────────────────────────┐
│ 📋 我的交易 (3)                     │
│ ───────────────────────────────────│
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🏠 信義區三房美寓                │ │
│ │ 房仲：王小明                    │ │
│ │ ████████░░ M3 出價              │ │
│ │ [查看詳情]                      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🏠 大安區景觀宅                  │ │
│ │ 房仲：李小華                    │ │
│ │ ████░░░░░░ M2 帶看              │ │
│ │ [查看詳情]                      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🏠 內湖電梯大樓          💤休眠 │ │
│ │ 房仲：張大明                    │ │
│ │ ██░░░░░░░░ M1 接洽              │ │
│ │ [喚醒交易]                      │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### 房仲視角 (`/uag` 或 `/feed/:agentId`)

```
┌─────────────────────────────────────┐
│ 📋 我的案件 (15)           [篩選 ▼]│
│ ───────────────────────────────────│
│ 進行中: 8 | 休眠: 5 | 成交: 2      │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🔥 信義區三房美寓                │ │
│ │ 買方：陳○○                      │ │
│ │ ████████░░ M3 出價              │ │
│ │ 最後互動：2 小時前              │ │
│ │ [推進步驟] [進入 Trust Room]    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 信義區三房美寓                   │ │
│ │ 買方：林○○                      │ │
│ │ ██░░░░░░░░ M1 接洽              │ │
│ │ 最後互動：3 天前                │ │
│ │ [推進步驟] [進入 Trust Room]    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 💤 休眠案件 (5)            [展開 ▼]│
└─────────────────────────────────────┘
```

**功能需求**：

| 功能 | 消費者 | 房仲 |
|------|--------|------|
| 顯示所有進行中交易 | ✅ | ✅ |
| 顯示休眠交易 | ✅ | ✅ |
| 篩選/分類 | ❌ | ✅（依狀態、物件、時間）|
| 快速推進步驟 | ❌ | ✅ |
| 進入 Trust Room | ✅ | ✅ |
| 喚醒休眠案件 | ✅（聯繫房仲）| ✅（直接推進）|

---

## 三、技術任務清單

### Phase 1: 資料庫

| ID | 任務 | 檔案 | 說明 |
|----|------|------|------|
| DB-1 | 新增 `trust_enabled` 欄位 | `supabase/migrations/xxx_add_trust_enabled.sql` | `ALTER TABLE properties ADD COLUMN trust_enabled BOOLEAN DEFAULT false;` |

---

### Phase 2: 前端組件

| ID | 任務 | 檔案 | 說明 |
|----|------|------|------|
| FE-1 | 建立 TrustBadge 組件 | `src/components/TrustBadge.tsx` | 安心留痕徽章（靜態展示） |
| FE-2 | PropertyDetailPage 加入 TrustBadge | `src/pages/PropertyDetailPage.tsx` | 側邊欄 AgentTrustCard 下方 |
| FE-3 | PropertyUploadPage 加入 Toggle | `src/pages/PropertyUploadPage.tsx` | 新增安心服務區塊 |
| FE-4 | UploadContext 擴充狀態 | `src/components/upload/UploadContext.tsx` | 新增 `trust_enabled` 到 form state |
| FE-5 | TrustRoom 註冊引導 | `src/pages/TrustRoom.tsx` | 頁面底部新增引導區塊 |
| FE-6 | 物件編輯頁補開安心服務 | `src/pages/PropertyEditPage.tsx` | 只能開不能關的 UI |
| FE-7 | Feed 消費者交易列表 | `src/components/Feed/TxList.tsx` | 多筆交易卡片列表 |
| FE-8 | Feed 交易卡片組件 | `src/components/Feed/TxCard.tsx` | 單筆交易進度卡片 |
| FE-9 | UAG 房仲案件列表強化 | `src/pages/UAG/components/CaseList.tsx` | 篩選、分類、快速操作 |

---

### Phase 3: 後端 API

| ID | 任務 | 檔案 | 說明 |
|----|------|------|------|
| BE-1 | property create 處理 trust_enabled | `api/property/create.ts` | 新增欄位處理 |
| BE-2 | property 補開安心服務 API | `api/property/enable-trust.ts` | 只能 false→true，不能反向 |
| BE-3 | 建立 my-cases API | `api/trust/my-cases.ts` | 用 line_user_id 查詢所有案件 |
| BE-4 | LINE webhook 處理「我的交易」 | `api/line/webhook.ts` | message 事件新增關鍵字處理 |
| BE-5 | 建立通知 API | `api/trust/notify.ts` | 進度更新時發送 LINE 推播 |
| BE-6 | 消費者案件列表 API | `api/trust/consumer-cases.ts` | 用 user_id 查詢所有案件 |
| BE-7 | 房仲案件列表 API | `api/trust/agent-cases.ts` | 用 agent_id 查詢，支援篩選 |

---

### Phase 4: 類型定義

| ID | 任務 | 檔案 | 說明 |
|----|------|------|------|
| TS-1 | 擴充 PropertyFormInput | `src/services/propertyService.ts` | 新增 `trust_enabled?: boolean` |
| TS-2 | 擴充 PropertyData | `src/services/propertyService.ts` | 新增 `trustEnabled: boolean` |

---

## 四、依賴關係

```
DB-1 (資料庫)
  │
  ├── TS-1, TS-2 (類型定義)
  │     │
  │     ├── BE-1 (property create API)
  │     │     │
  │     │     └── FE-3, FE-4 (上傳頁)
  │     │
  │     └── FE-1, FE-2 (詳情頁 TrustBadge)
  │
  └── BE-2 (my-cases API)
        │
        ├── BE-3 (LINE webhook)
        │
        └── BE-4 (notify API)
              │
              └── FE-5 (TrustRoom 引導)
```

**建議執行順序**：
1. DB-1 → TS-1, TS-2
2. FE-1 → FE-2 (可獨立)
3. FE-3, FE-4 → BE-1
4. BE-2 → BE-3, BE-4
5. FE-5 (可獨立)

---

## 五、驗收標準

### 5.1 物件詳情頁
- [ ] `trust_enabled = true` 的物件顯示徽章
- [ ] `trust_enabled = false` 的物件不顯示徽章
- [ ] 徽章樣式符合設計稿

### 5.2 物件上傳頁
- [ ] Toggle 預設為關閉
- [ ] Toggle 狀態正確保存到資料庫
- [ ] 成功上傳後可在詳情頁看到徽章

### 5.3 Trust Room
- [ ] 未登入用戶看到註冊引導
- [ ] 已登入用戶不顯示引導
- [ ] 「立即註冊」按鈕導向正確頁面

### 5.4 LINE 功能
- [ ] 輸入「我的交易」回覆正確格式
- [ ] 無交易時顯示適當訊息
- [ ] 進度更新時收到推播通知

### 5.5 品質檢查
- [ ] `npm run typecheck` 通過
- [ ] `npm run lint` 通過
- [ ] 無 `any` 類型
- [ ] 所有 API 有錯誤處理

---

## 六、資料查詢參考

### 查詢消費者所有案件 (by LINE User ID)

```sql
SELECT
  tc.id,
  tc.case_name,
  tc.current_step,
  tc.status,
  p.title AS property_title,
  u.full_name AS agent_name
FROM trust_cases tc
JOIN uag_sessions us ON tc.buyer_session_id = us.session_id
JOIN uag_line_bindings lb ON us.session_id = lb.session_id
LEFT JOIN properties p ON tc.property_id = p.id
LEFT JOIN users u ON tc.agent_id = u.id
WHERE lb.line_user_id = $1
  AND tc.status = 'active'
ORDER BY tc.updated_at DESC;
```

---

## 七、風險與注意事項

| 風險 | 影響 | 緩解措施 |
|------|------|----------|
| LINE API 限流 | 推播可能失敗 | 實作重試機制 + 錯誤日誌 |
| 舊物件無 trust_enabled | 預設為 false | Migration 設定 DEFAULT false |
| 未綁定 LINE 的消費者 | 無法查詢/收通知 | Trust Room Token 仍可用 |

---

## 八、案件生命週期管理

### 8.1 問題背景

- 100 個案件可能只有 1 個成交（M5 收費）
- 消費者不會主動關閉案件
- 房仲不能關閉（會逃避付費）
- 需要自動化的關閉機制

### 8.2 案件狀態定義

| 狀態 | 說明 | 可見性 |
|------|------|--------|
| `active` | 進行中 | 雙方可見 |
| `dormant` | 休眠（30天無互動） | 雙方可見，標記為休眠 |
| `completed` | 成交完成 ✅ 收費 | 雙方可見 |
| `closed_sold_to_other` | 物件已由他人成交 | 消費者可見，顯示說明 |
| `closed_property_unlisted` | 物件已下架 | 消費者可見，顯示說明 |
| `closed_inactive` | 過期關閉（休眠超 60 天） | 消費者可見，顯示說明 |

### 8.3 自動關閉觸發條件

| 觸發條件 | 說明 | 目標狀態 |
|----------|------|----------|
| **物件成交** | 該物件有任一案件達 M5 | 其他案件 → `closed_sold_to_other` |
| **物件下架** | 房仲下架或刪除物件 | 所有案件 → `closed_property_unlisted` |
| **長期無互動** | 30 天無步驟推進 | → `dormant`（休眠） |
| **休眠超時** | 休眠狀態持續 60 天 | → `closed_inactive` |

### 8.4 狀態流程圖

```
active (進行中)
   │
   ├─ 物件成交（他人）──→ closed_sold_to_other (他人成交)
   ├─ 自己成交（M5）───→ completed (完成) ✅ 收費
   ├─ 物件下架 ────────→ closed_property_unlisted (物件下架)
   │
   └─ 30天無互動 ─────→ dormant (休眠)
                           │
                           ├─ 有新互動 → active (復活)
                           └─ 60天後 ──→ closed_inactive (過期)
```

### 8.5 技術實作任務

| ID | 任務 | 檔案 | 說明 |
|----|------|------|------|
| LC-1 | 新增 status 欄位值 | `supabase/migrations/xxx_trust_case_status.sql` | 擴充 status enum |
| LC-2 | 成交時批量關閉 | `api/trust/complete.ts` | M5 成交時觸發 |
| LC-3 | 物件下架時關閉 | `api/property/unlist.ts` | 下架時觸發 |
| LC-4 | 休眠檢查 Cron | `api/cron/trust-dormant.ts` | 每日檢查 30 天無互動 |
| LC-5 | 過期關閉 Cron | `api/cron/trust-expire.ts` | 每日檢查休眠超 60 天 |
| LC-6 | 休眠復活機制 | `api/trust/advance-step.ts` | 推進步驟時檢查並復活 |

### 8.6 關鍵 SQL

**成交時批量關閉同物件其他案件**：
```sql
-- 當案件達到 M5 成交時執行
UPDATE trust_cases
SET status = 'closed_sold_to_other',
    closed_at = NOW(),
    closed_reason = '物件已由其他買方成交'
WHERE property_id = $property_id
  AND id != $completed_case_id
  AND status IN ('active', 'dormant');
```

**每日休眠檢查**：
```sql
-- Cron Job: 每日 03:00 執行
UPDATE trust_cases
SET status = 'dormant',
    dormant_at = NOW()
WHERE status = 'active'
  AND updated_at < NOW() - INTERVAL '30 days';
```

**每日過期關閉**：
```sql
-- Cron Job: 每日 03:30 執行
UPDATE trust_cases
SET status = 'closed_inactive',
    closed_at = NOW(),
    closed_reason = '超過 90 天無互動，案件已自動關閉'
WHERE status = 'dormant'
  AND dormant_at < NOW() - INTERVAL '60 days';
```

### 8.7 消費者通知

| 狀態變更 | LINE 通知內容 |
|----------|---------------|
| `active` → `dormant` | 「您的交易已休眠，如需繼續請聯繫房仲」 |
| `dormant` → `active` | 「您的交易已恢復進行中」 |
| `* ` → `closed_sold_to_other` | 「此物件已由其他買方成交，感謝您的關注」 |
| `*` → `closed_property_unlisted` | 「此物件已下架，案件已關閉」 |
| `dormant` → `closed_inactive` | 「案件因長期無互動已自動關閉」 |

### 8.8 驗收標準

- [ ] 案件成交時，同物件其他案件自動關閉
- [ ] 物件下架時，所有相關案件自動關閉
- [ ] 30 天無互動的案件標記為休眠
- [ ] 休眠 60 天的案件自動關閉
- [ ] 休眠案件有新互動時可復活
- [ ] 狀態變更時發送 LINE 通知
- [ ] Trust Room 正確顯示各狀態的說明文字

---

## 九、後續擴展（不在此工單範圍）

- [ ] 進度通知支援 Email
- [ ] 消費者評價房仲服務

---

*工單結束*
