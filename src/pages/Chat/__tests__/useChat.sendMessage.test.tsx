import { act, renderHook, waitFor } from '@testing-library/react';
import { useChat } from '../useChat';
import { supabase } from '../../../lib/supabase';

const authState = {
  user: null as { id: string } | null,
  role: 'consumer' as const,
  isAuthenticated: false,
};

const sessionState = {
  sessionId: 'guest-session-1',
  hasValidSession: true,
  isExpired: false,
};
const channelSendMock = vi.fn();

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => authState,
}));

vi.mock('../../../hooks/useConsumerSession', () => ({
  useConsumerSession: () => ({
    sessionId: sessionState.sessionId,
    hasValidSession: sessionState.hasValidSession,
    isExpired: sessionState.isExpired,
    setSession: vi.fn(),
    clearSession: vi.fn(),
  }),
}));

vi.mock('../../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}));

function buildRpcResponse<T>(data: T) {
  return Promise.resolve({
    data,
    error: null,
    count: null,
    status: 200,
    statusText: 'OK',
  });
}

describe('useChat sendMessage (visitor + valid session)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.user = null;
    authState.role = 'consumer';
    authState.isAuthenticated = false;
    sessionState.sessionId = 'guest-session-1';
    sessionState.hasValidSession = true;
    sessionState.isExpired = false;
    channelSendMock.mockReset();

    const mockConversation = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      status: 'active' as const,
      agent_id: 'agent-1',
      consumer_session_id: 'guest-session-1',
      consumer_profile_id: null,
      property_id: 'MH-100001',
      lead_id: null,
      unread_agent: 0,
      unread_consumer: 0,
      created_at: '2026-02-18T12:00:00.000Z',
      updated_at: '2026-02-18T12:00:00.000Z',
      agent_profile: [{ name: 'Agent One', email: 'agent@example.com' }],
      consumer_profile: [],
    };

    const conversationsChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockConversation, error: null }),
    };

    const messagesChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    const propertiesChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'conversations') {
        return conversationsChain as never;
      }
      if (table === 'messages') {
        return messagesChain as never;
      }
      if (table === 'properties') {
        return propertiesChain as never;
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    vi.mocked(supabase.rpc).mockImplementation(
      ((fn: string) => {
        if (fn === 'fn_send_message') {
          return buildRpcResponse('123e4567-e89b-12d3-a456-426614174099') as never;
        }
        if (fn === 'fn_mark_messages_read') {
          return buildRpcResponse(null) as never;
        }
        throw new Error(`Unexpected rpc: ${fn}`);
      }) as never
    );

    const channelMock = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      send: channelSendMock,
    };
    vi.mocked(supabase.channel).mockReturnValue(channelMock as never);
    vi.mocked(supabase.removeChannel).mockReturnValue(undefined as never);
  });

  it('允許 visitor+session 發送訊息，並以 null sender_id 呼叫 RPC', async () => {
    const conversationId = '123e4567-e89b-12d3-a456-426614174000';
    const { result } = renderHook(() => useChat(conversationId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.header?.counterpartName).toBe('Agent One');
    });

    await act(async () => {
      await result.current.sendMessage('guest hello');
    });

    expect(supabase.rpc).toHaveBeenCalledWith('fn_send_message', {
      p_conversation_id: conversationId,
      p_sender_type: 'consumer',
      p_sender_id: null,
      p_content: 'guest hello',
    });
    expect(result.current.error).toBeNull();
  });

  it('允許 visitor+session 發送 typing 事件', async () => {
    const conversationId = '123e4567-e89b-12d3-a456-426614174000';
    const { result } = renderHook(() => useChat(conversationId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.sendTyping();
    });

    expect(channelSendMock).toHaveBeenCalledWith({
      type: 'broadcast',
      event: 'typing',
      payload: { senderId: 'session:guest-session-1' },
    });
  });
});
