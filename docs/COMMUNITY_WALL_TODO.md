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
| P1 | UP-4 亮點膠囊分流 | ✅ 85/100 |


## ✅ 已完成

### UP-4: 亮點膠囊分流 (Spec vs Feature Separation) ✅ 85/100

| ID | 任務 | 狀態 | 核心驗證 |
|:---|:---|:---:|:---|
| UP-4.1 | **源頭清洗**：上傳/AI 生成排除規格 | ✅ | **[Strict Regex]** `tagUtils` 正則庫擴充 (含高樓層/朝向/管理費)，API 端主動移除規格注入，確保源頭純淨。 |
| UP-4.2 | **卡片精簡**：首頁僅渲染前 2 特色 | ✅ | **[Runtime Guard]** PropertyCard 強制執行 `!isSpecTag` 過濾，確保 UI 只有亮點。 |
| UP-4.3 | **顯示防呆**：列表頁 Runtime 過濾 | ✅ | **[Defense]** ChatPropertyCard 等組件同步套用正則防護。 |
| UP-4.4 | **詳情頁**：分區佈局重構 | ✅ | **[Layout]** 詳情頁嚴格執行「上膠囊(Highlight) / 下規格(Spec)」分流，互不混淆。 |

**📊 審計評分：85/100** ✅ (分流邏輯正確，存在少數 UX 與一致性問題)

**UP-4 審計缺失 (Checklist)**:
| 編號 | 嚴重度 | 問題描述 | 建議方案 |
|:---:|:---:|:---|:---|
| UP-4.A | **P1** | `tagUtils` 與 `HighlightPicker` 預設清單衝突 (高樓層) | **[Consistency]** 「高樓層」在 `SPEC_PATTERNS` 中被過濾，但 `HighlightPicker` 卻將其列為亮點。二者須統一：若為亮點則從正則移除，若為規格則從選單移除。 |
| UP-4.B | P1 | `HighlightPicker` 使用 `alert()` 攔截，UX 體驗差 | **[UX Fix]** 改用 `toast` 或輸入框下方的 `helper-text` 紅字提示，避免阻塞式對話框。 |
| UP-4.C | P2 | `MAX_TAG_LENGTH = 5` 限制過死 | **[UX Fix]** 放寬至 8-10 字，容納「捷運步行5分」「全新裝潢含家電」等高品質描述。 |
| UP-4.D | P3 | `PropertyDetailPage` 重複執行 `isSpecTag` 過濾 | **[Refactor]** 過濾已在 `buildKeyCapsuleTags` 執行，DetailPage 可移除冗餘調用。 |

**💡 首席架構師引導意見 (The World's Best Guidance)**:
> 「分流的核心精神是『各司其職』—— 亮點膠囊只講賣點，規格區專職數據。目前的實作方向完全正確：過濾規格後不讓它們污染亮點膠囊，這是對的。
> 
> **僅需收尾的細節**：
> 1. **消除邏輯內耗**：`SPEC_PATTERNS` 包含 `/^(高|中|低)樓層$/`，但 `HighlightPicker` 的預設清單卻有『高樓層』。這會導致用戶選了標籤卻被系統過濾的詭異體驗。請統一定義：若『高樓層』是賣點，從正則中移除；若是規格，從選單中移除。
> 2. **提升輸入體驗**：`alert()` 攔截規格輸入太粗暴，請改用 `sonner` toast 或紅字提示，讓用戶明白原因但不被打斷。
> 3. **放寬字數限制**：5 字上限會扼殺高品質亮點（如『雙捷運交匯3分鐘』），8-10 字更合理。」


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
