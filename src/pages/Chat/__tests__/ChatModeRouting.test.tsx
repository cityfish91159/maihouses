import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ChatPage from '../index';

type TestPageMode = 'visitor' | 'demo' | 'live';
type TestRole = 'agent' | 'consumer' | 'guest';

const TEST_CONVERSATION_ID = '123e4567-e89b-12d3-a456-426614174000';

const modeState: { value: TestPageMode } = {
  value: 'visitor',
};

const sessionState = {
  hasValidSession: false,
  isExpired: false,
  sessionId: null as string | null,
};

const authState: {
  isAuthenticated: boolean;
  loading: boolean;
  role: TestRole;
} = {
  isAuthenticated: false,
  loading: false,
  role: 'consumer',
};

const mockedUseChat = vi.hoisted(() => vi.fn());
const mockSendMessage = vi.hoisted(() => vi.fn());

vi.mock('../../../hooks/usePageMode', () => ({
  usePageMode: () => modeState.value,
}));

vi.mock('../../../hooks/useConsumerSession', () => ({
  useConsumerSession: () => ({
    hasValidSession: sessionState.hasValidSession,
    isExpired: sessionState.isExpired,
    sessionId: sessionState.sessionId,
    setSession: vi.fn(),
    clearSession: vi.fn(),
  }),
}));

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: authState.isAuthenticated,
    loading: authState.loading,
    role: authState.role,
    user: authState.isAuthenticated ? { id: 'user-1' } : null,
  }),
}));

vi.mock('../useChat', () => ({
  useChat: (...args: unknown[]) => mockedUseChat(...args),
}));

vi.mock('../../../components/layout/GlobalHeader', () => ({
  GlobalHeader: ({ mode }: { mode: string }) => <div data-testid="global-header">{mode}</div>,
}));

const renderChatPage = () =>
  render(
    <MemoryRouter initialEntries={[`/maihouses/chat/${TEST_CONVERSATION_ID}`]}>
      <Routes>
        <Route path="/maihouses/chat/:conversationId" element={<ChatPage />} />
      </Routes>
    </MemoryRouter>
  );

describe('ChatPage mode routing', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    modeState.value = 'visitor';
    sessionState.hasValidSession = false;
    sessionState.isExpired = false;
    sessionState.sessionId = null;
    authState.isAuthenticated = false;
    authState.loading = false;
    authState.role = 'consumer';

    mockedUseChat.mockReturnValue({
      header: {
        counterpartName: 'Test Client',
        counterpartSubtitle: 'test@example.com',
        statusLabel: '對話中',
        propertyTitle: 'Test Property',
        propertySubtitle: 'Test Address',
        propertyImage: undefined,
      },
      messages: [
        {
          id: 'msg-1',
          conversation_id: TEST_CONVERSATION_ID,
          sender_type: 'agent',
          sender_id: null,
          content: '您好，這是測試訊息',
          created_at: '2026-02-18T12:00:00.000Z',
          read_at: null,
        },
      ],
      isLoading: false,
      isSending: false,
      isTyping: false,
      error: null,
      sendMessage: mockSendMessage,
      sendTyping: vi.fn(),
      isAgent: false,
    });
    mockSendMessage.mockReset();
  });

  it('visitor 且無 session 時顯示登入提示', () => {
    renderChatPage();

    const loginLink = screen.getByRole('link', { name: '立即登入' });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', expect.stringContaining('/auth.html?mode=login'));
    expect(mockedUseChat).not.toHaveBeenCalled();
  });

  it('visitor 且 session 已過期時仍應顯示登入提示', () => {
    sessionState.hasValidSession = false;
    sessionState.isExpired = true;
    sessionState.sessionId = 'expired-session-1';

    renderChatPage();

    const loginLink = screen.getByRole('link', { name: '立即登入' });
    expect(loginLink).toBeInTheDocument();
    expect(mockedUseChat).not.toHaveBeenCalled();
  });

  it('visitor 但有 valid session 時走 live 對話流程', () => {
    sessionState.hasValidSession = true;
    sessionState.sessionId = 'guest-session-1';

    renderChatPage();

    expect(mockedUseChat).toHaveBeenCalledWith(TEST_CONVERSATION_ID);
    expect(screen.getByText('Test Client')).toBeInTheDocument();
  });

  it('visitor 但有 valid session 時可透過 UI 觸發送訊', async () => {
    sessionState.hasValidSession = true;
    sessionState.sessionId = 'guest-session-1';

    renderChatPage();

    const input = screen.getByRole('textbox', { name: '輸入訊息' });
    fireEvent.change(input, { target: { value: 'guest hello' } });
    fireEvent.click(screen.getByRole('button', { name: /發送/i }));

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('guest hello');
    });
  });

  it('demo 模式走本地聊天且不呼叫 useChat', async () => {
    modeState.value = 'demo';

    renderChatPage();

    expect(mockedUseChat).not.toHaveBeenCalled();
    expect(screen.getByText('示範物件')).toBeInTheDocument();

    const input = screen.getByRole('textbox', { name: '輸入訊息' });
    fireEvent.change(input, { target: { value: 'test demo message' } });
    fireEvent.click(screen.getByRole('button', { name: /發送/i }));

    expect(await screen.findByText('test demo message')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('示範回覆：已收到「test demo message」。')).toBeInTheDocument();
    });
  });

  it('live 模式走現有 live 對話流程', () => {
    modeState.value = 'live';
    authState.isAuthenticated = true;
    authState.role = 'consumer';

    renderChatPage();

    expect(mockedUseChat).toHaveBeenCalledWith(TEST_CONVERSATION_ID);
    expect(screen.getByText('Test Client')).toBeInTheDocument();
  });
});
