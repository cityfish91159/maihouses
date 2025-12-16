# 🏠 P11: 房源列表頁混合動力升級 V2.0

> **專案狀態**: ⬜ **待開發 (Pending)**
> **最後更新**: 2025-12-16
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

### Phase 1: 資料標準化 (SSOT) ⬜

| # | 任務 | 檔案 | 狀態 | 驗證 |
|---|------|------|------|------|
| 1.1 | 建立種子資料 JSON | `public/data/seed-property-page.json` | ⬜ | 結構與 Mock 一致 |
| 1.2 | 更新前端 Mock 註解 | `public/js/property-data.js` | ⬜ | 標記同步提醒 |
| 1.3 | TypeScript 型別定義 | `src/types/property-page.ts` | ⬜ | 共用介面 |

**驗收**: JSON 與 JS Mock 結構完全一致

---

### Phase 2: 後端聚合 API ⬜

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
