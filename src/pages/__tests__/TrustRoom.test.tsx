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

  it('displays error state when missing id parameter', async () => {
    render(
      <MemoryRouter initialEntries={['/?token=token-abc']}>
        <TrustRoom />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/連結無效/)).toBeInTheDocument();
    });

    expect(mocks.mockRpc).not.toHaveBeenCalled();
  });

  it('displays error state when missing token parameter', async () => {
    render(
      <MemoryRouter initialEntries={['/?id=case-1234']}>
        <TrustRoom />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/連結無效/)).toBeInTheDocument();
    });

    expect(mocks.mockRpc).not.toHaveBeenCalled();
  });

  it('displays error state when RPC returns error', async () => {
    mocks.mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Token expired' },
    });

    render(
      <MemoryRouter initialEntries={['/?id=case-1234&token=expired-token']}>
        <TrustRoom />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/載入失敗/)).toBeInTheDocument();
    });
  });

  it('displays error state when RPC returns empty data', async () => {
    mocks.mockRpc.mockResolvedValueOnce({
      data: [],
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/?id=case-1234&token=token-abc']}>
        <TrustRoom />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/連結已過期或不存在/)).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    mocks.mockRpc.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    const { container } = render(
      <MemoryRouter initialEntries={['/?id=case-1234&token=token-abc']}>
        <TrustRoom />
      </MemoryRouter>
    );

    // Loading skeleton has animate-pulse class
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('displays token expiry warning when less than 7 days remaining', async () => {
    const twoDaysLater = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

    mocks.mockRpc.mockResolvedValueOnce({
      data: [
        {
          id: 'case-1234',
          case_name: '測試案件',
          agent_name: '王小明',
          current_step: 1,
          steps_data: [
            {
              step: 1,
              name: '電話聯繫',
              done: false,
              confirmed: false,
              date: null,
              note: '',
            },
          ],
          status: 'active',
          created_at: new Date().toISOString(),
          token_expires_at: twoDaysLater,
        },
      ],
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/?id=case-1234&token=token-abc']}>
        <TrustRoom />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/2 天後到期/)).toBeInTheDocument();
    });
  });

  it('does not show expiry warning when more than 7 days remaining', async () => {
    const tenDaysLater = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();

    mocks.mockRpc.mockResolvedValueOnce({
      data: [
        {
          id: 'case-1234',
          case_name: '測試案件',
          agent_name: '王小明',
          current_step: 1,
          steps_data: [
            {
              step: 1,
              name: '電話聯繫',
              done: false,
              confirmed: false,
              date: null,
              note: '',
            },
          ],
          status: 'active',
          created_at: new Date().toISOString(),
          token_expires_at: tenDaysLater,
        },
      ],
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/?id=case-1234&token=token-abc']}>
        <TrustRoom />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('測試案件')).toBeInTheDocument();
    });

    expect(screen.queryByText(/天後到期/)).not.toBeInTheDocument();
    expect(screen.queryByText(/即將過期/)).not.toBeInTheDocument();
  });

  it('subscribes to realtime updates on mount', async () => {
    mocks.mockRpc.mockResolvedValueOnce({
      data: [
        {
          id: 'case-1234',
          case_name: '測試案件',
          agent_name: '王小明',
          current_step: 1,
          steps_data: [
            {
              step: 1,
              name: '電話聯繫',
              done: false,
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
      <MemoryRouter initialEntries={['/?id=case-1234&token=token-abc']}>
        <TrustRoom />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('測試案件')).toBeInTheDocument();
    });

    expect(mocks.mockChannelFactory).toHaveBeenCalledWith('trust:case-1234');
  });

  it('displays success message after confirm action', async () => {
    mocks.mockRpc.mockResolvedValueOnce({
      data: [
        {
          id: 'case-1234',
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

    // Mock confirm RPC
    mocks.mockRpc.mockResolvedValueOnce({
      data: { success: true },
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/?id=case-1234&token=token-abc']}>
        <TrustRoom />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('測試案件')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /確認此步驟已完成/ });
    confirmButton.click();

    await waitFor(() => {
      expect(screen.getByText(/已確認/)).toBeInTheDocument();
    });
  });

  it('displays error message when confirm action fails', async () => {
    mocks.mockRpc.mockResolvedValueOnce({
      data: [
        {
          id: 'case-1234',
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

    // Mock confirm RPC failure
    mocks.mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Confirmation failed' },
    });

    render(
      <MemoryRouter initialEntries={['/?id=case-1234&token=token-abc']}>
        <TrustRoom />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('測試案件')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /確認此步驟已完成/ });
    confirmButton.click();

    await waitFor(() => {
      expect(screen.getByText(/確認失敗/)).toBeInTheDocument();
    });
  });

  it('disables confirm button while confirming', async () => {
    mocks.mockRpc.mockResolvedValueOnce({
      data: [
        {
          id: 'case-1234',
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

    // Mock slow confirm RPC
    mocks.mockRpc.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: { success: true }, error: null }), 500))
    );

    render(
      <MemoryRouter initialEntries={['/?id=case-1234&token=token-abc']}>
        <TrustRoom />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('測試案件')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /確認此步驟已完成/ });
    confirmButton.click();

    await waitFor(() => {
      expect(confirmButton).toBeDisabled();
    });
  });
});
