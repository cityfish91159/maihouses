# 🏠 MaiHouses 物件上傳優化 TODO (SSOT)

> **最後更新**: 2025-12-23
> **目標**: 將上傳頁從「資料輸入表單」提升為「專業生產力工具」
> **首頁**: https://maihouses.vercel.app/maihouses/
> **上傳頁**: https://maihouses.vercel.app/maihouses/property/upload


## 📋 摘要 (Executive Summary)

| 優先級 | 任務 | 狀態 |
|:---:|:---|:---:|
| P0 | UP-1 表單自動快照 | ✅ 98/100 |
| P0 | UP-2 圖片前端壓縮 | ✅ 100/100 |
| P1 | UP-3 圖片管理重構 | ✅ 95/100 |
| P1 | UP-4 亮點膠囊分流 | ✅ 100/100 |


## ✅ 已完成

### UP-4: 亮點膠囊分流 (Spec vs Feature Separation) ✅ 100/100

| ID | 任務 | 狀態 | 核心驗證 |
|:---|:---|:---:|:---|
| UP-4.1 | **源頭清洗**：上傳/AI 生成排除規格 | ✅ | **[Strict Regex]** `tagUtils` 正則庫擴充 (朝向/管理費等)，高樓層視為亮點保留。 |
| UP-4.2 | **卡片精簡**：首頁僅渲染前 2 特色 | ✅ | **[Runtime Guard]** PropertyCard 強制執行 `!isSpecTag` 過濾，確保 UI 只有亮點。 |
| UP-4.3 | **顯示防呆**：列表頁 Runtime 過濾 | ✅ | **[Defense]** ChatPropertyCard 等組件同步套用正則防護。 |
| UP-4.4 | **詳情頁**：分區佈局重構 | ✅ | **[Layout]** 詳情頁嚴格執行「上膠囊(Highlight) / 下規格(Spec)」分流，互不混淆。 |

**📊 審計評分：100/100** ✅ (全部缺失已修正)

**UP-4 審計缺失修正 (Checklist)**:
| 編號 | 嚴重度 | 問題描述 | 現況 |
|:---:|:---:|:---|:---:|
| UP-4.A | P1 | `tagUtils` 與 `HighlightPicker` 預設清單衝突 (高樓層) | ✅ 從 SPEC_PATTERNS 移除 |
| UP-4.B | P1 | `HighlightPicker` 使用 `alert()` 攔截 | ✅ 改用 toast.error |
| UP-4.C | P2 | `MAX_TAG_LENGTH = 5` 限制過死 | ✅ 放寬至 10 字 |
| UP-4.D | P3 | `PropertyDetailPage` 重複執行 `isSpecTag` 過濾 | ✅ 移除冗餘 import 與 filter |


### UP-3: 圖片管理重構 (Image Consistency) ✅ 95/100


**📊 審計評分：95/100** ✅ (Core Logic Fixed)

| ID | 任務 | 狀態 | 驗證證據 |
|:---|:---|:---:|:---|
| UP-3.1 | `ManagedImage` 介面定義 | ✅ | `uploadReducer.ts` L22-28 |
| UP-3.2 | `uploadReducer` 狀態管理 | ✅ | `managedImages` + dispatch |
| UP-3.3 | 設為封面功能 | ✅ | `setCover(id)` + MediaSection ⭐ |
| UP-3.4 | 封面排序 `images[0]` | ✅ | `getSortedImages()` |

**UP-3 審計缺失修正 (Checklist)**:
| 編號 | 嚴重度 | 問題描述 | 現況 |
|:---:|:---:|:---|:---|
| UP-3.A | P0 | 無 uploadReducer 單元測試 | ✅ |
| UP-3.B | P1 | setCover 未測試邊界 | ✅ |
| UP-3.C | P1 | previewUrl 記憶體洩漏風險 | ✅ |
| UP-3.D | P2 | 發布時未驗證封面位置 | ✅ |
| UP-3.E | P2 | 刪除封面後的 fallback 未測 | ✅ |
| UP-3.F | P2 | 批次上傳第一張自動封面未測 | ✅ |
| UP-3.G | P3 | 無 E2E 測試驗證 UI 行為 | ✅ |
| UP-3.H | P3 | ManagedImage 型別未 export | ✅ |


### UP-2: 圖片前端壓縮 ✅ 100/100

### UP-1: 表單自動快照 ✅ 98/100

### 其他已完成


> 完整歷史：見 `docs/COMMUNITY_WALL_DEV_LOG.md`
