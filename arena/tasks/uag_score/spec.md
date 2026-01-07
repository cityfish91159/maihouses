# UAG Score 任務規格

## 功能

計算房源的 UAG 信任分數 (0-100)

## 輸入

```typescript
interface UAGInput {
  hasVerifiedOwner: boolean; // 已驗證屋主
  hasRealPhotos: boolean; // 真實照片
  hasPriceHistory: boolean; // 價格歷史
  responseTimeHours: number; // 回覆時間（小時）
  reviewCount: number; // 評價數量
  avgRating: number; // 平均評分 (1-5)
  listingAgeDays: number; // 刊登天數
  updateFrequency: number; // 更新頻率（次/月）
}
```

## 輸出

```typescript
interface UAGOutput {
  score: number; // 0-100
  level: "S" | "A" | "B" | "C" | "F";
  breakdown: {
    verification: number; // 0-30
    quality: number; // 0-25
    responsiveness: number; // 0-25
    history: number; // 0-20
  };
}
```

## 規則

- verification: hasVerifiedOwner +15, hasRealPhotos +15
- quality: avgRating \* 5 (max 25)
- responsiveness: max(0, 25 - responseTimeHours \* 2)
- history: min(20, reviewCount + updateFrequency \* 2)

## 邊界條件

- 所有數值可能是 null/undefined
- responseTimeHours 可能是負數或極大值
- avgRating 可能超出 1-5 範圍
- reviewCount 可能是小數或負數
