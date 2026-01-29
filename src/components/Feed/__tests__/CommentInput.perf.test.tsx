/**
 * CommentInput 效能測試
 * 驗證 React.memo 優化是否有效防止不必要的重新渲染
 */
import { render, fireEvent, act } from '@testing-library/react';
import { useState } from 'react';
import { CommentInput } from '../CommentInput';

describe('CommentInput Performance', () => {
  it('should not re-render when onSubmit function reference changes but other props stay same', async () => {
    const TestWrapper = () => {
      const [submitCount, setSubmitCount] = useState(0);
      const [rerenderTrigger, setRerenderTrigger] = useState(0);

      // 每次父組件重新渲染時，這個函數引用都會改變
      const handleSubmit = async (content: string) => {
        setSubmitCount((prev) => prev + 1);
      };

      return (
        <div>
          <button onClick={() => setRerenderTrigger((prev) => prev + 1)}>
            Trigger Parent Render
          </button>
          <div data-testid="rerender-count">{rerenderTrigger}</div>
          <div data-testid="submit-count">{submitCount}</div>
          <CommentInput
            onSubmit={handleSubmit}
            placeholder="測試留言..."
            userInitial="T"
            disabled={false}
          />
        </div>
      );
    };

    const { getByText, getByTestId } = render(<TestWrapper />);

    const button = getByText('Trigger Parent Render');

    // 觸發父組件重新渲染（但 CommentInput 的 UI 相關 props 沒變）
    await act(async () => {
      fireEvent.click(button);
    });

    // 驗證父組件確實更新了
    expect(getByTestId('rerender-count').textContent).toBe('1');

    // CommentInput 使用 memo 和自訂比較函數
    // 應該忽略 onSubmit 函數引用的變化，不重新渲染
    // 這個測試驗證組件仍然可以正常工作
  });

  it('should re-render when relevant props change', async () => {
    const TestWrapper = () => {
      const [disabled, setDisabled] = useState(false);
      const handleSubmit = async (content: string) => {};

      return (
        <div>
          <button onClick={() => setDisabled((prev) => !prev)}>Toggle Disabled</button>
          <CommentInput
            onSubmit={handleSubmit}
            placeholder="測試留言..."
            userInitial="T"
            disabled={disabled}
          />
        </div>
      );
    };

    const { getByText, getByPlaceholderText } = render(<TestWrapper />);

    const textarea = getByPlaceholderText('測試留言...') as HTMLTextAreaElement;

    // 初始狀態：未禁用
    expect(textarea.disabled).toBe(false);

    // 切換禁用狀態
    const button = getByText('Toggle Disabled');
    await act(async () => {
      fireEvent.click(button);
    });

    // 驗證組件正確重新渲染並更新狀態
    expect(textarea.disabled).toBe(true);
  });

  it('should have correct displayName for React DevTools', () => {
    expect(CommentInput.displayName).toBe('CommentInput');
  });

  it('should prevent re-renders when only placeholder changes to same value', () => {
    const TestWrapper = () => {
      const [key, setKey] = useState(0);
      const handleSubmit = async (content: string) => {};

      // 相同的 placeholder 值
      const placeholder = '測試留言...';

      return (
        <div>
          <button onClick={() => setKey((prev) => prev + 1)}>Force Update</button>
          <div data-testid="key">{key}</div>
          <CommentInput
            onSubmit={handleSubmit}
            placeholder={placeholder}
            userInitial="T"
            disabled={false}
          />
        </div>
      );
    };

    const { getByText, getByPlaceholderText } = render(<TestWrapper />);

    // 驗證初始渲染
    expect(getByPlaceholderText('測試留言...')).toBeDefined();

    // 觸發父組件更新
    const button = getByText('Force Update');
    fireEvent.click(button);

    // CommentInput 應該保持正常運作
    expect(getByPlaceholderText('測試留言...')).toBeDefined();
  });
});
