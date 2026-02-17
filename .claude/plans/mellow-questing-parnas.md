# 工單 #27 改造 + ReportGenerator Mock 修復

## Context

工單 #27 歡迎引導卡片已完成，但需要改造：
1. **UAGEmptyState** 目前嵌在 `uag-grid` 內，需改為螢幕中央懸浮 Modal（更大、居中）
2. **ReportGenerator** 在 Live 模式下仍顯示硬編碼的 3 筆 Mock 物件資料（12F 南屯區 3288 萬、18F 中山區 8800 萬、5F 士林區 2450 萬），應該只顯示真實 listings

---

## 修復 A：UAGEmptyState 改為螢幕中央懸浮 Modal

### 根本原因

目前 `UAGEmptyState` 是一個 `<section>` 嵌在 `uag-grid` 內（`k-span-6`），視覺上只是 grid 最上方的一張卡片。用戶希望它更醒目，以螢幕中央懸浮 overlay 的方式呈現。

### 修改檔案

| 檔案 | 改動 |
|------|------|
| `src/pages/UAG/components/UAGEmptyState.tsx` | `<section>` → Portal `<div>` overlay + 居中卡片 |
| `src/pages/UAG/UAG.module.css` L453-610 | 歡迎卡片樣式改為 overlay + 居中 Modal |

### 具體改法

#### UAGEmptyState.tsx

1. 引入 `createPortal` from `react-dom`
2. 外層改為 overlay 容器（固定定位，全螢幕半透明遮罩）
3. 內層為居中卡片（更大的 padding/字體）
4. 用 `createPortal` 掛到 `document.body`
5. MaiMai 改用 `size="lg"` (160px)，桌機更醒目
6. 手機 `size="md"` (128px)
7. 保留所有無障礙屬性、focus-visible、prefers-reduced-motion

```tsx
// 結構
return createPortal(
  <div className={styles['welcome-overlay']} role="dialog" aria-modal="true" aria-label="新手引導">
    <div className={styles['welcome-modal']}>
      <button className={styles['welcome-close']} onClick={onDismiss} aria-label="關閉歡迎引導">
        <X size={18} strokeWidth={2.5} />
      </button>
      <div className={styles['welcome-card-inner']}>
        <div className={styles['welcome-maimai-wrap']}>
          <MaiMaiBase mood="wave" size={isMobile ? 'md' : 'lg'} {...maimaiA11yProps} />
        </div>
        <div className={styles['welcome-text']}>
          {/* 文案保持不變 */}
        </div>
      </div>
    </div>
  </div>,
  document.body
);
```

#### UAG.module.css 修改

刪除 `.welcome-card` 的 `k-span-6` grid 定位，改為：

```css
/* 遮罩 */
.welcome-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 34, 70, 0.4);
  backdrop-filter: blur(4px);
  animation: welcome-overlay-in 0.2s ease forwards;
}

/* Modal 卡片（取代 .welcome-card） */
.welcome-modal {
  position: relative;
  background: #fff;
  border: 1px solid var(--line-soft);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 24px 48px rgba(10, 34, 70, 0.2);
  max-width: 560px;
  width: calc(100% - 32px);
  animation: welcome-fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

/* 桌機 MaiMai 加大 */
.welcome-maimai-wrap {
  width: 160px;
  min-width: 160px;
}

/* 標題加大 */
.welcome-title {
  font-size: 22px;
}
```

手機 RWD (`max-width: 767px`)：
- `.welcome-modal` padding 改 24px
- `.welcome-card-inner` 垂直排列
- MaiMai 維持 `md` (128px)
- 標題 18px

#### index.tsx

`showWelcome && <UAGEmptyState onDismiss={handleDismissWelcome} />` 移出 `uag-grid`，放在 `<div className={styles['uag-page']}>` 外面（因為用 Portal 所以位置其實不影響，但語義上更合理放在 grid 外）。

---

## 修復 B：ReportGenerator Live 模式顯示 Mock 資料

### 根本原因

`src/pages/UAG/components/ReportGenerator/index.tsx`：

1. **L150-300**：硬編碼了 `MY_LISTINGS` 陣列（3 筆 mock 物件），這些資料永遠存在
2. **L548**：`renderStep1()` 中 `{MY_LISTINGS.map((property) => ...)}` 直接迭代硬編碼資料
3. Props 接收的 `listings` 完全沒被使用

### 修改檔案

| 檔案 | 改動 |
|------|------|
| `src/pages/UAG/components/ReportGenerator/index.tsx` | 用 `listings` prop 取代 `MY_LISTINGS`；無 listings 時顯示空狀態 |

### 型別差異分析

`Listing` 型別（`uag.types.ts:202`）只有：`public_id, title, images, features, community_id, view_count, click_count, fav_count`

`PropertyData`（ReportGenerator 內部）有 18+ 欄位：`id, title, address, district, price, pricePerPing, size, rooms, floor, floorTotal, age, direction, parking, managementFee, community, communityYear, communityUnits, propertyType, description, images, highlights`

DB `properties` 表也只有：`id, public_id, title, price, address, description, images`

**結論**：大部分 `PropertyData` 欄位在目前的系統中不存在。

### 具體改法

1. 刪除 `MY_LISTINGS` 硬編碼陣列（L150-300）
2. 刪除 `DEFAULT_PROPERTY` 硬編碼物件（L74-147）
3. 用 `listings` prop 建立簡化列表，可映射欄位直接用，不可映射的給合理預設值
4. `renderStep1()` 中 `MY_LISTINGS.map()` → 改用轉換後的真實 listings
5. listings 為空時在 Step 1 顯示「尚無物件，請先上架」提示
6. AI 匯入截圖功能（`handleFileChange` L427-519）的硬編碼 `detectedProperty` 先保留（模擬 AI 辨識功能）

```typescript
// 轉換 Listing → PropertyData（可映射欄位 + 預設值）
const propertyList: PropertyData[] = useMemo(() =>
  (listings ?? []).map(listing => ({
    id: listing.public_id,
    title: listing.title,
    address: '',           // Listing 型別無此欄位
    district: '',          // Listing 型別無此欄位
    price: 0,              // Listing 型別無此欄位
    pricePerPing: 0,
    size: 0,
    rooms: '',
    floor: '',
    floorTotal: 0,
    age: 0,
    direction: '',
    parking: '',
    managementFee: 0,
    community: '',
    communityYear: 0,
    communityUnits: 0,
    propertyType: '',
    description: '',
    images: listing.images ?? listing.thumbnail ? [listing.thumbnail!] : [],
    highlights: [],
  })),
  [listings]
);
```

**注意**：由於 `Listing` 缺少大部分欄位，報告生成的完整度會受限。但至少移除了 Mock 資料，Live 模式下用戶只會看到自己真實上架的物件。未來需要擴充 `Listing` 或 `properties` 表欄位才能讓報告生成器充分利用。

---

## 修復 C：更新 MOCK-SYSTEM.md 工單紀錄

按照既有格式（參考 #1c、#2、#3 的施工紀錄格式），在 #27 的施作紀錄下方新增本輪改動紀錄：

- 摘要打勾
- 列出新增/修改的檔案
- 記錄本輪調整重點
- 驗證摘要

---

## 驗證方式

1. `npm run gate` 通過（typecheck + lint）
2. Live 模式 agent 登入 UAG → 歡迎卡片以螢幕中央 Modal 呈現
3. 點「上架物件」→ 導到 `/property/upload`
4. 點「知道了」或 ✕ → Modal 關閉 + overlay 消失
5. 重整頁面 → Modal 不再出現（sessionStorage）
6. 手機 viewport → Modal 垂直排列、MaiMai md 尺寸
7. ReportGenerator 在 Live 模式下不顯示 Mock 物件（12F/18F/5F 消失）
8. ReportGenerator 在有真實 listings 時正確顯示
9. ReportGenerator 在無 listings 時顯示空狀態提示
