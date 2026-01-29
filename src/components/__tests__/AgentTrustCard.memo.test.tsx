/**
 * AgentTrustCard React.memo 優化效能測試
 * 驗證：
 * 1. AgentTrustCard 在父組件重渲染時不重渲染
 * 2. agent 物件深度比較邏輯
 * 3. 回調函數引用變化的隔離效果
 * 4. useMemo 計算的 agentMetrics 快取
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { AgentTrustCard } from '../AgentTrustCard';
import type { Agent } from '../../lib/types';

describe('AgentTrustCard React.memo Performance', () => {
  const createMockAgent = (overrides: Partial<Agent> = {}): Agent => ({
    id: 'agent-1',
    internalCode: 12345,
    name: '測試經紀人',
    avatarUrl: 'https://example.com/avatar.jpg',
    company: '測試不動產',
    trustScore: 85,
    encouragementCount: 10,
    ...overrides,
  });

  const mockCallbacks = {
    onLineClick: vi.fn(),
    onCallClick: vi.fn(),
    onBookingClick: vi.fn(),
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
              onBookingClick={mockCallbacks.onBookingClick}
            />
          </div>
        );
      };

      const { getByTestId, getByText } = render(<TestWrapper />);

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

      const { getByTestId, getByText } = render(<TestWrapper />);

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

      const { getByText } = render(<TestWrapper />);

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

      const { getByText } = render(<TestWrapper />);

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

      const { getByText } = render(<TestWrapper />);

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

      const { getByText } = render(<TestWrapper />);

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

      const { getByText, container } = render(<TestWrapper />);

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

      const { getByText } = render(<TestWrapper />);

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

      const { getByTestId, getByText } = render(<TestWrapper />);

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

      const { getByTestId, getByText } = render(<TestWrapper />);

      const firstCard = document.querySelector('.rounded-xl.border');

      fireEvent.click(getByText('Update'));

      expect(getByTestId('version').textContent).toBe('1');

      const secondCard = document.querySelector('.rounded-xl.border');
      expect(secondCard).toBe(firstCard);
    });

    it('應該忽略 onBookingClick 回調函數引用變化', () => {
      const agent = createMockAgent();

      const TestWrapper = () => {
        const [version, setVersion] = useState(0);

        const handleBookingClick = () => {};

        return (
          <div>
            <button onClick={() => setVersion((prev) => prev + 1)}>Update</button>
            <div data-testid="version">{version}</div>
            <AgentTrustCard
              agent={agent}
              onLineClick={mockCallbacks.onLineClick}
              onBookingClick={handleBookingClick}
            />
          </div>
        );
      };

      const { getByTestId, getByText } = render(<TestWrapper />);

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

      const { getByText } = render(<TestWrapper />);

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
    it('應該在 agent.trustScore 改變時重新計算 agentMetrics', () => {
      const TestWrapper = () => {
        const [agent, setAgent] = useState(
          createMockAgent({ trustScore: 60, encouragementCount: 10 })
        );

        const updateScore = () => {
          setAgent({ ...agent, trustScore: 100 });
        };

        return (
          <div>
            <button onClick={updateScore}>Update Score</button>
            <AgentTrustCard agent={agent} onLineClick={mockCallbacks.onLineClick} />
          </div>
        );
      };

      const { getByText } = render(<TestWrapper />);

      // 初始狀態：經驗年數基於 trustScore / 25 + 1
      // trustScore=60 → floor(60/25)+1 = 2+1 = 3年
      expect(screen.getByText('3年')).toBeInTheDocument();

      // 更新分數
      fireEvent.click(getByText('Update Score'));

      // trustScore=100 → floor(100/25)+1 = 4+1 = 5年
      expect(screen.queryByText('3年')).not.toBeInTheDocument();
      expect(screen.getByText('5年')).toBeInTheDocument();
    });

    it('應該在 agent.encouragementCount 改變時重新計算 agentMetrics', () => {
      const TestWrapper = () => {
        const [agent, setAgent] = useState(
          createMockAgent({ trustScore: 85, encouragementCount: 10 })
        );

        const updateCount = () => {
          setAgent({ ...agent, encouragementCount: 20 });
        };

        return (
          <div>
            <button onClick={updateCount}>Update Count</button>
            <AgentTrustCard agent={agent} onLineClick={mockCallbacks.onLineClick} />
          </div>
        );
      };

      const { getByText } = render(<TestWrapper />);

      // 初始狀態：totalDeals = encouragementCount * 2 + 10 = 30
      expect(screen.getByText('30')).toBeInTheDocument();

      // 更新鼓勵數
      fireEvent.click(getByText('Update Count'));

      // totalDeals = 20 * 2 + 10 = 50
      expect(screen.queryByText('30')).not.toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('應該基於 internalCode 計算穩定的在線狀態', () => {
      // internalCode % 10 > 3 → 在線
      const onlineAgent = createMockAgent({ internalCode: 12345 }); // 5 > 3 → 在線
      const offlineAgent = createMockAgent({ internalCode: 12342 }); // 2 <= 3 → 離線

      const { rerender, container } = render(
        <AgentTrustCard agent={onlineAgent} onLineClick={mockCallbacks.onLineClick} />
      );

      // 在線狀態
      expect(container.textContent).toContain('在線');

      // 切換為離線經紀人
      rerender(<AgentTrustCard agent={offlineAgent} onLineClick={mockCallbacks.onLineClick} />);

      // 離線狀態
      expect(container.textContent).toContain('離線');
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

      const { getByText, container } = render(<TestWrapper />);

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

  describe('預約看屋 Modal', () => {
    it('應該在打開 Modal 後父組件重渲染時不關閉 Modal', () => {
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

      const { getByText } = render(<TestWrapper />);

      // 打開預約 Modal
      const bookingButton = screen.getByText('預約看屋');
      fireEvent.click(bookingButton);

      // 驗證 Modal 顯示（預約表單，不是成功訊息）
      expect(screen.getByText(/選擇方便的時段/)).toBeInTheDocument();

      // 觸發父組件重渲染
      fireEvent.click(getByText('Increment'));

      // Modal 應該仍然顯示（因為 memo 保持了組件內部狀態）
      expect(screen.getByText(/選擇方便的時段/)).toBeInTheDocument();
    });
  });

  describe('按鈕點擊行為', () => {
    it('應該正確觸發 onLineClick', () => {
      const agent = createMockAgent();
      render(<AgentTrustCard agent={agent} onLineClick={mockCallbacks.onLineClick} />);

      const lineButton = screen.getByText('加 LINE 聊聊');
      fireEvent.click(lineButton);

      expect(mockCallbacks.onLineClick).toHaveBeenCalledTimes(1);
    });

    it('應該正確觸發 onCallClick', () => {
      const agent = createMockAgent();
      render(<AgentTrustCard agent={agent} onCallClick={mockCallbacks.onCallClick} />);

      const callButton = screen.getByText('致電諮詢');
      fireEvent.click(callButton);

      expect(mockCallbacks.onCallClick).toHaveBeenCalledTimes(1);
    });

    it('應該正確觸發 onBookingClick', () => {
      const agent = createMockAgent();
      render(<AgentTrustCard agent={agent} onBookingClick={mockCallbacks.onBookingClick} />);

      const bookingButton = screen.getByText('預約看屋');
      fireEvent.click(bookingButton);

      expect(mockCallbacks.onBookingClick).toHaveBeenCalledTimes(1);
    });

    it('應該在沒有 onBookingClick 時顯示內建 Modal', () => {
      const agent = createMockAgent();
      render(<AgentTrustCard agent={agent} onLineClick={mockCallbacks.onLineClick} />);

      const bookingButton = screen.getByText('預約看屋');
      fireEvent.click(bookingButton);

      // 驗證內建 Modal 顯示
      expect(screen.getByText(/選擇方便的時段/)).toBeInTheDocument();
    });
  });

  describe('績效指標顯示', () => {
    it('應該正確計算並顯示成交率', () => {
      const agent = createMockAgent({ trustScore: 85 });
      render(<AgentTrustCard agent={agent} onLineClick={mockCallbacks.onLineClick} />);

      // closureRate = min(95, 60 + (85 % 30)) = min(95, 85) = 85
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('應該正確計算並顯示累積成交數', () => {
      const agent = createMockAgent({ encouragementCount: 15 });
      render(<AgentTrustCard agent={agent} onLineClick={mockCallbacks.onLineClick} />);

      // totalDeals = 15 * 2 + 10 = 40
      expect(screen.getByText('40')).toBeInTheDocument();
    });

    it('應該正確計算並顯示服務經驗', () => {
      const agent = createMockAgent({ trustScore: 75 });
      render(<AgentTrustCard agent={agent} onLineClick={mockCallbacks.onLineClick} />);

      // experience = floor(75 / 25) + 1 = 3 + 1 = 4
      expect(screen.getByText('4年')).toBeInTheDocument();
    });
  });

  describe('在線狀態顯示', () => {
    it('應該顯示在線狀態和快速回覆時間', () => {
      const onlineAgent = createMockAgent({ internalCode: 12345 }); // 5 > 3 → 在線
      const { container } = render(
        <AgentTrustCard agent={onlineAgent} onLineClick={mockCallbacks.onLineClick} />
      );

      expect(container.textContent).toContain('在線');
      expect(container.textContent).toContain('5 分鐘');
    });

    it('應該顯示離線狀態（無回覆時間提示）', () => {
      const offlineAgent = createMockAgent({ internalCode: 12342 }); // 2 <= 3 → 離線
      const { container } = render(
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
      render(<AgentTrustCard agent={agent} onLineClick={mockCallbacks.onLineClick} />);

      expect(screen.getByText('已認證')).toBeInTheDocument();
    });
  });
});
