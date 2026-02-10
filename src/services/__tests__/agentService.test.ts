import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchAgentProfile, updateAgentProfile } from '../agentService';

const { mockGetSession } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
    },
  },
}));

describe('agentService (#15)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('fetchAgentProfile maps verification fields', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            name: '測試房仲',
            avatar_url: null,
            company: '邁房子',
            bio: null,
            specialties: [],
            certifications: [],
            phone: null,
            line_id: null,
            license_number: '(113)北市經紀字第004521號',
            is_verified: true,
            verified_at: '2024-06-15T00:00:00Z',
            trust_score: 88,
            encouragement_count: 10,
            service_rating: 4.8,
            review_count: 12,
            completed_cases: 9,
            active_listings: 4,
            service_years: 3,
            joined_at: '2021-01-01T00:00:00Z',
            internal_code: 12345,
          },
        }),
      })
    );

    const profile = await fetchAgentProfile('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

    expect(profile.licenseNumber).toBe('(113)北市經紀字第004521號');
    expect(profile.isVerified).toBe(true);
    expect(profile.verifiedAt).toBe('2024-06-15T00:00:00Z');
  });

  it('updateAgentProfile sends company + license_number in request body', async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'token-123',
        },
      },
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { updated_at: '2026-02-09T00:00:00.000Z' },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await updateAgentProfile({
      name: '測試房仲',
      company: '邁房子信義店',
      licenseNumber: '(113)北市經紀字第004521號',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/agent/profile',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          name: '測試房仲',
          company: '邁房子信義店',
          bio: undefined,
          specialties: undefined,
          certifications: undefined,
          phone: undefined,
          line_id: undefined,
          license_number: '(113)北市經紀字第004521號',
          joined_at: undefined,
        }),
      })
    );
  });
});
