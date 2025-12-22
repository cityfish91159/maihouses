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
| UP-1.1 | 建立 usePropertyDraft Hook | src/hooks/usePropertyDraft.ts | ⚠️ | 基礎完成，缺 userId |
| UP-1.2 | 整合至 UploadContext，每 1000ms 自動存檔 | src/components/upload/UploadContext.tsx | ⚠️ | 有效能問題 |
| UP-1.3 | 新增「還原草稿」按鈕 UI | src/pages/PropertyUploadPage.tsx | ⚠️ | 缺時間顯示 |

**技術規格**:
- 使用 localStorage 儲存
- Key 格式: mh_draft_{userId}
- 僅保存文字欄位（不含圖片）

**驗收標準 (AC)**:
- [x] 填寫一半重整頁面後，點擊「還原」能找回所有文字內容
- [x] 發布成功後自動清除草稿

---

### 🔴 UP-1 嚴格審計報告 (Google 首席處長視角)

#### 審計評分：65/100 ⚠️ 不合格

| 項目 | 得分 | 扣分原因 |
|------|------|----------|
| 規格符合度 | 12/25 | Key 格式錯誤、無 userId 傳入 |
| 代碼品質 | 15/25 | 效能問題、硬編碼假資料 |
| UX 完整度 | 18/25 | 缺時間戳顯示、無載入中狀態 |
| 測試覆蓋 | 20/25 | 完全無測試 |

---

#### ❌ 缺失 1：Key 格式不符規格 [嚴重]

**規格要求**: `mh_draft_{userId}`
**實際實作**: `mh_draft_upload`

**問題**: 所有用戶共享同一個 draft key，A 用戶的草稿會被 B 用戶覆蓋。

**修正引導**:
1. `UploadContext` 需從 `supabase.auth.getUser()` 取得 userId
2. 將 userId 傳入 `usePropertyDraft(form, userId)`
3. Hook 內部組合 key: `${DRAFT_KEY_PREFIX}_${userId || 'anonymous'}`
4. 匿名用戶使用 `anonymous` 作為 fallback，登入後應觸發 migration

---

#### ❌ 缺失 2：getDraftPreview 返回假資料 [偷懶]

**問題**: `savedAt: '剛才'` 是硬編碼，用戶無法得知草稿實際儲存時間。

**修正引導**:
1. 儲存時加入時間戳: `{ ...draftData, _savedAt: Date.now() }`
2. `getDraftPreview` 計算相對時間: `formatDistanceToNow(savedAt, { locale: zhTW })`
3. 使用 `date-fns` 或手寫簡易版: `<1分鐘前 / X分鐘前 / X小時前 / X天前`

---

#### ❌ 缺失 3：無草稿版本號 [風險]

**問題**: 草稿結構日後變更時，舊草稿解析會失敗或導致 UI 錯亂。

**修正引導**:
1. 定義 `DRAFT_VERSION = 1`
2. 儲存時: `{ _version: DRAFT_VERSION, ...draftData }`
3. 讀取時檢查: `if (parsed._version !== DRAFT_VERSION) { clearDraft(); return null; }`
4. 版本不符時自動清除並提示用戶

---

#### ❌ 缺失 4：Hook 呼叫方式有效能問題 [技術債]

**問題代碼**:
```tsx
const draftFormData = useCallback(() => ({ ...form }), [form]);
const { ... } = usePropertyDraft(draftFormData()); // ← 每次 render 都調用!
```

**問題**: `draftFormData()` 每次 render 都執行並產生新物件，導致 Hook 內部 useEffect 不必要觸發。

**修正引導**:
1. 移除 `useCallback` 包裝的函數調用
2. 直接將 `form` 相關欄位作為 dependency 傳入
3. 或使用 `useMemo` 產生穩定的物件引用:
   ```tsx
   const draftData = useMemo(() => ({ title: form.title, ... }), [form.title, ...]);
   const { ... } = usePropertyDraft(draftData);
   ```

---

#### ❌ 缺失 5：還原失敗無用戶反饋 [UX]

**問題**: `restoreDraft` 返回 `null` 時沒有通知用戶。

**修正引導**:
1. `handleRestoreDraft` 中檢查返回值
2. 失敗時: `notify.error('草稿還原失敗', '草稿可能已損壞或過期')`
3. 同時清除損壞的草稿: `clearDraft()`

---

#### ❌ 缺失 6：無草稿過期機制 [技術債]

**問題**: 草稿永遠存在 localStorage，即使是 30 天前的也不會清除。

**修正引導**:
1. 定義 `DRAFT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000` (7 天)
2. `hasDraft` 檢查: `if (Date.now() - parsed._savedAt > DRAFT_EXPIRY_MS) { clearDraft(); return false; }`
3. 過期時自動清除，不打擾用戶

---

#### ❌ 缺失 7：完全無測試 [重大風險]

**問題**: 沒有任何單元測試或 E2E 測試，無法保證重構後功能正常。

**修正引導**:
1. 建立 `src/hooks/__tests__/usePropertyDraft.test.ts`
2. 測試案例:
   - `should save draft after 1000ms debounce`
   - `should restore draft correctly`
   - `should clear draft on clearDraft()`
   - `should return null for expired draft`
   - `should handle corrupted localStorage gracefully`
3. Mock `localStorage` 使用 `vitest` 的 `vi.spyOn`

---

#### ⚠️ 缺失 8：draftAvailable 狀態管理錯誤 [Bug]

**問題代碼**:
```tsx
useEffect(() => {
  setDraftAvailable(hasDraft());
}, [hasDraft]);
```

**問題**: `hasDraft` 是函數引用，不會因為 localStorage 變化而觸發 re-render。

**修正引導**:
1. 改為在組件掛載時檢查一次: `useEffect(() => { setDraftAvailable(hasDraft()); }, [])`
2. 或改為 computed 值: `const draftAvailable = hasDraft()`，不用 useState

---

#### ⚠️ 缺失 9：多分頁衝突 [進階]

**問題**: 同一用戶開多個分頁編輯時，草稿會互相覆蓋。

**修正引導** (P2 優先級):
1. 使用 `BroadcastChannel` 或 `storage` event 監聽其他分頁變化
2. 偵測到衝突時提示: `您在其他分頁有更新的草稿，是否載入？`
3. 簡易版: 儲存時加入 `_tabId = crypto.randomUUID()`，讀取時比對

---

#### ⚠️ 缺失 10：還原按鈕缺少草稿預覽資訊 [UX]

**問題**: 按鈕只顯示「還原草稿」，用戶不知道草稿內容是什麼。

**修正引導**:
1. 按鈕改為 Tooltip 或展開式:
   ```
   還原草稿
   └─ 標題: 信義區三房...
   └─ 儲存於: 5 分鐘前
   ```
2. 使用 `getDraftPreview()` 取得標題和時間

---

#### ⚠️ 缺失 11：沒有「捨棄草稿」功能 [UX]

**問題**: 用戶無法主動清除草稿，只能發布成功後自動清除。

**修正引導**:
1. 在「還原草稿」按鈕旁加入「捨棄」按鈕或下拉選單
2. 捨棄前確認: `確定要捨棄草稿嗎？此操作無法復原`
3. 確認後調用 `clearDraft()` 並 `setDraftAvailable(false)`

---

#### ⚠️ 缺失 12：匿名用戶登入後草稿遷移 [進階]

**問題**: 匿名用戶填寫一半後登入，原本的 `anonymous` 草稿會遺失。

**修正引導** (P2 優先級):
1. 監聽 `supabase.auth.onAuthStateChange`
2. 登入時檢查 `mh_draft_upload_anonymous` 是否存在
3. 存在則遷移到 `mh_draft_upload_{userId}` 並刪除舊 key

---

### 📋 UP-1 修正優先級

| 優先級 | 缺失編號 | 描述 | 預估工時 |
|:---:|:---:|:---|:---:|
| P0 | 1 | Key 格式 + userId | 30min |
| P0 | 2 | 時間戳顯示 | 20min |
| P0 | 3 | 版本號 | 15min |
| P0 | 4 | 效能問題修正 | 20min |
| P1 | 5 | 還原失敗反饋 | 10min |
| P1 | 6 | 過期機制 | 15min |
| P1 | 7 | 測試補齊 | 60min |
| P1 | 8 | 狀態管理修正 | 10min |
| P2 | 9 | 多分頁衝突 | 45min |
| P2 | 10 | 預覽資訊 | 20min |
| P2 | 11 | 捨棄功能 | 15min |
| P2 | 12 | 登入遷移 | 30min |

**總預估工時**: P0 (85min) + P1 (95min) = 3 小時

---

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
