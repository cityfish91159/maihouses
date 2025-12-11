
/**
 * Mock Data for Feed
 * 
 * Centralized mock data to avoid magic numbers in components.
 */

export const MOCK_FEED_STATS = {
    days: 128,
    liked: 73,
    contributions: 15,
};

export const MOCK_SALE_ITEMS = [
    { id: '1', title: '惠宇上晴 12F', price: 1280, priceUnit: '萬', communityName: '惠宇上晴' },
    { id: '2', title: '惠宇上晴 8F', price: 1150, priceUnit: '萬', communityName: '惠宇上晴' },
];

export const MOCK_ACTIVE_TRANSACTION = {
    hasActive: true,
    propertyName: '惠宇上晴 12F',
    stage: 'negotiation' as const,
};
