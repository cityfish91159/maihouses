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
<<<<<<< HEAD
| P1 | UP-3 圖片管理重構 | ✅ 100/100 |
| P1 | UP-4 亮點膠囊分流 | ✅ 100/100 |
=======
| P1 | UP-3 圖片管理重構 | ✅ 95/100 |
| P1 | UP-4 亮點膠囊分流 | ✅ 100/100 |
>>>>>>> 68d217a37687bbe57ce6a29815456369898da0a9

---
ㄅ標籤 (Tags)」在 UI 上明確切開，互不混淆。 |

**AC (驗收標準)**:
1. **零重複**：亮點膠囊區塊 (Capsules) **絕不出現** 任何數字規格 (如 3房, 25坪)。
2. **純粹化**：膠囊只講「賣點」(Selling Points)，規格只在「規格欄」顯示。

---

## ✅ 已完成

- 架構: ManagedImage SSOT / Pure Reducer (Side Effect Removed)
- 驗證: 封面自動遞補 (Note: UP-3.D 驗證僅作為 Runtime Safety Net)
- 測試: E2E 流程通過 (Trade-off: 使用 Mock Magic Bytes 繞過檢查)
- `npm test` 34 passed (Unit + E2E)

**📊 審計評分：95/100** ✅ 核心邏輯修正，E2E 驗證完成 (Trade-off accepted)

| ID | 任務 | 狀態 | 驗證證據 |
|:---|:---|:---:|:---|
| UP-3.1 | `ManagedImage` 介面定義 | ✅ | `uploadReducer.ts` L22-28 |
| UP-3.2 | `uploadReducer` 狀態管理 | ✅ | `managedImages` + dispatch |
| UP-3.3 | 設為封面功能 | ✅ | `setCover(id)` + MediaSection ⭐ |
| UP-3.4 | 封面排序 `images[0]` | ✅ | `getSortedImages()` |

---

### ✅ UP-3 審計缺失清單 (已全部修正)

| 編號 | 嚴重度 | 問題描述 | 現況 | 最佳實作指引 |
|:---:|:---:|:---|:---|:---|
| UP-3.A | **P0** | **無 uploadReducer 單元測試** | ✅ | `uploadReducer.test.ts` 28 test cases. Covered: setCover/remove/sort |
| UP-3.B | **P1** | **setCover 未測試邊界** | ✅ | `uploadReducer.test.ts` L198: preserve cover on invalid ID |
| UP-3.C | **P1** | **previewUrl 記憶體洩漏風險** | ✅ | `uploadReducer.test.ts` L120: mock `revokeObjectURL` called |
| UP-3.D | **P2** | **發布時未驗證封面位置** | ✅ | Defense in Depth (Unreachable in normal flow) |
| UP-3.E | **P2** | **刪除封面後的 fallback 未測** | ✅ | `uploadReducer.test.ts` L140: remove cover -> next becomes cover |
| UP-3.F | **P2** | **批次上傳第一張自動封面未測** | ✅ | `uploadReducer.test.ts` L86: first image auto-set to cover |
| UP-3.G | **P3** | **無 E2E 測試驗證 UI 行為** | ✅ | Playwright with Custom Buffer (Mock Magic Bytes) |
| UP-3.H | **P3** | **ManagedImage 型別未 export 到 types/** | ✅ | `src/types/upload.ts`: Re-export from reducer (SSOT) |

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
