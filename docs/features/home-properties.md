# 功能規格：首頁智能房源 (Smart Properties)

> **摘要**：實作「混合動力 V4.0」架構，達成首頁房源從 Mock 到真實資料的無縫切換，且外觀完全不變。

---

## 🎯 驗收標準 (Acceptance Criteria)

| # | 標準 | 驗證方式 |
|---|------|----------|
| AC-1 | **零秒載入**：使用者進入首頁時，立即看到 6 張房源卡片，無 Loading 動畫 | 錄影截圖 |
| AC-2 | **無縫切換**：API 載入完成後，卡片內容瞬間替換，版面高度/圖片比例維持不變 | DevTools Network + 視覺對比 |
| AC-3 | **多樣化評價**：新房源無評價時，根據 ID 自動輪替 A/B/C 三種文案 | 不同 ID 輸出不同文案 |
| AC-4 | **分級容錯**：DB 失敗 → 全 Seed；API 失敗 → 全 Mock | 模擬錯誤測試 |

---

## 🛠️ 實作計畫

### 1. 後端 API (`api/home/featured-properties.ts`)

**路徑**：`GET /api/home/featured-properties`

#### 1.1 常數定義

```typescript
const REQUIRED_COUNT = 6;

// 🔥 關鍵：必須與 src/constants/data.ts 的 PROPERTIES 完全一致
const SERVER_SEEDS = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=1600',
    badge: '捷運 5 分鐘',
    title: '新板特區｜三房含車位，採光面中庭',
    tags: ['34.2 坪', '3 房 2 廳', '高樓層'],
    price: '1,288',
    location: '新北市板橋區 · 中山路一段',
    reviews: [
      { avatar: 'A', name: '王小姐', role: '3年住戶', tag: '管理到位', text: '管委反應快...' },
      { avatar: 'B', name: '林先生', role: '屋主', tag: '車位好停', text: '坡道寬...' },
    ],
    source: 'seed'
  },
  // ... (其他 5 筆)
];
```

#### 1.2 價格格式化

```typescript
function formatPrice(price: number | null): string {
  if (!price) return '洽詢';
  const val = price > 10000 ? Math.round(price / 10000) : price;
  return new Intl.NumberFormat('en-US').format(val);
}
```

#### 1.3 Adapter 邏輯 (強制美顏)

```typescript
function adaptPropertyForUI(property: any, reviews: any[]) {
  // 1. 圖片優化：強制 4:3 裁切
  let imageUrl = property.images?.[0] || 'https://images.unsplash.com/...';
  if (imageUrl.includes('supabase.co')) {
    imageUrl += '?width=800&height=600&resize=cover';
  }

  // 2. 標籤優化：控制數量與長度
  const area = property.size ? `${Number(property.size).toFixed(1)} 坪` : '';
  const layout = `${property.rooms || 0}房${property.halls || 0}廳`;
  let featureTag = property.features?.[0] || '優質好房';
  if (featureTag.length > 5) featureTag = '精選物件';
  const tags = [area, layout, featureTag].filter(Boolean).slice(0, 3);

  // 3. 評價多樣化補位
  const displayReviews = [...reviews];
  if (displayReviews.length < 2) {
    const lastChar = property.id.slice(-1);
    const seedIndex = parseInt(lastChar, 16) % 3;
    const defaultSets = [
      // Set A: 新上架強調
      [{ avatar: 'M', name: '邁房子', role: '系統', tag: '新上架', text: '此物件剛剛上架...' }],
      // Set B: 熱度強調
      [{ avatar: 'H', name: '熱度榜', role: '系統', tag: '瀏覽高', text: '本週熱門物件...' }],
      // Set C: 地段強調
      [{ avatar: 'L', name: '區域通', role: '系統', tag: '地段佳', text: '位於精華生活圈...' }]
    ];
    displayReviews.push(...defaultSets[seedIndex]);
  }

  // 4. 地址組合
  const location = (property.city && property.district)
    ? `${property.city}${property.district} · ${property.road || ''}`
    : property.address || '地址詳洽';

  return {
    id: property.id,
    image: imageUrl,
    badge: property.features?.[0] || '精選物件',
    title: property.title || '未命名物件',
    tags,
    price: formatPrice(property.price),
    location,
    reviews: displayReviews.slice(0, 2),
    source: 'real'
  };
}
```

#### 1.4 Handler 主邏輯

```typescript
export default async function handler(req: VercelRequest, res: VercelResponse) {
  let finalProperties: any[] = [];

  try {
    // 1. 撈取真實房源
    const { data: realProps } = await supabase
      .from('properties')
      .select('id, title, price, size, rooms, halls, address, city, district, road, images, features, community_id')
      .order('created_at', { ascending: false })
      .limit(REQUIRED_COUNT);

    if (realProps && realProps.length > 0) {
      // 2. 批量撈取評價 (Batch Query)
      const communityIds = realProps.map(p => p.community_id).filter(Boolean);
      let reviewsMap: Record<string, any[]> = {};

      if (communityIds.length > 0) {
        const { data: allReviews } = await supabase
          .from('community_reviews')
          .select('community_id, content, agent(name), source')
          .in('community_id', communityIds);
        
        (allReviews || []).forEach((r: any) => {
          if (!reviewsMap[r.community_id]) reviewsMap[r.community_id] = [];
          reviewsMap[r.community_id].push(r);
        });
      }

      // 3. 組合資料
      finalProperties = realProps.map(p => {
        const relatedReviews = reviewsMap[p.community_id] || [];
        return adaptPropertyForUI(p, relatedReviews);
      });
    }
  } catch (error) {
    console.error('API Error');
  }

  // 4. 自動補位
  const missingCount = REQUIRED_COUNT - finalProperties.length;
  if (missingCount > 0) {
    finalProperties = [...finalProperties, ...SERVER_SEEDS.slice(0, missingCount)];
  }

  return res.status(200).json({ success: true, data: finalProperties });
}
```

---

### 2. 前端 Service (`src/services/propertyService.ts`)

```typescript
/**
 * 取得首頁精選房源
 * 無論後端發生什麼事，只回傳資料陣列或空陣列
 */
export async function getFeaturedProperties(): Promise<any[]> {
  try {
    const response = await fetch('/api/home/featured-properties');
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

---

### 3. 前端 UI (`src/features/home/sections/PropertyGrid.tsx`)

**修改範圍**：僅修改 State 初始化與新增 useEffect，**JSX 結構完全不變**。

```typescript
import { useEffect, useState } from 'react';
import { PROPERTIES } from '../../../constants/data';
import { getFeaturedProperties } from '../../../services/propertyService';

export default function PropertyGrid() {
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

  return (
    // JSX 完全不變
    <div className="grid ...">
      {properties.map(property => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}
```

---

## ⚠️ 注意事項

| # | 項目 | 說明 |
|---|------|------|
| 1 | **嚴禁 Loading Skeleton** | 會導致畫面閃爍，違反 UI 不變原則 |
| 2 | **真實房源無圖片** | 需提供高品質預設圖，不可破圖 |
| 3 | **SERVER_SEEDS 同步** | 前端 Mock 更新時，後端也必須更新 |
| 4 | **formatPrice 輸出** | 必須是字串 (含逗號)，不是數字 |

---

## 📊 資料流程圖

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   properties    │     │  communities    │     │community_reviews│
│   (房源表)       │────▶│   (社區表)       │────▶│   (評價表)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                               │
        │  community_id                                 │
        └───────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Batch Query    │
                    │  (一次撈取全部)  │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │    Adapter      │
                    │  (強制美顏)      │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Auto Fill     │
                    │  (自動補位)      │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Response      │
                    │  { data: [...] }│
                    └─────────────────┘
```

---

*版本：V4.0 終極版*
*最後更新：2025-12-15*
