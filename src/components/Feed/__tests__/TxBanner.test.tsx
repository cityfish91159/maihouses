/**
 * TxBanner Component Tests
 * MSG-3: 完整測試私訊提醒橫幅功能
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TxBanner } from '../TxBanner';
import type { ActiveTransaction } from '../../../types/feed';
import type { ConversationListItem } from '../../../types/messaging.types';
import * as loggerModule from '../../../lib/logger';

// Mock logger module
vi.mock('../../../lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Wrapper component with Router
function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('TxBanner - MSG-3 私訊提醒橫幅', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========================================
  // 測試 1-3: 私訊通知顯示
  // ========================================

  test('1. 顯示私訊通知橫幅（有完整資訊）', () => {
    const mockNotification: ConversationListItem = {
      id: 'conv-1',
      status: 'pending',
      unread_count: 2,
      last_message: {
        content: '您好，我對這個物件有興趣',
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 分鐘前
        sender_type: 'agent',
      },
      counterpart: {
        name: '張房仲',
      },
      property: {
        id: 'prop-1',
        title: '惠宇上晴 12F',
      },
    };

    const mockTransaction: ActiveTransaction = {
      hasActive: false,
    };

    renderWithRouter(
      <TxBanner transaction={mockTransaction} messageNotification={mockNotification} />
    );

    // 驗證標題
    expect(screen.getByText('💬 有房仲想聯繫您')).toBeInTheDocument();

    // 驗證物件名稱
    expect(screen.getByText(/惠宇上晴 12F/)).toBeInTheDocument();

    // 驗證房仲名字
    expect(screen.getByText(/張房仲/)).toBeInTheDocument();

    // 驗證時間顯示
    expect(screen.getByText(/5 分鐘前/)).toBeInTheDocument();

    // 驗證查看按鈕
    expect(screen.getByRole('button', { name: /查看房仲私訊/ })).toBeInTheDocument();
  });

  test('2. 顯示私訊通知橫幅（無物件資訊）', () => {
    const mockNotification: ConversationListItem = {
      id: 'conv-2',
      status: 'active',
      unread_count: 1,
      last_message: {
        content: '測試訊息',
        created_at: new Date().toISOString(),
        sender_type: 'agent',
      },
      counterpart: {
        name: '李房仲',
      },
      // 沒有 property
    };

    const mockTransaction: ActiveTransaction = {
      hasActive: false,
    };

    renderWithRouter(
      <TxBanner transaction={mockTransaction} messageNotification={mockNotification} />
    );

    // 應該顯示預設文字
    expect(screen.getByText(/物件諮詢/)).toBeInTheDocument();
    expect(screen.getByText(/李房仲/)).toBeInTheDocument();
  });

  test('3. 顯示私訊通知橫幅（無最後訊息）', () => {
    const mockNotification: ConversationListItem = {
      id: 'conv-3',
      status: 'pending',
      unread_count: 0,
      // 沒有 last_message
      counterpart: {
        name: '王房仲',
      },
      property: {
        id: 'prop-2',
        title: '聯聚方庭',
      },
    };

    const mockTransaction: ActiveTransaction = {
      hasActive: false,
    };

    renderWithRouter(
      <TxBanner transaction={mockTransaction} messageNotification={mockNotification} />
    );

    expect(screen.getByText(/聯聚方庭/)).toBeInTheDocument();
    expect(screen.getByText(/王房仲/)).toBeInTheDocument();

    // 沒有時間顯示（因為沒有 last_message）
    expect(screen.queryByText(/分鐘前/)).not.toBeInTheDocument();
  });

  // ========================================
  // 測試 4: 優先級邏輯
  // ========================================

  test('4. 私訊優先級高於交易橫幅', () => {
    const mockNotification: ConversationListItem = {
      id: 'conv-4',
      status: 'active',
      unread_count: 1,
      counterpart: { name: '陳房仲' },
      property: { id: 'p1', title: '測試物件' },
    };

    const mockTransaction: ActiveTransaction = {
      hasActive: true, // 有進行中的交易
      stage: 'negotiation',
      propertyName: '其他物件',
    };

    renderWithRouter(
      <TxBanner transaction={mockTransaction} messageNotification={mockNotification} />
    );

    // 應該顯示私訊橫幅，而不是交易橫幅
    expect(screen.getByText('💬 有房仲想聯繫您')).toBeInTheDocument();
    expect(screen.queryByText('您有一筆交易進行中')).not.toBeInTheDocument();
  });

  // ========================================
  // 測試 5-6: 交易橫幅顯示
  // ========================================

  test('5. 顯示交易橫幅（無私訊）', () => {
    const mockTransaction: ActiveTransaction = {
      hasActive: true,
      stage: 'contract',
      propertyName: '惠宇天青',
    };

    renderWithRouter(<TxBanner transaction={mockTransaction} messageNotification={null} />);

    expect(screen.getByText('您有一筆交易進行中')).toBeInTheDocument();
    expect(screen.getByText(/惠宇天青/)).toBeInTheDocument();
    expect(screen.getByText(/簽約階段/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /進入交易戰情室/ })).toBeInTheDocument();
  });

  test('6. 無交易也無私訊時不顯示', () => {
    const mockTransaction: ActiveTransaction = {
      hasActive: false,
    };

    const { container } = renderWithRouter(
      <TxBanner transaction={mockTransaction} messageNotification={null} />
    );

    // 應該不渲染任何內容
    expect(container.firstChild).toBeNull();
  });

  // ========================================
  // 測試 7: 點擊行為
  // ========================================

  test('7. 點擊查看按鈕進行導航', () => {
    const mockNotification: ConversationListItem = {
      id: 'conv-5',
      status: 'pending',
      unread_count: 1,
      counterpart: { name: '測試房仲' },
    };

    const mockTransaction: ActiveTransaction = {
      hasActive: false,
    };

    renderWithRouter(
      <TxBanner transaction={mockTransaction} messageNotification={mockNotification} />
    );

    const button = screen.getByRole('button', { name: /查看房仲私訊/ });

    // 點擊按鈕應該不會報錯（導航功能由 MemoryRouter 處理）
    expect(() => fireEvent.click(button)).not.toThrow();
    expect(button).toBeInTheDocument();
  });

  // ========================================
  // 測試 8-9: 邊界情況處理
  // ========================================

  test('8. 處理過長的房仲名字（自動截斷）', () => {
    const mockNotification: ConversationListItem = {
      id: 'conv-6',
      status: 'active',
      unread_count: 1,
      counterpart: {
        name: '這是一個非常非常非常長的房仲名字應該要被截斷',
      },
      property: {
        id: 'p1',
        title: '測試',
      },
    };

    const mockTransaction: ActiveTransaction = {
      hasActive: false,
    };

    renderWithRouter(
      <TxBanner transaction={mockTransaction} messageNotification={mockNotification} />
    );

    // 應該看到截斷後的名字（最多 12 個字 + ...）
    const text = screen.getByText(/這是一個非常非常非常長/);
    expect(text.textContent).toContain('...');
  });

  test('9. 處理無效時間戳（顯示「時間未知」）', () => {
    const mockNotification: ConversationListItem = {
      id: 'conv-7',
      status: 'active',
      unread_count: 1,
      last_message: {
        content: '測試',
        created_at: 'invalid-timestamp', // 無效時間
        sender_type: 'agent',
      },
      counterpart: { name: '測試房仲' },
    };

    const mockTransaction: ActiveTransaction = {
      hasActive: false,
    };

    renderWithRouter(
      <TxBanner transaction={mockTransaction} messageNotification={mockNotification} />
    );

    // 應該記錄 logger.warn
    expect(loggerModule.logger.warn).toHaveBeenCalledWith(
      'TxBanner.formatRelativeTime.invalidTimestamp',
      { timestamp: 'invalid-timestamp' }
    );

    // 應該顯示「時間未知」
    expect(screen.getByText(/時間未知/)).toBeInTheDocument();
  });

  // ========================================
  // 測試 10: 時間格式化邏輯
  // ========================================

  test('10. 正確格式化各種相對時間', () => {
    const now = Date.now();

    const testCases = [
      { offset: 0, expected: '剛剛' },
      { offset: 30 * 1000, expected: '剛剛' }, // 30秒
      { offset: 5 * 60 * 1000, expected: '5 分鐘前' }, // 5分鐘
      { offset: 30 * 60 * 1000, expected: '30 分鐘前' }, // 30分鐘
      { offset: 2 * 60 * 60 * 1000, expected: '2 小時前' }, // 2小時
      { offset: 12 * 60 * 60 * 1000, expected: '12 小時前' }, // 12小時
      { offset: 2 * 24 * 60 * 60 * 1000, expected: '2 天前' }, // 2天
      { offset: 5 * 24 * 60 * 60 * 1000, expected: '5 天前' }, // 5天
    ];

    testCases.forEach(({ offset, expected }) => {
      const mockNotification: ConversationListItem = {
        id: `conv-time-${offset}`,
        status: 'active',
        unread_count: 1,
        last_message: {
          content: '測試',
          created_at: new Date(now - offset).toISOString(),
          sender_type: 'agent',
        },
        counterpart: { name: '房仲' },
      };

      const { unmount } = renderWithRouter(
        <TxBanner transaction={{ hasActive: false }} messageNotification={mockNotification} />
      );

      expect(screen.getByText(new RegExp(expected))).toBeInTheDocument();

      unmount();
    });
  });

  // ========================================
  // 測試 11: 可訪問性
  // ========================================

  test('11. 具有正確的可訪問性屬性', () => {
    const mockNotification: ConversationListItem = {
      id: 'conv-a11y',
      status: 'active',
      unread_count: 1,
      counterpart: { name: '測試房仲' },
    };

    renderWithRouter(
      <TxBanner transaction={{ hasActive: false }} messageNotification={mockNotification} />
    );

    // 驗證 region role
    expect(screen.getByRole('region', { name: /有房仲想聯繫您/ })).toBeInTheDocument();

    // 驗證按鈕有 aria-label
    const button = screen.getByRole('button', { name: /查看房仲私訊/ });
    expect(button).toHaveAttribute('aria-label', '查看房仲私訊');
  });

  // ========================================
  // 測試 12: className prop
  // ========================================

  test('12. 正確應用自定義 className', () => {
    const mockNotification: ConversationListItem = {
      id: 'conv-class',
      status: 'active',
      unread_count: 1,
      counterpart: { name: '測試' },
    };

    const { container } = renderWithRouter(
      <TxBanner
        transaction={{ hasActive: false }}
        messageNotification={mockNotification}
        className="my-custom-class"
      />
    );

    const wrapper = container.querySelector('.my-custom-class');
    expect(wrapper).toBeInTheDocument();
  });
});
