# Trust Room (安心留痕) UX 重設計規劃

**版本**: 1.0
**日期**: 2026-01-30
**規範來源**: ui-ux-pro-max
**目標**: 移除所有 emoji、導入深藍色原子設計系統、去除 AI 味道

---

## 實作進度總覽

### Phase 1: trust.types.ts 更新
- [x] 1.1 移除 `STEP_ICONS` emoji 常數
- [x] 1.2 新增 `STEP_ICONS_SVG` Lucide 圖示映射
- [x] 1.3 更新 `STEP_DESCRIPTIONS` 文案（去 AI 味）
- [x] 1.4 更新 `STEP_NAMES` 文案（口語化）

#### Phase 1 施工紀錄 (2026-01-30)
- `src/types/trust.types.ts`: 移除 `STEP_ICONS`，新增 `STEP_ICONS_SVG`，更新 `STEP_NAMES`/`STEP_DESCRIPTIONS` 文案
- `src/pages/TrustRoom.tsx`: 改用 `STEP_ICONS_SVG` 渲染步驟圖示（避免引用舊常數）
- `src/components/TrustManager.tsx`: 移除未使用 `STEP_ICONS` import

### Phase 2: TrustRoom.tsx 重構
- [x] 2.1 移除 `COLORS` 物件（硬編碼 hex）
- [x] 2.2 移除 `styles` 物件（inline styles）
- [x] 2.3 改用 Tailwind classes + tokens
- [x] 2.4 替換 `🛡️ 安心交易` 徽章為 `ShieldCheck` SVG
- [x] 2.5 替換 `⏰` 過期提示為 `Clock` SVG
- [x] 2.6 替換 `✓` 確認圖示為 `Check` SVG
- [x] 2.7 替換步驟數字圖示為對應 SVG
- [x] 2.8 更新進度條樣式（深藍漸層）
- [x] 2.9 更新卡片樣式（brand tokens）
- [x] 2.10 更新按鈕樣式
- [x] 2.11 更新 Toast 訊息樣式

#### Phase 2 施工紀錄 (2026-01-30)
- `src/pages/TrustRoom.tsx`: 完全重構
  - 移除 `COLORS` 硬編碼物件
  - 移除 `styles` inline styles 物件（約 120 行）
  - 改用 Tailwind classes 引用 brand tokens
  - 新增 `ShieldCheck`, `Clock`, `Check` Lucide 圖示
  - 背景改用 `bg-gradient-to-br from-bg-base to-brand-50`
  - 進度條使用 `bg-gradient-to-r from-brand-700 to-success`
  - 按鈕使用 `bg-brand-700` 搭配 `hover:bg-brand-600`
  - Toast 使用 `bg-success` / `bg-danger` 語意色
  - 所有 emoji 已替換為 SVG 圖示
  - 進度條寬度改用 class 映射（移除 `style`）
  - 互動按鈕高度調整為 44px（符合 touch target）
  - 徽章文字調整為 `text-xs` 可讀性
  - Toast 提升至 `z-modal`
  - 載入狀態補上 spinner
  - 步驟標題改用 `STEP_NAMES`
  - 抽出 `MS_PER_DAY` 常數，避免 magic number
  - URL token 加註安全風險提醒
  - Loading 區塊改為 Skeleton UI
  - 步驟圖示渲染抽為函式
  - 確認按鈕加入 spinner/disabled 視覺提示

### Phase 3: Assure/Detail.tsx 優化
- [x] 3.1 更新 Header 色彩為品牌深藍
- [x] 3.2 移除 `📢` emoji（房仲帶看紀錄）
- [x] 3.3 移除 `📝` emoji（新增補充紀錄）
- [x] 3.4 移除 `👨‍💼` `👤` emoji（角色標示）
- [x] 3.5 替換角色圖示為 `Briefcase` / `User` SVG
- [x] 3.6 更新空狀態文案（去 AI 味）
- [x] 3.7 更新演示模式按鈕文案
- [x] 3.8 更新各步驟操作文案
- [x] 3.9 統一卡片樣式為 brand tokens

#### Phase 3 施工紀錄 (2026-01-30)
- `src/pages/Assure/Detail.tsx`: 完全重構
  - Header 改用 `bg-brand-700` + `ShieldCheck` 圖示 + 「安心留痕」標題
  - 進度條改用 `from-brand-700 to-success` 漸層
  - 「📢 房仲帶看紀錄」→ `<Megaphone>` + 文字
  - 「📝 新增補充紀錄」→ `<FilePlus>` + 「補充紀錄」
  - 「👨‍💼」「👤」→ `<Briefcase>` / `<User>` 角色徽章
  - 空狀態文案：「目前未檢測到...」→「沒有找到你的交易紀錄，想先體驗看看嗎？」
  - 演示按鈕：「啟動演示模式 (Demo Mode)」→「體驗看看」
  - 確認按鈕：「確認無誤並送出」→「確認送出」
  - 等待狀態：「等待房仲提交...」→「房仲還沒送出」
  - 進度條寬度改用 class 映射（移除 inline style）
  - 步驟卡片/付款區/清單配色改用 brand tokens
  - 進度條寬度常數抽到 `src/constants/progress.ts`
  - 移除未使用 hook 解構與 `useLocation`
  - 資料提交後改用 `fetchData` 更新（移除 `window.location.reload()`）
  - Header/徽章/提示文字最小字級調整為 `text-xs`
  - 重置/付款改為雙擊確認（避免原生 `confirm()`）

### Phase 4: DataCollectionModal.tsx 微調
- [x] 4.1 更新標題文案（去 AI 味）
- [x] 4.2 更新隱私說明文案
- [x] 4.3 更新按鈕文案
- [x] 4.4 確認 SVG 圖示已使用（已有 Lucide）

#### Phase 4 施工紀錄 (2026-01-30)
- `src/components/TrustRoom/DataCollectionModal.tsx`: 文案更新
  - 標題：「請填寫基本資料以保全交易過程全貌」→「留下聯絡方式，方便後續聯繫」
  - 隱私說明：「此資訊僅供法律留痕使用，不會公開給房仲」→「資料只用於交易紀錄，不會外流」
  - 按鈕：「送出」→「確認送出」
  - Placeholder：「請輸入您的姓名」→「你的名字」
  - Modal 配色與邊框改用 brand tokens（去除灰藍色系）
  - 按鈕高度調整為 `min-h-[44px]`
  - 移除 `animate-in` 系列類別（避免依賴外部插件）
  - 隱私區塊圖示改為 `Info`，減少重複 Shield
  - 精簡頂部註解，移除多餘 Skills 標註
  - `FOCUS_DELAY_MS` 與 focusable selector 抽為常數
  - Email 驗證改用 `.email().or(z.literal(''))` 簡化

### Phase 5: 整合驗證
- [x] 5.1 `npm run typecheck` 通過
- [x] 5.2 `npm run lint` 通過
- [ ] 5.3 Mock 模式功能正常（待手動驗證）
- [ ] 5.4 正式模式功能正常（待手動驗證）
- [ ] 5.5 手機版響應式正常（待手動驗證）
- [ ] 5.6 桌面版響應式正常（待手動驗證）
- [x] 5.7 無任何 emoji 殘留（Trust Room 相關檔案已確認）
- [x] 5.8 無任何 inline styles 殘留（TrustRoom.tsx 已移除 styles 物件）
- [x] 5.9 無任何硬編碼 hex 值（TrustRoom.tsx 已移除 COLORS 物件）

#### Phase 5 施工紀錄 (2026-01-30)
- `npm run gate` 通過（typecheck + lint）
- Trust Room 相關檔案 emoji 掃描：無殘留
- 待手動驗證：Mock 模式、正式模式、響應式
- 新增測試：progress 計算、資料收集 Zod schema、TrustRoom 整合渲染
 - `npm run typecheck` 通過
 - `npm run lint` 通過
 - `vitest run`（progress / schema / TrustRoom / DataCollectionModal）通過
 - `constants/progress` 型別改為 tuple + union，避免索引 undefined

### Phase 6: MaiMai 吉祥物整合（極簡存在感）
- [x] 6.1 建立 `useTrustRoomMaiMai` Hook
- [x] 6.2 首次進入：wave 表情 + 3 秒後淡出
- [x] 6.3 完成步驟確認：happy 表情 + 1.5 秒動畫
- [x] 6.4 全部完成：celebrate 表情 + confetti 慶祝
- [x] 6.5 錯誤狀態：shy 表情顯示
- [x] 6.6 位置：右下角固定，不遮擋主要內容
- [x] 6.7 手機版響應式尺寸調整
- [x] 6.8 效能：lazy load + requestAnimationFrame

#### Phase 6 施工紀錄 (2026-01-30)
- `src/hooks/useTrustRoomMaiMai.ts`: 新增 MaiMai 狀態管理（wave/happy/celebrate/shy/idle）與 idle timer
- `src/components/TrustRoom/TrustRoomMaiMai.tsx`: 封裝 MaiMai + confetti，桌機/手機尺寸對應
- `src/pages/TrustRoom.tsx`: lazy 載入 MaiMai，成功/失敗/全完成觸發對應狀態
- 補上 MaiMai Hook / 元件 JSDoc 說明
 - TriggerOptions 新增 onComplete，idleDelay 加註說明
 - MaiMai 手機尺寸調整為 64px，加入 safe-area
 - Confetti 手機粒子減半、origin 自適應
 - 新增 `useTrustRoomMaiMai` 單元測試

### Phase 7: 手機優先 UI 優化（ui-ux-pro-max 審查）
- [ ] 7.1 **Touch Target Size**：確認按鈕 `py-2.5` → `py-3` + `min-h-[44px]`（44px 最小觸控區域）
- [ ] 7.2 **徽章文字尺寸**：`text-[11px]` → `text-xs` (12px)，提升手機可讀性
- [ ] 7.3 **進度條視覺權重**：`h-2` → `h-2.5` 或 `h-3`，加強視覺存在感
- [ ] 7.4 **Safe Area 處理**：加入 `pb-safe` 或 `pb-8`，避免 iPhone Home Bar 遮擋
- [ ] 7.5 **Toast 位置優化**：手機版改為 `left-4 right-4 top-4` 全寬，避開瀏覽器網址列
- [ ] 7.6 **觸控間距確認**：確保所有觸控元素間距 ≥ 8px (`gap-2`)

#### Phase 7 審查依據 (ui-ux-pro-max)
| 問題 | 嚴重度 | 規範 |
|------|--------|------|
| Touch Target Size | HIGH | Minimum 44x44px touch targets |
| Touch Spacing | MEDIUM | Minimum 8px gap between touch targets |
| Typography | MEDIUM | 12px minimum for mobile readability |
| Safe Area | MEDIUM | Account for iOS safe areas |
| Toast Position | LOW | Avoid browser chrome overlap |

### Phase 8: Assure/Detail.tsx 組件拆分重構

> ⚠️ **重要說明**：此 Phase 為大規模重構，需謹慎進行。
> 目標：解決 `Assure/Detail.tsx` Line 289-531 步驟卡片邏輯過於複雜的問題（單一 render 超過 200 行）

#### 8.1 子組件拆分計畫

| 組件名稱 | 檔案路徑 | 職責 |
|---------|---------|------|
| `<StepCard />` | `src/components/Assure/StepCard.tsx` | 步驟卡片主體容器，處理樣式狀態（past/current/future） |
| `<StepIcon />` | `src/components/Assure/StepIcon.tsx` | 步驟圖示，整合 STEP_ICONS_SVG |
| `<StepContent />` | `src/components/Assure/StepContent.tsx` | 步驟內容顯示（帶看紀錄、付款計時器等） |
| `<StepActions />` | `src/components/Assure/StepActions.tsx` | 操作按鈕區塊（送出、確認、付款） |
| `<PaymentTimer />` | `src/components/Assure/PaymentTimer.tsx` | Step 5 付款倒數計時器 |
| `<ChecklistPanel />` | `src/components/Assure/ChecklistPanel.tsx` | Step 6 交屋清單 |
| `<SupplementList />` | `src/components/Assure/SupplementList.tsx` | 補充紀錄列表 |

#### 8.2 重構步驟

- [ ] 8.2.1 建立 `src/components/Assure/` 目錄
- [ ] 8.2.2 提取 `<StepIcon />` 組件（最小依賴，先行測試）
- [ ] 8.2.3 提取 `<StepCard />` 容器組件
- [ ] 8.2.4 提取 `<StepContent />` 內容組件
- [ ] 8.2.5 提取 `<StepActions />` 操作組件
- [ ] 8.2.6 提取 `<PaymentTimer />` 付款計時器
- [ ] 8.2.7 提取 `<ChecklistPanel />` 交屋清單
- [ ] 8.2.8 提取 `<SupplementList />` 補充紀錄
- [ ] 8.2.9 更新 `Detail.tsx` 使用新組件
- [ ] 8.2.10 驗證功能正常（Mock + 正式模式）

#### 8.3 Props 設計原則

```typescript
// StepCard.tsx
interface StepCardProps {
  stepKey: string;
  step: TrustStep;
  isCurrent: boolean;
  isPast: boolean;
  isFuture: boolean;
  children: React.ReactNode;
}

// StepActions.tsx
interface StepActionsProps {
  stepKey: string;
  step: TrustStep;
  role: 'agent' | 'buyer';
  isBusy: boolean;
  onSubmit: (step: string) => void;
  onConfirm: (step: string, note?: string) => void;
}

// PaymentTimer.tsx
interface PaymentTimerProps {
  timeLeft: string;
  role: 'agent' | 'buyer';
  isBusy: boolean;
  onPay: () => void;
}
```

#### 8.4 測試策略

- [ ] 每個子組件需有獨立單元測試
- [ ] 保留 Detail.tsx 整合測試
- [ ] 重構後執行 `npm run gate` 確認品質

#### 8.5 風險控管

| 風險 | 緩解措施 |
|------|---------|
| 引入新 bug | 逐步提取，每步驗證 |
| Props drilling | 必要時使用 Context |
| 效能下降 | 使用 React.memo 優化 |
| 樣式錯亂 | 保持 Tailwind class 不變 |

#### 8.6 預估複雜度

- **總行數減少**：Detail.tsx 預計從 570 行降至 ~250 行
- **子組件總行數**：~400 行（分散在 7 個檔案）
- **可維護性提升**：每個組件職責單一，易於測試和修改

---

## 一、現況分析

### 1.1 現有問題清單

| 問題類型 | 現況 | 位置 |
|---------|------|------|
| **Emoji 圖示** | `🛡️` `⏰` `✓` `📞` `🏠` `💰` `📝` `🤝` `🔑` | `TrustRoom.tsx`, `trust.types.ts` |
| **Emoji 文字** | `📢 房仲帶看紀錄` `📝 新增補充紀錄` `👨‍💼` `👤` | `Assure/Detail.tsx` |
| **缺乏品牌一致性** | 使用 inline style，未使用 Tailwind tokens | `TrustRoom.tsx` |
| **AI 味道** | 罐頭式語句、過度正式的語氣 | 各處文案 |
| **色彩不一致** | 硬編碼 hex 值，未引用首頁深藍色系統 | `TrustRoom.tsx` COLORS 物件 |

### 1.2 品牌色彩系統（從首頁擷取）

根據 `tailwind.config.cjs` 和 `src/index.css`，MaiHouses 品牌色彩系統：

```css
/* Primary Brand - 深藍系 */
--brand: #00385a;           /* 主品牌色 */
--brand-600: #004E7C;       /* 中間藍 */
--brand-light: #009FE8;     /* 亮藍強調 */
--primary-dark: #002a44;    /* 深色背景 */

/* Text */
--text-primary: #0A2246;    /* 深色文字 */
--text-muted: #6C7B91;      /* 次要文字 */

/* Background */
--bg-base: #F6F9FF;         /* 淺藍背景 */
--bg-page: #EEF2F7;         /* 頁面背景 */
--bg-elevated: #FFFFFF;     /* 卡片白底 */

/* Semantic */
--success: #0F6A23;         /* 成功綠 */
--danger: #DC2626;          /* 危險紅 */
--border: #E6EDF7;          /* 邊框 */
```

---

## 二、設計規範 (ui-ux-pro-max)

### 2.1 字體配對

根據搜尋結果，採用 **Corporate Trust** 字體組合：

```css
/* Google Fonts Import */
@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap');

/* Tailwind Config */
fontFamily: {
  heading: ['Lexend', 'sans-serif'],
  body: ['Source Sans 3', 'sans-serif']
}
```

**選擇理由**：
- Lexend 設計用於提高可讀性，適合金融/法律服務
- Source Sans 3 中性專業，適合表單與內文
- 兩者皆有 Google Fonts 支援

### 2.2 色彩規範

採用 **B2B Service** + **Legal Services** 調色盤：

| Token | Hex | 用途 |
|-------|-----|------|
| `brand-primary` | `#00385A` | 主按鈕、標題、品牌元素 |
| `brand-secondary` | `#004E7C` | 次要按鈕、hover 狀態 |
| `brand-accent` | `#009FE8` | 連結、進度條高亮 |
| `success` | `#0F6A23` | 已完成狀態、確認徽章 |
| `warning` | `#D97706` | 即將過期提示 |
| `danger` | `#DC2626` | 錯誤、過期狀態 |
| `bg-page` | `#F6F9FF` | 頁面背景 |
| `bg-card` | `#FFFFFF` | 卡片背景 |
| `text-primary` | `#0A2246` | 主文字 |
| `text-muted` | `#6C7B91` | 次要文字 |
| `border` | `#E6EDF7` | 邊框、分隔線 |

### 2.3 SVG 圖示系統

**圖示來源**: Lucide React（已在專案中使用）

| 步驟 | 原 Emoji | 新 SVG 圖示 | Lucide 名稱 |
|------|---------|------------|-------------|
| 1 - 已電聯 | 📞 | 電話圖示 | `Phone` |
| 2 - 已帶看 | 🏠 | 房屋圖示 | `Home` |
| 3 - 已出價 | 💰 | 錢幣圖示 | `Banknote` |
| 4 - 已斡旋 | 📝 | 文件圖示 | `FileText` |
| 5 - 已成交 | 🤝 | 握手圖示 | `Handshake` |
| 6 - 已交屋 | 🔑 | 鑰匙圖示 | `Key` |
| 安心交易徽章 | 🛡️ | 盾牌圖示 | `ShieldCheck` |
| 即將過期 | ⏰ | 時鐘圖示 | `Clock` |
| 已確認 | ✓ | 勾選圖示 | `Check` |

---

## 三、元件重設計

### 3.1 TrustRoom.tsx 重構

#### A. 移除 inline styles，改用 Tailwind

```tsx
// Before (現況)
const COLORS = {
  primary: '#1749D7',
  ...
};
const styles: Record<string, React.CSSProperties> = { ... };

// After (目標)
// 完全使用 Tailwind classes，引用 tailwind.config.cjs tokens
```

#### B. 徽章元件

```tsx
// Before
<span style={styles.badge}>🛡️ 安心交易</span>

// After
<span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
  <ShieldCheck className="size-3.5" />
  安心交易
</span>
```

#### C. 步驟圖示

```tsx
// Before (trust.types.ts)
export const STEP_ICONS: Record<number, string> = {
  1: '📞',
  2: '🏠',
  ...
};

// After - 新增 SVG 圖示映射
import { Phone, Home, Banknote, FileText, Handshake, Key } from 'lucide-react';

export const STEP_ICONS_SVG: Record<number, React.ComponentType<{ className?: string }>> = {
  1: Phone,
  2: Home,
  3: Banknote,
  4: FileText,
  5: Handshake,
  6: Key,
};
```

### 3.2 Assure/Detail.tsx 重構

#### A. Header 優化

```tsx
// Before
<header className={`${isMock ? 'bg-indigo-900' : 'bg-slate-900'} ...`}>
  <h1>MaiHouses <span>DEMO</span></h1>
</header>

// After - 使用品牌色
<header className="sticky top-0 z-overlay bg-brand-700 text-white shadow-brand-lg">
  <div className="flex items-center justify-between px-4 py-3">
    <div className="flex items-center gap-2">
      <ShieldCheck className="size-5 text-brand-light" />
      <span className="font-heading text-lg font-bold">安心留痕</span>
      {isMock && (
        <span className="rounded bg-warning-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-200">
          演示模式
        </span>
      )}
    </div>
    ...
  </div>
</header>
```

#### B. 步驟卡片

```tsx
// Before - emoji 在文字中
<p className="mb-2 border-b pb-1 text-xs font-bold text-gray-500">
  📢 房仲帶看紀錄
</p>

// After - SVG 圖示
<div className="flex items-center gap-2 border-b border-border pb-2 mb-3">
  <FileText className="size-4 text-brand-600" />
  <span className="text-xs font-semibold text-text-muted">房仲帶看紀錄</span>
</div>
```

#### C. 角色徽章

```tsx
// Before
{tx.supplements.map((s, i) => (
  <span>{s.role === 'agent' ? '👨‍💼' : '👤'}</span>
))}

// After
<span className={cn(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
  s.role === 'agent'
    ? "bg-brand-50 text-brand-700"
    : "bg-emerald-50 text-emerald-700"
)}>
  {s.role === 'agent' ? <Briefcase className="size-3" /> : <User className="size-3" />}
  {s.role === 'agent' ? '房仲' : '買方'}
</span>
```

---

## 四、文案優化 - 去除 AI 味道

### 4.1 原則

1. **口語化**：使用台灣人日常說話的方式
2. **簡潔**：不要過度解釋
3. **實用**：直接說重點，不要廢話
4. **人味**：避免機器式罐頭語句

### 4.2 文案對照表

| 位置 | 原文案 (AI 味) | 新文案 (人味) |
|------|---------------|---------------|
| 標題 | 安心交易 | 交易紀錄 |
| 副標題 | 請填寫基本資料以保全交易過程全貌 | 留下聯絡方式，方便後續聯繫 |
| 隱私說明 | 此資訊僅供法律留痕使用，不會公開給房仲 | 資料只用於交易紀錄，不會外流 |
| 步驟說明 1 | 房仲已與您電話聯繫 | 房仲打來了 |
| 步驟說明 2 | 房仲已帶您實地看屋 | 看過房子了 |
| 步驟說明 3 | 您已向屋主提出價格 | 出價了 |
| 步驟說明 4 | 正在進行價格協商 | 在談價中 |
| 步驟說明 5 | 恭喜！交易已成交 | 成交了 |
| 步驟說明 6 | 完成交屋手續 | 拿到鑰匙 |
| 空狀態 | 目前未檢測到有效的登入憑證 (Token)。您可以進入演示模式來測試功能。 | 沒有找到你的交易紀錄，想先體驗看看嗎？ |
| 演示按鈕 | 啟動演示模式 (Demo Mode) | 體驗看看 |
| 提交按鈕 | 確認無誤並送出 | 確認送出 |
| 等待狀態 | 等待房仲提交... | 房仲還沒送出 |
| 補充紀錄 | 若之前的留言有誤，請在此新增補充說明。已送出的內容無法修改。 | 有話要補充？之前送出的改不了，但可以在這裡加註。 |

### 4.3 STEP_DESCRIPTIONS 更新

```typescript
// src/types/trust.types.ts

export const STEP_DESCRIPTIONS: Record<number, string> = {
  1: '房仲打來了',
  2: '看過房子了',
  3: '出價了',
  4: '在談價中',
  5: '成交了',
  6: '拿到鑰匙',
};
```

---

## 五、視覺元素規範

### 5.1 卡片樣式

```tsx
// 標準卡片
<div className="rounded-xl border border-border bg-bg-card p-4 shadow-card">
  ...
</div>

// 強調卡片（當前步驟）
<div className="rounded-xl border-2 border-brand-500 bg-brand-50/30 p-4 shadow-brand-sm ring-2 ring-brand-100">
  ...
</div>

// 完成卡片
<div className="rounded-xl border border-success/30 bg-success/5 p-4">
  ...
</div>
```

### 5.2 按鈕樣式

```tsx
// 主要按鈕
<button className="w-full rounded-xl bg-brand-700 px-4 py-3 font-semibold text-white shadow-brand-sm transition-all hover:bg-brand-600 hover:shadow-brand-md active:scale-[0.98]">
  確認送出
</button>

// 次要按鈕
<button className="w-full rounded-xl border border-border bg-white px-4 py-3 font-semibold text-text-primary transition-all hover:bg-bg-base hover:border-brand-300">
  稍後再說
</button>

// 危險按鈕
<button className="w-full rounded-xl bg-danger px-4 py-3 font-semibold text-white shadow-sm transition-all hover:bg-red-700">
  重置進度
</button>
```

### 5.3 進度條

```tsx
<div className="h-2 w-full overflow-hidden rounded-full bg-border">
  <div
    className="h-2 rounded-full bg-gradient-to-r from-brand-700 to-success transition-all duration-500"
    style={{ width: `${(currentStep / 6) * 100}%` }}
  />
</div>
```

### 5.4 徽章樣式

```tsx
// 品牌徽章
<span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 border border-brand-100">
  <ShieldCheck className="size-3.5" />
  交易紀錄
</span>

// 狀態徽章 - 進行中
<span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-medium text-brand-700">
  進行中
</span>

// 狀態徽章 - 已完成
<span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
  <Check className="size-3" />
  已確認
</span>

// 警告徽章
<span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-200">
  <Clock className="size-3" />
  3 天後到期
</span>
```

---

## 六、MaiMai 吉祥物整合規格

### 6.1 設計理念：極簡存在感

MaiMai 在 Trust Room 中的角色是「無聲陪伴者」，不主動干擾使用者，只在關鍵時刻給予視覺回饋。

**核心原則**：
- 不說話、不彈窗、不搶注意力
- 只用表情和動作傳達情感
- 出現短暫、消失自然

### 6.2 觸發時機與表情

| 時機 | 表情 | 動作 | 持續時間 |
|------|------|------|---------|
| 首次進入頁面 | `wave` | 從右下角滑入，揮手打招呼 | 3 秒後淡出 |
| 完成步驟確認 | `happy` | 原地跳躍一下 | 1.5 秒後回到 idle |
| 全部 6 步完成 | `celebrate` | 跳躍 + 放煙火 (confetti) | 3 秒 |
| API 錯誤發生 | `shy` | 縮小 + 微微顫抖 | 顯示到錯誤消失 |
| 長時間閒置 (>30s) | `idle` | 偶爾眨眼 | 持續 |

### 6.3 位置與尺寸

```css
/* 桌面版 */
.maimai-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 80px;
  height: 80px;
  z-index: 50;
  pointer-events: none; /* 不干擾點擊 */
}

/* 手機版 */
@media (max-width: 640px) {
  .maimai-container {
    bottom: 16px;
    right: 16px;
    width: 56px;
    height: 56px;
  }
}
```

### 6.4 動畫規格

```typescript
// useTrustRoomMaiMai Hook
interface TrustRoomMaiMaiState {
  visible: boolean;
  mood: MaiMaiMood;
  showConfetti: boolean;
}

const ANIMATION_CONFIG = {
  fadeInDuration: 300,      // ms
  fadeOutDuration: 500,     // ms
  waveDisplayTime: 3000,    // 首次進入揮手時間
  happyDisplayTime: 1500,   // 確認步驟開心時間
  celebrateDuration: 3000,  // 慶祝動畫時間
};
```

### 6.5 效能考量

- **Lazy Load**: MaiMai SVG 組件使用 `React.lazy()` 延遲載入
- **RAF**: 動畫使用 `requestAnimationFrame` 而非 `setInterval`
- **條件渲染**: 只在需要時 render MaiMai 組件
- **GPU 加速**: 使用 `transform` 和 `opacity` 觸發 GPU 合成

### 6.6 整合方式

```tsx
// src/pages/TrustRoom.tsx
import { useTrustRoomMaiMai } from '../hooks/useTrustRoomMaiMai';
import { MaiMaiBase } from '../components/MaiMai';

export default function TrustRoom() {
  const { maiMaiState, triggerHappy, triggerCelebrate } = useTrustRoomMaiMai();

  const handleConfirm = async (stepNum: number) => {
    // ... 原本的確認邏輯
    if (result?.success) {
      const allDone = checkAllStepsDone();
      if (allDone) {
        triggerCelebrate();
      } else {
        triggerHappy();
      }
    }
  };

  return (
    <div>
      {/* 主要內容 */}

      {/* MaiMai 吉祥物 */}
      {maiMaiState.visible && (
        <div className="fixed bottom-6 right-6 z-50 pointer-events-none sm:bottom-4 sm:right-4">
          <MaiMaiBase
            mood={maiMaiState.mood}
            size={80}
            className="sm:size-14"
          />
          {maiMaiState.showConfetti && <Confetti />}
        </div>
      )}
    </div>
  );
}
```

---

## 七、實作檔案清單

### 需修改的檔案

| 檔案 | 修改內容 |
|------|---------|
| `src/types/trust.types.ts` | 移除 STEP_ICONS emoji，新增 STEP_ICONS_SVG，更新 STEP_DESCRIPTIONS 文案 |
| `src/pages/TrustRoom.tsx` | 完全重構，移除 inline styles，改用 Tailwind tokens，整合 MaiMai |
| `src/pages/Assure/Detail.tsx` | 移除所有 emoji，使用 Lucide icons，優化文案 |
| `src/components/TrustRoom/DataCollectionModal.tsx` | 更新文案去除 AI 味，微調樣式 |
| `tailwind.config.cjs` | 確認 tokens 完整性（已足夠） |
| `src/index.css` | 如需新增字體則更新 |

### 新增的檔案

| 檔案 | 用途 |
|------|------|
| `src/hooks/useTrustRoomMaiMai.ts` | MaiMai 狀態管理 Hook |

---

## 八、驗收標準

### 8.1 視覺驗收

- [ ] 所有 emoji 已被 SVG 圖示取代
- [ ] 色彩使用與首頁一致（深藍色系）
- [ ] 卡片、按鈕、徽章樣式符合規範
- [ ] 進度條漸層正確顯示
- [ ] 響應式設計在手機/桌面皆正常

### 8.2 文案驗收

- [ ] 所有文案已更新為口語化版本
- [ ] 無「恭喜」「您」等 AI 味詞彙
- [ ] 訊息簡潔直接，無廢話

### 8.3 功能驗收

- [ ] Mock 模式正常運作
- [ ] 正式模式（有 token）正常運作
- [ ] 步驟確認流程正常
- [ ] DataCollectionModal 正常彈出與提交

### 8.4 MaiMai 驗收

- [ ] 首次進入：wave 表情正確顯示並 3 秒後淡出
- [ ] 步驟確認：happy 表情正確觸發 1.5 秒
- [ ] 全部完成：celebrate + confetti 動畫正常
- [ ] 錯誤狀態：shy 表情正確顯示
- [ ] 手機版：尺寸適當（56px），位置正確
- [ ] 不遮擋：pointer-events: none，不影響互動
- [ ] 效能：無明顯卡頓，動畫流暢

### 8.5 程式碼品質

- [ ] 無 TypeScript 錯誤
- [ ] 無 ESLint 警告
- [ ] 無 inline styles（全部改用 Tailwind）
- [ ] 無硬編碼 hex 值

---

## 九、時程建議

| 階段 | 工作項目 | 複雜度 |
|------|---------|--------|
| Phase 1 | 更新 `trust.types.ts` 的圖示與文案 | 低 |
| Phase 2 | 重構 `TrustRoom.tsx`（inline styles → Tailwind） | 高 |
| Phase 3 | 優化 `Assure/Detail.tsx` emoji 與文案 | 中 |
| Phase 4 | 微調 `DataCollectionModal.tsx` 文案 | 低 |
| Phase 5 | 整合測試與視覺 QA | 中 |
| Phase 6 | MaiMai 吉祥物整合 | 中 |

---

## 十、附錄：SVG 圖示參考

所有圖示皆來自 Lucide React（MIT License），已在專案中安裝。

```tsx
import {
  Phone,        // 電聯
  Home,         // 帶看
  Banknote,     // 出價
  FileText,     // 斡旋
  Handshake,    // 成交
  Key,          // 交屋
  ShieldCheck,  // 安心徽章
  Clock,        // 時間/過期
  Check,        // 確認勾選
  User,         // 買方
  Briefcase,    // 房仲
  AlertCircle,  // 警告
  RotateCcw,    // 重置
  Zap,          // 演示模式
} from 'lucide-react';
```

---

**文件結束**
待確認後開始實作。
