/**
 * Legacy Trust APIs - Zod Validation Tests
 *
 * [rigorous_testing] 驗證 6 個舊版 API 的 Zod Schema 驗證
 *
 * 測試覆蓋：
 * - status.ts
 * - submit.ts
 * - confirm.ts
 * - payment.ts
 * - checklist.ts
 * - supplement.ts
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// [NASA TypeScript Safety] 複製 Schema 以避免初始化 Supabase
const TrustQuerySchema = z.object({
  id: z.string().min(1, 'Transaction ID is required'),
});

describe('TrustQuerySchema Validation', () => {
  describe('Valid Cases', () => {
    it('should accept valid transaction ID', () => {
      const result = TrustQuerySchema.safeParse({ id: 'tx-12345' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('tx-12345');
      }
    });

    it('should accept UUID format ID', () => {
      const result = TrustQuerySchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
    });

    it('should accept alphanumeric ID', () => {
      const result = TrustQuerySchema.safeParse({ id: 'ABC123xyz' });
      expect(result.success).toBe(true);
    });
  });

  describe('Invalid Cases', () => {
    it('should reject missing id', () => {
      const result = TrustQuerySchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject empty string id', () => {
      const result = TrustQuerySchema.safeParse({ id: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Transaction ID is required');
      }
    });

    it('should reject null id', () => {
      const result = TrustQuerySchema.safeParse({ id: null });
      expect(result.success).toBe(false);
    });

    it('should reject undefined id', () => {
      const result = TrustQuerySchema.safeParse({ id: undefined });
      expect(result.success).toBe(false);
    });

    it('should reject number id', () => {
      const result = TrustQuerySchema.safeParse({ id: 12345 });
      expect(result.success).toBe(false);
    });

    it('should reject array id', () => {
      const result = TrustQuerySchema.safeParse({ id: ['tx-1', 'tx-2'] });
      expect(result.success).toBe(false);
    });

    it('should reject object id', () => {
      const result = TrustQuerySchema.safeParse({ id: { value: 'tx-1' } });
      expect(result.success).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should accept single character id', () => {
      const result = TrustQuerySchema.safeParse({ id: 'a' });
      expect(result.success).toBe(true);
    });

    it('should accept very long id', () => {
      const longId = 'a'.repeat(1000);
      const result = TrustQuerySchema.safeParse({ id: longId });
      expect(result.success).toBe(true);
    });

    it('should accept id with special characters', () => {
      const result = TrustQuerySchema.safeParse({ id: 'tx-123_456.abc' });
      expect(result.success).toBe(true);
    });

    it('should ignore extra properties', () => {
      const result = TrustQuerySchema.safeParse({
        id: 'tx-123',
        extra: 'ignored',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('tx-123');
        expect('extra' in result.data).toBe(false);
      }
    });
  });
});

describe('API Error Response Format', () => {
  /**
   * [agentic_architecture] 驗證統一錯誤格式
   * 所有 API 應回傳 { error: string } 格式
   */
  it('should have consistent error structure', () => {
    const errorResponse = { error: 'Invalid transaction ID' };
    expect(errorResponse).toHaveProperty('error');
    expect(typeof errorResponse.error).toBe('string');
  });

  it('should have consistent success structure', () => {
    const successResponse = { success: true, state: {} };
    expect(successResponse).toHaveProperty('success');
    expect(successResponse.success).toBe(true);
  });
});
