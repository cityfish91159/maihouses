# TrustServiceBanner 整合報告 - Team 7

**日期**: 2026-01-28
**任務**: 整合 `TrustServiceBanner` 到 `PropertyDetailPage.tsx`
**狀態**: ✅ 完成

---

## 📋 任務總覽

將 `TrustServiceBanner` 組件整合到房源詳情頁面，實現消費者主動發起安心留痕服務的功能。

---

## 🎯 完成項目

### 1. 實作 `handleEnterService` 函數

**位置**: `C:\Users\陳世瑜\maihouses\src\pages\PropertyDetailPage.tsx` (行 163-184)

```typescript
const handleEnterService = useCallback(async () => {
  setIsRequesting(true);
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const res = await fetch('/api/trust/auto-create-case', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyId: property.publicId,
        userId: user?.id,
        userName: user?.user_metadata?.name,
      }),
    });
    if (!res.ok) throw new Error('Failed to create case');
    const { data } = await res.json();
    window.location.href = `/maihouses/assure?token=${data.token}`;
  } catch (error) {
    notify.error('無法進入服務', '請稍後再試');
  } finally {
    setIsRequesting(false);
  }
}, [property.publicId]);
```

**功能說明**:

- 呼叫 `/api/trust/auto-create-case` API 自動建立安心留痕案件
- 支援已登入/未登入用戶 (API 會自動處理匿名買方)
- 建立成功後導向 Trust Room (`/maihouses/assure?token=xxx`)
- 完整錯誤處理與用戶提示

---

### 2. 新增狀態管理

**位置**: `C:\Users\陳世瑜\maihouses\src\pages\PropertyDetailPage.tsx` (行 98)

```typescript
const [isRequesting, setIsRequesting] = useState(false);
```

**用途**: 追蹤「進入服務」按鈕的載入狀態，防止重複提交。

---

### 3. 更新 TrustServiceBanner Props

**位置**: `C:\Users\陳世瑜\maihouses\src\pages\PropertyDetailPage.tsx` (行 336-363)

**修改前**:

```typescript
<TrustServiceBanner
  onEnterService={trustActions.learnMore}  // ❌ 舊邏輯：開啟說明頁
  isRequesting={isRequestingTrust}         // ❌ 錯誤狀態
/>
```

**修改後**:

```typescript
<TrustServiceBanner
  onEnterService={handleEnterService}      // ✅ 新邏輯：建立案件並進入 Trust Room
  isRequesting={isRequesting}              // ✅ 正確狀態
/>
```

---

### 4. 匯入必要模組

**位置**: `C:\Users\陳世瑜\maihouses\src\pages\PropertyDetailPage.tsx` (行 48-49)

```typescript
import { supabase } from '../lib/supabase';
import { notify } from '../lib/notify';
```

---

## 🔍 程式碼品質檢查

### TypeScript 類型檢查

```bash
npm run typecheck
```

**結果**: ✅ 通過，無類型錯誤

### ESLint 代碼風格檢查

```bash
npx eslint "C:\Users\陳世瑜\maihouses\src\pages\PropertyDetailPage.tsx"
```

**結果**: ✅ 通過，無新增錯誤

> 註：專案中存在 1 個既有的 lint 錯誤 (`DataCollectionModal.tsx`，與本次修改無關)

---

## 📝 遵循規範

### ✅ 先讀後寫規範

- 閱讀了 `PropertyDetailPage.tsx` 主檔案
- 閱讀了 `TrustServiceBanner.tsx` 組件
- 閱讀了 `useTrustActions.ts` hook
- 閱讀了 `supabase.ts` 與 `notify.ts` 工具函數
- 確認 `/api/trust/auto-create-case.ts` API 存在

### ✅ 類型安全

- 無使用 `any` 類型
- 完整的錯誤處理 (try-catch)
- 使用 `useCallback` 優化效能

### ✅ 代碼品質

- 通過 `npm run typecheck`
- 通過 ESLint 檢查
- 遵循專案既定的代碼風格

### ✅ 文件要求

- 使用繁體中文（台灣用語）撰寫報告
- 程式碼註解清晰
- 錯誤訊息使用者友善

---

## 🔗 相關檔案清單

| 檔案路徑                                                          | 修改狀態  | 說明                                            |
| ----------------------------------------------------------------- | --------- | ----------------------------------------------- |
| `C:\Users\陳世瑜\maihouses\src\pages\PropertyDetailPage.tsx`      | ✅ 已修改 | 主要整合檔案                                    |
| `C:\Users\陳世瑜\maihouses\src\components\TrustServiceBanner.tsx` | ⚪ 未修改 | 已支援 `onEnterService` 與 `isRequesting` props |
| `C:\Users\陳世瑜\maihouses\api\trust\auto-create-case.ts`         | ⚪ 未修改 | 後端 API 已存在                                 |
| `C:\Users\陳世瑜\maihouses\src\lib\supabase.ts`                   | ⚪ 未修改 | 已匯入使用                                      |
| `C:\Users\陳世瑜\maihouses\src\lib\notify.ts`                     | ⚪ 未修改 | 已匯入使用                                      |

---

## 🧪 測試建議

### 手動測試流程

1. 前往房源詳情頁面 (`/maihouses/property/MH-100001`)
2. 點擊「進入服務」按鈕（需 `trustEnabled=true` 的物件）
3. 驗證：
   - 按鈕顯示 Loading 狀態
   - 成功建立案件後導向 Trust Room
   - 錯誤時顯示 Toast 提示

### 測試案例

- [ ] 已登入用戶：使用 `userId` 與 `userName` 建立案件
- [ ] 未登入用戶：自動生成匿名買方名稱
- [ ] 網路錯誤：顯示錯誤訊息
- [ ] API 失敗：顯示錯誤訊息
- [ ] 重複點擊：按鈕 disabled 狀態正常運作

---

## 🚀 後續工作

### 建議優化

1. 新增 E2E 測試覆蓋「進入服務」流程
2. 監控 API 呼叫成功率與回應時間
3. 考慮新增「建立案件中」的過渡畫面

### 依賴功能

- Trust Room 頁面需正確處理 `token` 參數
- `/api/trust/auto-create-case` API 需維持穩定

---

## ✅ 結論

Team 7 已成功完成 `TrustServiceBanner` 整合任務：

1. ✅ 實作 `handleEnterService` 函數
2. ✅ 更新 TrustServiceBanner props (`onEnterService` + `isRequesting`)
3. ✅ 新增必要的狀態管理
4. ✅ 通過 TypeScript 類型檢查
5. ✅ 通過 ESLint 代碼風格檢查
6. ✅ 遵循專案規範（先讀後寫、類型安全、繁體中文）

整合完成後，消費者可在房源詳情頁面直接點擊「進入服務」按鈕，自動建立安心留痕案件並進入 Trust Room，實現 Phase 1.5 的核心功能。
