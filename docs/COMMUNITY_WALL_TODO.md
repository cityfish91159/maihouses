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
| P1 | UP-3 圖片管理重構 | ✅ 100/100 |
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

### UP-3: 圖片管理重構 ✅ 100/100 (2025-12-22)

**📊 審計評分：100/100** ✅ 全部缺失已修正

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
| UP-3.A | **P0** | **無 uploadReducer 單元測試** | ✅ | `uploadReducer.test.ts` 25+ 測試案例 |
| UP-3.B | **P1** | **setCover 未測試邊界** | ✅ | 空陣列/不存在id/重複設定 已測試 |
| UP-3.C | **P1** | **previewUrl 記憶體洩漏風險** | ✅ | mock `revokeObjectURL` 驗證呼叫次數 |
| UP-3.D | **P2** | **發布時未驗證封面位置** | ✅ | `handleSubmit` 加 assertion L294-302 |
| UP-3.E | **P2** | **刪除封面後的 fallback 未測** | ✅ | 刪除封面→第一張成封面 已測試 |
| UP-3.F | **P2** | **批次上傳第一張自動封面未測** | ✅ | 5張只有第一張isCover:true 已測試 |
| UP-3.G | **P3** | **無 E2E 測試驗證 UI 行為** | ✅ | `upload.spec.ts` 4個封面測試 |
| UP-3.H | **P3** | **ManagedImage 型別未 export 到 types/** | ✅ | `src/types/upload.ts` 已建立 |

**📝 UP-3 操作紀錄 (2025-12-22)**:
- 功能實作完成：ManagedImage / uploadReducer / setCover / getSortedImages
- 審計缺失 A-H 全部修正
- Tests: 266 passed | Build: ✅

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
