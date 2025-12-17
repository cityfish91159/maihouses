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
| D8 | 🔴 P0 | **D3 validate 只驗 JSON，沒驗 Mock** | Mock 可能偷偷壞掉 | ✅ 已修 |
| D9 | 🟠 P1 | **D6 adapter 沒有單元測試** | Regex 解析可能出錯不知道 | ✅ 已修 |
| D10 | 🟠 P1 | **D6 adapter 沒有被任何代碼引用** | 寫了等於沒寫 | ✅ 已修 |
| D11 | 🟡 P2 | **pre-commit Step 7 會自動 git add，但沒通知用戶** | 用戶不知道 commit 被改了什麼 | ✅ 已修 |
| D12 | 🟡 P2 | **D5 check:ssot 沒有測試案例** | 不知道 deepEqual 有沒有 bug | ✅ 已修 |
| D13 | 🟡 P2 | **三個腳本都沒有 error boundary** | 腳本 crash 會讓 pre-commit 掛掉 | ✅ 已修 |

---

### 🔴 D7-D13 二次審計（Google 首席工程師視角）

> **審計日期**: 2025-12-17
> **審計結果**: 發現 6 個新問題需追蹤

| # | 嚴重度 | 缺失描述 | 影響 | 狀態 |
|---|--------|----------|------|------|
| D14 | 🔴 P0 | **D10 只在驗證腳本使用 adapter，沒有在實際業務代碼使用** | 假裝解決、實際還是死代碼 | ⬜ 待修 |
| D15 | 🔴 P0 | **verify-seed-strict 和 check-ssot-sync 功能重疊** | 維護兩份相同邏輯 | ⬜ 待修 |
| D16 | 🟠 P1 | **D9 測試案例不足：半形 dash 失敗但沒修 Regex** | 測試發現問題卻不修，等於沒測 | ⬜ 待修 |
| D17 | 🟠 P1 | **error-handler.ts 沒有單元測試** | 錯誤處理器本身可能有 bug | ⬜ 待修 |
| D18 | 🟡 P2 | **hard-gate.sh 的 G8 和 pre-commit hook Step 7 重複** | 兩處都做 Schema 同步檢查 | ⬜ 待修 |
| D19 | 🟡 P2 | **SeedFileSchema.toJSONSchema() 強制轉型 as unknown** | 沒有型別安全，toJSONSchema 可能不存在 | ⬜ 待修 |

---

#### 🔴 D14: D10 的修復是假的「使用」

**問題**: D10 說 adapter 沒被引用，修復方式是在 `verify-seed-strict.ts` 裡呼叫。但這不是「業務使用」，只是「測試執行」。

**偷懶程度**: 💀💀💀 嚴重 - 用驗證腳本假裝「有引用」，實際業務代碼還是沒用

**證據**:
```bash
# 搜尋實際業務代碼（api/, src/pages/, src/components/）
grep -r "normalizeFeaturedReview\|normalizeListingReview" src/pages/ src/components/ api/
# 結果：0 matches
```

**風險**: 
- API 端點沒用 adapter，前後端格式還是不統一
- adapter 還是可能被刪除（因為「看起來沒人用」）

**引導修正**:
```
這是 Phase 2 的核心：

1. 建立 api/property/page-data.ts API 端點
2. 從 Supabase 撈取真實房源資料
3. 使用 normalizeFeaturedReview / normalizeListingReview 統一格式
4. 回傳統一的 NormalizedReview[] 給前端

在那之前，至少加上 JSDoc 說明：
@used-by api/property/page-data.ts (Phase 2)
```

---

#### 🔴 D15: verify-seed-strict 和 check-ssot-sync 功能重疊

**問題**: 兩個腳本都做「Mock ↔ JSON 同步檢查」，而且邏輯幾乎一樣。

**偷懶程度**: 💀💀 中等 - 修 D8 時沒整合，反而造成冗餘

**證據**:
```typescript
// verify-seed-strict.ts
deepStrictEqual(normalizedJson, normalizedMock);

// check-ssot-sync.ts
deepStrictEqual(normalizedMock, normalizedJson);
// 完全一樣！
```

**風險**: 
- 改一邊忘改另一邊
- pre-commit 跑兩次相同檢查浪費時間

**引導修正**:
```
方案 A: 刪除 check-ssot-sync.ts，統一用 verify-seed-strict.ts
  - 修改 package.json: "check:ssot": "npm run verify:seed"

方案 B: 拆分職責
  - verify-seed-strict: 只做 Zod 驗證（結構正確性）
  - check-ssot-sync: 只做內容比對（資料一致性）
  - 但這樣 adapter 檢查要搬去哪？

建議用方案 A，一個腳本做完所有事。
```

---

#### 🟠 D16: D9 測試發現問題卻不修

**問題**: `property-page.test.ts` 有測試「半形 dash」案例，但測試預期是「失敗回傳匿名」，而不是「修 Regex 支援半形」。

**偷懶程度**: 💀💀 中等 - 用「預期失敗」掩蓋 Regex 缺陷

**證據**:
```typescript
it('tolerates halfwidth dash', () => {
  const result = normalizeListingReview({ badge: '在地', content: '「好住」- 小李' });
  expect(result).toEqual({
    author: '匿名',  // 明明應該是「小李」！
    content: '「好住」- 小李',
    badges: ['在地']
  });
});
```

**風險**: 
- 實際資料可能用半形 dash，會全變匿名
- 測試通過但功能有缺陷

**引導修正**:
```
修改 normalizeListingReview 的 Regex：

// 改前：只支援全形 —
const match = r.content.match(/「(.+)」—\s*(.+)/);

// 改後：同時支援全形 — 和半形 -
const match = r.content.match(/「(.+)」[—-]\s*(.+)/);

然後修改測試預期：
expect(result.author).toBe('小李');  // 不是匿名！
```

---

#### 🟠 D17: error-handler.ts 沒有單元測試

**問題**: 建立統一錯誤處理器是好事，但處理器本身沒測試。

**偷懶程度**: 💀 輕微 - 錯誤處理邏輯簡單，但 Zod issues 展開可能有 bug

**風險**: 
- `issues.slice(0, 10)` 可能在非陣列時 crash
- `issue.path.join('.')` 可能在 path undefined 時 crash

**引導修正**:
```
建立 scripts/lib/__tests__/error-handler.test.ts:

describe('handleScriptError', () => {
  it('handles plain Error', () => {
    // 驗證輸出格式
  });
  
  it('handles Zod error with issues', () => {
    const zodError = new ZodError([...]);
    // 驗證 issues 展開正確
  });
  
  it('handles non-Error values', () => {
    // 驗證 string, null, undefined 不會 crash
  });
});

// 注意：handleScriptError 會 process.exit(1)
// 測試時要 mock process.exit
```

---

#### 🟡 D18: G8 和 Step 7 重複

**問題**: Schema 同步檢查同時存在於：
1. `.git/hooks/pre-commit` Step 7
2. `scripts/hard-gate.sh` G8

**偷懶程度**: 💀 輕微 - 不影響功能，但浪費執行時間

**風險**: 
- 兩處邏輯不同步時會混亂
- pre-commit 跑兩次 `npm run generate:schema`

**引導修正**:
```
方案 A: 刪除 hard-gate.sh 的 G8，只保留 pre-commit hook
  - 因為 pre-commit hook 是實際執行的

方案 B: pre-commit hook 改為呼叫 hard-gate.sh
  - 統一入口，避免重複

建議用方案 A，hard-gate.sh 是給 arena 用的，不需要管 Schema。
```

---

#### 🟡 D19: toJSONSchema 強制轉型

**問題**: `generate-json-schema.ts` 用 `as unknown as { toJSONSchema: ... }` 強制轉型。

**偷懶程度**: 💀 輕微 - 沒有型別安全

**證據**:
```typescript
const jsonSchema = (SeedFileSchema as unknown as { toJSONSchema: () => Record<string, unknown> }).toJSONSchema();
```

**風險**: 
- 如果 zod-to-json-schema 沒安裝，執行時才會 crash
- TypeScript 無法提供自動補全

**引導修正**:
```
方案 A: 安裝 @anatine/zod-openapi 或 zod-to-json-schema
  npm install zod-to-json-schema
  import { zodToJsonSchema } from 'zod-to-json-schema';
  const jsonSchema = zodToJsonSchema(SeedFileSchema);

方案 B: 加上執行時檢查
  if (typeof SeedFileSchema.toJSONSchema !== 'function') {
    throw new Error('SeedFileSchema.toJSONSchema 不存在，請確認 zod 版本');
  }

建議用方案 A，有完整型別支援。
```

---

### 📊 D7-D13 原問題（已歸檔）

> 以下為原始問題描述，已於 2025-12-17 修正完成

<details>
<summary>點擊展開已修正的 D7-D13 原始問題</summary>

#### ✅ D7: JSON Schema 是假的「自動生成」(已修)

**修正**: 改為 `SeedFileSchema.toJSONSchema()` 真自動生成

---

#### ✅ D8: validate:property 沒驗證 Mock (已修)

**修正**: `verify-seed-strict.ts` 同時驗 JSON + Mock

---

#### ✅ D9: D6 adapter 沒有單元測試 (已修但有缺陷)

**修正**: 新增 `property-page.test.ts`
**⚠️ 缺陷**: 半形 dash 測試預期「匿名」而非修 Regex，見 D16

---

#### ✅ D10: D6 adapter 沒有被引用 (已修但有缺陷)

**修正**: 在 `verify-seed-strict.ts` 呼叫 adapters
**⚠️ 缺陷**: 這只是驗證使用，非業務代碼使用，見 D14

---

#### ✅ D11: pre-commit 偷偷改檔案沒通知 (已修)

**修正**: `.git/hooks/pre-commit` + `hard-gate.sh` 加警示

---

#### ✅ D12: check:ssot 的 deepEqual 沒測試 (已修)

**修正**: 改用 Node.js `assert.deepStrictEqual`

---

#### ✅ D13: 腳本沒有 error boundary (已修)

**修正**: 新增 `scripts/lib/error-handler.ts` 統一格式

</details>

---

### 📊 修正優先順序建議（更新版）
- null vs undefined
- [] vs {}
- 順序不同的陣列
```

---

</details>

---

### 📊 修正優先順序建議（更新版 2025-12-17）

| 優先 | 缺失 | 理由 |
|------|------|------|
| 1 | D14 | **最重要** - adapter 假使用，Phase 2 前必須解決 |
| 2 | D15 | 重複腳本浪費維護成本 |
| 3 | D16 | 測試發現問題卻不修，等於沒測 |
| 4 | D17-D19 | 輕微問題，可延後 |
| ~~5~~ | ~~D7-D13~~ | ✅ 已完成 |

---

## Phase 2: API 端點建立 ⬜
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
