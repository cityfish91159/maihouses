# MaiHouses Design Patterns (設計模式)

> 本文件定義 MaiHouses 專案的核心開發模式，所有列表類功能必須遵守此規範。

## 🚀 混合動力架構 (Hybrid Power Architecture)

適用於：首頁列表、推薦區塊、冷啟動階段的功能 (如智能房源、社區評價)。
核心原則：**Real First, Mock Fill, Zero Flicker** (真實優先，Mock 補位，零閃爍)。

### 1. 運作流程

```
┌─────────────────────────────────────────────────────────────────┐
│                         混合動力架構流程圖                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [用戶進站]                                                      │
│      │                                                          │
│      ▼                                                          │
│  ┌───────────────────────┐                                      │
│  │ 1. useState(MOCK)     │  ← 前端直出 Mock，0 秒等待            │
│  │    顯示 6 張卡片       │                                      │
│  └───────────┬───────────┘                                      │
│              │                                                  │
│              ▼                                                  │
│  ┌───────────────────────┐                                      │
│  │ 2. useEffect()        │  ← 背景發送 API 請求                  │
│  │    fetch API          │                                      │
│  └───────────┬───────────┘                                      │
│              │                                                  │
│              ▼                                                  │
│  ┌───────────────────────────────────────────────┐              │
│  │ 3. 後端聚合 (Backend Aggregation)              │              │
│  │    ├─ 撈取真實資料 (DB)                        │              │
│  │    ├─ 批量查詢評價 (Batch Query)               │              │
│  │    ├─ 適配轉換 (Adapter)                       │              │
│  │    └─ 自動補位 (Fill with SERVER_SEEDS)        │              │
│  └───────────────────────┬───────────────────────┘              │
│                          │                                      │
│                          ▼                                      │
│  ┌───────────────────────┐                                      │
│  │ 4. setState(apiData)  │  ← 靜默替換，視覺無跳動               │
│  │    顯示真實 + Seed     │                                      │
│  └───────────────────────┘                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

1.  **初始化 (Init)**：前端 `useState` 初始值直接使用 `CONST_MOCK_DATA`，確保 SSR/CSR 無白屏、無 Skeleton 跳動。
2.  **後端聚合 (Backend Aggregation)**：
    * **Batch Query**：必須使用批量查詢解決 N+1 問題 (例如一次撈取所有房源的評價)。
    * **Auto Fill**：計算缺口 (Target - Real)，不足時自動用 `SERVER_SEEDS` 補位。
    * **Smart Adapter**：後端負責所有格式轉換 (日期、金額、圖片裁切)，確保吐給前端的資料與 Mock 格式 **100% 一致**。
3.  **靜默替換 (Silent Swap)**：
    * 前端 `useEffect` 呼叫 API。
    * 成功後 `setState` 替換資料。
    * 因格式嚴格對齊，使用者視覺上無跳動感，只會感覺內容變了。

### 2. 關鍵實作細節

#### 2.1 單一真理來源 (Single Source of Truth)

Mock 資料必須在「前端常數」與「後端 API」中保持內容完全一致。

```typescript
// 前端: src/constants/data.ts
export const PROPERTIES = [
  { id: 1, title: '新板特區...', price: '1,288', ... },
  // ...
];

// 後端: api/home/featured-properties.ts
const SERVER_SEEDS = [
  { id: 1, title: '新板特區...', price: '1,288', ... },
  // 必須與前端完全一致！
];
```

#### 2.2 強制美顏 (Force Beautification)

後端 Adapter 必須處理以下轉換，確保真實資料與 Mock 一樣精緻：

| 項目 | 處理方式 | 範例 |
|------|----------|------|
| **圖片** | 動態裁切參數 | `?width=800&height=600&resize=cover` |
| **標籤** | 限制數量與長度 | Max 3 個，超過 5 字替換 |
| **金額** | 千分位字串 | `12880000` → `"1,288"` |
| **地址** | 組合格式化 | `台北市大安區 · 忠孝東路` |

#### 2.3 分級容錯 (Graceful Degradation)

```
Level 1 (最佳): 混合資料 (真實 + Seed)
    ↓ DB 失敗
Level 2 (次優): 全 Seed (API 回傳)
    ↓ API 失敗
Level 3 (保底): 全 Mock (前端靜態)
```

---

## 🎨 UI 不變原則 (UI Freeze Protocol)

當任務標註為「外觀不變」時：

### 禁止行為

| # | 禁止項目 | 說明 |
|---|----------|------|
| 1 | **禁止修改 JSX 結構** | 不得增減 DOM 層級 |
| 2 | **禁止修改 CSS Class** | 不得調整間距、顏色、字體 |
| 3 | **禁止修改 Props 介面** | 後端資料必須配合前端 Component |
| 4 | **禁止 Loading Skeleton** | 首頁列表必須 Mock 預填 |

### 允許行為

| # | 允許項目 | 說明 |
|---|----------|------|
| 1 | 修改 State 初始值 | Mock → API 資料 |
| 2 | 新增 useEffect | 背景呼叫 API |
| 3 | 新增 Service 函數 | API 封裝 |
| 4 | 新增後端 API | 資料聚合 |

---

## 🔧 標準程式碼範本

### 後端 API 範本

```typescript
// api/home/featured-xxx.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const REQUIRED_COUNT = 6;
const SERVER_SEEDS = [ /* 與前端 Mock 一致 */ ];

function adaptForUI(item: any): any {
  // 強制美顏邏輯
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let finalData: any[] = [];

  try {
    // 1. 撈取真實資料
    const { data: realData } = await supabase.from('xxx').select('*').limit(REQUIRED_COUNT);
    
    // 2. Adapter 轉換
    if (realData) {
      finalData = realData.map(adaptForUI);
    }
  } catch (error) {
    console.error('API Error');
  }

  // 3. 自動補位
  const missingCount = REQUIRED_COUNT - finalData.length;
  if (missingCount > 0) {
    finalData = [...finalData, ...SERVER_SEEDS.slice(0, missingCount)];
  }

  return res.status(200).json({ success: true, data: finalData });
}
```

### 前端 Service 範本

```typescript
// src/services/xxxService.ts
export async function getFeaturedXxx(): Promise<any[]> {
  try {
    const response = await fetch('/api/home/featured-xxx');
    const json = await response.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data;
    }
    return [];
  } catch (error) {
    return []; // 觸發 Level 3 保底
  }
}
```

### 前端 UI 範本

```typescript
// src/features/home/sections/XxxGrid.tsx
import { useEffect, useState } from 'react';
import { MOCK_DATA } from '../../../constants/data';
import { getFeaturedXxx } from '../../../services/xxxService';

export default function XxxGrid() {
  // 🚀 Mock 先行
  const [items, setItems] = useState<any[]>(MOCK_DATA);

  useEffect(() => {
    let isMounted = true;
    // 🚀 背景靜默更新
    getFeaturedXxx().then(data => {
      if (isMounted && data && data.length > 0) {
        setItems(data);
      }
    });
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="grid ...">
      {items.map(item => <Card key={item.id} data={item} />)}
    </div>
  );
}
```

---

*版本：V1.0*
*最後更新：2025-12-15*
