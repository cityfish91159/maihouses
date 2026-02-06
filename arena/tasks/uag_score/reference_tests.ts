/**
 * UAG Score 公開測試
 *
 * AI 可以看到這些測試，必須全過才能入場
 */

export interface TestCase {
  name: string;
  input: unknown;
  expected: unknown;
}

export const tests: TestCase[] = [
  {
    name: '完美房源',
    input: {
      hasVerifiedOwner: true,
      hasRealPhotos: true,
      hasPriceHistory: true,
      responseTimeHours: 1,
      reviewCount: 10,
      avgRating: 5,
      listingAgeDays: 30,
      updateFrequency: 4,
    },
    expected: {
      score: 96,
      level: 'S',
      breakdown: {
        verification: 30,
        quality: 25,
        responsiveness: 23,
        history: 18,
      },
    },
  },
  {
    name: '最差房源',
    input: {
      hasVerifiedOwner: false,
      hasRealPhotos: false,
      hasPriceHistory: false,
      responseTimeHours: 72,
      reviewCount: 0,
      avgRating: 1,
      listingAgeDays: 365,
      updateFrequency: 0,
    },
    expected: {
      score: 5,
      level: 'F',
      breakdown: {
        verification: 0,
        quality: 5,
        responsiveness: 0,
        history: 0,
      },
    },
  },
  {
    name: '中等房源',
    input: {
      hasVerifiedOwner: true,
      hasRealPhotos: false,
      hasPriceHistory: true,
      responseTimeHours: 12,
      reviewCount: 3,
      avgRating: 3.5,
      listingAgeDays: 60,
      updateFrequency: 2,
    },
    expected: {
      score: 40,
      level: 'C',
      breakdown: {
        verification: 15,
        quality: 17,
        responsiveness: 1,
        history: 7,
      },
    },
  },
];

export default tests;
