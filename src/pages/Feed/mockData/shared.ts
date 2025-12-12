/**
 * Feed Mock Data - Shared Constants & Utilities
 *
 * Centralized mock data constants to avoid magic strings/numbers.
 * Following UAG/Community mockData patterns.
 */

// ============ Time Utilities ============

/**
 * Generate ISO timestamp relative to now
 * @param minutesAgo - Minutes before current time
 */
export const mockTimestamp = (minutesAgo: number): string =>
  new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();

/** Helper for hours */
export const mockTimestampHoursAgo = (hours: number): string =>
  mockTimestamp(hours * 60);

/** Helper for days */
export const mockTimestampDaysAgo = (days: number): string =>
  mockTimestamp(days * 24 * 60);

// ============ Shared Constants ============

export const MOCK_COMMUNITIES = {
  HUIYU: {
    id: 'test-uuid',
    name: '惠宇上晴',
  },
  FARGLORY: {
    id: 'community-2',
    name: '遠雄中央公園',
  },
  CATHAY: {
    id: 'community-3',
    name: '國泰建設',
  },
} as const;

export const MOCK_AUTHORS = {
  // Residents
  CHEN_MS: { name: '陳小姐', floor: '12F', type: 'resident' as const },
  LI_MR: { name: '李先生', floor: '8F', type: 'resident' as const },
  WANG_MS: { name: '王太太', floor: '5F', type: 'resident' as const },
  ZHANG_MR: { name: '張先生', floor: '10F', type: 'resident' as const },
  // Agents
  YOU_AGENT: { name: '游杰倫', type: 'agent' as const },
  LIN_AGENT: { name: '林經理', type: 'agent' as const },
  // Members
  TEST_USER: { name: '測試用戶', type: 'member' as const },
} as const;

// ============ ID Generator ============

let mockIdCounter = 1000;

/**
 * Generate unique mock ID
 * Ensures no collision between Consumer and Agent mock data
 */
export const generateMockId = (): number => ++mockIdCounter;

/**
 * Reset ID counter (for testing)
 */
export const resetMockIdCounter = (start = 1000): void => {
  mockIdCounter = start;
};
