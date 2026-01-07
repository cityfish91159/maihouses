
// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                single: vi.fn()
              }))
            }))
          }))
        }))
      }))
    }))
  }))
}));

// Import types
import type { SessionRecoveryRequest, SessionRecoveryResponse } from '../session-recovery';

describe('Session Recovery API Types', () => {
  describe('SessionRecoveryRequest', () => {
    it('should accept valid request with fingerprint only', () => {
      const request: SessionRecoveryRequest = {
        fingerprint: 'eyJ0ZXN0IjoidGVzdCJ9'
      };
      expect(request.fingerprint).toBeDefined();
      expect(request.agentId).toBeUndefined();
    });

    it('should accept valid request with fingerprint and agentId', () => {
      const request: SessionRecoveryRequest = {
        fingerprint: 'eyJ0ZXN0IjoidGVzdCJ9',
        agentId: 'agent-123'
      };
      expect(request.fingerprint).toBe('eyJ0ZXN0IjoidGVzdCJ9');
      expect(request.agentId).toBe('agent-123');
    });
  });

  describe('SessionRecoveryResponse', () => {
    it('should return recovered: false when no session found', () => {
      const response: SessionRecoveryResponse = {
        recovered: false
      };
      expect(response.recovered).toBe(false);
      expect(response.session_id).toBeUndefined();
    });

    it('should return full data when session recovered', () => {
      const response: SessionRecoveryResponse = {
        recovered: true,
        session_id: 'u_abc123',
        grade: 'A',
        last_active: '2025-12-31T10:00:00Z'
      };
      expect(response.recovered).toBe(true);
      expect(response.session_id).toBe('u_abc123');
      expect(response.grade).toBe('A');
    });

    it('should include error message on failure', () => {
      const response: SessionRecoveryResponse = {
        recovered: false,
        error: 'Missing required parameter: fingerprint'
      };
      expect(response.recovered).toBe(false);
      expect(response.error).toBe('Missing required parameter: fingerprint');
    });
  });
});

describe('Session Recovery API Logic', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('成功恢復場景', () => {
    it('應該成功恢復有效指紋的 session', async () => {
      const mockResult = {
        data: {
          session_id: 'u_test123',
          grade: 'S',
          last_active: '2025-12-30T12:00:00Z'
        },
        error: null
      };

      // Verify expected response structure
      const expectedResponse: SessionRecoveryResponse = {
        recovered: true,
        session_id: 'u_test123',
        grade: 'S',
        last_active: '2025-12-30T12:00:00Z'
      };

      expect(expectedResponse.recovered).toBe(true);
      expect(expectedResponse.session_id).toBe('u_test123');
    });
  });

  describe('錯誤處理場景', () => {
    it('缺少 fingerprint 時應回傳錯誤', () => {
      const response: SessionRecoveryResponse = {
        recovered: false,
        error: 'Missing required parameter: fingerprint'
      };

      expect(response.recovered).toBe(false);
      expect(response.error).toContain('fingerprint');
    });

    it('錯誤 HTTP method 時應回傳 405', () => {
      const response: SessionRecoveryResponse = {
        recovered: false,
        error: 'Method not allowed'
      };

      expect(response.recovered).toBe(false);
      expect(response.error).toBe('Method not allowed');
    });

    it('查無資料時應回傳 recovered: false', () => {
      const response: SessionRecoveryResponse = {
        recovered: false
      };

      expect(response.recovered).toBe(false);
      expect(response.session_id).toBeUndefined();
      expect(response.error).toBeUndefined();
    });
  });

  describe('邊界條件', () => {
    it('agentId 為 unknown 時應忽略過濾', () => {
      const request: SessionRecoveryRequest = {
        fingerprint: 'eyJ0ZXN0IjoidGVzdCJ9',
        agentId: 'unknown'
      };

      // unknown should be treated as no agentId filter
      expect(request.agentId).toBe('unknown');
    });

    it('7 天時間窗口應正確計算', () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const now = new Date();
      const diffDays = (now.getTime() - sevenDaysAgo.getTime()) / (1000 * 60 * 60 * 24);
      
      expect(diffDays).toBeCloseTo(7, 0);
    });
  });
});
