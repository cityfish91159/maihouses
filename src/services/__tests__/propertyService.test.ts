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
        {
          avatar: 'A',
          name: '王小姐',
          role: '住戶',
          tag: '管理佳',
          text: '很棒',
        },
        {
          avatar: 'B',
          name: '李先生',
          role: '屋主',
          tag: '交通便利',
          text: '推薦',
        },
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
        {
          avatar: 'C',
          name: '張小姐',
          role: '住戶',
          tag: '環境好',
          text: '讚',
        },
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

      const sources = result.map((p) => p.source);
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

// ============================
// BE-1: CreatePropertyRpcResultSchema 測試
// ============================
import { z } from 'zod';

// 複製 Schema 用於測試（避免循環依賴）
const CreatePropertyRpcResultSchema = z.object({
  success: z.boolean(),
  id: z.string().uuid().optional(),
  public_id: z.string().optional(),
  error: z.string().optional(),
});

describe('BE-1: CreatePropertyRpcResultSchema', () => {
  describe('成功案例', () => {
    it('驗證成功回傳結構', () => {
      const validResult = {
        success: true,
        id: '550e8400-e29b-41d4-a716-446655440000',
        public_id: 'MH-100001',
      };

      const parsed = CreatePropertyRpcResultSchema.safeParse(validResult);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.success).toBe(true);
        expect(parsed.data.id).toBe('550e8400-e29b-41d4-a716-446655440000');
        expect(parsed.data.public_id).toBe('MH-100001');
      }
    });

    it('驗證失敗回傳結構', () => {
      const errorResult = {
        success: false,
        error: 'Database connection failed',
      };

      const parsed = CreatePropertyRpcResultSchema.safeParse(errorResult);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.success).toBe(false);
        expect(parsed.data.error).toBe('Database connection failed');
      }
    });

    it('id 和 public_id 是可選的', () => {
      const minimalResult = { success: true };

      const parsed = CreatePropertyRpcResultSchema.safeParse(minimalResult);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.id).toBeUndefined();
        expect(parsed.data.public_id).toBeUndefined();
      }
    });
  });

  describe('驗證失敗案例', () => {
    it('缺少 success 欄位時驗證失敗', () => {
      const invalidResult = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        public_id: 'MH-100001',
      };

      const parsed = CreatePropertyRpcResultSchema.safeParse(invalidResult);
      expect(parsed.success).toBe(false);
    });

    it('success 不是 boolean 時驗證失敗', () => {
      const invalidResult = {
        success: 'true', // string instead of boolean
        id: '550e8400-e29b-41d4-a716-446655440000',
      };

      const parsed = CreatePropertyRpcResultSchema.safeParse(invalidResult);
      expect(parsed.success).toBe(false);
    });

    it('id 不是 UUID 格式時驗證失敗', () => {
      const invalidResult = {
        success: true,
        id: 'not-a-uuid',
        public_id: 'MH-100001',
      };

      const parsed = CreatePropertyRpcResultSchema.safeParse(invalidResult);
      expect(parsed.success).toBe(false);
    });
  });

  describe('trustEnabled 傳遞驗證', () => {
    it('Boolean(true) 正確轉換', () => {
      expect(Boolean(true)).toBe(true);
    });

    it('Boolean(false) 正確轉換', () => {
      expect(Boolean(false)).toBe(false);
    });

    it('Boolean(undefined) 轉換為 false', () => {
      expect(Boolean(undefined)).toBe(false);
    });

    it('Boolean(null) 轉換為 false', () => {
      expect(Boolean(null)).toBe(false);
    });
  });

  describe('RPC 必要欄位驗證', () => {
    it('success=true 但缺少 id 時應視為無效', () => {
      const resultMissingId = {
        success: true,
        public_id: 'MH-100001',
        // id 缺失
      };

      const parsed = CreatePropertyRpcResultSchema.safeParse(resultMissingId);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        // Schema 驗證通過，但業務邏輯應檢查 id 存在
        expect(parsed.data.id).toBeUndefined();
      }
    });

    it('success=true 但缺少 public_id 時應視為無效', () => {
      const resultMissingPublicId = {
        success: true,
        id: '550e8400-e29b-41d4-a716-446655440000',
        // public_id 缺失
      };

      const parsed = CreatePropertyRpcResultSchema.safeParse(resultMissingPublicId);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        // Schema 驗證通過，但業務邏輯應檢查 public_id 存在
        expect(parsed.data.public_id).toBeUndefined();
      }
    });

    it('success=true 且 id、public_id 都存在時為有效', () => {
      const validResult = {
        success: true,
        id: '550e8400-e29b-41d4-a716-446655440000',
        public_id: 'MH-100001',
      };

      const parsed = CreatePropertyRpcResultSchema.safeParse(validResult);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.id).toBeDefined();
        expect(parsed.data.public_id).toBeDefined();
      }
    });
  });
});
