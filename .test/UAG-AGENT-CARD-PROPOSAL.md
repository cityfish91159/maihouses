# UAG 房仲個人資料卡設計建議書

> **重要前提**：本建議書不包含任何代碼實作，僅提供設計分析與建議

---

## 目錄

1. [問題診斷](#1-問題診斷)
2. [設計原則](#2-設計原則)
3. [資料來源分析](#3-資料來源分析)
4. [房仲資料卡應呈現的內容](#4-房仲資料卡應呈現的內容)
5. [UAG 頁面佈局建議](#5-uag-頁面佈局建議)
6. [設計規格建議](#6-設計規格建議)
7. [與其他頁面的差異](#7-與其他頁面的差異)
8. [實作優先級](#8-實作優先級)

---

## 1. 問題診斷

### 1.1 核心問題

**之前的誤解**：

- ❌ 認為 UAG 需要顯示「聯絡按鈕」（電話、LINE）
- ❌ 新增了不必要的資料庫欄位（`agents.phone`, `agents.line_id`）
- ❌ 沒有深入理解 UAG 的使用情境

**正確理解**：

```
UAG = 房仲工作後台
使用者 = 房仲本人
情境 = 房仲查看客戶、購買 Lead、管理資產

問題：房仲為什麼要在自己的後台看到「打給自己的電話按鈕」？
答案：不需要！這是設計錯誤。
```

### 1.2 UAG 與其他頁面的本質差異

| 頁面              | 使用者         | 房仲資料卡的作用        | 是否需要聯絡按鈕 |
| ----------------- | -------------- | ----------------------- | ---------------- |
| **UAG**           | 房仲本人       | 展示房仲自己的身份/績效 | ❌ 不需要        |
| **Chat/Connect**  | 消費者（匿名） | 讓消費者識別房仲並聯絡  | ✅ 需要          |
| **Property Page** | 消費者（瀏覽） | 展示物件負責房仲        | ✅ 需要          |
| **Feed Agent**    | 消費者 + 房仲  | 社交展示                | ✅ 需要          |

**結論**：

- UAG 的房仲資料卡是「自我儀表板」性質
- 重點是**績效監控**和**身份識別**，不是聯絡

---

## 2. 設計原則

### 2.1 UAG 頁面的設計哲學

根據現有代碼和 UI/UX Pro Max 搜尋結果，UAG 應遵循：

#### **風格原則**（來自 UI/UX Pro Max - Minimalism & Swiss Style）

| 原則                     | 說明       | UAG 應用                     |
| ------------------------ | ---------- | ---------------------------- |
| **Clean & Simple**       | 乾淨簡潔   | 減少裝飾性元素，專注資訊呈現 |
| **Functional**           | 功能為先   | 每個組件都有明確用途         |
| **High Contrast**        | 高對比度   | 重要資訊（等級、點數）需突出 |
| **Grid-Based**           | 網格系統   | 使用現有 K-Span-12 系統      |
| **Sans-Serif**           | 無襯線字體 | 保持現有字體系統             |
| **Mathematical Spacing** | 數學化間距 | 4/8/16/24px 倍數             |

#### **互動原則**（來自 UI/UX Pro Max - UX Guidelines）

| 原則               | 說明               | 實例                             |
| ------------------ | ------------------ | -------------------------------- |
| **Subtle Hover**   | 微妙懸停反饋       | `hover:bg-gray-100` 不使用 scale |
| **Cursor Pointer** | 可點擊元素游標     | 所有互動卡片加 `cursor-pointer`  |
| **200-250ms**      | 動畫時長           | `transition-colors duration-200` |
| **No Emoji Icons** | 不用表情符號做圖標 | 使用 Lucide/Heroicons SVG        |

#### **UAG 特有原則**（從現有組件提取）

```
1. 資訊密度優先
   └─ 房仲需要快速掃描大量資料（Leads、資產、房源）
   └─ 卡片應簡潔但資訊完整

2. 等級視覺化
   └─ S/A/B/C 等級用顏色強化（紅/橙/黃/藍）
   └─ 房仲資料卡如有績效，應延續這個設計語言

3. 數字突出
   └─ 點數餘額、配額、信任分數應大且醒目
   └─ 使用 tabular-nums（等寬數字）

4. 狀態即時性
   └─ 保護倒數、通知狀態都有即時更新
   └─ 房仲資料卡如有動態資料，應考慮更新機制
```

### 2.2 品牌色統一

**問題**：

- 首頁使用深藍色 `#00385a`（邁房子品牌色）
- UAG 目前部分組件使用 `#1749d7`（偏亮藍紫）

**建議**：

```css
/* 統一為品牌色 */
--brand-primary: #00385a; /* 深藍（主品牌色） */
--brand-secondary: #004e7c; /* 中藍（懸停狀態） */
--accent-green: #10b981; /* 成功/購買 */

/* 保留等級色（不衝突） */
--grade-s: #ef4444; /* 紅 */
--grade-a: #f97316; /* 橙 */
--grade-b: #fbbf24; /* 黃 */
--grade-c: #60a5fa; /* 藍 */
```

**影響範圍**：

- UAGHeader
- ActionPanel 購買按鈕
- 新增的房仲資料卡

---

## 3. 資料來源分析

### 3.1 當前 `agents` 表完整欄位

```sql
-- 已存在的欄位（無需新增任何欄位）
agents 表:
├─ id (TEXT, PK)                    ✅ auth.uid()
├─ internal_code (SERIAL)           ✅ 房仲編號（如 MH-100001）
├─ name (TEXT)                      ✅ 房仲名稱
├─ avatar_url (TEXT, nullable)      ✅ 頭像 URL
├─ company (TEXT)                   ✅ 公司名稱（預設「邁房子」）
├─ trust_score (INTEGER)            ✅ 信任分數（0-100）
├─ encouragement_count (INTEGER)    ✅ 鼓勵數
├─ visit_count (INTEGER)            ✅ 累計帶看次數
├─ deal_count (INTEGER)             ✅ 累計成交戶數
├─ points (INTEGER)                 ✅ 點數餘額
├─ quota_s (INTEGER)                ✅ S 級配額
├─ quota_a (INTEGER)                ✅ A 級配額
├─ phone (TEXT, nullable)           ⚠️ 新增欄位（UAG-14，實際 UAG 不需要）
└─ line_id (TEXT, nullable)         ⚠️ 新增欄位（UAG-14，實際 UAG 不需要）
```

### 3.2 UAG 當前如何取得房仲資料

**現況**：

```typescript
// src/pages/UAG/index.tsx (line 92-98)

const agentId = user?.id; // 來自 useAuth()

const agentName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? '房仲';

// ⚠️ 問題：只有 agentName，缺少其他資料
```

**資料流**：

```
useAuth() Hook
    ↓
Supabase Auth Client
    ↓
auth.users 表
    ├─ user.id (UUID)
    ├─ user.email
    └─ user.user_metadata.full_name
    ↓
❌ 缺少 agents 表資料
    ├─ 沒有 trust_score
    ├─ 沒有 internal_code
    ├─ 沒有 points/quota
    └─ 沒有 visit_count/deal_count
```

### 3.3 資料來源建議

#### **選項 A：擴展 useUAG Hook**（推薦）

```typescript
// useUAG.fetchAppData() 已查詢 agents 表
// 只需在回傳中加入 agentProfile

interface AppData {
  user: {
    /* 點數、配額 */
  };
  leads: Lead[];
  listings: Listing[];
  feed: FeedItem[];
  agentProfile?: AgentProfile; // ← 新增
}

interface AgentProfile {
  id: string;
  internalCode: number;
  name: string;
  avatarUrl: string | null;
  company: string;
  trustScore: number;
  encouragementCount: number;
  visitCount: number;
  dealCount: number;
}
```

**優點**：

- ✅ 一次查詢，減少 API 呼叫
- ✅ 與現有架構一致
- ✅ 利用 React Query 快取

**缺點**：

- ⚠️ 增加 fetchAppData 複雜度

---

#### **選項 B：新增 useAgentProfile Hook**

```typescript
// 新 Hook：src/pages/UAG/hooks/useAgentProfile.ts

const { profile, isLoading } = useAgentProfile(user?.id);
```

**優點**：

- ✅ 單一職責原則
- ✅ 可複用於其他頁面

**缺點**：

- ⚠️ 額外的 API 請求
- ⚠️ 需要同步兩個 loading 狀態

---

**建議**：

- 如果只有 UAG 使用 → **選項 A**（擴展 useUAG）
- 如果多個頁面需要 → **選項 B**（新 Hook）

---

## 4. 房仲資料卡應呈現的內容

### 4.1 內容清單（分級）

#### **必須顯示**（核心身份識別）

| 欄位         | 來源                   | 用途                           |
| ------------ | ---------------------- | ------------------------------ |
| **頭像**     | `agents.avatar_url`    | 視覺識別（無圖時顯示名字首字） |
| **房仲名稱** | `agents.name`          | 身份確認                       |
| **房仲編號** | `agents.internal_code` | 唯一識別碼（如 #12345）        |
| **公司名稱** | `agents.company`       | 組織歸屬                       |

#### **應該顯示**（績效指標）

| 欄位         | 來源                         | 呈現方式                 |
| ------------ | ---------------------------- | ------------------------ |
| **信任分數** | `agents.trust_score`         | ⭐ 92 分（進度條或數字） |
| **鼓勵數**   | `agents.encouragement_count` | 👍 12 次                 |
| **累計帶看** | `agents.visit_count`         | 🏠 45 次                 |
| **累計成交** | `agents.deal_count`          | 💰 8 戶                  |

#### **可選顯示**（資源狀態）

| 欄位         | 來源             | 呈現方式     | 備註                     |
| ------------ | ---------------- | ------------ | ------------------------ |
| **點數餘額** | `agents.points`  | 💎 1,250 點  | UAGHeader 已顯示，可省略 |
| **S 級配額** | `agents.quota_s` | S 配額: 3/5  | UAGHeader 已顯示，可省略 |
| **A 級配額** | `agents.quota_a` | A 配額: 7/10 | UAGHeader 已顯示，可省略 |

#### **不應顯示**（UAG 情境不適用）

| 欄位             | 原因                 |
| ---------------- | -------------------- |
| ❌ 電話按鈕      | 房仲不需要打給自己   |
| ❌ LINE 按鈕     | 房仲不需要傳訊給自己 |
| ❌ 「聯絡我」CTA | 這是房仲自己的頁面   |

---

### 4.2 資訊層級建議

```
┌─────────────────────────────────────────┐
│  [頭像]  王小明                        │  ← 主識別（大且醒目）
│          #12345 │ 邁房子               │  ← 次要識別（小字灰色）
├─────────────────────────────────────────┤
│  ⭐ 信任分   👍 鼓勵                   │  ← 社交績效（左側）
│  92 分       12 次                     │
├─────────────────────────────────────────┤
│  🏠 累計帶看    💰 累計成交            │  ← 業務績效（右側）
│  45 次          8 戶                   │
└─────────────────────────────────────────┘
```

**設計理念**：

- **上層**：身份識別（誰）
- **中層**：社交信任（信任度）
- **下層**：業務能力（成交力）

---

### 4.3 與現有組件對比

| 組件                 | 頁面          | 顯示內容                        | UAG 應參考的部分                           |
| -------------------- | ------------- | ------------------------------- | ------------------------------------------ |
| **AgentTrustCard**   | Property Page | 頭像 + 信任分 + 績效 + 聯絡按鈕 | ✅ 頭像、信任分、績效佈局<br>❌ 聯絡按鈕   |
| **AgentProfileCard** | Feed Agent    | 頭像 + 名稱 + 徽章 + 統計       | ✅ 簡潔的統計呈現<br>⚠️ 徽章系統（可借鑑） |
| **UAGHeader**        | UAG           | 點數、配額、登出                | ✅ 數字突出風格<br>❌ 缺少房仲身份展示     |

**建議**：

- 借鑑 AgentTrustCard 的**佈局結構**
- 借鑑 AgentProfileCard 的**徽章系統**
- 移除所有**聯絡 CTA**

---

## 5. UAG 頁面佈局建議

### 5.1 當前佈局（6 區塊）

```
┌─────────────────────────────────────────────────┐
│              UAG Header                          │
│  [邁房子 Logo] 點數: 1,250  配額: S(3) A(7) [登出]│
├─────────────────────────────────────────────────┤
│                                                 │
│  [1] UAG Radar             [Action Panel]       │
│  (K-Span-6)                (K-Span-6)            │
│                                                 │
│  [2] Asset Monitor         (K-Span-12)          │
│                                                 │
│  [3] Listing Feed          [4] Feed             │
│  (K-Span-6)                (K-Span-6)            │
│                                                 │
│  [5] ReportGenerator       (K-Span-3)           │
│                                                 │
│  [6] Trust Flow                                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 5.2 房仲資料卡插入位置（3 個選項）

#### **選項 1：Header 下方獨立區塊**（推薦）

```
┌─────────────────────────────────────────────────┐
│              UAG Header                          │
├─────────────────────────────────────────────────┤
│ 🆕 房仲資料卡 (K-Span-12 或 3)                  │  ← 新增
│  [頭像] 王小明 #12345 │ 信任分 92 │ 成交 8 戶  │
├─────────────────────────────────────────────────┤
│  [1] Radar + [Action Panel]                     │
│  ...
```

**優點**：

- ✅ 突出顯示（進入頁面第一眼看到）
- ✅ 不干擾現有區塊
- ✅ 類似 Feed Agent 頁面的個人資料位置

**缺點**：

- ⚠️ 增加頁面長度
- ⚠️ 桌面版可能浪費空間（可用 K-Span-3 靠左）

---

#### **選項 2：整合進 UAGHeader**

```
┌─────────────────────────────────────────────────┐
│  [頭像] 王小明 #12345   點數: 1,250  [登出]     │
│  信任分: 92  成交: 8 戶  配額: S(3) A(7)        │
└─────────────────────────────────────────────────┘
```

**優點**：

- ✅ 節省空間
- ✅ 所有全局資訊集中

**缺點**：

- ⚠️ UAGHeader 資訊過載
- ⚠️ 手機版會很擁擠
- ⚠️ 違反單一職責原則（Header 應該是導航，不是展示區）

---

#### **選項 3：側邊欄（僅桌面版）**

```
┌───────────┬─────────────────────────────┐
│           │  UAG Header                 │
│  房仲資料  ├─────────────────────────────┤
│  卡       │  [1] Radar                  │
│           │  [2] Asset Monitor          │
│  (固定)   │  ...                        │
│           │                             │
└───────────┴─────────────────────────────┘
```

**優點**：

- ✅ 桌面版體驗佳（固定側邊欄）
- ✅ 不佔用主內容區

**缺點**：

- ❌ 手機版無法使用（需要完全不同的佈局）
- ❌ 與現有 K-Span 網格系統不一致
- ❌ 開發成本高

---

**建議優先級**：

1. **選項 1**（Header 下方獨立區塊）- 最推薦
2. 選項 2（整合 Header）- 如果空間非常緊張
3. 選項 3（側邊欄）- 不推薦（手機版問題）

---

### 5.3 手機版佈局特別考量

**原則**：手機版優先（根據用戶需求：「桌機沒什麼人用」）

```
┌─────────────────────┐
│  UAG Header         │
│  [Logo] [登出]      │
├─────────────────────┤
│ 房仲資料卡 (100%)   │  ← 全寬顯示
│ [頭像] 王小明       │
│ #12345 | 信任分 92  │
│ 帶看 45 | 成交 8    │
├─────────────────────┤
│ 點數: 1,250         │  ← 摺疊式（可展開）
│ 配額: S(3) A(7)     │
├─────────────────────┤
│ [1] Radar           │
│ (全寬)              │
│                     │
│ [Action Panel]      │
│ (全寬，Radar 下方)  │
│                     │
│ [2] Asset Monitor   │
│ ...                 │
└─────────────────────┘
```

**重點**：

- 房仲資料卡應簡潔（最多 3 行）
- 點數/配額可摺疊（點擊展開）
- 避免水平滾動

---

## 6. 設計規格建議

### 6.1 視覺設計（遵循 Minimalism 原則）

#### **色彩系統**

```css
/* 品牌色（統一為首頁深藍） */
--brand: #00385a; /* 主品牌色 */
--brand-light: #004e7c; /* 懸停狀態 */

/* 功能色 */
--accent: #10b981; /* 成功/購買 */
--warning: #f59e0b; /* 警告 */
--danger: #ef4444; /* 錯誤 */

/* 中性色（高對比） */
--ink-100: #0f172a; /* 主文字（黑） */
--ink-200: #334155; /* 次要文字（深灰） */
--ink-300: #64748b; /* 輔助文字（中灰） */
--bg-card: #ffffff; /* 卡片背景（白） */
--bg-page: #f8fafc; /* 頁面背景（淺灰） */
--line-soft: #e2e8f0; /* 分隔線 */
```

#### **字體系統**

```css
/* 字體家族（保持現有） */
font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Noto Sans TC', sans-serif;

/* 字體大小（數學化） */
--text-xs: 12px; /* 輔助文字 */
--text-sm: 14px; /* 次要內容 */
--text-base: 16px; /* 正文 */
--text-lg: 18px; /* 小標題 */
--text-xl: 20px; /* 標題 */
--text-2xl: 24px; /* 大標題 */

/* 字重 */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

#### **間距系統（Tailwind 標準）**

```
4px  → space-1
8px  → space-2
12px → space-3
16px → space-4  ← 卡片內邊距
24px → space-6  ← 區塊間距
32px → space-8
```

---

### 6.2 組件規格（房仲資料卡）

#### **桌面版（選項 1 佈局）**

```
尺寸：
  - 寬度: K-Span-3 (25% 容器寬度) 或 固定 280px
  - 高度: auto（內容撐開）
  - 內邊距: 16px
  - 圓角: 8px
  - 陰影: 0 1px 3px rgba(0,0,0,0.1)

頭像：
  - 尺寸: 64x64px（桌面） / 48x48px（手機）
  - 圓角: 50%（圓形）
  - 無圖時: 顯示名字首字，背景色 --brand

名稱：
  - 字體: 18px / font-semibold（桌面）
  - 字體: 16px / font-semibold（手機）
  - 顏色: --ink-100

房仲編號：
  - 字體: 12px / font-normal
  - 顏色: --ink-300
  - 格式: #12345

統計數字：
  - 字體: 20px / font-bold / tabular-nums
  - 顏色: --brand
  - 標籤: 12px / --ink-300

分隔線：
  - 高度: 1px
  - 顏色: --line-soft
  - 間距: 12px 上下
```

#### **手機版（100% 寬度）**

```
佈局：
  - 水平佈局（頭像在左，資訊在右）
  - 高度: 100px
  - 內邊距: 12px

頭像：
  - 尺寸: 48x48px
  - 位置: 左側固定

統計區：
  - 2x2 網格
  - 每格: 50% 寬度
  - 字體縮小: 16px（數字） / 11px（標籤）
```

---

### 6.3 互動設計

#### **懸停效果（桌面版）**

```css
/* 遵循 UX Guidelines - Subtle Hover */
.agent-card {
  transition: all 200ms ease;
  cursor: default; /* ⚠️ 不是 pointer，因為卡片本身不可點擊 */
}

.agent-card:hover {
  background: #fafafa; /* 微妙背景變化 */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* 陰影加深 */
  transform: none; /* ❌ 不使用 scale，避免佈局位移 */
}
```

#### **可點擊元素（如有）**

```
如果未來需要點擊卡片（如導向個人設定頁）：
  - 整個卡片加 cursor-pointer
  - hover 時加淺藍背景
  - 加入 keyboard focus 樣式（a11y）
```

---

### 6.4 響應式斷點

```css
/* Tailwind 斷點 */
sm: 640px   → 不使用（太小）
md: 768px   → 平板直式（卡片 50% 寬度）
lg: 1024px  → 桌面（卡片 K-Span-3）
xl: 1280px  → 大桌面（保持 K-Span-3）

/* 佈局策略 */
< 768px:  全寬（100%）、水平佈局
≥ 768px:  50% 寬度、垂直佈局
≥ 1024px: K-Span-3、完整資訊
```

---

## 7. 與其他頁面的差異

### 7.1 房仲資料卡跨頁面對比

| 特性          | UAG（房仲後台）     | Chat/Connect（消費者） | Property Page  |
| ------------- | ------------------- | ---------------------- | -------------- |
| **使用者**    | 房仲本人            | 消費者（匿名）         | 消費者（瀏覽） |
| **卡片目的**  | 身份確認 + 績效展示 | 建立信任 + 聯絡方式    | 物件負責人展示 |
| **頭像**      | ✅ 大（64px）       | ✅ 大（60px）          | ✅ 中（48px）  |
| **名稱**      | ✅ 粗體 18px        | ✅ 粗體 16px           | ✅ 粗體 14px   |
| **房仲編號**  | ✅ #12345           | ✅ #12345              | ✅ MH-100001   |
| **信任分數**  | ✅ 92 分 + 進度條   | ✅ 92 分 + 星星        | ✅ 信任徽章    |
| **績效統計**  | ✅ 鼓勵/帶看/成交   | ✅ 成交數              | ⚠️ 簡化版      |
| **電話按鈕**  | ❌ 不需要           | ✅ 需要                | ✅ 需要        |
| **LINE 按鈕** | ❌ 不需要           | ✅ 需要                | ✅ 需要        |
| **訊息按鈕**  | ❌ 不需要           | ✅ 需要（回覆）        | ⚠️ 可選        |
| **編輯按鈕**  | ⚠️ 可考慮           | ❌ 無                  | ❌ 無          |

**核心差異**：

- **UAG**：「這是我」（自我認知）
- **Chat**：「我是誰」（向客戶介紹）
- **Property**：「誰負責這個物件」（物件關聯）

---

### 7.2 設計語言一致性

**共同點**（保持品牌一致性）：

- ✅ 頭像圓形
- ✅ 房仲編號格式（#xxxxx）
- ✅ 信任分數範圍（0-100）
- ✅ 公司名稱「邁房子」
- ✅ 品牌色 `#00385a`

**差異點**（適應不同情境）：

- UAG：強調**績效數字**（帶看、成交）
- Chat：強調**聯絡方式**（電話、LINE）
- Property：強調**信任建立**（徽章、評價）

---

## 8. 實作優先級

### P0（核心功能，必須實作）

```
1. 建立資料查詢邏輯
   └─ 擴展 useUAG.fetchAppData() 或新增 useAgentProfile Hook
   └─ 查詢 agents 表完整資料

2. 建立房仲資料卡組件
   └─ 檔案: src/pages/UAG/components/AgentProfileCard/
   └─ 顯示: 頭像、名稱、編號、信任分、績效

3. 整合到 UAG 頁面
   └─ 位置: UAGHeader 下方（選項 1 佈局）
   └─ 響應式: 手機 100% / 桌面 K-Span-3
```

### P1（增強體驗，建議實作）

```
4. 品牌色統一
   └─ 修改 UAGHeader、ActionPanel 使用 #00385a
   └─ 建立 CSS 變數系統

5. 頭像 Fallback 優化
   └─ 無圖時顯示名字首字
   └─ 背景色使用品牌色

6. 數字視覺化
   └─ 信任分數加進度條
   └─ 使用 tabular-nums 字體
```

### P2（可選功能，視需求實作）

```
7. 編輯功能
   └─ 點擊卡片可編輯個人資料
   └─ 上傳頭像

8. 動畫效果
   └─ 數字計數器動畫（績效數字）
   └─ 進場動畫（fade-in）

9. 更多統計
   └─ 本月新增成交
   └─ 平均回覆時間
```

### P3（未來規劃，暫不實作）

```
10. 社交分享
    └─ 生成房仲名片
    └─ 分享到社群媒體

11. 績效趨勢圖
    └─ 信任分數歷史曲線
    └─ 成交數月度統計
```

---

## 9. 技術實作建議（概要）

### 9.1 檔案結構

```
src/pages/UAG/
├─ components/
│  ├─ AgentProfileCard/
│  │  ├─ index.tsx                    # 主組件
│  │  ├─ AgentProfileCard.module.css  # 樣式
│  │  └─ AgentAvatar.tsx              # 頭像子組件（可選）
│  ├─ UAGHeader/
│  ├─ RadarCluster/
│  └─ ...
├─ hooks/
│  ├─ useUAG.ts                       # 擴展以包含 agentProfile
│  └─ useAgentProfile.ts              # （選項 B）新 Hook
├─ types/
│  └─ uag.types.ts                    # 新增 AgentProfile 介面
└─ index.tsx                          # 整合 AgentProfileCard
```

### 9.2 資料介面

```typescript
// src/pages/UAG/types/uag.types.ts

export interface AgentProfile {
  id: string; // auth.uid()
  internalCode: number; // 房仲編號（數字部分）
  name: string; // 房仲名稱
  avatarUrl: string | null; // 頭像 URL
  company: string; // 公司名稱
  trustScore: number; // 信任分數（0-100）
  encouragementCount: number; // 鼓勵數
  visitCount: number; // 累計帶看
  dealCount: number; // 累計成交
}

export interface AppData {
  user: {
    id: string;
    points: number;
    quotaS: number;
    quotaA: number;
  };
  leads: Lead[];
  listings: Listing[];
  feed: FeedItem[];
  agentProfile: AgentProfile; // 新增
}
```

### 9.3 查詢邏輯（選項 A - 擴展 useUAG）

```typescript
// src/pages/UAG/services/uagService.ts

async function fetchAppData(userId: string): Promise<AppData> {
  const [
    userData,
    leadsData,
    listingsData,
    feedData,
    agentProfile, // 新增查詢
  ] = await Promise.all([
    ,
    ,
    /* 現有查詢 */ /* ... */ // 新增：查詢 agents 表
    supabase
      .from('agents')
      .select(
        'id, internal_code, name, avatar_url, company, trust_score, encouragement_count, visit_count, deal_count'
      )
      .eq('id', userId)
      .single(),
  ]);

  if (agentProfile.error) {
    console.error('Failed to fetch agent profile:', agentProfile.error);
  }

  return {
    user: userData.data,
    leads: transformLeads(leadsData.data),
    listings: listingsData.data,
    feed: feedData.data,
    agentProfile: agentProfile.data
      ? {
          id: agentProfile.data.id,
          internalCode: agentProfile.data.internal_code,
          name: agentProfile.data.name,
          avatarUrl: agentProfile.data.avatar_url,
          company: agentProfile.data.company,
          trustScore: agentProfile.data.trust_score,
          encouragementCount: agentProfile.data.encouragement_count,
          visitCount: agentProfile.data.visit_count,
          dealCount: agentProfile.data.deal_count,
        }
      : null,
  };
}
```

### 9.4 組件結構（概要）

```typescript
// src/pages/UAG/components/AgentProfileCard/index.tsx

interface AgentProfileCardProps {
  profile: AgentProfile;
}

export function AgentProfileCard({ profile }: AgentProfileCardProps) {
  return (
    <div className={styles.card}>
      {/* 頭像 + 名稱 */}
      <div className={styles.header}>
        <div className={styles.avatar}>
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.name} />
          ) : (
            <div className={styles.avatarFallback}>
              {profile.name.charAt(0)}
            </div>
          )}
        </div>
        <div className={styles.info}>
          <h3>{profile.name}</h3>
          <p>#{profile.internalCode} | {profile.company}</p>
        </div>
      </div>

      {/* 統計區（2x2 網格） */}
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{profile.trustScore}</span>
          <span className={styles.statLabel}>信任分</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{profile.encouragementCount}</span>
          <span className={styles.statLabel}>鼓勵</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{profile.visitCount}</span>
          <span className={styles.statLabel}>帶看</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{profile.dealCount}</span>
          <span className={styles.statLabel}>成交</span>
        </div>
      </div>
    </div>
  );
}
```

### 9.5 樣式（概要）

```css
/* AgentProfileCard.module.css */

.card {
  background: var(--bg-card);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 200ms ease;
}

.card:hover {
  background: #fafafa;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
}

.avatarFallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--brand);
  color: white;
  font-size: 24px;
  font-weight: 600;
}

.stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  border-top: 1px solid var(--line-soft);
  padding-top: 12px;
}

.statItem {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.statValue {
  font-size: 20px;
  font-weight: 700;
  color: var(--brand);
  font-variant-numeric: tabular-nums;
}

.statLabel {
  font-size: 12px;
  color: var(--ink-300);
}

/* 響應式 */
@media (max-width: 768px) {
  .avatar {
    width: 48px;
    height: 48px;
  }

  .avatarFallback {
    font-size: 18px;
  }

  .statValue {
    font-size: 16px;
  }
}
```

---

## 10. 總結與建議

### 10.1 核心建議

1. **❌ 不要在 UAG 顯示聯絡按鈕**
   - UAG 是房仲自己的後台
   - 聯絡按鈕應該在 Chat/Connect 頁面（消費者視角）

2. **✅ 聚焦於身份識別和績效展示**
   - 頭像、名稱、編號（身份）
   - 信任分、鼓勵、帶看、成交（績效）

3. **✅ 保持設計簡潔**
   - 遵循 Minimalism 原則
   - 高對比、清晰層級、數學化間距

4. **✅ 手機版優先**
   - 100% 寬度、水平佈局
   - 統計數字縮小但仍清晰

5. **✅ 品牌色統一**
   - 使用首頁深藍色 `#00385a`
   - 移除 UAG 中的 `#1749d7`

### 10.2 不建議新增的功能

| 功能                                     | 原因                                 |
| ---------------------------------------- | ------------------------------------ |
| ❌ 電話/LINE 按鈕                        | UAG 是房仲自己的頁面，不需要聯絡自己 |
| ❌ 新增 agents.phone/line_id（UAG 用途） | 這些欄位應該用於 Chat 頁面，不是 UAG |
| ❌ 複雜動畫                              | UAG 是工作後台，需要高效率，不是炫技 |
| ❌ 社交分享                              | 不符合 UAG 使用情境                  |

### 10.3 建議保留的欄位（供 Chat 頁面使用）

```sql
-- 這些欄位在 agents 表中保留，但用於 Chat/Connect 頁面
agents.phone      → Chat 頁面「打電話」按鈕
agents.line_id    → Chat 頁面「加 LINE」按鈕

-- UAG 頁面不使用這兩個欄位
```

### 10.4 實作順序建議

```
第一階段（MVP）:
1. 擴展 useUAG 查詢 agents 表
2. 建立 AgentProfileCard 組件（基礎版）
3. 整合到 UAG 頁面（Header 下方）
4. 手機版響應式測試

第二階段（優化）:
5. 品牌色統一
6. 頭像 Fallback 優化
7. 信任分數進度條

第三階段（增強）:
8. 編輯個人資料功能
9. 數字動畫效果
10. A/B 測試不同佈局
```

---

## 11. 附錄

### A. 參考現有組件

| 組件             | 檔案路徑                                        | 可借鑑的部分           |
| ---------------- | ----------------------------------------------- | ---------------------- |
| AgentTrustCard   | `src/pages/Property/components/AgentTrustCard/` | 頭像、信任分、績效佈局 |
| AgentProfileCard | `src/components/Feed/AgentProfileCard/`         | 徽章系統、簡潔統計     |
| UAGHeader        | `src/pages/UAG/components/UAGHeader/`           | 點數/配額數字突出風格  |
| AssetMonitor     | `src/pages/UAG/components/AssetMonitor/`        | 進度條、狀態徽章       |

### B. UI/UX Pro Max 搜尋結果摘要

**風格指引**（Minimalism & Swiss Style）:

- Clean, simple, spacious
- High contrast (Black/White)
- Subtle hover (200-250ms)
- Grid-based layout
- Sans-serif typography

**UX 指引**:

- ✅ Hover states with cursor-pointer
- ✅ Subtle visual change (bg/shadow)
- ❌ No hover-only interactions
- ❌ No scale transforms (layout shift)

**Tailwind 最佳實踐**:

- Responsive padding: `px-4 md:px-6 lg:px-8`
- Hidden/shown: `hidden md:block`
- Tabular numbers: `font-variant-numeric: tabular-nums`

### C. 品牌色對照表

| 色彩     | 十六進位  | 用途                       |
| -------- | --------- | -------------------------- |
| 品牌主色 | `#00385a` | Header、卡片強調、CTA 按鈕 |
| 品牌輔色 | `#004e7c` | 懸停狀態                   |
| 成功綠   | `#10b981` | 購買成功、正面反饋         |
| S 級紅   | `#ef4444` | S 級 Lead、高優先級        |
| A 級橙   | `#f97316` | A 級 Lead                  |
| B 級黃   | `#fbbf24` | B 級 Lead                  |
| C 級藍   | `#60a5fa` | C 級 Lead                  |

---

**建議書結束**

此建議書基於對 UAG 系統的深入理解，結合 UI/UX Pro Max 設計指引和現有代碼分析。所有建議均未包含實作代碼，僅提供設計方向供參考。
