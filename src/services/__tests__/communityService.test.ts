// Mock env config BEFORE importing service
vi.mock('../../config/env', () => ({
  env: {
    VITE_SUPABASE_URL: 'https://mock.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'mock-key',
  },
  communityApiBase: 'http://localhost:3000',
}));

import { getFeaturedHomeReviews } from '../communityService';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('communityService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Mock environment variable
    vi.stubEnv('VITE_API_TIMEOUT', '1000');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('getFeaturedHomeReviews', () => {
    it('should return data when API response is valid', async () => {
      const mockData = {
        success: true,
        data: [
          {
            id: '1',
            displayId: 'A',
            name: 'Test User',
            rating: 5,
            tags: ['#Tag'],
            content: 'Content',
            communityId: 'c1',
            source: 'real',
            region: 'tw',
          },
        ],
        meta: {
          total: 1,
          realCount: 1,
          seedCount: 0,
          timestamp: '2025-01-01',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await getFeaturedHomeReviews();
      expect(result).toEqual(mockData.data);
    });

    it('should throw error when tags are not strings (Lie 1)', async () => {
      const invalidData = {
        success: true,
        data: [
          {
            id: '1',
            displayId: 'A',
            name: 'Test User',
            rating: 5,
            tags: [123], // Invalid tag type
            content: 'Content',
            communityId: 'c1',
            source: 'real',
            region: 'tw',
          },
        ],
        meta: { total: 1, realCount: 1, seedCount: 0, timestamp: '2025-01-01' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => invalidData,
      });

      await expect(getFeaturedHomeReviews()).rejects.toThrow('Invalid API response format');
    });

    it('should throw error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(getFeaturedHomeReviews()).rejects.toThrow('API error: 500');
    });
  });
});
