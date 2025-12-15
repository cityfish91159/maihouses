# 🏠 P9: 首頁社區評價聚合 API 導入

> **專案狀態**: 🟡 **規劃中**
> **最後更新**: 2025-12-15
> **目標**: 外觀不變，資料源從靜態切換為 API 混合模式
> **核心策略**: 後端聚合 + 自動補位 (Hybrid Reviews System)

---

## 🎯 核心目標

1. **零天窗保證**：無論資料庫有沒有資料，首頁永遠顯示 6 則評價卡片
2. **自動演化**：
   - 初期 (0 資料)：顯示 6 則 Mock
   - 中期 (少資料)：顯示 真實資料 + Mock 補位
   - 後期 (多資料)：全顯示真實資料，Mock 自動退場
3. **外觀凍結**：完全不改動現有 UI/CSS，僅替換資料源

---

## 🏗️ 系統架構

```
┌─────────────────────────────────────────────────────────────┐
│                    CommunityTeaser.tsx                       │
│                  (外觀完全不變)                               │
│                         ↓                                    │
│              getFeaturedHomeReviews()                        │
│                         ↓                                    │
├─────────────────────────────────────────────────────────────┤
│            /api/home/featured-reviews                        │
│                                                              │
│   ┌──────────────┐    ┌──────────────┐                      │
│   │  Supabase    │ +  │ SERVER_SEEDS │ = 永遠 6 筆          │
│   │  真實資料    │    │  Mock 補位   │                      │
│   └──────────────┘    └──────────────┘                      │
│                                                              │
│   自動補位公式：missingCount = 6 - realData.length          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 實作清單

### Phase 1: 後端 API (🔴 最優先)

- [ ] **P9-1**: 建立 `api/home/featured-reviews.ts`
  - 從 Supabase `community_reviews` 撈取真實資料
  - 不足 6 筆時用 `SERVER_SEEDS` 補位
  - 統一輸出格式 (Adapter Pattern)
  - 設定 Cache Header (`s-maxage=60`)

### Phase 2: 前端服務層

- [ ] **P9-2**: 更新 `src/services/communityService.ts`
  - 新增 `getFeaturedHomeReviews()` 函數
  - 管理使用者地區偏好 (`localStorage`)
  - 錯誤處理 + fallback

### Phase 3: UI 整合

- [ ] **P9-3**: 更新 `CommunityTeaser.tsx`
  - 改用 `useEffect` + `useState` 取代靜態 import
  - 保持 UI 外觀完全不變
  - 加入 Loading Skeleton
  - 處理點擊導向邏輯 (Mock vs Real)

### Phase 4: 保底機制

- [ ] **P9-4**: 更新 `src/constants/data.ts`
  - 將 `COMMUNITY_REVIEWS` 改名為 `BACKUP_REVIEWS`
  - 作為 API 斷線時的 Level 3 保底

---

## 🔧 技術細節

### 1. API 端點設計

**路徑**: `GET /api/home/featured-reviews`

**Query Parameters**:
| 參數 | 類型 | 說明 |
|------|------|------|
| `region` | string | 地區偏好 (north/central/south)，可選 |

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "review-123",
      "displayId": "01",
      "name": "J***｜景安和院 住戶",
      "rating": 5,
      "tags": ["#物業/管理"],
      "content": "公設維護得乾淨...",
      "communityId": "uuid-xxx",
      "source": "real",
      "region": "north"
    }
  ]
}
```

### 2. 自動補位邏輯 (核心)

```typescript
const REQUIRED_COUNT = 6;

// 1. 撈真實資料
const realReviews = await fetchFromSupabase();

// 2. 計算缺口
const missingCount = REQUIRED_COUNT - realReviews.length;

// 3. 自動補位
if (missingCount > 0) {
  const seeds = SERVER_SEEDS.slice(0, missingCount);
  return [...realReviews, ...seeds];
}

return realReviews;
```

### 3. 三層保底機制

| 層級 | 情境 | 資料源 |
|------|------|--------|
| Level 1 | API 正常 + 有真實資料 | Supabase 真實資料 |
| Level 2 | API 正常 + 無真實資料 | SERVER_SEEDS (後端 Mock) |
| Level 3 | API 斷線 | BACKUP_REVIEWS (前端靜態) |

---

## 🌟 架構師建議 (優化方案)

### 建議 1: 使用 SWR/React Query 取代原生 fetch

**為什麼**：
- 自動快取 + 重新驗證
- 避免重複請求
- 更好的 Loading/Error 狀態管理

**引導意見**：
```typescript
// 用 useSWR 取代手動 useState + useEffect
import useSWR from 'swr';

function CommunityTeaser() {
  const { data, isLoading } = useSWR('/api/home/featured-reviews', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 60秒內不重複請求
  });
}
```

### 建議 2: 加入 Optimistic Placeholder

**為什麼**：
- 避免首次載入時的空白/跳動
- 提升 CLS (Cumulative Layout Shift) 分數

**引導意見**：
```typescript
// 在 API 回應前先顯示 placeholder
const [reviews, setReviews] = useState(BACKUP_REVIEWS); // 預設值

useEffect(() => {
  getFeaturedHomeReviews().then(data => {
    if (data?.length > 0) setReviews(data);
    // 失敗時保持預設值，不會閃爍
  });
}, []);
```

### 建議 3: 區分 Mock 的視覺提示 (可選)

**為什麼**：
- 避免用戶誤以為 Mock 是真實評價
- 增加信任度

**引導意見**：
```typescript
// 可以在 Mock 卡片加上小標籤
{review.source === 'seed' && (
  <span className="text-xs text-gray-400">示範</span>
)}
```

### 建議 4: 點擊行為差異化

**為什麼**：
- Mock 評價沒有對應社區頁，點擊應該不導航
- 真實評價點擊應該導向社區牆

**引導意見**：
```typescript
const handleClick = (review) => {
  if (review.source === 'real' && review.communityId) {
    navigate(`/maihouses/community/${review.communityId}/wall`);
  }
  // Mock 不做任何事，或跳通用頁
};
```

### 建議 5: Server-Side Rendering 考量

**為什麼**：
- 首頁 SEO 重要
- 避免首次載入時內容跳動

**引導意見**：
```typescript
// 如果未來需要 SSR，可考慮：
// 1. 在 Vercel Edge Function 預渲染
// 2. 使用 Next.js 的 getServerSideProps
// 3. 或在 HTML 中嵌入初始資料
```

---

## ✅ 驗收標準

| 項目 | 標準 |
|------|------|
| **外觀** | UI/CSS 完全不變 |
| **資料** | 永遠顯示 6 筆評價 |
| **效能** | 首次載入 < 2s |
| **穩定** | API 斷線時有 fallback |
| **SEO** | 保持現有 meta tags |

---

## 📊 測試計畫

### 1. 現在 (0 真實資料)
- [ ] 部署後首頁顯示 6 張卡片
- [ ] 全部來自 SERVER_SEEDS
- [ ] 顯示「林小姐 (平台精選)」等示範資料

### 2. 未來 (有 1 筆真實資料)
- [ ] 手動在 `community_reviews` 新增測試資料
- [ ] 重新整理首頁
- [ ] 顯示：第 1 張真實 + 第 2-6 張 Mock

### 3. 成熟期 (6+ 真實資料)
- [ ] 首頁顯示 6 張全真實評價
- [ ] Mock 自動消失

### 4. API 斷線測試
- [ ] 關閉 Supabase 連線
- [ ] 首頁顯示 `BACKUP_REVIEWS` 靜態資料
- [ ] 不影響用戶體驗

---

## 📁 檔案變更清單

| 檔案 | 操作 | 說明 |
|------|------|------|
| `api/home/featured-reviews.ts` | **新增** | 後端聚合 API |
| `src/services/communityService.ts` | 修改 | 新增 API 呼叫函數 |
| `src/features/home/sections/CommunityTeaser.tsx` | 修改 | 改用動態資料 |
| `src/constants/data.ts` | 修改 | COMMUNITY_REVIEWS → BACKUP_REVIEWS |

---

## 🚀 部署檢查

- [ ] ESLint 通過
- [ ] TypeScript 編譯通過
- [ ] Build 成功
- [ ] 首頁功能正常
- [ ] 評價區塊顯示 6 筆

---

**Ready for Implementation.**
