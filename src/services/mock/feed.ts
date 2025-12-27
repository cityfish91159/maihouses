/**
 * Mock Data for Feed
 * 
 * Centralized mock data to avoid magic numbers in components.
 */

const MOCK_STRINGS = {
    COMMUNITY_NAME: '惠宇上晴',
    PRICE_UNIT: '萬',
    TITLE_12F: '惠宇上晴 12F',
    TITLE_8F: '惠宇上晴 8F',
    STAGE: 'negotiation' as const,
};

export const MOCK_FEED_STATS = {
    days: 128,
    liked: 73,
    contributions: 15,
};

export const MOCK_SALE_ITEMS = [
    { id: '1', title: MOCK_STRINGS.TITLE_12F, price: 1280, priceUnit: MOCK_STRINGS.PRICE_UNIT, communityName: MOCK_STRINGS.COMMUNITY_NAME },
    { id: '2', title: MOCK_STRINGS.TITLE_8F, price: 1150, priceUnit: MOCK_STRINGS.PRICE_UNIT, communityName: MOCK_STRINGS.COMMUNITY_NAME },
];

export const MOCK_ACTIVE_TRANSACTION = {
    hasActive: true,
    propertyName: MOCK_STRINGS.TITLE_12F,
    stage: MOCK_STRINGS.STAGE,
};
