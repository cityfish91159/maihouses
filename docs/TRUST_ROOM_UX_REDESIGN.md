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
- [ ] 2.1 移除 `COLORS` 物件（硬編碼 hex）
- [ ] 2.2 移除 `styles` 物件（inline styles）
- [ ] 2.3 改用 Tailwind classes + tokens
- [ ] 2.4 替換 `🛡️ 安心交易` 徽章為 `ShieldCheck` SVG
- [ ] 2.5 替換 `⏰` 過期提示為 `Clock` SVG
- [ ] 2.6 替換 `✓` 確認圖示為 `Check` SVG
- [ ] 2.7 替換步驟數字圖示為對應 SVG
- [ ] 2.8 更新進度條樣式（深藍漸層）
- [ ] 2.9 更新卡片樣式（brand tokens）
- [ ] 2.10 更新按鈕樣式
- [ ] 2.11 更新 Toast 訊息樣式

### Phase 3: Assure/Detail.tsx 優化
- [ ] 3.1 更新 Header 色彩為品牌深藍
- [ ] 3.2 移除 `📢` emoji（房仲帶看紀錄）
- [ ] 3.3 移除 `📝` emoji（新增補充紀錄）
- [ ] 3.4 移除 `👨‍💼` `👤` emoji（角色標示）
- [ ] 3.5 替換角色圖示為 `Briefcase` / `User` SVG
- [ ] 3.6 更新空狀態文案（去 AI 味）
- [ ] 3.7 更新演示模式按鈕文案
- [ ] 3.8 更新各步驟操作文案
- [ ] 3.9 統一卡片樣式為 brand tokens

### Phase 4: DataCollectionModal.tsx 微調
- [ ] 4.1 更新標題文案（去 AI 味）
- [ ] 4.2 更新隱私說明文案
- [ ] 4.3 更新按鈕文案
- [ ] 4.4 確認 SVG 圖示已使用（已有 Lucide）

### Phase 5: 整合驗證
- [ ] 5.1 `npm run typecheck` 通過
- [ ] 5.2 `npm run lint` 通過
- [ ] 5.3 Mock 模式功能正常
- [ ] 5.4 正式模式功能正常
- [ ] 5.5 手機版響應式正常
- [ ] 5.6 桌面版響應式正常
- [ ] 5.7 無任何 emoji 殘留
- [ ] 5.8 無任何 inline styles 殘留
- [ ] 5.9 無任何硬編碼 hex 值

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

## 六、實作檔案清單

### 需修改的檔案

| 檔案 | 修改內容 |
|------|---------|
| `src/types/trust.types.ts` | 移除 STEP_ICONS emoji，新增 STEP_ICONS_SVG，更新 STEP_DESCRIPTIONS 文案 |
| `src/pages/TrustRoom.tsx` | 完全重構，移除 inline styles，改用 Tailwind tokens |
| `src/pages/Assure/Detail.tsx` | 移除所有 emoji，使用 Lucide icons，優化文案 |
| `src/components/TrustRoom/DataCollectionModal.tsx` | 更新文案去除 AI 味，微調樣式 |
| `tailwind.config.cjs` | 確認 tokens 完整性（已足夠） |
| `src/index.css` | 如需新增字體則更新 |

### 新增的檔案

無需新增檔案，所有變更在現有檔案內完成。

---

## 七、驗收標準

### 7.1 視覺驗收

- [ ] 所有 emoji 已被 SVG 圖示取代
- [ ] 色彩使用與首頁一致（深藍色系）
- [ ] 卡片、按鈕、徽章樣式符合規範
- [ ] 進度條漸層正確顯示
- [ ] 響應式設計在手機/桌面皆正常

### 7.2 文案驗收

- [ ] 所有文案已更新為口語化版本
- [ ] 無「恭喜」「您」等 AI 味詞彙
- [ ] 訊息簡潔直接，無廢話

### 7.3 功能驗收

- [ ] Mock 模式正常運作
- [ ] 正式模式（有 token）正常運作
- [ ] 步驟確認流程正常
- [ ] DataCollectionModal 正常彈出與提交

### 7.4 程式碼品質

- [ ] 無 TypeScript 錯誤
- [ ] 無 ESLint 警告
- [ ] 無 inline styles（全部改用 Tailwind）
- [ ] 無硬編碼 hex 值

---

## 八、時程建議

| 階段 | 工作項目 | 複雜度 |
|------|---------|--------|
| Phase 1 | 更新 `trust.types.ts` 的圖示與文案 | 低 |
| Phase 2 | 重構 `TrustRoom.tsx`（inline styles → Tailwind） | 高 |
| Phase 3 | 優化 `Assure/Detail.tsx` emoji 與文案 | 中 |
| Phase 4 | 微調 `DataCollectionModal.tsx` 文案 | 低 |
| Phase 5 | 整合測試與視覺 QA | 中 |

---

## 九、附錄：SVG 圖示參考

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
