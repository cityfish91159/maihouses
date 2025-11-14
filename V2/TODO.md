# 邁房子首頁 CSS 重構代辦事項

## 📋 狀態說明
- ✅ 已完成
- 🔲 待執行
- ⏸️ 暫停等待確認

---

## 第一階段：設計系統建立

### 🔲 Task 1.1：建立 CSS 變數系統 (Design Tokens)
**檔案：** `/main.css`

#### 1.1.1 色彩系統
```css
:root {
  /* 品牌色 - 核心 */
  --brand-primary: #1749D7;
  --brand-primary-light: #6aa4ff;
  --brand-primary-dark: #0d3399;
  --brand-primary-rgb: 23, 73, 215;  /* 新增：用於 rgba */
  
  /* 中性色 - 避免純黑/白 */
  --neutral-50: #f6f9ff;      /* 背景 */
  --neutral-100: #e8f1ff;     /* 次層背景 */
  --neutral-200: #d1e3ff;     /* 邊框 */
  --neutral-700: #2d3748;     /* 次要文字 */
  --neutral-900: #0a2246;     /* 主文字 */
  
  /* 語義色 - 按需使用 */
  --success: #22c55e;
  --success-rgb: 34, 197, 94;
  --warning: #fb923c;
  --warning-rgb: 251, 146, 60;
  --info: #9333ea;
  --info-rgb: 147, 51, 234;
}
```

**改善點：**
- 原始：直接使用 `#1A5FDB`, `#6aa4ff` 等散亂值
- 新版：統一變數管理，增加 RGB 版本用於透明度

---

#### 1.1.2 字型系統
```css
:root {
  /* Typography Scale */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
  
  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-bold: 700;
  --font-black: 900;
  
  /* Line Heights */
  --leading-tight: 1.2;
  --leading-snug: 1.3;
  --leading-normal: 1.4;
  --leading-relaxed: 1.6;
  
  /* Letter Spacing */
  --tracking-tight: -0.01em;
  --tracking-normal: 0;
}
```

**改善點：**
- 原始：`font-size: 20px !important`
- 新版：`font-size: var(--text-xl)`

---

#### 1.1.3 間距系統 (8px Grid)
```css
:root {
  /* Spacing Scale (8px grid) */
  --space-0: 0;
  --space-1: 0.5rem;   /* 8px */
  --space-2: 1rem;     /* 16px */
  --space-3: 1.5rem;   /* 24px */
  --space-4: 2rem;     /* 32px */
  --space-5: 2.5rem;   /* 40px */
  --space-6: 3rem;     /* 48px */
  --space-8: 4rem;     /* 64px */
}
```

**改善點：**
- 原始：`padding: 14px 18px !important`
- 新版：`padding: var(--space-3) var(--space-4)`

---

#### 1.1.4 陰影系統
```css
:root {
  /* Shadows */
  --shadow-none: none;
  --shadow-sm: 0 1px 2px rgba(10, 34, 70, 0.05);
  --shadow-md: 0 4px 6px rgba(10, 34, 70, 0.07), 0 2px 4px rgba(10, 34, 70, 0.06);
  --shadow-lg: 0 10px 15px rgba(10, 34, 70, 0.1), 0 4px 6px rgba(10, 34, 70, 0.05);
  --shadow-neumorphic: 10px 10px 24px rgba(9, 15, 30, 0.18), 
                       -10px -10px 24px rgba(255, 255, 255, 0.9);
  --shadow-neumorphic-hover: 12px 12px 28px rgba(9, 15, 30, 0.22), 
                             -12px -12px 28px rgba(255, 255, 255, 0.95);
}
```

**改善點：**
- 原始：每個元件重複定義複雜 `box-shadow`
- 新版：統一管理，複用變數

---

#### 1.1.5 圓角系統
```css
:root {
  /* Border Radius */
  --radius-none: 0;
  --radius-sm: 0.375rem;  /* 6px */
  --radius-md: 0.5rem;    /* 8px */
  --radius-lg: 0.75rem;   /* 12px */
  --radius-xl: 1rem;      /* 16px */
  --radius-2xl: 1.5rem;   /* 24px */
  --radius-full: 9999px;
}
```

---

#### 1.1.6 過渡效果
```css
:root {
  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-bounce: 350ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

---

### 🔲 Task 1.2：響應式斷點統一管理
```css
/* 集中管理斷點 */
@custom-media --mobile (max-width: 767px);
@custom-media --tablet (min-width: 768px);
@custom-media --desktop (min-width: 1024px);
@custom-media --wide (min-width: 1440px);

/* 或使用標準 @media */
@media (min-width: 768px) {
  :root {
    --text-xl: 1.375rem;   /* 22px */
    --text-2xl: 1.75rem;   /* 28px */
  }
}

@media (min-width: 1024px) {
  :root {
    --text-2xl: 2rem;      /* 32px */
    --text-3xl: 2.25rem;   /* 36px */
  }
}
```

---

## 第二階段：動畫系統重構

### 🔲 Task 2.1：統一動畫命名規則
**原則：** 使用 `mh-` 前綴避免衝突

```css
/* 原始版本 */
@keyframes heroBounce { ... }
@keyframes shine { ... }
@keyframes gradientFlow { ... }
@keyframes cardPop { ... }
@keyframes dotPulse { ... }

/* 新版本 - 加上前綴 */
@keyframes mh-hero-bounce { ... }
@keyframes mh-shine { ... }
@keyframes mh-gradient-flow { ... }
@keyframes mh-card-pop { ... }
@keyframes mh-dot-pulse { ... }
```

### 🔲 Task 2.2：動畫集中管理區塊
```css
/* ========================================
   Animations - 動畫定義區
   ======================================== */

@keyframes mh-fade-in-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes mh-scale-in {
  from {
    opacity: 0;
    transform: scale(0.92);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes mh-gradient-shift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes mh-icon-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}
```

---

## 第三階段：元件選擇器重構 (BEM 風格)

### 🔲 Task 3.1：Hero 標語區重構

**原始版本：**
```css
.marquee-container { ... }
.marquee-container::before { ... }
.marquee-container .brand-highlight { ... }
```

**新版本：**
```css
/* Hero Tagline Component */
.hero-tagline {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  letter-spacing: var(--tracking-tight);
  line-height: var(--leading-normal);
  padding: var(--space-3) var(--space-2);
  animation: mh-fade-in-up 0.6s var(--transition-bounce) both;
}

.hero-tagline::before {
  /* 微光效果 */
  animation: mh-shine 2.5s 0.3s ease-in-out;
}

.hero-tagline__brand {
  background: linear-gradient(
    135deg, 
    var(--brand-primary) 0%, 
    var(--brand-primary-light) 50%, 
    var(--brand-primary) 100%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: var(--font-black);
  animation: mh-gradient-shift 3s ease-in-out infinite;
}

/* 響應式 */
@media (min-width: 768px) {
  .hero-tagline {
    font-size: var(--text-2xl);
    padding: var(--space-4) var(--space-3);
  }
}

@media (min-width: 1024px) {
  .hero-tagline {
    font-size: var(--text-3xl);
    padding: var(--space-5) var(--space-4);
  }
}

@media (min-width: 1440px) {
  .hero-tagline {
    font-size: var(--text-4xl);
    padding: var(--space-6) var(--space-5);
  }
}
```

**React 組件對應修改：**
```tsx
// 原始
<div className="marquee-container">
  邁向理想的家，<span className="brand-highlight">邁房子</span>陪你每一步
</div>

// 新版
<div className="hero-tagline">
  邁向理想的家，<span className="hero-tagline__brand">邁房子</span>陪你每一步
</div>
```

---

### 🔲 Task 3.2：Assurance Card 重構

**原始版本：**
```css
.hero-assure-card { ... }
.hero-assure-card .info { ... }
.hero-assure-card .chip { ... }
```

**新版本：**
```css
/* Assurance Card Component */
.assurance-card {
  background: #ffffff;
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  box-shadow: var(--shadow-neumorphic);
  border: 1px solid rgba(var(--brand-primary-rgb), 0.08);
  animation: mh-scale-in 0.5s var(--transition-bounce) 0.2s both;
}

.assurance-card__header {
  margin-bottom: var(--space-3);
}

.assurance-card__title {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--neutral-900);
  margin-bottom: var(--space-2);
}

.assurance-card__subtitle {
  font-size: var(--text-sm);
  color: var(--neutral-700);
  font-weight: var(--font-normal);
}

.assurance-card__info {
  background: linear-gradient(135deg, var(--neutral-100), var(--neutral-200));
  border: 2px dashed rgba(var(--brand-primary-rgb), 0.4);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  font-size: var(--text-sm);
  color: var(--neutral-700);
  box-shadow: var(--shadow-sm);
}

.assurance-card__tags {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  margin-top: var(--space-2);
}

.assurance-card__tag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-full);
  border: 2px solid var(--brand-primary);
  background: #ffffff;
  color: var(--brand-primary);
  box-shadow: 0 2px 6px rgba(var(--brand-primary-rgb), 0.15);
  transition: all var(--transition-base);
}

.assurance-card__tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--brand-primary-rgb), 0.25);
}
```

**React 組件對應修改：**
```tsx
// 原始
<div className="hero-assure-card">
  <div className="info">...</div>
  <div className="chip">...</div>
</div>

// 新版
<div className="assurance-card">
  <div className="assurance-card__header">
    <h3 className="assurance-card__title">...</h3>
    <p className="assurance-card__subtitle">...</p>
  </div>
  <div className="assurance-card__info">...</div>
  <div className="assurance-card__tags">
    <span className="assurance-card__tag">...</span>
  </div>
</div>
```

---

### 🔲 Task 3.3：Filter Pills 重構

**原始版本：**
```css
.filter-pills .pill { ... }
.pill-community { ... }
.pill-location { ... }
.pill-transit { ... }
```

**新版本：**
```css
/* Filter Pills Component */
.filter-group {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  padding: var(--space-3);
}

.filter-pill {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-lg);
  background: #ffffff;
  color: var(--neutral-900);
  border: 1px solid rgba(10, 34, 70, 0.08);
  box-shadow: var(--shadow-neumorphic);
  cursor: pointer;
  transition: all var(--transition-bounce);
}

.filter-pill:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-neumorphic-hover);
}

.filter-pill__icon {
  width: 1.25rem;
  height: 1.25rem;
  animation: mh-icon-pulse 3s ease-in-out infinite;
}

/* Variants - 使用 CSS 變數實現主題色 */
.filter-pill--community {
  --pill-color: var(--success);
  --pill-color-rgb: var(--success-rgb);
}

.filter-pill--location {
  --pill-color: var(--warning);
  --pill-color-rgb: var(--warning-rgb);
}

.filter-pill--transit {
  --pill-color: var(--info);
  --pill-color-rgb: var(--info-rgb);
}

/* 統一 hover 樣式 */
.filter-pill--community:hover,
.filter-pill--location:hover,
.filter-pill--transit:hover {
  border-color: var(--pill-color);
  box-shadow: 
    var(--shadow-neumorphic-hover),
    0 0 0 2px rgba(var(--pill-color-rgb), 0.3);
}

.filter-pill--community .filter-pill__icon {
  color: var(--pill-color);
}

.filter-pill--location .filter-pill__icon {
  color: var(--pill-color);
  animation-delay: 1s;
}

.filter-pill--transit .filter-pill__icon {
  color: var(--pill-color);
  animation-delay: 2s;
}

/* 響應式 */
@media (min-width: 768px) {
  .filter-pill {
    font-size: var(--text-base);
    padding: var(--space-3) var(--space-4);
  }
}
```

**React 組件對應修改：**
```tsx
// 原始
<div className="filter-pills">
  <button className="pill pill-community">
    <span className="pill-icon">🏘️</span>
    社區評價
  </button>
  <button className="pill pill-location">...</button>
  <button className="pill pill-transit">...</button>
</div>

// 新版
<div className="filter-group">
  <button className="filter-pill filter-pill--community">
    <span className="filter-pill__icon">🏘️</span>
    社區評價
  </button>
  <button className="filter-pill filter-pill--location">...</button>
  <button className="filter-pill filter-pill--transit">...</button>
</div>
```

---

## 第四階段：移除 !important

### 🔲 Task 4.1：提高選擇器優先級替代 !important

**原始版本：**
```css
.marquee-container {
  font-size: 20px !important;
  font-weight: 600 !important;
  letter-spacing: -0.01em !important;
}
```

**新版本（方案 A - 提高優先級）：**
```css
body .hero-tagline {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  letter-spacing: var(--tracking-tight);
}
```

**新版本（方案 B - ID 選擇器）：**
```css
#root .hero-tagline {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  letter-spacing: var(--tracking-tight);
}
```

**新版本（方案 C - 重複選擇器）：**
```css
.hero-tagline.hero-tagline {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  letter-spacing: var(--tracking-tight);
}
```

---

### 🔲 Task 4.2：列出所有需要移除 !important 的地方

**清單：**
1. `.hero-tagline` - font-size, font-weight, letter-spacing, line-height
2. `.hero-tagline` (平板) - font-size, padding
3. `.hero-tagline` (桌機) - font-size, padding
4. `.hero-tagline` (超寬) - font-size, padding
5. `.assurance-card` - box-shadow, border
6. `.assurance-card__info` - border, background, padding, box-shadow
7. `.assurance-card__tag` - font-size, padding, font-weight, border, box-shadow
8. `.filter-pill` - padding, font-size, box-shadow
9. `.filter-pill:hover` - transform, box-shadow, transition
10. `.filter-pill--*:hover` - box-shadow (3個變體)

---

## 第五階段：檔案結構優化

### 🔲 Task 5.1：CSS 檔案分層
```
/styles/
  ├── main.css                  # 主要入口（引入所有檔案）
  ├── design-tokens.css         # 設計變數
  ├── base.css                  # 基礎樣式
  ├── animations.css            # 動畫定義
  └── components/
      ├── hero.css              # Hero 區塊
      ├── assurance-card.css    # 安心流程卡
      └── filter-pills.css      # 搜尋按鈕組
```

**或單一檔案版本（推薦）：**
```
/main.css                       # 所有樣式集中在此
```

---

### 🔲 Task 5.2：index.html 優化
```html
<!doctype html>
<html lang="zh-Hant-TW">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light only" />
    <meta name="theme-color" content="#ffffff" />
    
    <!-- DNS 預解析與預連線優化 -->
    <link rel="preconnect" href="https://api.openai.com" crossorigin />
    <link rel="dns-prefetch" href="https://api.openai.com" />
    
    <!-- Google Fonts - 優化載入 -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap" rel="stylesheet" />
    
    <!-- 主要樣式表 - 關鍵 CSS 可考慮內聯 -->
    <link rel="stylesheet" href="/main.css" />
    
    <title>邁房子｜讓家,不只是地址</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## 第六階段：React 組件對應修改

### 🔲 Task 6.1：更新 Hero 組件
```tsx
// 檔案：src/components/Hero.tsx

export function Hero() {
  return (
    <div className="hero-tagline">
      邁向理想的家，
      <span className="hero-tagline__brand">邁房子</span>
      陪你每一步
    </div>
  );
}
```

---

### 🔲 Task 6.2：更新 AssuranceCard 組件
```tsx
// 檔案：src/components/AssuranceCard.tsx

export function AssuranceCard() {
  return (
    <div className="assurance-card">
      <div className="assurance-card__header">
        <h3 className="assurance-card__title">安心流程</h3>
        <p className="assurance-card__subtitle">三步驟找到理想的家</p>
      </div>
      
      <div className="assurance-card__info">
        提供完整的物件資訊與社區評價
      </div>
      
      <div className="assurance-card__tags">
        <span className="assurance-card__tag">實價登錄</span>
        <span className="assurance-card__tag">社區評分</span>
      </div>
    </div>
  );
}
```

---

### 🔲 Task 6.3：更新 FilterPills 組件
```tsx
// 檔案：src/components/FilterPills.tsx

export function FilterPills() {
  return (
    <div className="filter-group">
      <button className="filter-pill filter-pill--community">
        <span className="filter-pill__icon">🏘️</span>
        社區評價
      </button>
      
      <button className="filter-pill filter-pill--location">
        <span className="filter-pill__icon">📍</span>
        地段分析
      </button>
      
      <button className="filter-pill filter-pill--transit">
        <span className="filter-pill__icon">🚇</span>
        交通評估
      </button>
    </div>
  );
}
```

---

## 第九階段：CSS 維護性與擴展性優化

### 🔲 Task 9.1：變數命名統一化
**問題：** 混用 `--brand` 和 `--brand-primary`

**解決：**
```css
:root {
  /* 統一使用完整語意命名 */
  --brand-primary: #1A5FDB;
  --brand-secondary: #6aa4ff;
  --brand-dark: #0d3399;
  
  /* 淺色系統化 */
  --neutral-50: #f6f9ff;   /* 最淺背景 */
  --neutral-100: #f0f5ff;  /* 新增：info 區起點 */
  --neutral-150: #e8f1ff;  /* 現有 */
  --neutral-200: #d1e3ff;  /* 現有 */
}
```

---

### 🔲 Task 9.2：BEM 命名持續完善
**改進方向：**
- `.tag` → `.assurance-card__tag`（避免全局污染）
- `.brand-name` → `.hero-tagline__brand`（語意更清晰）

**範例：**
```css
/* ❌ 過於通用 */
.tag { ... }

/* ✅ 明確作用域 */
.assurance-card__tag { ... }
```

---

### 🔲 Task 9.3：首頁專屬樣式隔離
**策略 A：Body 標識**
```html
<body class="page-home" data-page="home">
```

```css
/* 首頁專用增強 */
.page-home .assurance-card {
  box-shadow: var(--shadow-neumorphic-enhanced);
}
```

**策略 B：Modifier 類**
```css
.assurance-card--home {
  /* 首頁專用增強樣式 */
}
```

---

### 🔲 Task 9.4：移除 !important 依賴
**替代方案：**

**方案 A：提高選擇器優先級**
```css
/* ❌ 原本 */
.filter-pill { font-size: 15px !important; }

/* ✅ 改進 */
body .filter-pill { font-size: 15px; }
```

**方案 B：CSS 變數覆寫**
```css
:root { --pill-font-size: 14px; }
.page-home { --pill-font-size: 15px; }

.filter-pill { font-size: var(--pill-font-size); }
```

---

### 🔲 Task 9.5：樣式作用域管理
**檔案結構建議：**
```
/styles/
  ├── design-tokens.css    # 設計變數（全局）
  ├── base.css             # 基礎樣式（全局）
  ├── animations.css       # 動畫定義（全局）
  └── pages/
      ├── home.css         # 首頁專用樣式
      └── ...
```

**或單一檔案 + 註釋區隔：**
```css
/* ========================================
   HOME PAGE SPECIFIC STYLES
   ======================================== */
.page-home .hero-tagline { ... }
```

---

### 🔲 Task 9.6：CSS 風格指南建立
**必須包含：**
1. **命名規範**：BEM 風格，使用 `block__element--modifier`
2. **縮進**：2 空格
3. **註釋格式**：區塊級註釋使用 `/* === */`，行內註釋使用 `/* ... */`
4. **變數使用**：優先使用設計變數，避免魔術數字
5. **選擇器優先級**：避免 `!important`，使用明確選擇器
6. **響應式**：Mobile-first，由小到大
7. **動畫規範**：命名加 `mh-` 前綴，時長 <500ms

**範例文件：**
```markdown
# 邁房子 CSS 風格指南

## 命名規範
- Block: `.hero-tagline`
- Element: `.hero-tagline__brand`
- Modifier: `.filter-pill--community`

## 變數使用
- 顏色必須使用 `--brand-*` 或 `--neutral-*`
- 間距必須使用 `--space-*`
- 字體必須使用 `--text-*` 和 `--font-*`

## 禁止事項
- ❌ 使用 `!important`（除非有充分理由）
- ❌ 硬編碼顏色值（如 `#1A5FDB`）
- ❌ 使用像素單位（優先 `rem`/`em`）
- ❌ 過於通用的類名（如 `.tag`、`.icon`）
```

---

## 第十階段：最終整合與測試

### ✅ 已完成項目
- [x] 創建 `/main.css` 基礎檔案
- [x] 創建 `/index.html` 優化版本

### 🔲 待執行項目（按優先級排序）

**高優先級（核心功能）**
- [ ] Task 1.1：建立完整 CSS 變數系統（色彩、字型、間距、陰影、圓角、過渡）
- [ ] Task 2.1：統一動畫命名規則（加 `mh-` 前綴）
- [ ] Task 3.1：Hero 標語區重構（BEM 命名）
- [ ] Task 3.2：Assurance Card 重構（BEM 命名）
- [ ] Task 3.3：Filter Pills 重構（BEM 命名）

**中優先級（代碼品質）**
- [ ] Task 4.1：移除所有 !important
- [ ] Task 4.2：提高選擇器優先級替代
- [ ] Task 1.2：響應式斷點統一管理
- [ ] Task 2.2：動畫集中管理區塊

**低優先級（可選優化）**
- [ ] Task 5.1：CSS 檔案分層（如果需要模組化）
- [ ] Task 6.1：更新 React Hero 組件
- [ ] Task 6.2：更新 React AssuranceCard 組件
- [ ] Task 6.3：更新 React FilterPills 組件

---

## 第七階段：精確外觀匹配（基於比對分析）

### 🔲 Task 7.1：Hero 標語區精確修正

**字重修正：**
```css
.hero-tagline {
  font-weight: 600; /* 從 700 改為 600 */
}
```

**字體大小精確匹配：**
```css
/* 手機：20px ✓ 已正確 */
@media (min-width: 768px) {
  .hero-tagline { font-size: 1.5rem; } /* 24px ✓ */
}
@media (min-width: 1024px) {
  .hero-tagline { font-size: 1.75rem; } /* 28px（從 30px 降低） */
}
@media (min-width: 1440px) {
  .hero-tagline { font-size: 1.875rem; } /* 30px（從 36px 降低） */
}
```

**內距緊湊化：**
```css
.hero-tagline {
  padding: var(--space-3) var(--space-2); /* 手機 24px/16px ✓ */
}
@media (min-width: 768px) {
  .hero-tagline { padding: 0.875rem 1.125rem; } /* 14px/18px */
}
@media (min-width: 1024px) {
  .hero-tagline { padding: 1rem 1.25rem; } /* 16px/20px */
}
@media (min-width: 1440px) {
  .hero-tagline { padding: 1.125rem 1.375rem; } /* 18px/22px */
}
```

**品牌色統一：**
```css
:root {
  --brand-primary: #1A5FDB; /* 從 #1749D7 改為 #1A5FDB */
  --brand-primary-rgb: 26, 95, 219; /* 對應 RGB */
}
```

**動畫替換 - heroBounce：**
```css
.hero-tagline {
  animation: heroBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  /* 替換原本的 fadeInUp */
}

@keyframes heroBounce {
  0% { 
    transform: translateY(20px) scale(0.95); 
    opacity: 0; 
  }
  60% {
    transform: translateY(-4px) scale(1.01);
    opacity: 1;
  }
  80% {
    transform: translateY(2px) scale(0.99);
  }
  100% { 
    transform: none; 
    opacity: 1; 
  }
}
```

**微光掃過效果：**
```css
.hero-tagline::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shine 2.5s 0.3s ease-in-out;
  pointer-events: none;
}

@keyframes shine {
  0% { left: -100%; }
  100% { left: 100%; }
}
```

**品牌名樣式完善：**
```css
.hero-tagline .brand-name {
  display: inline-block; /* 新增 */
  transform-origin: center; /* 新增 */
}
```

---

### 🔲 Task 7.2：Assurance Card 精確修正

**邊框加粗：**
```css
.assurance-card {
  border: 1.5px solid rgba(26, 95, 219, 0.08); /* 從 1px 改為 1.5px */
}
```

**陰影加強（藍色光暈）：**
```css
:root {
  --shadow-neumorphic: 
    10px 10px 30px rgba(9, 15, 30, 0.22),    /* 深色加深到 0.22 */
    -10px -10px 30px rgba(255, 255, 255, 0.95),
    0 8px 24px rgba(26, 95, 219, 0.12);      /* 新增藍色光暈 */
}
```

**內距調整（可選）：**
```css
.assurance-card {
  padding: var(--space-3); /* 24px，如果原本更緊湊則改為 var(--space-3) */
}
```

**Info 提示區精確匹配：**
```css
.assurance-card__info {
  background: linear-gradient(135deg, #f0f5ff, #e8f1ff); /* 更淺的起點 */
  border: 2px dashed rgba(26, 95, 219, 0.6); /* 透明度從 0.4 提高到 0.6 */
  padding: 0.875rem 1rem; /* 14px/16px，從 24px 縮減 */
  box-shadow: 0 2px 8px rgba(26, 95, 219, 0.06); /* 加強陰影 */
}
```

**膠囊標籤精確尺寸：**
```css
.tag {
  font-size: 0.8125rem; /* 13px，從 12px 放大 */
  padding: 0.375rem 0.75rem; /* 6px/12px ✓ */
}
```

**移除 Tag hover（如果原本沒有）：**
```css
/* 刪除或註釋掉 */
/* .tag:hover { ... } */
```

---

### 🔲 Task 7.3：Filter Pills 精確修正

**手機端尺寸放大：**
```css
.filter-pill {
  font-size: 0.9375rem; /* 15px，從 14px 放大 */
  padding: 1.3125rem var(--space-3); /* 21px 上下，從 16px 增加 */
}
```

**桌機端不過度放大：**
```css
@media (min-width: 768px) {
  .filter-pill {
    font-size: 0.9375rem; /* 保持 15px，不變成 16px */
    padding: 1.3125rem var(--space-3); /* 保持 21px，不變成 24px */
  }
}
```

**陰影加強：**
```css
.filter-pill {
  box-shadow: 
    10px 10px 24px rgba(9, 15, 30, 0.25),  /* 深色從 0.18 提高到 0.25 */
    -10px -10px 24px rgba(255, 255, 255, 0.9),
    0 4px 8px rgba(0, 0, 0, 0.08);  /* 新增底部陰影 */
}

.filter-pill:hover {
  box-shadow: 
    12px 12px 28px rgba(9, 15, 30, 0.28),  /* hover 深色提高到 0.28 */
    -12px -12px 28px rgba(255, 255, 255, 0.95);
}
```

**Hover 微調：**
```css
.filter-pill:hover {
  transform: translateY(-2px); /* 從 -3px 改為 -2px */
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); /* 從 0.35s 改為 0.25s */
}
```

**圖標動畫�
## 第十階段：最終整合與測試

### 🔲 Task 10.1：視覺回歸測試
**工具：** 瀏覽器開發者工具 + 截圖對比

**測試項目：**
1. **Hero 區域**
   - [ ] 字體粗細（600）
   - [ ] 字體大小（手機 20px / 平板 24px / 桌機 28px / 超寬 30px）
   - [ ] 內距（緊湊版）
   - [ ] 彈跳動畫 + 微光掃過
   - [ ] 品牌漸層流動

2. **Assurance Card**
   - [ ] 邊框 1.5px + 藍色光暈
   - [ ] Info 區樣式精確
   - [ ] 膠囊 13px 字體
   - [ ] 進場動畫

3. **Filter Pills**
   - [ ] 21px padding + 15px 字體
   - [ ] Hover 2px 上移 + 0.25s
   - [ ] 圖標動畫 + 彩色光暈

---

### 🔲 Task 10.2：響應式 + 互動 + 性能 + 可訪問性測試
**設備：** iPhone SE / iPad / MacBook / iMac
**性能：** Lighthouse 測試
**可訪問性：** axe DevTools 檢查
**瀏覽器：** Chrome / Safari / Firefox / Edge

---

## 總結

✅ **已完成：**
- 創建 `/main.css` 基礎檔案
- 創建 `/index.html` 優化版本
- 完整代辦清單（共 10 階段）

🔲 **待執行：** 70+ 個精確修正任務

📋 **完整清單：** [查看 TODO.md](computer:///mnt/user-data/outputs/TODO.md)

---

**執行方式：**
告訴我「開始執行 Task X.X」或「全部自動執行」即可開始！
nd-primary-rgb: 26, 95, 219;`

### 🔲 Task 7.4：字型尺寸微調
```css
:root {
  /* 匹配原版精確尺寸 */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.75rem;   /* 28px 桌機 */
  --text-4xl: 1.875rem;  /* 30px 超寬 */
}
```

### 🔲 Task 7.5：間距精確匹配
```css
.filter-pill {
  padding: 1.3125rem var(--space-3); /* 21px 精確值 */
}

.tag {
  font-size: var(--text-sm); /* 14px 代替 13px */
  padding: 0.375rem 0.75rem; /* 6px 12px */
}
```

### 🔲 Task 7.6：陰影加強（匹配原版）
```css
:root {
  --shadow-neumorphic: 
    10px 10px 30px rgba(9, 15, 30, 0.22),    /* 加深 */
    -10px -10px 30px rgba(255, 255, 255, 0.95),
    0 8px 24px rgba(26, 95, 219, 0.12);      /* 藍色光暈 */
}
```

### 🔲 Task 7.7：動畫合併去重
- 合併 `gradientFlow` → `gradientShift`
- 合併 `dotPulse` → `iconPulse`
- 保留 `heroBounce` 替換 `fadeInUp`
- 保留 `cardPop` 替換 `scaleIn`
- 新增 `shine` 微光效果

---

## 驗收標準

### ✅ 完成時必須滿足：
1. **視覺零差異**：新舊版本在瀏覽器中看起來完全一致
2. **無格式衝突**：所有選擇器使用 BEM 命名，無全局污染
3. **可維護性**：修改任一顏色/字型只需改 CSS 變數
4. **無 !important**：所有 !important 已移除或有充分理由保留
5. **響應式正常**：手機/平板/桌機/超寬螢幕都正常顯示
6. **動畫流暢**：所有動畫效果與原版一致
7. **AI 對話正常**：OpenAI API 整合無影響
8. **性能優化**：加入 `will-change`，動畫 <500ms
9. **可訪問性**：ARIA 標籤、焦點樣式、減少動畫選項
10. **色彩精確**：品牌色 `#1A5FDB`，RGB 值正確

---

## 開始執行指令

當你準備好時，告訴我：
- 「開始執行 Task X.X」
- 或「一次執行第一階段所有任務」
- 或「全部自動執行」

我會依序完成每個任務！
