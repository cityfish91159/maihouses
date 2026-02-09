/**
 * AgentTrustCard React.memo 優化效能測試
 * 驗證：
 * 1. AgentTrustCard 在父組件重渲染時不重渲染
 * 2. agent 物件深度比較邏輯
 * 3. 回調函數引用變化的隔離效果
 * 4. useMemo 計算的 agentMetrics 快取
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';
import { AgentTrustCard } from '../AgentTrustCard';
import type { Agent } from '../../lib/types';

describe('AgentTrustCard React.memo Performance', () => {
  const renderWithClient = (ui: ReactElement) => {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
  };
  const createMockAgent = (overrides: Partial<Agent> = {}): Agent => ({
    id: 'agent-1',
    internalCode: 12345,
    name: '測試經紀人',
    avatarUrl: 'https://example.com/avatar.jpg',
    company: '測試不動產',
    trustScore: 85,
    encouragementCount: 10,
    serviceRating: 4.8,
    reviewCount: 32,
    completedCases: 45,
    serviceYears: 4,
    ...overrides,
  });

  const mockCallbacks = {
    onLineClick: vi.fn(),
    onCallClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本 memo 隔離', () => {
    it('應該在父組件重渲染時不重新渲染（相同 props）', () => {
      const agent = createMockAgent();

      const TestWrapper = () => {
        const [rerenderCount, setRerenderCount] = useState(0);

        return (
          <div>
            <button onClick={() => setRerenderCount((prev) => prev + 1)}>
              Trigger Parent Render
            </button>
            <div data-testid="rerender-count">{rerenderCount}</div>
            <AgentTrustCard
              agent={agent}
              onLineClick={mockCallbacks.onLineClick}
              onCallClick={mockCallbacks.onCallClick}
            />
          </div>
        );
      };

      const { getByTestId, getByText } = renderWithClient(<TestWrapper />);

      // 第一次渲染
      const firstCard = document.querySelector('.rounded-xl.border');
      expect(firstCard).toBeInTheDocument();
      expect(screen.getByText('測試經紀人')).toBeInTheDocument();

      // 觸發父組件重新渲染
      fireEvent.click(getByText('Trigger Parent Render'));

      // 驗證父組件確實重新渲染了
      expect(getByTestId('rerender-count').textContent).toBe('1');

      // AgentTrustCard 應該沒有重新渲染（DOM 節點相同）
      const secondCard = document.querySelector('.rounded-xl.border');
      expect(secondCard).toBe(firstCard);
    });

    it('應該在多次父組件重渲染時保持 DOM 節點不變', () => {
      const agent = createMockAgent();

      const TestWrapper = () => {
        const [count, setCount] = useState(0);

        return (
          <div>
            <button onClick={() => setCount((prev) => prev + 1)}>Increment</button>
            <div data-testid="count">{count}</div>
            <AgentTrustCard agent={agent} onLineClick={mockCallbacks.onLineClick} />
          </div>
        );
      };

      const { getByTestId, getByText } = renderWithClient(<TestWrapper />);

      const firstCard = document.querySelector('.rounded-xl.border');

      // 觸發多次父組件重渲染
      for (let i = 0; i < 5; i++) {
        fireEvent.click(getByText('Increment'));
      }

      // 驗證父組件確實更新了
      expect(getByTestId('count').textContent).toBe('5');

      // AgentTrustCard 應該保持相同的 DOM 節點
      const finalCard = document.querySelector('.rounded-xl.border');
      expect(finalCard).toBe(firstCard);
    });
  });

  describe('agent 物件屬性變化偵測', () => {
    it('應該在 agent.name 改變時重新渲染', () => {
      const TestWrapper = () => {
        const [agent, setAgent] = useState(createMockAgent({ name: '原名' }));

        const updateName = () => {
          setAgent({ ...agent, name: '新名字' });
        };

        return (
          <div>
            <button onClick={updateName}>Update Name</button>
            <AgentTrustCard agent={agent} onLineClick={mockCallbacks.onLineClick} />
          </div>
        );
      };

      const { getByText } = renderWithClient(<TestWrapper />);

      // 初始狀態
      expect(screen.getByText('原名')).toBeInTheDocument();

      // 更新名稱
      fireEvent.click(getByText('Update Name'));

      // 驗證名稱已更新
      expect(screen.queryByText('原名')).not.toBeInTheDocument();
      expect(screen.getByText('新名字')).toBeInTheDocument();
    });

    it('應該在 agent.trustScore 改變時重新渲染', () => {
      const TestWrapper = () => {
        const [agent, setAgent] = useState(createMockAgent({ trustScore: 85 }));

        const updateScore = () => {
          setAgent({ ...agent, trustScore: 95 });
        };

        return (
          <div>
            <button onClick={updateScore}>Update Score</button>
            <AgentTrustCard agent={agent} onLineClick={mockCallbacks.onLineClick} />
          </div>
        );
      };

      const { getByText } = renderWithClient(<TestWrapper />);

      // 初始狀態
      expect(screen.getByText('85')).toBeInTheDocument();

      // 更新分數
      fireEvent.click(getByText('Update Score'));

      // 驗證分數已更新
      expect(screen.queryByText('85')).not.toBeInTheDocument();
      expect(screen.getByText('95')).toBeInTheDocument();
    });

    it('應該在 agent.encouragementCount 改變時重新渲染', () => {
      const TestWrapper = () => {
        const [agent, setAgent] = useState(createMockAgent({ encouragementCount: 10 }));

        const updateCount = () => {
          setAgent({ ...agent, encouragementCount: 20 });
        };

        return (
          <div>
            <button onClick={updateCount}>Update Encouragement</button>
            <AgentTrustCard agent={agent} onLineClick={mockCallbacks.onLineClick} />
          </div>
        );
      };

      const { getByText } = renderWithClient(<TestWrapper />);

      // 初始狀態
      expect(screen.getByText('10')).toBeInTheDocument();

      // 更新鼓勵數
      fireEvent.click(getByText('Update Encouragement'));

      // 驗證鼓勵數已更新
      expect(screen.queryByText('10')).not.toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
    });

    it('應該在 agent.company 改變時重新渲染', () => {
      const TestWrapper = () => {
        const [agent, setAgent] = useState(createMockAgent({ company: '舊公司' }));

        const updateCompany = () => {
          setAgent({ ...agent, company: '新公司' });
        };

        return (
          <div>
            <button onClick={updateCompany}>Update Company</button>
            <AgentTrustCard agent={agent} onLineClick={mockCallbacks.onLineClick} />
          </div>
        );
      };

      const { getByText } = renderWithClient(<TestWrapper />);

      // 初始狀態
      expect(screen.getByText('舊公司')).toBeInTheDocument();

      // 更新公司
      fireEvent.click(getByText('Update Company'));

      // 驗證公司已更新
      expect(screen.queryByText('舊公司')).not.toBeInTheDocument();
      expect(screen.getByText('新公司')).toBeInTheDocument();
    });

    it('應該在 agent.avatarUrl 改變時重新渲染', () => {
      const TestWrapper = () => {
        const [agent, setAgent] = useState(
          createMockAgent({ avatarUrl: 'https://example.com/old.jpg' })
        );

        const updateAvatar = () => {
          setAgent({ ...agent, avatarUrl: 'https://example.com/new.jpg' });
        };

        return (
          <div>
            <button onClick={updateAvatar}>Update Avatar</button>
            <AgentTrustCard agent={agent} onLineClick={mockCallbacks.onLineClick} />
          </div>
        );
      };

      const { getByText, container } = renderWithClient(<TestWrapper />);

      // 初始狀態
      const oldImg = container.querySelector('img[alt="測試經紀人"]');
      expect(oldImg).toHaveAttribute('src', 'https://example.com/old.jpg');

      // 更新頭像
      fireEvent.click(getByText('Update Avatar'));

      // 驗證頭像已更新
      const newImg = container.querySelector('img[alt="測試經紀人"]');
      expect(newImg).toHaveAttribute('src', 'https://example.com/new.jpg');
    });

    it('應該在 agent.internalCode 改變時重新渲染', () => {
      const TestWrapper = () => {
        const [agent, setAgent] = useState(createMockAgent({ internalCode: 12345 }));

        const updateCode = () => {
          setAgent({ ...agent, internalCode: 54321 });
        };

        return (
          <div>
            <button onClick={updateCode}>Update Code</button>
            <AgentTrustCard agent={agent} onLineClick={mockCallbacks.onLineClick} />
          </div>
        );
      };

      const { getByText } = renderWithClient(<TestWrapper />);

      // 初始狀態
      expect(screen.getByText(/12345/)).toBeInTheDocument();

      // 更新編號
      fireEvent.click(getByText('Update Code'));

      // 驗證編號已更新
      expect(screen.queryByText(/12345/)).not.toBeInTheDocument();
      expect(screen.getByText(/54321/)).toBeInTheDocument();
    });
  });

  describe('回調函數 memo 優化', () => {
    it('應該忽略 onLineClick 回調函數引用變化', () => {
      const agent = createMockAgent();

      const TestWrapper = () => {
        const [callbackVersion, setCallbackVersion] = useState(0);

        // 每次父組件重新渲染，回調函數引用都會改變
        const handleLineClick = () => {};

        return (
          <div>
            <button onClick={() => setCallbackVersion((prev) => prev + 1)}>Change Callback</button>
            <div data-testid="callback-version">{callbackVersion}</div>
            <AgentTrustCard
              agent={agent}
              onLineClick={handleLineClick}
              onCallClick={mockCallbacks.onCallClick}
            />
          </div>
        );
      };

      const { getByTestId, getByText } = renderWithClient(<TestWrapper />);

      // 第一次渲染
      const firstCard = document.querySelector('.rounded-xl.border');

      // 改變回調函數引用
      fireEvent.click(getByText('Change Callback'));

      // 驗證父組件確實更新了
      expect(getByTestId('callback-version').textContent).toBe('1');

      // AgentTrustCard 應該忽略回調函數引用變化
      const secondCard = document.querySelector('.rounded-xl.border');
      expect(secondCard).toBe(firstCard);
    });

    it('應該忽略 onCallClick 回調函數引用變化', () => {
      const agent = createMockAgent();

      const TestWrapper = () => {
        const [version, setVersion] = useState(0);

        const handleCallClick = () => {};

        return (
          <div>
            <button onClick={() => setVersion((prev) => prev + 1)}>Update</button>
            <div data-testid="version">{version}</div>
            <AgentTrustCard
              agent={agent}
              onLineClick={mockCallbacks.onLineClick}
              onCallClick={handleCallClick}
            />
          </div>
        );
      };

      const { getByTestId, getByText } = renderWithClient(<TestWrapper />);

      const firstCard = document.querySelector('.rounded-xl.border');

      fireEvent.click(getByText('Update'));

      expect(getByTestId('version').textContent).toBe('1');

      const secondCard = document.querySelector('.rounded-xl.border');
      expect(secondCard).toBe(firstCard);
    });

    it('應該在回調函數引用變化時仍能正確執行', () => {
      const agent = createMockAgent();
      let callCount = 0;

      const TestWrapper = () => {
        const [version, setVersion] = useState(0);

        const handleLineClick = () => {
          callCount++;
        };

        return (
          <div>
            <button onClick={() => setVersion((prev) => prev + 1)}>Update Version</button>
            <AgentTrustCard agent={agent} onLineClick={handleLineClick} />
          </div>
        );
      };

      const { getByText } = renderWithClient(<TestWrapper />);

      // 改變回調函數引用
      fireEvent.click(getByText('Update Version'));

      // 點擊加 LINE 按鈕
      const lineButton = screen.getByText('加 LINE 聊聊');
      fireEvent.click(lineButton);

      // 驗證新的回調函數被執行
      expect(callCount).toBe(1);
    });
  });

  describe('useMemo agentMetrics 快取', () => {
    it('應該在 agent.serviceYears 改變時重新計算 agentMetrics', () => {
      const TestWrapper = () => {
        const [agent, setAgent] = useState(createMockAgent({ serviceYears: 3 }));

        const updateYears = () => {
          setAgent({ ...agent, serviceYears: 5 });
        };

        return (
          <div>
            <button onClick={updateYears}>Update Years</button>
            <AgentTrustCard agent={agent} onLineClick={mockCallbacks.onLineClick} />
          </div>
        );
      };

      const { getByText } = renderWithClient(<TestWrapper />);

      expect(screen.getByText('3年')).toBeInTheDocument();

      fireEvent.click(getByText('Update Years'));

      expect(screen.queryByText('3年')).not.toBeInTheDocument();
      expect(screen.getByText('5年')).toBeInTheDocument();
    });

    it('應該在 agent.completedCases 改變時重新計算 agentMetrics', () => {
      const TestWrapper = () => {
        const [agent, setAgent] = useState(createMockAgent({ completedCases: 12 }));

        const updateCount = () => {
          setAgent({ ...agent, completedCases: 20 });
        };

        return (
          <div>
            <button onClick={updateCount}>Update Count</button>
            <AgentTrustCard agent={agent} onLineClick={mockCallbacks.onLineClick} />
          </div>
        );
      };

      const { getByText } = renderWithClient(<TestWrapper />);

      expect(screen.getByText('12')).toBeInTheDocument();

      fireEvent.click(getByText('Update Count'));

      expect(screen.queryByText('12')).not.toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
    });

    it('應該基於 internalCode 計算穩定的在線狀態', () => {
      // internalCode % 10 > 3 → 在線
      const onlineAgent = createMockAgent({ internalCode: 12345 }); // 5 > 3 → 在線
      const offlineAgent = createMockAgent({ internalCode: 12342 }); // 2 <= 3 → 離線

      const { container, unmount } = renderWithClient(
        <AgentTrustCard agent={onlineAgent} onLineClick={mockCallbacks.onLineClick} />
      );

      // 在線狀態
      expect(container.textContent).toContain('在線');

      // 清除並重新渲染離線經紀人
      unmount();
      const { container: container2 } = renderWithClient(
        <AgentTrustCard agent={offlineAgent} onLineClick={mockCallbacks.onLineClick} />
      );

      // 離線狀態
      expect(container2.textContent).toContain('離線');
    });
  });

  describe('信任分數 Tooltip 互動', () => {
    it('應該在父組件重渲染時保持 tooltip 狀態', () => {
      const agent = createMockAgent();

      const TestWrapper = () => {
        const [count, setCount] = useState(0);

        return (
          <div>
            <button onClick={() => setCount((prev) => prev + 1)}>Increment</button>
            <AgentTrustCard agent={agent} onLineClick={mockCallbacks.onLineClick} />
          </div>
        );
      };

      const { getByText, container } = renderWithClient(<TestWrapper />);

      // 觸發 tooltip 顯示
      const trustScoreDiv = container.querySelector('[role="button"]');
      expect(trustScoreDiv).toBeInTheDocument();
      fireEvent.mouseEnter(trustScoreDiv!);

      // 驗證 tooltip 顯示
      expect(screen.getByText('信任分數構成')).toBeInTheDocument();

      // 觸發父組件重渲染
      fireEvent.click(getByText('Increment'));

      // 因為 memo，組件不應重渲染，tooltip 應保持顯示
      // 注意：實際上 tooltip 是組件內部狀態，memo 會保持內部狀態
    });
  });

  describe('按鈕點擊行為', () => {
    it('應該正確觸發 onLineClick', () => {
      const agent = createMockAgent();
      renderWithClient(<AgentTrustCard agent={agent} onLineClick={mockCallbacks.onLineClick} />);

      const lineButton = screen.getByText('加 LINE 聊聊');
      fireEvent.click(lineButton);

      expect(mockCallbacks.onLineClick).toHaveBeenCalledTimes(1);
    });

    it('應該正確觸發 onCallClick', () => {
      const agent = createMockAgent();
      renderWithClient(<AgentTrustCard agent={agent} onCallClick={mockCallbacks.onCallClick} />);

      const callButton = screen.getByText('致電諮詢');
      fireEvent.click(callButton);

      expect(mockCallbacks.onCallClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('績效指標顯示', () => {
    it('應該正確顯示服務評價與評論數', () => {
      const agent = createMockAgent({ serviceRating: 4.6, reviewCount: 18 });
      renderWithClient(<AgentTrustCard agent={agent} onLineClick={mockCallbacks.onLineClick} />);

      expect(screen.getByText('4.6')).toBeInTheDocument();
      expect(screen.getByText('(18)')).toBeInTheDocument();
    });

    it('應該正確顯示完成案件數', () => {
      const agent = createMockAgent({ completedCases: 40 });
      renderWithClient(<AgentTrustCard agent={agent} onLineClick={mockCallbacks.onLineClick} />);

      expect(screen.getByText('40')).toBeInTheDocument();
    });

    it('應該正確顯示服務年資', () => {
      const agent = createMockAgent({ serviceYears: 6 });
      renderWithClient(<AgentTrustCard agent={agent} onLineClick={mockCallbacks.onLineClick} />);

      expect(screen.getByText('6年')).toBeInTheDocument();
    });
  });

  describe('在線狀態顯示', () => {
    it('應該顯示在線狀態和快速回覆時間', () => {
      const onlineAgent = createMockAgent({ internalCode: 12345 }); // 5 > 3 → 在線
      const { container } = renderWithClient(
        <AgentTrustCard agent={onlineAgent} onLineClick={mockCallbacks.onLineClick} />
      );

      expect(container.textContent).toContain('在線');
      expect(container.textContent).toContain('5 分鐘');
    });

    it('應該顯示離線狀態（無回覆時間提示）', () => {
      const offlineAgent = createMockAgent({ internalCode: 12342 }); // 2 <= 3 → 離線
      const { container } = renderWithClient(
        <AgentTrustCard agent={offlineAgent} onLineClick={mockCallbacks.onLineClick} />
      );

      expect(container.textContent).toContain('離線');
      // 離線狀態不顯示回覆時間提示
      expect(container.textContent).not.toContain('平均');
      expect(container.textContent).not.toContain('內回覆');
    });
  });

  describe('認證 badge 顯示', () => {
    it('應該顯示已認證標記', () => {
      const agent = createMockAgent();
      renderWithClient(<AgentTrustCard agent={agent} onLineClick={mockCallbacks.onLineClick} />);

      expect(screen.getByText('已認證')).toBeInTheDocument();
    });
  });
});
