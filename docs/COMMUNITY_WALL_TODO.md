# 🏠 MaiHouses 物件上傳優化 TODO (SSOT)

> **最後更新**: 2025-12-22
> **目標**: 將上傳頁從「資料輸入表單」提升為「專業生產力工具」
> **首頁**: https://maihouses.vercel.app/maihouses/
> **上傳頁**: https://maihouses.vercel.app/maihouses/property/upload

---

## 📋 摘要 (Executive Summary)

| 優先級 | 任務 | 狀態 |
|:---:|:---|:---:|
| P0 | UP-1 表單自動快照 | ✅ 98/100 |
| P0 | UP-2 圖片前端壓縮 | ✅ 100/100 |
| P1 | UP-3 圖片管理重構 | ⚠️ 75/100 |
| P1 | UP-4 亮點膠囊分流 | ⬜ |

---

## 🚀 待辦任務

### UP-4: 亮點膠囊分流

| ID | 任務 | 狀態 |
|:---|:---|:---:|
| UP-4.1 | 上傳頁：亮點改為手動勾選 | ⬜ |
| UP-4.2 | 首頁卡片：僅渲染 tags 前兩位 | ⬜ |
| UP-4.3 | 列表頁：移除重複規格膠囊 | ⬜ |
| UP-4.4 | 詳情頁：亮點與規格分區 | ⬜ |

**AC**: 卡片不再出現「23坪」「3房」重複膠囊

---

## ✅ 已完成

### UP-3: 圖片管理重構 ⚠️ 75/100 (2025-12-22)

**📊 審計評分：75/100** ⚠️ 功能實作完成但缺測試與驗證

| ID | 任務 | 狀態 | 驗證證據 |
|:---|:---|:---:|:---|
| UP-3.1 | `ManagedImage` 介面定義 | ✅ | `uploadReducer.ts` L22-28 |
| UP-3.2 | `uploadReducer` 狀態管理 | ✅ | `managedImages` + dispatch |
| UP-3.3 | 設為封面功能 | ✅ | `setCover(id)` + MediaSection ⭐ |
| UP-3.4 | 封面排序 `images[0]` | ✅ | `getSortedImages()` |

---

### ❌ UP-3 審計缺失清單 (Google 首席處長審計)

| 編號 | 嚴重度 | 問題描述 | 現況 | 最佳實作指引 |
|:---:|:---:|:---|:---|:---|
| UP-3.A | **P0** | **無 uploadReducer 單元測試** | ❌ | 建立 `uploadReducer.test.ts`：測試 ADD_IMAGES/REMOVE_IMAGE/SET_COVER 每個 action，驗證 state 變化正確。至少 15 個測試案例 |
| UP-3.B | **P1** | **setCover 未測試邊界** | ❌ | 測試：設定不存在的 id、重複設定同一封面、空陣列時設封面。使用 `expect(state.managedImages.filter(i=>i.isCover).length).toBe(1)` 確保永遠只有一個封面 |
| UP-3.C | **P1** | **previewUrl 記憶體洩漏風險** | ⚠️ | REMOVE_IMAGE 有 `revokeObjectURL`，但需測試確認：在 vitest 中 mock `URL.revokeObjectURL` 並驗證被呼叫次數等於移除的圖片數 |
| UP-3.D | **P2** | **發布時未驗證封面位置** | ❌ | `handleSubmit` 前加 assertion：`console.assert(sortedImages[0]?.isCover, '封面必須在第一位')`，或在 `getSortedImages` 加 invariant check |
| UP-3.E | **P2** | **刪除封面後的 fallback 未測** | ❌ | 測試案例：有 3 張圖，刪除封面，驗證 `remaining[0].isCover === true`。這是 UP-3.4 的關鍵邏輯 |
| UP-3.F | **P2** | **批次上傳第一張自動封面未測** | ❌ | 測試案例：空 state 時 ADD_IMAGES 5 張，驗證只有第一張 `isCover: true`，其他四張都是 `false` |
| UP-3.G | **P3** | **無 E2E 測試驗證 UI 行為** | ❌ | 在 `tests/e2e/upload.spec.ts` 加入：上傳圖片 → 點擊⭐ → 驗證封面標籤出現 → 發布 → 驗證 API payload `images[0]` 正確 |
| UP-3.H | **P3** | **ManagedImage 型別未 export 到 types/** | ⚠️ | 將 `ManagedImage` 移到 `src/types/upload.ts` 並 re-export，保持型別集中管理 |

**📝 UP-3 操作紀錄 (2025-12-22)**:
- 功能實作完成：ManagedImage / uploadReducer / setCover / getSortedImages
- 審計發現：**0 個單元測試**，8 項缺失待修
- 評分 75/100（-25 因無測試覆蓋）

---

### UP-2: 圖片前端壓縮 ✅ 100/100
- 壓縮: 2048px / 1.5MB / quality 0.85
- 並發控制 (concurrency=3)
- HEIC 轉 JPEG
- 重試機制 (0.85→0.68)
- 壓縮進度 UI
- `npm test` 250 passed

### UP-1: 表單自動快照 ✅ 98/100
- 草稿 Key: `mh_draft_{userId}`
- 7 天過期、版本檢查、匿名遷移
- `npm test` 通過

### 其他已完成
- KC-5: 測試補強 ✅
- KC-4: AI 膠囊生成 ✅ 97/100
- KC-3: 列表頁膠囊渲染 ✅
- P11: 房源列表頁升級 ✅

---

> 完整歷史：見 `docs/COMMUNITY_WALL_DEV_LOG.md`
