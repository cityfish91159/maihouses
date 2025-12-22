# 🏠 MaiHouses 物件上傳優化 TODO (SSOT)

> **最後更新**: 2025-12-22
> **目標**: 將上傳頁從「資料輸入表單」提升為「專業生產力工具」
> **首頁**: https://maihouses.vercel.app/maihouses/
> **上傳頁**: https://maihouses.vercel.app/maihouses/property/upload

---

## 📋 摘要 (Executive Summary)

| 優先級 | 任務 | 目標 | 狀態 |
|:---:|:---|:---|:---:|
| P0 | 表單自動快照 | 防止資料流失，一鍵還原草稿 | ⬜ |
| P0 | 圖片前端壓縮 | 降低傳輸流量，加速上傳 | ⬜ |
| P1 | 圖片管理重構 | 統一狀態管理，支援封面選擇 | ⬜ |
| P1 | 亮點膠囊分流 | 手動勾選亮點，規格與行銷分離 | ⬜ |

---

## 🎯 設計原則

### 資訊展示分流
- **重點膠囊 (Highlights)**: 僅放行銷亮點（如：全新裝潢、靜巷住宅）
- **規格文字 (Specs)**: 僅放物理事實（如：3 房、23 坪）
- **數據模型**: `tags` 陣列固定為 3-5 個手動選擇的亮點標籤

---

## 🚀 當前執行區 (Active Tasks)

### 任務 1: [P0] 表單自動快照 (Draft Persistence)

| ID | 任務描述 | 檔案路徑 | 狀態 | 驗證證據 |
|:---|:---|:---|:---:|:---|
| UP-1.1 | 建立 usePropertyDraft Hook | src/hooks/usePropertyDraft.ts | ✅ | userId key / 版本 / 過期 / 時間戳 |
| UP-1.2 | 整合至 UploadContext，每 1000ms 自動存檔 | src/components/upload/UploadContext.tsx | ✅ | userId 注入 + 匿名遷移 |
| UP-1.3 | 新增「還原草稿」按鈕 UI | src/pages/PropertyUploadPage.tsx | ✅ | 預覽時間 + 捨棄草稿 |

**技術規格**:
- 使用 localStorage 儲存
- Key 格式: mh_draft_{userId}
- 僅保存文字欄位（不含圖片）

**驗收標準 (AC)**:
- [x] 填寫一半重整頁面後，點擊「還原」能找回所有文字內容（已驗：手動 + 單元測試）
- [x] 發布成功後自動清除草稿（已驗：手動）

---

### ✅ UP-1 修正完成 (Google 首席處長自查)

| 項目 | 狀態 | 說明 |
|------|:---:|------|
| Key 規格 | ✅ | `mh_draft_{userId}`，匿名 fallback `anonymous`，登入自動遷移 |
| 時間戳 | ✅ | `_savedAt` 儲存並以相對時間顯示 |
| 版本號 | ✅ | `_version` 驗證，版本不符自動清除 |
| 過期機制 | ✅ | 7 天過期自動清除 |
| 效能 | ✅ | `useMemo` 穩定引用，避免每次 render 觸發存檔 |
| 還原失敗回饋 | ✅ | 錯誤通知 + 自動清除損壞草稿 |
| 測試 | ✅ | `usePropertyDraft.test.ts` 覆蓋保存/還原/過期/遷移 |
| 狀態管理 | ✅ | storage 事件同步 draftAvailable |
| 多分頁 | ✅ | storage 事件偵測跨分頁更新 |
| 預覽資訊 | ✅ | 按鈕顯示標題 + 相對時間 |
| 捨棄功能 | ✅ | 新增「捨棄」按鈕 |
| 登入遷移 | ✅ | 匿名草稿自動遷移至登入 userId |

**驗證證據**:
- 單元測試：`npm test`（新增 `src/hooks/__tests__/usePropertyDraft.test.ts`）
- 手動驗證：
  - 重整後還原成功
  - 發佈成功後草稿清除
  - 7 天過期草稿自動清除
  - 匿名填寫 → 登入後草稿仍在

### 任務 2: [P0] 圖片前端預處理 (Client-side Compression)

| ID | 任務描述 | 檔案路徑 | 狀態 | 驗證證據 |
|:---|:---|:---|:---:|:---|
| UP-2.1 | 安裝 browser-image-compression | package.json | ⬜ | |
| UP-2.2 | 建立 optimizePropertyImage 服務 | src/services/imageService.ts | ⬜ | |
| UP-2.3 | 整合至 handleFileSelect 流程 | src/components/upload/UploadContext.tsx | ⬜ | |

**技術規格**:
- 最大寬高: 2048px
- 檔案上限: 1.5MB
- 畫質: 0.85
- 自動修正 EXIF 旋轉問題

**驗收標準 (AC)**:
- [ ] 上傳 5MB 照片時，實際傳輸流量 < 2MB
- [ ] 手機拍攝的照片方向正確顯示

---

### 任務 3: [P1] 圖片管理重構 (Single Truth Management)

| ID | 任務描述 | 檔案路徑 | 狀態 | 驗證證據 |
|:---|:---|:---|:---:|:---|
| UP-3.1 | 定義 ManagedImage 介面 | src/types/upload.ts | ⬜ | |
| UP-3.2 | 重構 UploadContext 狀態管理 | src/components/upload/UploadContext.tsx | ⬜ | |
| UP-3.3 | 實作「設為封面」功能 | src/components/upload/ImagePreview.tsx | ⬜ | |
| UP-3.4 | 確保發布時 images[0] 為封面 | src/components/upload/UploadContext.tsx | ⬜ | |

**技術規格**:
- ManagedImage { id, file, preview, isCover, status }
- status: pending | optimizing | ready

**驗收標準 (AC)**:
- [ ] 點擊任一張圖為封面後，發布後 images[0] 為該張圖
- [ ] 刪除圖片時，File 與 preview URL 同步清除
- [ ] 預覽圖顯示優化狀態 (pending → ready)

---

### 任務 4: [P1] 亮點膠囊與規格分流

| ID | 任務描述 | 檔案路徑 | 狀態 | 驗證證據 |
|:---|:---|:---|:---:|:---|
| UP-4.1 | 上傳頁：亮點標籤改為手動勾選 | src/components/upload/HighlightPicker.tsx | ⬜ | |
| UP-4.2 | 首頁卡片：僅渲染 tags 前兩位 | src/features/home/PropertyCard.tsx | ⬜ | |
| UP-4.3 | 列表頁：移除重複規格膠囊 | public/js/property-renderer.js | ⬜ | |
| UP-4.4 | 詳情頁：亮點與規格分區顯示 | src/pages/PropertyDetailPage.tsx | ⬜ | |

**預設亮點選項**:
- 全新裝潢、近捷運、靜巷住宅、景觀優美
- 高樓層、邊間採光、車位充足、學區宅

**驗收標準 (AC)**:
- [ ] 卡片上不再出現「23坪」、「3房」重複膠囊
- [ ] 所有頁面亮點順序與上傳時一致
- [ ] 房仲可自訂最多 5 個亮點標籤

---

## ✅ 已完成階段 (Milestones)

### �� KC-5: 測試補強 (2025-12-22) ✅
- ✅ KC-5.1~5.4: 228 tests passed | Commit: 69701d2

### 🧩 KC-4: AI 膠囊生成 (2025-12-22) ✅ 97/100
- ✅ KC-4.1~4.3: API + 整合 + 降級 | Commit: f49ee59

### 🧩 KC-3: 列表頁膠囊渲染 (2025-12-22) ✅
- ✅ KC-3.1~3.3: 大卡/水平卡 tags 渲染

### 🏠 P11: 房源列表頁升級 (2025-12-19) ✅
- ✅ S1-S4, M1-M3, L1: DOM Diffing, Ring Buffer, XSS 防護
