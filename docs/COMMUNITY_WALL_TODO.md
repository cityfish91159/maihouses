# 🏠 MaiHouses 物件上傳優化 TODO (SSOT)

> **最後更新**: 2025-12-22
> **目標**: 將上傳頁從「資料輸入表單」提升為「專業生產力工具」
> **首頁**: https://maihouses.vercel.app/maihouses/
> **上傳頁**: https://maihouses.vercel.app/maihouses/property/upload

---

## 📋 摘要 (Executive Summary)

| 優先級 | 任務 | 目標 | 狀態 |
|:---:|:---|:---|:---:|
| P0 | 表單自動快照 | 防止資料流失，一鍵還原草稿 | ✅ |
| P0 | 圖片前端壓縮 | 降低傳輸流量，加速上傳 | 🔶 75/100 |
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

### UP-1 二次審計待修 (Active)

| 編號 | 優先級 | 描述 | 狀態 | 驗證方式 |
|:---:|:---:|:---|:---:|:---|
| A | P1 | useEffect 依賴 hasDraft/getDraftPreview 可能造成重跑 | ✅ | 依賴改為 userId；重新載入與 storage 事件皆正常 |
| B | P2 | 捨棄草稿缺少確認對話框 | ✅ | 手動點擊「捨棄」彈出確認，可取消 |
| C | P2 | 測試案例不足（僅 5 個，缺邊界） | ✅ | 新增邊界測試：空草稿/損壞 JSON、debounce 單次寫入、相對時間預覽；npm test 全綠 |
| D | P2 | PropertyUploadPage 重複呼叫 supabase.auth.getUser() | ✅ | 改用 context.userId，移除重複 supabase 呼叫 |
| E | P2 | draftFormData useMemo 依賴整個 form 導致頻繁重算 | ✅ | useMemo 依賴拆欄位，避免每次 setForm 重算 |
| F | P2 | migrateDraft 每次 userId 變動都執行 | ✅ | 遷移前檢查 anonymous key 存在再遷移 |

**目標**: 收斂 UP-1 技術債，保留唯一待修列表，清除已完成雜訊。

**背景**: UP-1 已達成（首次審計缺失 12 項全修，二次審計 88/100），此區僅保留未完成的 6 項修補行動。

**預估工時**: 75 分鐘 (P1 10min + P2 65min)

---

### ✅ UP-1 成果摘要 (Archived)

- 12 項缺失全部修正：Key/版本/過期/時間戳/效能/遷移/多分頁/UX
- 二次審計：88/100（待修 A-F 已上表）
- 驗證：`npm test` 233/233，手動驗證還原/過期/遷移/發布後清除

> 完整歷史與評分：見 `docs/COMMUNITY_WALL_DEV_LOG.md`

---

### 📝 本次操作紀錄 (2025-12-22)

- 重新閱讀 `.github/copilot-instructions.md` 及 TODO，全量梳理 UP-1 區塊
- 移除已完成的 UP-1 任務描述，改為單一「待修列表」+「成果摘要」
- 保留二次審計待修 A-F 作為唯一執行入口，避免資訊雜亂
- 清除 UP-1 相關 console.* 並改為單次警示 toast；`useState<any>` 改為 `User | null`
- TS1128 自查：執行 `npm run build`（含 tsc）未復現錯誤，仍需若 IDE 有殘留可重啟 TS Server
- 本次：修復 A/B/D/E/F，新增捨棄確認、移除重複 auth 取得、useMemo 拆欄位、遷移 guard；C 仍待新增邊界測試
- 本次（二次補充）：完成 C 邊界測試（腐敗 JSON/空草稿、debounce 單寫入、相對時間預覽），`npm test` 全綠
- 本次（三次補充）：完成任務二前端壓縮（browser-image-compression 安裝；新增 imageService；UploadContext 串 validate → 壓縮 → 1.5MB 防線；新增壓縮相關測試），`npm test` 241/241 通過


### 任務 2: [P0] 圖片前端預處理 (Client-side Compression)

**📊 審計評分：75/100** ⚠️ 基礎功能完成但缺 UX/測試/穩定性

| ID | 任務描述 | 檔案路徑 | 狀態 | 驗證證據 |
|:---|:---|:---|:---:|:---|
| UP-2.1 | 安裝 browser-image-compression | package.json | ✅ | 241/241 tests |
| UP-2.2 | 建立 optimizePropertyImage 服務 | src/services/imageService.ts | ✅ | 241/241 tests |
| UP-2.3 | 整合至 handleFileSelect 流程 | src/components/upload/UploadContext.tsx | ✅ | 241/241 tests |

**技術規格**:
- 最大寬高: 2048px
- 檔案上限: 1.5MB
- 畫質: 0.85
- 自動修正 EXIF 旋轉問題

**驗收標準 (AC)**:
- [ ] 上傳 5MB 照片時，實際傳輸流量 < 2MB
- [ ] 手機拍攝的照片方向正確顯示

---

### ❌ UP-2 審計缺失清單 (Google 首席處長審計)

| 編號 | 嚴重度 | 問題描述 | 現況 | 最佳實作指引 |
|:---:|:---:|:---|:---|:---|
| UP-2.A | P1 | **缺壓縮進度 UI** | ✅ | 已實作 `compressionProgress` 與 `MediaSection` 進度條 |
| UP-2.B | P1 | **無並發控制** | ✅ | 實作 `optimizeImagesConcurrent` (concurrency=3) |
| UP-2.C | P2 | **HEIC 未轉換** | ✅ | 偵測 HEIC 並強制 `fileType: 'image/jpeg'` |
| UP-2.D | P2 | **壓縮失敗無重試** | ✅ | 實作遞迴重試 (quality * 0.8) |
| UP-2.E | P2 | **WebWorker 錯誤未分類** | ✅ | 識別 `RangeError` 為 OOM |
| UP-2.F | P2 | **測試覆蓋不足** | ✅ | 已補上 `imageService` 單元測試 (HEIC/Retry/OOM/Concurrency) [Strict Remediation] |
| UP-2.G | P3 | **缺壓縮對比 UI** | ✅ | 實作 `CompressionComparison` 元件與 `MediaSection` 整合 (Demo Mode) |
| UP-2.H | P3 | **EXIF 保留未測** | ✅ | 參數設定 `preserveExif: true` |
| UP-2.I | P3 | **批次進度不明** | ✅ | 實作與 UP-2.A 整合 |
| UP-2.J | P3 | **缺 E2E 驗收** | ✅ | 建立 `tests/e2e/upload.spec.ts` (需 Playwright 環境) |
| P-2.K | P0 | **Value 缺少 compressing** | ✅ | Context value 補上 `compressing` state |
| UP-2.L | P1 | **finally 缺重設** | ✅ | `handleFileSelect` finally 加入 `setCompressing(false)` |
| UP-2.M | P1 | **Mock 缺 stats** | ✅ | 測試 Mock 補上 `stats` 欄位 |

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
