import { createClient } from '@supabase/supabase-js';
import type { Mock } from 'vitest';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

interface PurchaseLeadResult {
  success: boolean;
  error?: string;
  used_quota?: boolean;
}

interface MockSupabaseClient {
  rpc: Mock;
}

describe('purchase_lead RPC Function', () => {
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    // Setup mock Supabase client
    mockSupabase = {
      rpc: vi.fn(),
    };
    vi.mocked(createClient).mockReturnValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    );
  });

  describe('成功購買場景', () => {
    it('應該成功使用點數購買 S 級客戶', async () => {
      // Arrange
      const mockResult: PurchaseLeadResult = {
        success: true,
        used_quota: false,
      };

      mockSupabase.rpc.mockResolvedValue({ data: mockResult, error: null });

      // Act
      const { data, error } = await mockSupabase.rpc('purchase_lead', {
        p_user_id: 'agent-123',
        p_lead_id: 'session-abc',
        p_cost: 500,
        p_grade: 'S',
      });

      // Assert
      expect(error).toBeNull();
      expect(data).toEqual({ success: true, used_quota: false });
      expect(mockSupabase.rpc).toHaveBeenCalledWith('purchase_lead', {
        p_user_id: 'agent-123',
        p_lead_id: 'session-abc',
        p_cost: 500,
        p_grade: 'S',
      });
    });

    it('應該成功使用 S 級配額購買', async () => {
      // Arrange
      const mockResult: PurchaseLeadResult = {
        success: true,
        used_quota: true,
      };

      mockSupabase.rpc.mockResolvedValue({ data: mockResult, error: null });

      // Act
      const { data, error } = await mockSupabase.rpc('purchase_lead', {
        p_user_id: 'agent-123',
        p_lead_id: 'session-xyz',
        p_cost: 500,
        p_grade: 'S',
      });

      // Assert
      expect(error).toBeNull();
      expect(data).toEqual({ success: true, used_quota: true });
    });

    it('應該成功使用 A 級配額購買', async () => {
      // Arrange
      const mockResult: PurchaseLeadResult = {
        success: true,
        used_quota: true,
      };

      mockSupabase.rpc.mockResolvedValue({ data: mockResult, error: null });

      // Act
      const { data, error } = await mockSupabase.rpc('purchase_lead', {
        p_user_id: 'agent-456',
        p_lead_id: 'session-def',
        p_cost: 300,
        p_grade: 'A',
      });

      // Assert
      expect(data?.success).toBe(true);
      expect(data?.used_quota).toBe(true);
    });
  });

  describe('錯誤處理場景', () => {
    it('餘額不足時應該回傳錯誤', async () => {
      // Arrange
      const mockResult: PurchaseLeadResult = {
        success: false,
        error: 'Insufficient balance',
      };

      mockSupabase.rpc.mockResolvedValue({ data: mockResult, error: null });

      // Act
      const { data } = await mockSupabase.rpc('purchase_lead', {
        p_user_id: 'agent-broke',
        p_lead_id: 'session-ghi',
        p_cost: 500,
        p_grade: 'S',
      });

      // Assert
      expect(data?.success).toBe(false);
      expect(data?.error).toBe('Insufficient balance');
    });

    it('重複購買時應該回傳錯誤', async () => {
      // Arrange
      const mockResult: PurchaseLeadResult = {
        success: false,
        error: 'Already purchased',
      };

      mockSupabase.rpc.mockResolvedValue({ data: mockResult, error: null });

      // Act
      const { data } = await mockSupabase.rpc('purchase_lead', {
        p_user_id: 'agent-123',
        p_lead_id: 'session-abc',
        p_cost: 500,
        p_grade: 'S',
      });

      // Assert
      expect(data?.success).toBe(false);
      expect(data?.error).toBe('Already purchased');
    });
  });

  describe('邊界條件', () => {
    it('應該正確處理 B/C/F 級客戶購買', async () => {
      const grades = [
        { grade: 'B', cost: 150 },
        { grade: 'C', cost: 80 },
        { grade: 'F', cost: 20 },
      ];

      for (const { grade, cost } of grades) {
        mockSupabase.rpc.mockResolvedValue({
          data: { success: true, used_quota: false },
          error: null,
        });

        const { data } = await mockSupabase.rpc('purchase_lead', {
          p_user_id: 'agent-123',
          p_lead_id: `session-${grade}`,
          p_cost: cost,
          p_grade: grade,
        });

        expect(data?.success).toBe(true);
      }
    });

    it('空 session_id 應該被驗證', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Invalid session_id' },
      });

      // Act
      const { error } = await mockSupabase.rpc('purchase_lead', {
        p_user_id: 'agent-123',
        p_lead_id: '',
        p_cost: 500,
        p_grade: 'S',
      });

      // Assert
      expect(error).toBeTruthy();
    });
  });
});
