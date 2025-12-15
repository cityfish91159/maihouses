# 🏠 P9: 首頁社區評價聚合 API 導入

> **專案狀態**: ✅ **Phase 1 完成 (100/100)**
> **最後更新**: 2025-12-15
> **目標**: 外觀不變，資料源從靜態切換為 API 混合模式
> **核心策略**: 後端聚合 + 自動補位 (Hybrid Reviews System)

---

## ✅ P9-1 審查發現的問題 - 全部已修復 (100/100)

### ✅ P1: API 回傳格式與 UI 不相容 (已修復)

**問題**：API 回傳 `displayId: "01"`，但 `ReviewCard` 期望 `id: "J"` (首字母)

**修復方式**：
- 新增 `extractDisplayId()` 函數，從 name 提取首字
- 真實資料："匿名住戶" → `displayId: "匿"`
- Mock 資料："林小姐" → `displayId: "林"`

**驗證**：
```json
{ "displayId": "匿", "name": "匿名用戶｜認證評價" }
{ "displayId": "林", "name": "林小姐｜平台精選" }
```

---

### ✅ P2: displayId 計算邏輯問題 (已修復)

**問題**：`index + 1` 計算會導致 Mock 和 Real 資料編號衝突

**修復方式**：
- 移除數字編號，改用 `extractDisplayId()` 從名字取首字
- 不再有編號衝突問題

---

### ✅ P3: rating 硬編碼 5 星 (已修復)

**問題**：所有真實評價都顯示 5 星，與原本 3-5 星混合不同

**修復方式**：
- 新增 `calculateRating()` 函數
- 真實資料：有 `disadvantage` → 4 星，無 → 5 星
- Mock 資料：手動設定多樣化評分 (4-5 星)

**驗證**：
```json
{ "rating": 4, "source": "real" }  // 有缺點
{ "rating": 5, "source": "seed" }  // 5 星
{ "rating": 4, "source": "seed" }  // 4 星 (王太太、李設計師)
```

---

### ✅ P4: TypeScript 定義未導出 (已修復)

**問題**：`ReviewForUI` 只在 API 檔案內，前端無法重用

**修復方式**：
- 新增 `src/types/review.ts` 共用型別定義
- 包含 `ReviewForUI`, `FeaturedReviewsResponse`, `RealReviewRow`, `ServerSeed`
- API 和前端可共用同一介面

---

### ✅ P5: TODO.md 測試狀態未勾選 (已修復)

**狀態**：已在審查中修正

---

### ✅ P6: 缺少錯誤監控上報 (已修復)

**問題**：`console.error` 只在 server log，Production 無法追蹤

**修復方式**：
- 新增 `logError()` 函數
- 同時輸出到 console 和嘗試上報到 `/api/log-error`
- 非阻塞設計，不影響主流程

---

## ✅ Phase 1: 後端 API - 已完成 (100/100)

### P9-1: `api/home/featured-reviews.ts` ✅

**檔案位置**: `/api/home/featured-reviews.ts`

**已實作功能**:
1. ✅ 從 Supabase `community_reviews` 撈取真實資料
2. ✅ 不足 6 筆時用 `SERVER_SEEDS` 補位
3. ✅ 統一輸出格式 (Adapter Pattern)
4. ✅ 設定 Cache Header (`s-maxage=60, stale-while-revalidate=300`)
5. ✅ CORS 設定
6. ✅ 錯誤降級機制 (API 異常時仍回傳 Mock)
7. ✅ **displayId 從 name 提取首字** (P1 修復)
8. ✅ **rating 根據 disadvantage 決定** (P3 修復)
9. ✅ **logError() 錯誤上報機制** (P6 修復)

**新增檔案**:
- `src/types/review.ts` - 共用 TypeScript 型別定義 (P4 修復)

**API 回應格式** (修復後):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "displayId": "匿",
      "name": "匿名用戶｜認證評價",
      "rating": 4,
      "tags": ["#優點1", "#優點2"],
      "content": "推薦優點：...",
      "communityId": "uuid",
      "source": "real",
      "region": "taiwan"
    },
    {
      "id": "seed-server-1",
      "displayId": "林",
      "name": "林小姐｜平台精選",
      "rating": 5,
      "tags": ["#隱私保護", "#管家服務"],
      "content": "透過平台不僅看到...",
      "communityId": null,
      "source": "seed",
      "region": "global"
    }
  ],
  "meta": {
    "total": 6,
    "realCount": 2,
    "seedCount": 4,
    "timestamp": "2025-12-15T03:26:42.903Z"
  }
}
```

**驗證結果**:
- TypeScript 編譯: ✅ 通過
- Vite Build: ✅ 通過 (19.41s)
- Live API: ✅ 正常運作 (commit `100551e`)

---

## 📊 測試計畫

### API 端點測試
- [x] 部署後測試: `https://maihouses.vercel.app/api/home/featured-reviews`
- [x] 驗證回傳 6 筆資料
- [x] 驗證混合 `source: "real"` + `source: "seed"`
- [x] 驗證 `displayId` 是首字 (不是 "01")
- [x] 驗證 `rating` 有 4-5 星多樣化

---

## 📝 待實作清單

### Phase 2: 前端服務層

- [ ] **P9-2**: 更新 `src/services/communityService.ts`
  - 新增 `getFeaturedHomeReviews()` 函數
  - 使用 `src/types/review.ts` 的共用型別
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

## 📁 檔案變更清單

| 檔案 | 操作 | 狀態 |
|------|------|------|
| `api/home/featured-reviews.ts` | 新增+修復 | ✅ 完成 |
| `src/types/review.ts` | 新增 | ✅ 完成 |
| `src/services/communityService.ts` | 修改 | ⬜ 待做 |
| `src/features/home/sections/CommunityTeaser.tsx` | 修改 | ⬜ 待做 |
| `src/constants/data.ts` | 修改 | ⬜ 待做 |

---

## 📋 P9-1 修復過程紀錄

### 第一次審查：68/100

發現 6 個問題：
- P1: displayId 格式與 UI 不相容 (-15)
- P2: displayId 編號衝突 (-5)
- P3: rating 硬編碼 5 星 (-4)
- P4: TypeScript interface 未導出 (-3)
- P5: TODO.md 未勾選測試 (-2)
- P6: 缺少錯誤上報 (-3)

### 修復提交：100551e

修復內容：
1. **P1 修復**: 新增 `extractDisplayId(name)` 函數
   - 從名字提取首字作為 displayId
   - "匿名住戶" → "匿"
   - "林小姐" → "林"

2. **P2 修復**: 移除 `index` 參數
   - 不再使用數字編號
   - 避免 Real/Seed 衝突

3. **P3 修復**: 新增 `calculateRating(hasDisadvantage)` 函數
   - 有缺點 → 4 星
   - 無缺點 → 5 星
   - Mock 資料手動多樣化

4. **P4 修復**: 新增 `src/types/review.ts`
   - 導出 `ReviewForUI`, `FeaturedReviewsResponse`, `RealReviewRow`, `ServerSeed`

5. **P6 修復**: 新增 `logError()` 函數
   - 同時 console.error + 上報到 /api/log-error
   - 非阻塞設計

### 驗證結果

```bash
curl https://maihouses.vercel.app/api/home/featured-reviews | jq
```

回傳：
- displayId: "匿", "林", "陳", "王", "張" ✅
- rating: 4, 5, 4, 5, 4, 5 (多樣化) ✅
- realCount: 2, seedCount: 4 ✅
