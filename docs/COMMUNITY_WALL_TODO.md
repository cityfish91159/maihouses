## 總改進事項
- [ ] 實作 `implementation_guide.md` 規劃的後端 API routes（/wall, /post, /like, /question），完成資料庫串接並能服務前端現有的 React Query hook。
- [ ] 建立 API ↔ 前端 adapter 層，統一 `ApiPost`、`Post`、`CommunityInfo` 等型別，移除 `communityService.ts` 與 `useCommunityWallData.ts` 之間的 mock fallback。
- [ ] 讓 Review 與 CommunityInfo 走真實來源：依 `code_analysis.md` 的建議補齊 join 與統計欄位，消除假值與固定 0 的欄位。
- [ ] 強化權限/同步流程：修復樂觀更新的 private tab、補上後端權限 middleware、調整 `LockedOverlay` 以避免佈局跳動。
- [ ] 套用性能優化（LRU cache、虛擬滾動或分頁、Sidebar 排序 useMemo）確保大社區場景仍順暢。

---

### 首頁
- (1) 依 `COMMUNITY_WALL_COMPLETE_CODE.md` 與 `code_analysis.md` 深度比對前後端，確認首屏所需的 community info 與 posts API 結構一致。
- (2) 優先處理關鍵錯誤：API 缺失、community info 永遠 mock、型別對不上導致 runtime 錯誤。
- (3) 建議以統一格式的 `/wall/:communityId` 響應（含 info/posts/reviews/questions）餵給首頁，並啟用虛擬滾動避免首屏渲染阻塞。

### 帳戶
- (1) 詳讀 `implementation_guide.md` 的權限流程與 `code_analysis.json` 列出的角色對映，確認帳戶/角色切換與權限 provider 設計一致。
- (2) 找出權限重複計算與缺失（如 private wall 未驗證、樂觀更新誤觸），並記錄於 `code_analysis.md` 指出的衝突清單。
- (3) 將權限驗證下沉至後端 middleware，再由前端透過 Auth/Permission Context 共用，確保帳戶狀態變化時前後端同步。

### 回答
- (1) 參考 `COMMUNITY_WALL_COMPLETE_CODE.md` 的 QA 區段與 `code_analysis.md` 的 type 衝突，重新審視 Answer/Question 結構。
- (2) 修正 Answer type 混亂與 reviewer 假值問題，確保 API/前端欄位一一對應、權限標記清楚。
- (3) 推薦在 adapter 層拆分 `authorType`、`isOfficial`、`isExpert`，並把回答串接到後端 PUT /question API 以支援追問/回答流程。

### 鏈接
- (1) 通盤檢查 `code_analysis.md` 指出的 API endpoint 覆蓋率，確定每個連結（reviews、questions、posts）都有實體 route。
- (2) 找出前端呼叫與後端 URL 命名不一致、或需要 includePrivate 卻未帶參數的情況。
- (3) 規劃統一的 `ApiResponse<T>` 包裝與路由命名，使前後端鏈接協議單一來源，方便版本管理。

### 圖片們
- (1) 依 `code_analysis.md` 的性能建議確認圖片/媒體載入策略，特別是 posts/reviews 的 avatar、樓層示意圖。
- (2) 找出會造成 FOUC 或閃爍的 overlay/blur 實作，並標記需要 lazy loading 或骨架的元件。
- (3) 將圖片資源納入 adapter/快取策略（如 LRU + CDN URL 生成），確保在整合 API 後仍維持快速回應。
