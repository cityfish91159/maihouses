import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// --- Mocks ---

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockStartMockMode = vi.fn();
const mockDispatchAction = vi.fn();
const mockFetchData = vi.fn();

const defaultUseTrustRoomReturn = {
  isMock: false,
  caseId: '',
  setCaseId: vi.fn(),
  role: 'agent' as const,
  setRole: vi.fn(),
  setToken: vi.fn(),
  token: '',
  tx: null,
  setTx: vi.fn(),
  loading: false,
  isBusy: false,
  timeLeft: '--:--:--',
  startMockMode: mockStartMockMode,
  dispatchAction: mockDispatchAction,
  fetchData: mockFetchData,
};

vi.mock('../../../hooks/useTrustRoom', () => ({
  useTrustRoom: vi.fn(() => ({ ...defaultUseTrustRoomReturn })),
}));

vi.mock('../../../hooks/usePageMode', () => ({
  usePageMode: vi.fn(() => 'live' as import('../../../hooks/usePageMode').PageMode),
}));

vi.mock('../../../lib/notify', () => ({
  notify: {
    info: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../../lib/trustPrivacy', () => ({
  getAgentDisplayInfo: vi.fn(() => ({ fullText: '測試房仲' })),
}));

vi.mock('../../../lib/safeStorage', () => ({
  safeLocalStorage: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

vi.mock('../../../constants/progress', () => ({
  calcProgressWidthClass: vi.fn(() => 'w-1/6'),
}));

vi.mock('../../../services/trustService', () => ({
  mockService: {
    completeBuyerInfo: vi.fn(),
    fetchData: vi.fn(),
    dispatch: vi.fn(),
  },
  realService: {
    completeBuyerInfo: vi.fn(),
    fetchData: vi.fn(),
    dispatch: vi.fn(),
  },
}));

vi.mock('../../../components/TrustRoom/DataCollectionModal', () => ({
  DataCollectionModal: ({ onSkip }: { isOpen: boolean; onSkip: () => void; isSubmitting: boolean; onSubmit: (data: { name: string; phone: string; email: string }) => void }) => (
    <div data-testid="data-collection-modal">
      <button onClick={onSkip}>跳過</button>
    </div>
  ),
}));

vi.mock('../../../components/Assure/StepCard', () => ({
  StepCard: ({ children }: { children: React.ReactNode }) => <div data-testid="step-card">{children}</div>,
}));

vi.mock('../../../components/Assure/StepContent', () => ({
  StepContent: ({ stepKey, handlers }: { stepKey: string; step: unknown; state: unknown; handlers: { onPay: () => void; onConfirm: (step: string) => void } }) => (
    <div data-testid="step-content">
      <button onClick={handlers.onPay}>付款</button>
      <button onClick={() => handlers.onConfirm(stepKey)}>確認</button>
    </div>
  ),
}));

vi.mock('../../../components/Assure/ReviewPromptModal', () => ({
  ReviewPromptModal: () => <div data-testid="review-prompt-modal" />,
}));

// --- 建立有效的 Transaction 假資料 ---
import type { Transaction, Step } from '../../../types/trust';

const makeStep = (name: string): Step => ({
  name,
  agentStatus: 'pending',
  buyerStatus: 'pending',
  data: {},
  locked: false,
});

const mockTransaction: Transaction = {
  id: 'TEST-001',
  currentStep: 1,
  isPaid: false,
  steps: {
    '1': makeStep('已電聯'),
    '2': makeStep('已帶看'),
    '3': makeStep('已出價'),
    '4': makeStep('已斡旋'),
    '5': makeStep('已成交'),
    '6': makeStep('已交屋'),
  },
  supplements: [],
  agentName: '測試房仲',
  agentCompany: '測試公司',
  buyerName: null,
  buyerUserId: null,
};

// --- 取得 mock 函數 ---
import { useTrustRoom } from '../../../hooks/useTrustRoom';
import { usePageMode } from '../../../hooks/usePageMode';
import { notify } from '../../../lib/notify';
import AssureDetail from '../Detail';

const mockUseTrustRoom = vi.mocked(useTrustRoom);
const mockUsePageMode = vi.mocked(usePageMode);
const mockNotify = vi.mocked(notify);

// --- 渲染 helper ---
function renderDetail() {
  return render(
    <MemoryRouter>
      <AssureDetail />
    </MemoryRouter>
  );
}

describe('AssureDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTrustRoom.mockReturnValue({ ...defaultUseTrustRoomReturn });
    mockUsePageMode.mockReturnValue('live');
  });

  it('1. loading 狀態顯示 spinner（tx=null, loading=true）', () => {
    mockUseTrustRoom.mockReturnValue({
      ...defaultUseTrustRoomReturn,
      loading: true,
    });

    renderDetail();

    // spinner 會有 animate-spin class
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });

  it('2. demo mode 下顯示「演示模式」標籤', async () => {
    mockUsePageMode.mockReturnValue('demo');
    mockUseTrustRoom.mockReturnValue({
      ...defaultUseTrustRoomReturn,
      tx: mockTransaction,
      loading: false,
    });

    renderDetail();

    expect(screen.getByText('演示模式')).toBeTruthy();
  });

  it('3. visitor mode 觸發 notify.info 並導向首頁', async () => {
    mockUsePageMode.mockReturnValue('visitor');

    await act(async () => {
      renderDetail();
    });

    expect(mockNotify.info).toHaveBeenCalledWith(
      '請先登入或進入演示模式',
      '安心留痕功能需要登入後才能使用。'
    );
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('4. pay() 第一次點擊觸發 notify.info 提示二次確認', async () => {
    mockUseTrustRoom.mockReturnValue({
      ...defaultUseTrustRoomReturn,
      tx: mockTransaction,
      loading: false,
    });

    renderDetail();

    const payButtons = screen.getAllByText('付款');
    const payButton = payButtons[0];
    if (!payButton) throw new Error('找不到付款按鈕');
    fireEvent.click(payButton);

    expect(mockNotify.info).toHaveBeenCalledWith('再點一次確認付款');
  });

  it('5. reset() 第一次點擊觸發 notify.warning 提示二次確認', async () => {
    mockUseTrustRoom.mockReturnValue({
      ...defaultUseTrustRoomReturn,
      tx: mockTransaction,
      loading: false,
    });

    renderDetail();

    const resetButton = screen.getByLabelText('重置案件');
    fireEvent.click(resetButton);

    expect(mockNotify.warning).toHaveBeenCalledWith('再點一次確認重置');
  });

  it('6. handleDataSkip 關閉 DataCollectionModal 並觸發 notify.info', async () => {
    vi.useFakeTimers();

    mockUseTrustRoom.mockReturnValue({
      ...defaultUseTrustRoomReturn,
      role: 'buyer',
      tx: {
        ...mockTransaction,
        currentStep: 4,
        buyerName: '買方-臨時',
        buyerUserId: null,
      },
      loading: false,
    });

    renderDetail();

    // 快進 MODAL_DELAY_MS（500ms），讓 setTimeout 觸發 setShowDataModal(true)
    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    vi.useRealTimers();

    expect(screen.getByTestId('data-collection-modal')).toBeTruthy();

    fireEvent.click(screen.getByText('跳過'));

    expect(mockNotify.info).toHaveBeenCalledWith(
      '已跳過資料填寫',
      '你可以稍後在案件頁面中補充資料。'
    );
    expect(screen.queryByTestId('data-collection-modal')).toBeNull();
  });

  it('7. step2 buyer confirm 後 500ms 出現 ReviewPromptModal', async () => {
    vi.useFakeTimers();

    const { safeLocalStorage } = await import('../../../lib/safeStorage');
    vi.mocked(safeLocalStorage.getItem).mockReturnValue('agent-mock-001');

    const mockDispatch = vi.fn().mockResolvedValue(true);
    mockUseTrustRoom.mockReturnValue({
      ...defaultUseTrustRoomReturn,
      caseId: 'CASE-001',
      role: 'buyer',
      tx: { ...mockTransaction, currentStep: 2 },
      loading: false,
      dispatchAction: mockDispatch,
    });

    renderDetail();

    expect(screen.queryByTestId('review-prompt-modal')).toBeNull();

    // 點 step 2 的確認按鈕（StepContent mock 暴露的 onConfirm）
    const confirmButtons = screen.getAllByText('確認');
    const step2Confirm = confirmButtons[1]; // index 1 = step key '2'
    expect(step2Confirm).toBeDefined();
    await act(async () => {
      fireEvent.click(step2Confirm!);
    });

    // 500ms 前不顯示
    expect(screen.queryByTestId('review-prompt-modal')).toBeNull();

    // 快進 500ms
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByTestId('review-prompt-modal')).toBeTruthy();

    vi.useRealTimers();
  });
});
