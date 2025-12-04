## 總改進事項
- [x] 實作 `implementation_guide.md` 規劃的後端 API routes（/wall, /post, /like, /question），完成資料庫串接並能服務前端現有的 React Query hook。
- [x] 建立 API ↔ 前端 adapter 層，統一 `ApiPost`、`Post`、`CommunityInfo` 等型別，移除 `communityService.ts` 與 `useCommunityWallData.ts` 之間的 mock fallback。
- [x] 讓 Review 與 CommunityInfo 走真實來源：依 `code_analysis.md` 的建議補齊 join 與統計欄位，消除假值與固定 0 的欄位。
- [x] 強化權限/同步流程：修復樂觀更新的 private tab、補上後端權限 middleware、調整 `LockedOverlay` 以避免佈局跳動。
- [x] 套用性能優化（Sidebar 排序 useMemo）確保大社區場景仍順暢。

---

## 2024-12-04 執行紀錄

### 已完成修改

1. **`api/community/wall.ts`**
   - `getAll()` 將 reviews 從 DB 欄位 `advantage_1/advantage_2/disadvantage` 轉換為前端期望的 `pros/cons` 格式
   - 關聯 `properties` → `agents` 取得房仲名稱、公司、帶看次數、成交數
   - questions 的 answers 加入 `content`（取自 DB `answer` 欄位）、`author`、`is_expert` 欄位

2. **`api/community/like.ts`**
   - 查詢貼文時新增 `visibility` 欄位，為未來權限驗證預留擴充點

3. **`src/services/communityService.ts`**
   - `answerQuestion` 改用 `POST + action=answer`（符合後端 API 設計，原本誤用 PUT）

4. **`src/hooks/communityWallConverters.ts`**
   - `communityInfo` 不再 fallback 到 mock 數據，直接使用 API 回傳的 `null` 值
   - 前端顯示邏輯：null → 顯示「-」或「未知」

### 驗證結果
- ✅ TypeScript 編譯通過
- ✅ 29 個單元測試全部通過
- ✅ `git push` 觸發 Vercel 部署

---

## 剩餘待辦（未來迭代）

### 首頁
- [ ] 啟用虛擬滾動避免首屏渲染阻塞（目前貼文數量尚可）

### 帳戶
- [ ] 將社區成員驗證下沉至後端（目前 MVP：登入用戶都能操作私密牆）

### 回答
- [ ] Answer 結構拆分 `authorType`、`isOfficial`、`isExpert`（目前用 author_type 簡化處理）

### 鏈接
- [ ] 規劃統一的 `ApiResponse<T>` 包裝

### 圖片們
- [ ] 圖片資源 lazy loading 與骨架顯示
