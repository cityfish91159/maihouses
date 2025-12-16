# 🏠 P11: 房源列表頁混合動力升級 V2.0

> **專案狀態**: ✅ **Phase 1 D1-D6 已修正，二次審查發現新缺失**
> **最後更新**: 2025-12-16
> **審查評分**: **72/100** (從 52 分進步，但仍有改進空間)
> **目標**: 將 `public/property.html` 升級為混合動力架構，零閃爍載入真實資料
> **核心策略**: Mock First, API Background, Silent Replace, Race Guard

---

## 📊 V2.0 效益檢核表

| 項目 | 舊方案 | 新方案 (V2.0) | 效益 |
|------|--------|---------------|------|
| **首頁載入** | 純 Mock 或等待 API | Mock 秒開 + 背景更新 | 體驗順暢度提升 100% |
| **資料同步** | Mock/API 分離 | SSOT (單一真理來源) | 零不一致風險 |
| **競態保護** | 無 | AbortController + 版本控制 | 無舊資料覆蓋新資料 |
| **圖片閃爍** | 直接替換 | 預載後替換 | 零閃爍體驗 |
| **錯誤容錯** | 可能白屏 | 自動降級到 Mock | 永不崩壞 |

---

## 🎯 驗收標準 (Acceptance Criteria)

1. **秒開體驗**: 開啟 `property.html` 時，畫面必須 **瞬間出現**（讀取本地 JS Mock）
2. **靜默更新**: 背景 API 載入完成後，圖片與文字 **瞬間變更**，無白畫面、無圖片破圖
3. **競態保護**: 快速切換時，舊請求不會覆蓋新請求的資料
4. **錯誤容錯**: API 失敗時維持顯示 Mock，Console 僅有警告
5. **外觀不變**: UI 完全不改動，僅資料來源切換

---

## 📋 TODO List (HARD GATE)

### Phase 1: 資料標準化 (SSOT) ✅ D1-D6 已修正

| # | 任務 | 檔案 | 狀態 | 驗證 |
|---|------|------|------|------|
| 1.1 | 建立種子資料 JSON | `public/data/seed-property-page.json` | ✅ | 結構與 Mock 一致 |
| 1.2 | 更新前端 Mock 註解 | `public/js/property-data.js` | ✅ | 標記同步提醒 |
| 1.3 | TypeScript 型別定義 | `src/types/property-page.ts` | ✅ | Zod Schema-First |
| 1.4 | 🔴 **D1** | JSON 加入 `default`/`test` 結構 | ✅ | 與 Mock 完全一致 |
| 1.5 | 🔴 **D2** | JSON 結構對齊 Mock | ✅ | `default.featured` |
| 1.6 | 🟠 **D3** | Zod Schema + 驗證腳本 | ✅ | `npm run validate:property` |
| 1.7 | 🟠 **D4** | JSON Schema 生成 | ✅ | `npm run generate:schema` |
| 1.8 | 🟡 **D5** | Mock ↔ JSON 同步檢查 | ✅ | `npm run check:ssot` |
| 1.9 | 🟡 **D6** | Review Adapter 統一 | ✅ | `NormalizedReview` |

**驗收**: ✅ Pre-commit hook Step 6-8 自動驗證

---

### 🔴 二次審查報告 (Google 首席前後端處長)

> **審查日期**: 2025-12-16
> **審查結果**: ⚠️ **D1-D6 基本完成，但發現 7 項新缺失**
> **評分**: **72/100** (進步但有改進空間)

#### 📋 新發現缺失清單

| # | 嚴重度 | 缺失描述 | 影響 | 狀態 |
|---|--------|----------|------|------|
| D7 | 🔴 P0 | **D4 JSON Schema 是硬編碼，不是從 Zod 自動生成** | Zod 改了 Schema 不會自動更新 | ✅ 已修 |
| D8 | 🔴 P0 | **D3 validate 只驗 JSON，沒驗 Mock** | Mock 可能偷偷壞掉 | ⬜ 待修 |
| D9 | 🟠 P1 | **D6 adapter 沒有單元測試** | Regex 解析可能出錯不知道 | ⬜ 待修 |
| D10 | 🟠 P1 | **D6 adapter 沒有被任何代碼引用** | 寫了等於沒寫 | ⬜ 待修 |
| D11 | 🟡 P2 | **pre-commit Step 7 會自動 git add，但沒通知用戶** | 用戶不知道 commit 被改了什麼 | ⬜ 待修 |
| D12 | 🟡 P2 | **D5 check:ssot 沒有測試案例** | 不知道 deepEqual 有沒有 bug | ⬜ 待修 |
| D13 | 🟡 P2 | **三個腳本都沒有 error boundary** | 腳本 crash 會讓 pre-commit 掛掉 | ⬜ 待修 |

---

#### 🔴 D7: JSON Schema 是假的「自動生成」

**修正**: 改為 **Zod 主導自動生成 + 原生嚴格驗證**，Schema 直接由 `SeedFileSchema.toJSONSchema()` 產出，不再手寫。

**落地**:
- `npm run generate:schema`：由 `scripts/generate-json-schema.ts` 調用 `SeedFileSchema.toJSONSchema()` 自動生成 Draft-07 Schema
- `npm run verify:seed`：(`scripts/verify-seed-strict.ts`) 同時驗證 `public/data/seed-property-page.json` 與 `public/js/property-data.js`（Mock）
- Zod 變更 → Schema/種子立刻報錯，杜絕脫節與假自動化

**驗證紀錄**:
- `npm run generate:schema` → 成功生成 `public/data/seed-property-page.schema.json`（Draft-07，自動化來源：Zod）
- `npm run verify:seed` → `✅ JSON 種子通過 Zod 驗證`、`✅ Mock 種子通過 Zod 驗證`

---

#### 🔴 D8: validate:property 沒驗證 Mock

**問題**: `validate-property-types.ts` 只驗證 JSON，沒驗證 `property-data.js`。

**偷懶程度**: 💀💀 中等 - Mock 可以偷偷壞掉不被發現

**證據**:
```typescript
// 只讀 JSON
const jsonPath = resolve(__dirname, '../public/data/seed-property-page.json');
// 沒有讀 property-data.js！
```

**風險**: 有人改 Mock 結構，Zod 驗證不會發現。

**引導修正**:
```
validate-property-types.ts 應該也驗證 Mock:

1. 用 VM 執行 property-data.js 取得 window.propertyMockData
2. 對 Mock 資料也跑 SeedFileSchema.safeParse()
3. 兩者都通過才算 pass

這樣 Zod 同時守護 JSON 和 Mock，真正的 SSOT。
```

---

#### 🟠 D9: D6 adapter 沒有單元測試

**問題**: `normalizeListingReview()` 用 Regex 解析 content，但沒有測試。

**偷懶程度**: 💀💀 中等 - Regex 最容易出錯

**證據**:
```typescript
const match = r.content.match(/「(.+)」—\s*(.+)/);
return {
  author: match?.[2] ?? '匿名',  // 如果格式不對就變「匿名」
```

**風險**: 
- content 沒有「」會直接變匿名
- content 有多個「」會解析錯誤
- 全形/半形空格不一致會 fail

**引導修正**:
```
建立 src/types/__tests__/property-page.test.ts:

describe('normalizeListingReview', () => {
  it('正常格式', () => {
    const r = { badge: 'X', content: '「評價內容」— 作者名' };
    expect(normalizeListingReview(r).author).toBe('作者名');
  });
  
  it('無「」時回傳匿名', () => {
    const r = { badge: 'X', content: '普通評價' };
    expect(normalizeListingReview(r).author).toBe('匿名');
    expect(normalizeListingReview(r).content).toBe('普通評價');
  });
  
  it('多個「」時只取最外層', () => {
    const r = { badge: 'X', content: '「他說「很棒」」— 作者' };
    // 這個會 fail，要修 Regex
  });
});
```

---

#### 🟠 D10: D6 adapter 沒有被引用

**問題**: 寫了 `normalizeFeaturedReview` 和 `normalizeListingReview`，但沒有任何代碼 import 使用。

**偷懶程度**: 💀💀 中等 - 寫了等於沒寫

**證據**:
```bash
grep -r "normalizeFeaturedReview\|normalizeListingReview" src/ api/
# 只有定義，沒有引用
```

**風險**: 代碼腐爛，可能哪天被刪掉。

**引導修正**:
```
至少要有一處實際使用:

方案 A: 在 Phase 2 的 api/property/page-data.ts 使用
方案 B: 在前端組件使用（如果有需要統一格式的地方）
方案 C: 加入 TODO 註解標記「Phase 2 會用到」

最低標準: 加入 @see 或 @used-by 註解說明預期用途
```

---

#### 🟡 D11: pre-commit 偷偷改檔案沒通知

**問題**: Step 7 會自動執行 `git add`，但用戶不知道 commit 多了什麼。

**證據**:
```bash
# .git/hooks/pre-commit
npm run generate:schema
git add public/data/seed-property-page.schema.json
echo "✅ Schema 已更新並加入暫存區。"  # 只有這行提示
```

**風險**: 用戶以為 commit 了 A，結果還包含 B。

**引導修正**:
```
改進提示訊息:

echo "⚠️  注意：以下檔案已自動加入此次 commit:"
echo "    • public/data/seed-property-page.schema.json"
echo ""
echo "如果這不是你預期的，請執行 git reset HEAD -- <file>"
```

---

#### 🟡 D12: check:ssot 的 deepEqual 沒測試

**問題**: `check-ssot-sync.ts` 自己寫了 `deepEqual()`，但沒有單元測試。

**偷懶程度**: 💀 輕微 - 標準庫有現成的

**引導修正**:
```
方案 A: 用 Node.js 內建的 assert.deepStrictEqual()
方案 B: 用 lodash 的 _.isEqual()
方案 C: 至少寫幾個測試案例確認 edge case

Edge cases 要測:
- undefined vs 缺失 key
- null vs undefined
- [] vs {}
- 順序不同的陣列
```

---

#### 🟡 D13: 腳本沒有 error boundary

**問題**: 三個腳本都是直接 `process.exit(1)`，沒有統一的錯誤處理。

**證據**:
```typescript
} catch (error) {
  console.error('❌ 執行失敗:', error instanceof Error ? error.message : error);
  process.exit(1);
}
```

**風險**: 錯誤訊息不一致，debug 困難。

**引導修正**:
```
建立 scripts/lib/error-handler.ts:

export function handleScriptError(scriptName: string, error: unknown): never {
  console.error('');
  console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.error(`❌ [${scriptName}] 執行失敗`);
  console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  if (error instanceof Error) {
    console.error(`錯誤: ${error.message}`);
    if (process.env.DEBUG) console.error(error.stack);
  }
  process.exit(1);
}
```

---

### 📊 修正優先順序建議

| 優先 | 缺失 | 理由 |
|------|------|------|
| 1 | D7 | SSOT 核心，Schema 脫節 = 假驗證 |
| 2 | D8 | Mock 沒驗證 = SSOT 有洞 |
| 3 | D9 | Regex 解析容易出錯 |
| 4 | D10 | 死代碼要清理或標記 |
| 5 | D11-D13 | 體驗/維護性問題，非關鍵 |

---

| # | 任務 | 檔案 | 狀態 | 驗證 |
|---|------|------|------|------|
| 2.1 | 建立 API 端點 | `api/property/page-data.ts` | ⬜ | `curl` 測試 |
| 2.2 | 撈取真實房源 (11筆) | `api/property/page-data.ts` | ⬜ | DB Query |
| 2.3 | 批量撈取評價 | `api/property/page-data.ts` | ⬜ | Batch Query |
| 2.4 | 資料適配器 (DB → UI) | `api/property/page-data.ts` | ⬜ | adaptProperty |
| 2.5 | 混合組裝 (真實 + Seed 補位) | `api/property/page-data.ts` | ⬜ | 11筆完整 |
| 2.6 | 快取設定 | `api/property/page-data.ts` | ⬜ | s-maxage=60 |
| 2.7 | 錯誤時回傳 Seed | `api/property/page-data.ts` | ⬜ | 不回 500 |

**驗收**: API 回傳 `{ success: true, data: {...} }` 或 `{ success: false, data: SEED }`

---

### Phase 3: 前端架構重構 (ES Modules) ⬜

| # | 任務 | 檔案 | 狀態 | 驗證 |
|---|------|------|------|------|
| 3.1 | 建立主入口 | `public/js/property-main.js` | ⬜ | ES Module |
| 3.2 | 升級 API Service | `public/js/services/property-api.js` | ⬜ | AbortController |
| 3.3 | 升級 Renderer | `public/js/property-renderer.js` | ⬜ | Class + 版本控制 |
| 3.4 | 修改 HTML 引用 | `public/property.html` | ⬜ | type="module" |
| 3.5 | 實作圖片預載 | `public/js/property-renderer.js` | ⬜ | preloadImages |

**驗收**: `property.html` 秒開 + 背景靜默更新

---

### Phase 4: 防閃爍機制 ⬜

| # | 任務 | 檔案 | 狀態 | 驗證 |
|---|------|------|------|------|
| 4.1 | 圖片預載 Helper | `public/js/property-renderer.js` | ⬜ | Promise.all |
| 4.2 | 版本控制渲染 | `public/js/property-renderer.js` | ⬜ | renderVersion |
| 4.3 | requestAnimationFrame | `public/js/property-renderer.js` | ⬜ | 流暢渲染 |
| 4.4 | 競態保護 | `public/js/services/property-api.js` | ⬜ | abort 舊請求 |

**驗收**: 快速刷新無舊資料閃爍

---

### Phase 5: 測試與驗證 ⬜

| # | 任務 | 檔案 | 狀態 | 驗證 |
|---|------|------|------|------|
| 5.1 | API 單元測試 | `api/property/__tests__/page-data.test.ts` | ⬜ | 覆蓋率 |
| 5.2 | 手動 E2E 測試 | - | ⬜ | 視覺無閃爍 |
| 5.3 | 錯誤降級測試 | - | ⬜ | API 失敗仍顯示 Mock |
| 5.4 | 競態測試 | - | ⬜ | 快速刷新無問題 |

---

### Phase 6: 部署 ⬜

| # | 任務 | 檔案 | 狀態 | 驗證 |
|---|------|------|------|------|
| 6.1 | 更新 DEPLOY_TRIGGER.md | `DEPLOY_TRIGGER.md` | ⬜ | P11 記錄 |
| 6.2 | Git Commit & Push | - | ⬜ | Vercel Build |
| 6.3 | 生產環境驗證 | - | ⬜ | 線上測試 |

---

## 🛠️ 實作細節

### 1. 種子資料 JSON (`public/data/seed-property-page.json`)

```json
{
  "featured": {
    "main": {
      "badge": "熱門社區",
      "image": "https://images.unsplash.com/...",
      "title": "新光晴川 B棟 12樓",
      "location": "📍 板橋區・江子翠生活圈",
      "details": ["3房2廳2衛 + 平面車位", "🏢 2020年完工", ...],
      "highlights": "🏪 5分鐘全聯・10分鐘捷運",
      "rating": "4.4 分(63 則評價)",
      "reviews": [...],
      "lockCount": 61,
      "price": "1,050 萬",
      "size": "約 23 坪"
    },
    "sideTop": { ... },
    "sideBottom": { ... }
  },
  "listings": [ ... ]
}
```

### 2. 後端 API (`api/property/page-data.ts`)

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import SEED_DATA from '../../public/data/seed-property-page.json';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  
  try {
    // 1. 撈取真實房源 (11筆: 1大 + 2小 + 8列表)
    // 2. 批量撈取評價
    // 3. 混合組裝 (真實 + Seed 補位)
    return res.json({ success: true, data: responseData });
  } catch (e) {
    return res.json({ success: false, data: SEED_DATA });
  }
}
```

### 3. 前端主入口 (`public/js/property-main.js`)

```javascript
import { PropertyRenderer } from './property-renderer.js';
import { PropertyAPI } from './services/property-api.js';

document.addEventListener('DOMContentLoaded', async () => {
  const renderer = new PropertyRenderer();
  
  // 1. 秒開：立即渲染 Mock
  if (window.propertyMockData) {
    renderer.render(window.propertyMockData.default);
  }

  // 2. 背景撈取真實資料
  try {
    const realData = await PropertyAPI.getPageData();
    if (realData) {
      // 3. 圖片預載 (防閃爍)
      await renderer.preloadImages(realData);
      // 4. 靜默更新
      renderer.render(realData);
    }
  } catch (e) {
    console.warn('Background update skipped:', e);
  }
});
```

### 4. API Service 競態保護 (`public/js/services/property-api.js`)

```javascript
export const PropertyAPI = {
  currentController: null,

  async getPageData() {
    // 競態保護：取消舊請求
    if (this.currentController) this.currentController.abort();
    this.currentController = new AbortController();

    try {
      const timeoutId = setTimeout(() => this.currentController.abort(), 5000);
      const res = await fetch('/api/property/page-data', {
        signal: this.currentController.signal
      });
      clearTimeout(timeoutId);
      
      if (!res.ok) throw new Error('API Error');
      const json = await res.json();
      return json.success ? json.data : null;
    } catch (e) {
      if (e.name !== 'AbortError') console.warn('Fetch failed', e);
      return null;
    } finally {
      this.currentController = null;
    }
  }
};
```

### 5. Renderer 版本控制 (`public/js/property-renderer.js`)

```javascript
export class PropertyRenderer {
  constructor() {
    this.containers = { ... };
    this.renderVersion = 0;
  }

  async preloadImages(data) {
    const urls = [
      data.featured?.main?.image,
      data.featured?.sideTop?.image,
      data.featured?.sideBottom?.image,
      ...(data.listings || []).map(l => l.image)
    ].filter(Boolean);

    await Promise.all(urls.map(url => new Promise(resolve => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = resolve;
      img.src = url;
    })));
  }

  render(data) {
    if (!data) return;
    const currentVer = ++this.renderVersion;

    requestAnimationFrame(() => {
      if (currentVer !== this.renderVersion) return; // 版本檢查
      // ... render logic
    });
  }
}
```

---

## 🚫 禁止行為 (Red Lines)

1. **禁止改動 UI**: HTML/CSS 結構、Class 名稱不得修改
2. **禁止 Loading 動畫**: 必須 Mock 秒開，背景靜默更新
3. **禁止 N+1 查詢**: 必須批量查詢評價
4. **禁止吞噬錯誤**: API 失敗必須有明確 fallback
5. **禁止競態問題**: 必須有 AbortController + 版本控制

---

## 📚 相關文件

- [P10 首頁混合動力](./COMMUNITY_WALL_DEV_LOG.md) - 參考實作
- [property-data.js](../public/js/property-data.js) - 現有 Mock
- [property-renderer.js](../public/js/property-renderer.js) - 現有 Renderer
- [property-api.js](../public/js/services/property-api.js) - 現有 API Service

---

## 📝 開發日誌

| 日期 | 內容 | 負責人 |
|------|------|--------|
| 2025-12-16 | 建立 P11 TODO List | AI |
| - | - | - |

---

*版本：V2.0*
*最後更新：2025-12-16*
