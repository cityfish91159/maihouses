# 🏠 P10: 首頁智能房源混合動力 V4.0

> **專案狀態**: � **開發中 (In Progress)**
> **最後更新**: 2025-12-16
> **目標**: 首頁房源從 Mock 無縫切換至真實資料，**外觀完全不變**
> **核心策略**: Real First, Mock Fill, Zero Flicker (真實優先，Mock 補位，零閃爍)

---

## 📊 V4.0 效益檢核表

| 項目 | 舊方案 (V1/V2) | 新方案 (V4.0) | 效益 |
|------|----------------|---------------|------|
| **首頁載入** | 需等待 API，顯示 Skeleton | Mock 直出，0 秒等待 | 體驗順暢度提升 100% |
| **真實圖片** | 可能大小不一，破壞排版 | 強制裁切 4:3 | 維持設計稿級別的整齊度 |
| **預設評價** | 所有新房源都顯示一樣文案 | 隨機多樣化 (A/B/C 組) | 消除「機器人感」，增加信任度 |
| **查詢效能** | 迴圈查詢 (N+1) | 批量查詢 (1次 SQL) | 後端負載大幅降低 |
| **資料同步** | 容易遺漏 | 單一真理來源 | 補位資料永遠與 Mock 一致 |

---

## 🎯 驗收標準 (Acceptance Criteria)

1. **零秒載入**: 使用者進入首頁時，立即看到 6 張房源卡片 (初始 Mock)，無 Loading 動畫。
2. **無縫切換**: 背景 API 載入完成後，若有真實房源，卡片內容瞬間替換，但版面高度、圖片比例維持不變。
3. **多樣化評價**: 即使真實房源無評價，系統根據 ID 自動輪替「新上架/熱度/地段」三種不同文案。
4. **分級容錯**:
   - Level 1 (最佳): 混合資料 (真實 + Seed)
   - Level 2 (DB失敗): 全 Seed (API 回傳)
   - Level 3 (斷網): 全 Mock (前端靜態保底)

---

## 📋 TODO List (HARD GATE)

### Phase 1: 後端 API 開發 ✅ (2025-12-16)

| # | 任務 | 檔案 | 狀態 | 驗證 |
|---|------|------|------|------|
| 1.1 | 建立 API 端點 | `api/home/featured-properties.ts` | ✅ | `curl` 測試通過 |
| 1.2 | 定義 SERVER_SEEDS (與前端 PROPERTIES 一致) | `api/home/featured-properties.ts` | ✅ | 6 筆完整 |
| 1.3 | 實作 Batch Query (用 community_id 查評價) | `api/home/featured-properties.ts` | ✅ | 去重 + 分組 |
| 1.4 | 實作 adaptPropertyForUI (強制美顏) | `api/home/featured-properties.ts` | ✅ | 4:3 裁切 + 地址格式化 |
| 1.5 | 實作多樣化預設評價 (3 組) | `api/home/featured-properties.ts` | ✅ | UUID 末碼決定 |
| 1.6 | 實作自動補位邏輯 | `api/home/featured-properties.ts` | ✅ | seed 補足至 6 筆 |

**P1 修正記錄 (2025-12-16):**
- 🔴 修正 1: `forceImageRatio` 加入 Supabase Storage 支援
- 🔴 修正 2: Batch Query 改用 `community_id` 而非 `property_id`
- 🔴 修正 3: DB Schema 修正 (`size` 非 `area`, `images[]` 非 `image_url`)
- 🔴 修正 4: 用 curl 測試確認 API 正常回傳
- 🔴 修正 5: 確認 migrations 中 `properties` 表存在

### Phase 2: 前端 Service 層 ⬜

| # | 任務 | 檔案 | 狀態 | 驗證 |
|---|------|------|------|------|
| 2.1 | 新增 getFeaturedProperties() | `src/services/propertyService.ts` | ⬜ | 單元測試 |
| 2.2 | 失敗時回傳空陣列 (觸發 Level 3) | `src/services/propertyService.ts` | ⬜ | 模擬錯誤測試 |

### Phase 3: 前端 UI 整合 ⬜

| # | 任務 | 檔案 | 狀態 | 驗證 |
|---|------|------|------|------|
| 3.1 | useState 初始值改為 PROPERTIES (Mock) | `src/features/home/sections/PropertyGrid.tsx` | ⬜ | 視覺無閃爍 |
| 3.2 | useEffect 呼叫 API 並靜默替換 | `src/features/home/sections/PropertyGrid.tsx` | ⬜ | Network Tab 確認 |
| 3.3 | 確保 key 使用 property.id | `src/features/home/sections/PropertyGrid.tsx` | ⬜ | React DevTools |

### Phase 4: 測試與驗證 ⬜

| # | 任務 | 檔案 | 狀態 | 驗證 |
|---|------|------|------|------|
| 4.1 | API 單元測試 | `api/home/__tests__/featured-properties.test.ts` | ⬜ | `npm test` |
| 4.2 | Service 單元測試 | `src/services/__tests__/propertyService.test.ts` | ⬜ | `npm test` |
| 4.3 | E2E 視覺測試 (無閃爍) | 手動測試 | ⬜ | 錄影截圖 |
| 4.4 | TypeScript 編譯檢查 | - | ⬜ | `npx tsc --noEmit` |

### Phase 5: 部署 ⬜

| # | 任務 | 檔案 | 狀態 | 驗證 |
|---|------|------|------|------|
| 5.1 | 更新 DEPLOY_TRIGGER.md | `DEPLOY_TRIGGER.md` | ⬜ | - |
| 5.2 | Git Commit & Push | - | ⬜ | Vercel Build 成功 |
| 5.3 | 生產環境驗證 | - | ⬜ | 線上測試 |

---

## 🛠️ 實作細節

### 1. 後端 API 核心邏輯 (`api/home/featured-properties.ts`)

```typescript
// 關鍵常數
const REQUIRED_COUNT = 6;

// 1. SERVER_SEEDS: 必須與 src/constants/data.ts 的 PROPERTIES 完全一致
const SERVER_SEEDS = [ /* 複製前端 Mock */ ];

// 2. formatPrice: 12880000 -> "1,288"
function formatPrice(price: number | null): string { ... }

// 3. adaptPropertyForUI: 強制美顏
function adaptPropertyForUI(property: any, reviews: any[]) {
  // 3.1 圖片: 強制 4:3 裁切 (?width=800&height=600&resize=cover)
  // 3.2 標籤: 最多 3 個，過長替換
  // 3.3 評價: 多樣化補位 (A/B/C 組)
  // 3.4 地址: 組合 city + district + road
}

// 4. handler
export default async function handler(req, res) {
  // 4.1 撈取真實房源 (Limit 6)
  // 4.2 批量撈取評價 (Batch Query)
  // 4.3 組合資料 (Adapter)
  // 4.4 自動補位 (Mock Fill)
  return res.json({ success: true, data: finalProperties });
}
```

### 2. 前端 Service (`src/services/propertyService.ts`)

```typescript
export async function getFeaturedProperties(): Promise<any[]> {
  try {
    const response = await fetch('/api/home/featured-properties');
    const json = await response.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data;
    }
    return [];
  } catch (error) {
    return []; // Level 3: 觸發前端 Mock 保底
  }
}
```

### 3. 前端 UI (`src/features/home/sections/PropertyGrid.tsx`)

```typescript
// 🚀 關鍵 1: 初始狀態直接給 Mock
const [properties, setProperties] = useState<any[]>(PROPERTIES);

useEffect(() => {
  let isMounted = true;
  // 🚀 關鍵 2: 背景靜默更新
  getFeaturedProperties().then(data => {
    if (isMounted && data && data.length > 0) {
      setProperties(data);
    }
  });
  return () => { isMounted = false; };
}, []);
```

---

## 🚫 禁止行為 (Red Lines)

1. **禁止 Loading Skeleton**: 首頁列表必須使用 Mock 預填，背景替換。
2. **禁止 N+1 查詢**: 必須使用批量查詢。
3. **禁止破壞 UI**: 不得修改 JSX 結構、CSS Class、Props 介面。
4. **禁止前後端不一致**: SERVER_SEEDS 必須與 PROPERTIES 完全一致。

---

## 📚 相關文件

- [docs/PATTERNS.md](./PATTERNS.md) - 混合動力架構定義
- [docs/features/home-properties.md](./features/home-properties.md) - 功能規格書
- [docs/PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) - 專案總覽

---

## 📝 開發日誌

| 日期 | 內容 | 負責人 |
|------|------|--------|
| 2025-12-15 | 建立 P10 TODO List | AI |
| - | - | - |

---

*版本：V4.0 終極版*
*最後更新：2025-12-15*
