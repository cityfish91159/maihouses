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
| P1 | UP-3 圖片管理重構 | ✅ 95/100 |
| P1 | UP-4 亮點膠囊分流 | ⚠️ 65/100 |

---

## ✅ 已完成

### UP-4: 亮點膠囊分流 (Spec vs Feature Separation) ⚠️ 65/100

| ID | 任務 | 狀態 | 核心驗證 |
|:---|:---|:---:|:---|
| UP-4.1 | **源頭清洗**：上傳/AI 生成排除規格 | ✅ | **[Strict Regex]** `tagUtils` 正則庫擴充 (含高樓層/朝向/管理費)，API 端主動移除規格注入，確保源頭純淨。 |
| UP-4.2 | **卡片精簡**：首頁僅渲染前 2 特色 | ✅ | **[Runtime Guard]** PropertyCard 強制執行 `!isSpecTag` 過濾，確保 UI 只有亮點。 |
| UP-4.3 | **顯示防呆**：列表頁 Runtime 過濾 | ✅ | **[Defense]** ChatPropertyCard 等組件同步套用正則防護。 |
| UP-4.4 | **詳情頁**：分區佈局重構 | ✅ | **[Layout]** 詳情頁嚴格執行「上膠囊(Highlight) / 下規格(Spec)」分流，互不混淆。 |

**📊 審計評分：65/100** ⚠️ (發現重大邏輯缺陷與偷懶實作)

**UP-4 審計缺失 (Checklist)**:
| 編號 | 嚴重度 | 問題描述 | 建議方案 |
|:---:|:---:|:---|:---|
| UP-4.A | **P0** | `PropertyCard` 過濾規格後，卡片完全不顯示坪數/格局 | **[UX Fix]** 在卡片標題下方或價格旁新增「規格摘要列」，顯示坪數與房型。 |
| UP-4.B | **P0** | `buildKeyCapsuleTags` 忽略 `size/rooms/floor` 等參數 | **[Logic Fix]** 實作規格轉標籤邏輯，確保亮點不足時能由規格自動遞補。 |
| UP-4.C | P1 | `tagUtils` 與 `HighlightPicker` 預設清單衝突 (高樓層) | **[Consistency]** 統一定義：若「高樓層」是亮點，則不應出現在 `SPEC_PATTERNS`。 |
| UP-4.D | P1 | `HighlightPicker` 使用 `alert()` 攔截，UX 體驗差 | **[UX Fix]** 改用 `toast` 或輸入框下方的 `helper-text` 紅字提示。 |
| UP-4.E | P2 | `MAX_TAG_LENGTH = 5` 限制過死 | **[UX Fix]** 放寬至 8-10 字，容納「捷運步行5分」等高品質描述。 |
| UP-4.F | P2 | `PropertyDetailPage` 重複執行 `isSpecTag` 過濾 | **[Refactor]** 將過濾邏輯收斂至 `buildKeyCapsuleTags` 內部。 |

**💡 首席架構師引導意見 (The World's Best Guidance)**:
> 「真正的分流不是『隱藏』，而是『歸位』。目前的實作只是簡單地把規格從標籤雲中踢除，卻忘記在卡片上為它們找一個新家，導致用戶在首頁失去判斷房源價值的核心數據。
> 
> **解決之道**：
> 1. **重構 `PropertyCard`**：不要只會 filter，請在 `tags` 區塊上方新增一行 `text-slate-500` 的規格文字（如：`34.2 坪 · 3 房 2 廳`），這才是專業的房地產卡片。
> 2. **賦予 `buildKeyCapsuleTags` 靈魂**：它不該只是個過濾器，它應該是個『智慧組裝器』。當 `advantage` 不足時，它應自動將 `size` 和 `rooms` 格式化為精美的膠囊補位。
> 3. **消除邏輯內耗**：決定好『高樓層』的定位。如果它是賣點，就讓它通過；如果它是規格，就把它從亮點選單中移除。不要讓系統在後台偷偷刪除用戶剛選好的標籤。」

---

### UP-3: 圖片管理重構 (Image Consistency) ✅ 95/100

- 架構: ManagedImage SSOT / Pure Reducer (Side Effect Removed)
- 驗證: 封面自動遞補 (Runtime Safety Net Verified)
- 測試: E2E 流程通過 (Trade-off: 使用 Mock Magic Bytes 繞過檢查)
- `npm test` 34 passed (Unit + E2E)

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
