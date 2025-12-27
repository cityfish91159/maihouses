import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock env config BEFORE importing service
vi.mock('../../config/env', () => ({
  env: {
    VITE_SUPABASE_URL: 'https://mock.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'mock-key',
  },
}));

// Mock supabase client
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { getFeaturedProperties, FeaturedPropertyForUI } from '../propertyService';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// ============================
// Mock Data
// ============================

const mockSuccessResponse = {
  success: true,
  data: [
    {
      id: 'uuid-1',
      image: 'https://example.com/image1.jpg',
      badge: '捷運5分鐘',
      title: '測試房源一',
      tags: ['30坪', '3房2廳', '高樓層'],
      price: '1,288',
      location: '台北市信義區 · 信義路',
      reviews: [
        { avatar: 'A', name: '王小姐', role: '住戶', tag: '管理佳', text: '很棒' },
        { avatar: 'B', name: '李先生', role: '屋主', tag: '交通便利', text: '推薦' },
      ],
      source: 'real',
    },
    {
      id: 2,
      image: 'https://example.com/image2.jpg',
      badge: '社區中庭',
      title: '測試房源二',
      tags: ['25坪', '2房2廳'],
      price: '968',
      location: '新北市板橋區 · 中山路',
      reviews: [
        { avatar: 'C', name: '張小姐', role: '住戶', tag: '環境好', text: '讚' },
      ],
      source: 'seed',
    },
  ] as FeaturedPropertyForUI[],
};

// ============================
// Test Suite
// ============================

describe('propertyService - getFeaturedProperties', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('成功情境', () => {
    it('API 回傳成功時，回傳 data 陣列', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      });

      const result = await getFeaturedProperties();

      expect(mockFetch).toHaveBeenCalledWith('/api/home/featured-properties');
      expect(result).toEqual(mockSuccessResponse.data);
      expect(result.length).toBe(2);
    });

    it('回傳資料包含 real 和 seed 兩種 source', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      });

      const result = await getFeaturedProperties();

      const sources = result.map(p => p.source);
      expect(sources).toContain('real');
      expect(sources).toContain('seed');
    });
  });

  describe('失敗情境 - HTTP 錯誤', () => {
    it('response.ok 為 false 時，回傳空陣列', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal Server Error' }),
      });

      const result = await getFeaturedProperties();

      expect(result).toEqual([]);
    });

    it('HTTP 404 時，回傳空陣列', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not Found' }),
      });

      const result = await getFeaturedProperties();

      expect(result).toEqual([]);
    });
  });

  describe('失敗情境 - JSON 格式錯誤', () => {
    it('json.success 為 false 時，回傳空陣列', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, error: 'DB Error' }),
      });

      const result = await getFeaturedProperties();

      expect(result).toEqual([]);
    });

    it('json.data 不是陣列時，回傳空陣列', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: 'not an array' }),
      });

      const result = await getFeaturedProperties();

      expect(result).toEqual([]);
    });

    it('json.data 為 null 時，回傳空陣列', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: null }),
      });

      const result = await getFeaturedProperties();

      expect(result).toEqual([]);
    });
  });

  describe('失敗情境 - 網路錯誤', () => {
    it('fetch 拋出錯誤時 (斷網)，回傳空陣列', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network Error'));

      const result = await getFeaturedProperties();

      expect(result).toEqual([]);
    });

    it('fetch timeout 時，回傳空陣列', async () => {
      mockFetch.mockRejectedValueOnce(new Error('AbortError: The operation was aborted'));

      const result = await getFeaturedProperties();

      expect(result).toEqual([]);
    });
  });

  describe('三層容錯機制驗證', () => {
    it('Level 1: API 成功 → 回傳真實資料', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      });

      const result = await getFeaturedProperties();
      expect(result.length).toBeGreaterThan(0);
    });

    it('Level 2: response.ok=false → 回傳空陣列 (觸發前端 Mock)', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      const result = await getFeaturedProperties();
      expect(result).toEqual([]);
    });

    it('Level 3: 網路斷線 → 回傳空陣列 (觸發前端 Mock)', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

      const result = await getFeaturedProperties();
      expect(result).toEqual([]);
    });
  });
});
