# 🏠 P9: 首頁社區評價聚合 API 導入

> **專案狀態**: 🟡 **Phase 1 完成**
> **最後更新**: 2025-12-15
> **目標**: 外觀不變，資料源從靜態切換為 API 混合模式
> **核心策略**: 後端聚合 + 自動補位 (Hybrid Reviews System)

---

## ✅ Phase 1: 後端 API - 已完成

### P9-1: `api/home/featured-reviews.ts` ✅

**檔案位置**: `/api/home/featured-reviews.ts`

**已實作功能**:
1. ✅ 從 Supabase `community_reviews` 撈取真實資料
2. ✅ 不足 6 筆時用 `SERVER_SEEDS` 補位
3. ✅ 統一輸出格式 (Adapter Pattern)
4. ✅ 設定 Cache Header (`s-maxage=60, stale-while-revalidate=300`)
5. ✅ CORS 設定
6. ✅ 錯誤降級機制 (API 異常時仍回傳 Mock)

**API 回應格式**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "displayId": "01",
      "name": "匿名房仲｜認證評價",
      "rating": 5,
      "tags": ["#優點1", "#優點2"],
      "content": "推薦優點：...",
      "communityId": "uuid",
      "source": "real",
      "region": "taiwan"
    }
  ],
  "meta": {
    "total": 6,
    "realCount": 0,
    "seedCount": 6,
    "timestamp": "2025-12-15T..."
  }
}
```

**驗證結果**:
- TypeScript 編譯: ✅ 通過
- Vite Build: ✅ 通過 (18.73s)

---

## 📝 待實作清單

### Phase 2: 前端服務層

- [ ] **P9-2**: 更新 `src/services/communityService.ts`
  - 新增 `getFeaturedHomeReviews()` 函數
  - 錯誤處理 + fallback

### Phase 3: UI 整合

- [ ] **P9-3**: 更新 `CommunityTeaser.tsx`
  - 改用 `useEffect` + `useState` 取代靜態 import
  - 保持 UI 外觀完全不變
  - 處理點擊導向邏輯 (Mock vs Real)

### Phase 4: 保底機制

- [ ] **P9-4**: 更新 `src/constants/data.ts`
  - 將 `COMMUNITY_REVIEWS` 改名為 `BACKUP_REVIEWS`

---

## 📊 測試計畫

### API 端點測試
- [ ] 部署後測試: `https://maihouses.vercel.app/api/home/featured-reviews`
- [ ] 驗證回傳 6 筆資料
- [ ] 驗證 `source: "seed"` (目前無真實資料)

---

## 📁 檔案變更清單

| 檔案 | 操作 | 狀態 |
|------|------|------|
| `api/home/featured-reviews.ts` | 新增 | ✅ 完成 |
| `src/services/communityService.ts` | 修改 | ⬜ 待做 |
| `src/features/home/sections/CommunityTeaser.tsx` | 修改 | ⬜ 待做 |
| `src/constants/data.ts` | 修改 | ⬜ 待做 |
