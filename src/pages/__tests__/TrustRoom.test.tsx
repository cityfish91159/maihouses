import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TrustRoom from '../TrustRoom';
import { STEP_NAMES } from '../../types/trust.types';

const mocks = vi.hoisted(() => {
  const mockRpc = vi.fn();
  const mockChannelOn = vi.fn().mockReturnThis();
  const mockSubscribe = vi.fn().mockReturnValue({});
  const mockChannelFactory = vi.fn(() => ({
    on: mockChannelOn,
    subscribe: mockSubscribe,
  }));
  const mockRemoveChannel = vi.fn();

  return {
    mockRpc,
    mockChannelFactory,
    mockRemoveChannel,
  };
});

vi.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: mocks.mockRpc,
    channel: mocks.mockChannelFactory,
    removeChannel: mocks.mockRemoveChannel,
  },
}));

describe('TrustRoom', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders trust room data and confirm action', async () => {
    mocks.mockRpc.mockResolvedValueOnce({
      data: [
        {
          id: 'case-1234-5678',
          case_name: '測試案件',
          agent_name: '王小明',
          current_step: 1,
          steps_data: [
            {
              step: 1,
              name: '電話聯繫',
              done: true,
              confirmed: false,
              date: null,
              note: '',
            },
          ],
          status: 'active',
          created_at: new Date().toISOString(),
          token_expires_at: new Date(Date.now() + 86400000).toISOString(),
        },
      ],
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/?id=case-1234-5678&token=token-abc']}>
        <TrustRoom />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('測試案件')).toBeInTheDocument();
    });

    expect(mocks.mockRpc).toHaveBeenCalledWith('get_trust_room_by_token', {
      p_id: 'case-1234-5678',
      p_token: 'token-abc',
    });

    const stepName = STEP_NAMES[1];
    expect(stepName).toBeDefined();
    expect(screen.getByText(stepName as string)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /確認此步驟已完成/ })).toBeInTheDocument();
  });
});
