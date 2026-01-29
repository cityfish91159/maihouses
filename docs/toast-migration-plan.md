# Toast 通知系統遷移規劃

## 執行摘要

本文件規劃將所有原生 `alert()` 替換為現代化 Toast 通知系統,以改善用戶體驗並避免阻塞 UI。

---

## 背景

### 問題

- 原生 `alert()` 會阻塞主執行緒,造成 UI 凍結
- 樣式無法自訂,與現代化 UI 設計不一致
- 無法控制顯示時間,用戶必須手動關閉
- 缺乏漸進式顯示動畫,用戶體驗較差

### 解決方案

使用已安裝的 `sonner` Toast library + 專案內建 `notify` 工具函數

---

## 技術選擇

### 選定方案: Sonner (已安裝)

**優勢:**

- ✅ 已安裝 (`sonner@2.0.7`)
- ✅ 已整合到 App.tsx (`<Toaster>` 已配置)
- ✅ 專案已封裝 `src/lib/notify.ts` 工具函數
- ✅ 輕量級 (~3KB gzipped)
- ✅ 支援無障礙功能 (ARIA)
- ✅ 提供 5 種通知類型: success, error, warning, info, loading
- ✅ 支援 action button 與自訂 duration

**現有配置:**

```typescript
// src/App.tsx (L73-79)
<Toaster
  position="top-right"
  theme="light"
  richColors
  closeButton
  toastOptions={{ duration: 3200 }}
/>
```

**現有 API:**

```typescript
// src/lib/notify.ts
import { notify } from '../lib/notify';

// 範例使用
notify.success('標題', '描述文字');
notify.error('錯誤', '詳細錯誤訊息', { duration: 5000 });
notify.info('提示');
notify.warning('警告');
notify.loading('處理中...');
```

### 備選方案: react-hot-toast (未採用)

**不採用原因:**

- ❌ 需要額外安裝依賴
- ❌ 會增加專案複雜度 (兩套 Toast 系統)
- ❌ 現有 sonner 已滿足所有需求

---

## 需要替換的位置

### 1. PropertyDetailPage.tsx (L386) - **已改善 (Phase 1 完成)**

**位置:** `src/pages/PropertyDetailPage.tsx:386`

**目前狀態 (Phase 1):**

```typescript
// Phase 1: 改善訊息內容 (Phase 2: 將替換為 Toast notification)
alert('✅ 您的要求已記錄\n\n系統將通知房仲開啟安心留痕服務,我們會透過 Email 通知您進度。');
```

**Phase 2 遷移方案:**

```typescript
// 移除 alert,改用 notify
import { notify } from '../lib/notify';

const handleRequestTrustEnable = useCallback(() => {
  logger.info('User requested trust enable', {
    propertyId: property.publicId,
  });

  // Phase 2: Toast notification
  notify.success('要求已送出', '系統將通知房仲開啟安心留痕服務,我們會透過 Email 通知您進度。', {
    duration: 4000,
  });
}, [property.publicId]);
```

**優先級:** P0 (已在 Phase 1 改善,Phase 2 優先執行)

---

### 2. PropertyDetailPage.tsx (L377) - **發現新問題**

**位置:** `src/pages/PropertyDetailPage.tsx:377`
**場景:** 彈出視窗攔截時的 fallback alert

**目前代碼:**

```typescript
if (!newWindow) {
  logger.warn('Popup blocked, showing fallback alert', {
    propertyId: property.publicId,
  });
  alert('彈出視窗被攔截,請允許彈出視窗或直接訪問信任說明頁面');
}
```

**遷移方案:**

```typescript
if (!newWindow) {
  logger.warn('Popup blocked, showing fallback toast', {
    propertyId: property.publicId,
  });

  notify.warning('彈出視窗被攔截', '請允許彈出視窗,或點擊下方按鈕開啟信任說明頁面', {
    duration: 6000,
    actionLabel: '開啟頁面',
    onAction: () => {
      window.location.href = 'https://maihouses.vercel.app/maihouses/trust-room';
    },
  });
}
```

**優先級:** P1 (次要修復,提升 UX)

---

### 3. 其他檔案中的 alert 使用情況

**搜尋結果:**

```bash
$ grep -r "alert(" --include="*.ts" --include="*.tsx" src/
# 僅發現以上兩處
```

**結論:** 目前僅 PropertyDetailPage.tsx 需要修復,範圍可控。

---

## 實施步驟

### Phase 2-A: 核心替換 (必做)

1. **修改 PropertyDetailPage.tsx L386**
   - [ ] 在檔案頂部新增 `import { notify } from '../lib/notify';`
   - [ ] 替換 alert 為 `notify.success()`
   - [ ] 移除 Phase 1 TODO 註解
   - [ ] 測試通知顯示是否正常

2. **手動測試**
   - [ ] 前往房源詳情頁面
   - [ ] 點擊「要求房仲開啟安心留痕」按鈕
   - [ ] 確認 Toast 顯示正確內容
   - [ ] 確認 4 秒後自動消失

3. **驗收標準**
   - [ ] 無 `alert()` 呼叫
   - [ ] Toast 顯示於 top-right
   - [ ] 內容清晰易讀
   - [ ] 不阻塞 UI

### Phase 2-B: 進階優化 (選做)

4. **修改 PropertyDetailPage.tsx L377 (彈窗攔截處理)**
   - [ ] 替換 alert 為 `notify.warning()` + action button
   - [ ] 測試 action button 功能

5. **全域代碼品質檢查**
   - [ ] 執行 `npm run gate` (typecheck + lint)
   - [ ] 確保無 TypeScript 錯誤
   - [ ] 確保無 ESLint 警告

6. **更新品質關卡規則 (可選)**
   - [ ] 檢查 `scripts/ultimate-gate.js` 中的 alert 檢查規則
   - [ ] 確認規則正確攔截新增的 alert

---

## 設計規範

### Toast 類型選擇指南

| 場景     | Toast 類型         | 範例                   |
| -------- | ------------------ | ---------------------- |
| 操作成功 | `notify.success()` | 表單送出、資料儲存成功 |
| 錯誤     | `notify.error()`   | API 呼叫失敗、驗證錯誤 |
| 警告     | `notify.warning()` | 彈窗攔截、權限不足     |
| 提示     | `notify.info()`    | 一般資訊、功能說明     |
| 載入中   | `notify.loading()` | 長時間 API 呼叫        |

### 訊息撰寫原則

1. **標題簡短** (≤10 字)
2. **描述具體** (說明用戶接下來會發生什麼)
3. **使用正向語氣** (「已送出」而非「沒有失敗」)
4. **避免技術術語** (用戶導向,非開發者導向)

### Duration 建議

| 訊息重要性 | 建議時間            |
| ---------- | ------------------- |
| 一般成功   | 3200ms (預設)       |
| 重要成功   | 4000-5000ms         |
| 錯誤訊息   | 5000ms (預設)       |
| 警告訊息   | 4500ms (預設)       |
| 載入中     | Infinity (手動關閉) |

---

## 測試計劃

### 單元測試 (建議)

```typescript
// src/pages/__tests__/PropertyDetailPage.test.tsx
import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as notify from '../lib/notify';

vi.mock('../lib/notify');

test('should show toast when requesting trust enable', () => {
  const mockSuccess = vi.spyOn(notify, 'success');

  render(<PropertyDetailPage />);
  const button = screen.getByText('要求房仲開啟');
  fireEvent.click(button);

  expect(mockSuccess).toHaveBeenCalledWith(
    '要求已送出',
    expect.stringContaining('Email 通知您進度'),
    expect.objectContaining({ duration: 4000 })
  );
});
```

### 手動測試檢查清單

- [ ] **Desktop Chrome**: Toast 顯示正常
- [ ] **Mobile Safari**: Toast 顯示正常
- [ ] **多次點擊**: Toast 不重複堆疊 (sonner 自動處理)
- [ ] **螢幕閱讀器**: ARIA live region 正常運作
- [ ] **Dark Mode**: Toast 主題正確 (目前固定 light)

---

## 風險評估

### 低風險

- ✅ Toast library 已安裝並運作中
- ✅ 修改範圍小 (僅 2 處)
- ✅ 不影響業務邏輯
- ✅ 易於回退 (保留原 alert 代碼註解)

### 潛在問題

1. **用戶習慣**
   - 風險: 用戶可能習慣阻塞式 alert
   - 緩解: Toast 更顯眼 (top-right + richColors)

2. **通知遺漏**
   - 風險: 用戶可能錯過自動消失的 Toast
   - 緩解: 設定較長 duration (4000ms) + closeButton 手動關閉

3. **無障礙功能**
   - 風險: 螢幕閱讀器支援
   - 緩解: sonner 內建 ARIA support

---

## 時程規劃

| 階段       | 任務                | 預估時間     | 責任人 |
| ---------- | ------------------- | ------------ | ------ |
| Phase 1 ✅ | 改善 alert 訊息內容 | 10 分鐘      | Claude |
| Phase 2-A  | 替換為 Toast (核心) | 20 分鐘      | 開發者 |
| Phase 2-B  | 進階優化 (選做)     | 30 分鐘      | 開發者 |
| 測試       | 手動 + 自動化測試   | 30 分鐘      | QA     |
| **總計**   | -                   | **1.5 小時** | -      |

---

## 完成標準

### Phase 2-A (必做)

- [x] Phase 1: 改善 alert 訊息內容
- [ ] Phase 2: 替換 L386 的 alert 為 notify.success()
- [ ] 通過 `npm run gate` (typecheck + lint)
- [ ] 手動測試通過

### Phase 2-B (選做)

- [ ] 替換 L377 的 alert 為 notify.warning()
- [ ] 撰寫單元測試
- [ ] 更新技術文件

---

## 參考資料

- [Sonner 官方文件](https://sonner.emilkowal.ski/)
- [專案 notify 工具](../src/lib/notify.ts)
- [App.tsx Toaster 配置](../src/App.tsx#L73-L79)
- [品質關卡規則](../scripts/ultimate-gate.js#L78)

---

## 附錄: 遷移範例

### 範例 1: 簡單成功訊息

```typescript
// ❌ Before
alert('操作成功');

// ✅ After
notify.success('操作成功');
```

### 範例 2: 含描述的成功訊息

```typescript
// ❌ Before
alert('您的要求已記錄\n\n系統將發送 Email 通知。');

// ✅ After
notify.success('要求已記錄', '系統將發送 Email 通知。');
```

### 範例 3: 錯誤訊息 + 自訂時間

```typescript
// ❌ Before
alert('發生錯誤,請稍後再試');

// ✅ After
notify.error('發生錯誤', '請稍後再試', { duration: 5000 });
```

### 範例 4: 含 Action Button 的警告

```typescript
// ❌ Before
if (!confirmed) {
  alert('請確認您的操作');
}

// ✅ After
notify.warning('請確認您的操作', '', {
  actionLabel: '確認',
  onAction: () => handleConfirm(),
});
```

---

**最後更新:** 2026-01-27
**文件版本:** 1.0
**狀態:** Phase 1 已完成 ✅ | Phase 2 待執行
