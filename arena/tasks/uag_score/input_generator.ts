/**
 * UAG Score 測試資料生成器
 * 
 * ⚠️ AI 看不到這裡的邏輯
 * 
 * 生成：
 * 1. Fuzz 測試（邊界、異常、極端值）
 * 2. Stress 測試（大量資料）
 * 3. Perf 測試（正常資料）
 */

// ============================================================================
// Fuzz 輸入生成（專門找邊界問題）
// ============================================================================

export function generateFuzzInput(): unknown {
  const r = Math.random();
  
  // 10% 完全空
  if (r < 0.1) return {};
  
  // 10% null
  if (r < 0.2) return null;
  
  // 10% 錯誤類型
  if (r < 0.3) return "not an object";
  
  // 10% 部分欄位
  if (r < 0.4) {
    return {
      hasVerifiedOwner: Math.random() > 0.5,
      // 其他欄位故意不給
    };
  }
  
  // 10% 極端數值
  if (r < 0.5) {
    return {
      hasVerifiedOwner: true,
      hasRealPhotos: true,
      hasPriceHistory: true,
      responseTimeHours: Math.random() > 0.5 ? -999 : 999999,
      reviewCount: Math.random() > 0.5 ? -100 : Infinity,
      avgRating: Math.random() > 0.5 ? -5 : 100,
      listingAgeDays: NaN,
      updateFrequency: undefined,
    };
  }
  
  // 10% 錯誤類型欄位
  if (r < 0.6) {
    return {
      hasVerifiedOwner: "yes",  // 應該是 boolean
      hasRealPhotos: 1,          // 應該是 boolean
      hasPriceHistory: null,
      responseTimeHours: "fast", // 應該是 number
      reviewCount: [],
      avgRating: {},
      listingAgeDays: true,
      updateFrequency: "often",
    };
  }
  
  // 10% 多餘欄位
  if (r < 0.7) {
    return {
      hasVerifiedOwner: true,
      hasRealPhotos: true,
      hasPriceHistory: true,
      responseTimeHours: 5,
      reviewCount: 10,
      avgRating: 4,
      listingAgeDays: 30,
      updateFrequency: 2,
      // 多餘
      __proto__: { polluted: true },
      constructor: null,
      extraField: "should be ignored",
    };
  }
  
  // 30% 邊界值
  const boundaryValues = [0, 0.001, 0.999, 1, 1.001, 4.999, 5, 5.001, -0.001];
  
  return {
    hasVerifiedOwner: [true, false, null, undefined][Math.floor(Math.random() * 4)],
    hasRealPhotos: [true, false, null, undefined][Math.floor(Math.random() * 4)],
    hasPriceHistory: [true, false, null, undefined][Math.floor(Math.random() * 4)],
    responseTimeHours: boundaryValues[Math.floor(Math.random() * boundaryValues.length)],
    reviewCount: boundaryValues[Math.floor(Math.random() * boundaryValues.length)],
    avgRating: boundaryValues[Math.floor(Math.random() * boundaryValues.length)],
    listingAgeDays: Math.floor(Math.random() * 1000),
    updateFrequency: Math.random() * 10,
  };
}

// ============================================================================
// Stress 輸入生成（大量資料）
// ============================================================================

export function generateStressInput(size: number): unknown[] {
  const inputs = [];
  
  for (let i = 0; i < size; i++) {
    inputs.push({
      hasVerifiedOwner: Math.random() > 0.5,
      hasRealPhotos: Math.random() > 0.5,
      hasPriceHistory: Math.random() > 0.5,
      responseTimeHours: Math.random() * 72,
      reviewCount: Math.floor(Math.random() * 100),
      avgRating: 1 + Math.random() * 4,
      listingAgeDays: Math.floor(Math.random() * 365),
      updateFrequency: Math.random() * 10,
    });
  }
  
  return inputs;
}

// ============================================================================
// Perf 輸入生成（正常資料）
// ============================================================================

export function generatePerfInput(): unknown {
  return {
    hasVerifiedOwner: Math.random() > 0.3,
    hasRealPhotos: Math.random() > 0.4,
    hasPriceHistory: Math.random() > 0.5,
    responseTimeHours: Math.random() * 48,
    reviewCount: Math.floor(Math.random() * 50),
    avgRating: 2 + Math.random() * 3,
    listingAgeDays: Math.floor(Math.random() * 180),
    updateFrequency: Math.random() * 8,
  };
}

export default generatePerfInput;
