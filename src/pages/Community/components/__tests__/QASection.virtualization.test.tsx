/**
 * AUDIT-01 Phase 8: QA 卡片虛擬化測試
 *
 * 測試目標：
 * 1. 少量問題時不啟用虛擬化（SimpleQAList）
 * 2. 大量問題時啟用虛擬化（VirtualizedQAListInner）
 * 3. 虛擬化列表正確渲染可見項目
 * 4. props 正確傳遞（activeQuestion、onAnswer 等）
 * 5. 邊界案例處理
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QASection } from '../QASection';
import type { Question } from '../../types';

// Mock useGuestVisibleItems hook
vi.mock('../../../../hooks/useGuestVisibleItems', () => ({
  useGuestVisibleItems: <T,>(items: T[], isLoggedIn: boolean) => ({
    visible: isLoggedIn ? items : items.slice(0, 2),
    hiddenCount: isLoggedIn ? 0 : Math.max(0, items.length - 2),
    nextHidden: !isLoggedIn && items.length > 2 ? items[2] : null,
  }),
}));

// 常數：與 QASection.tsx 保持一致
const VIRTUALIZATION_THRESHOLD = 10;

// 生成測試用問題資料（混合已回答/未回答）
function generateQuestions(count: number): Question[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `q-${i + 1}`,
    question: `測試問題 ${i + 1}`,
    time: new Date().toISOString(),
    answersCount: i % 3 === 0 ? 0 : i + 1, // 每 3 個問題有一個未回答
    answers:
      i % 3 === 0
        ? []
        : [
            {
              author: `住戶 ${i}`,
              type: 'resident' as const,
              content: `這是回答 ${i}`,
            },
          ],
  }));
}

// 生成全部有回答的問題（便於測試虛擬化）
function generateAnsweredQuestions(count: number): Question[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `q-${i + 1}`,
    question: `已回答問題第${i + 1}題`, // 使用「第X題」避免匹配歧義
    time: new Date().toISOString(),
    answersCount: 1,
    answers: [
      {
        author: `住戶 ${i}`,
        type: 'resident' as const,
        content: `這是回答 ${i}`,
      },
    ],
  }));
}

describe('QASection 虛擬化測試', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('虛擬化啟用條件', () => {
    it(`少於等於 ${VIRTUALIZATION_THRESHOLD} 個問題時，不啟用虛擬化（無 data-testid="virtualized-container"）`, () => {
      const questions = generateAnsweredQuestions(VIRTUALIZATION_THRESHOLD);

      const { container } = render(<QASection viewerRole="resident" questions={questions} />);

      // 不應有虛擬化容器
      const virtualContainer = container.querySelector('[data-testid="virtualized-container"]');
      expect(virtualContainer).toBeNull();

      // 應該能找到第一個和最後一個問題（驗證所有問題都被渲染）
      expect(screen.getByText(/Q: 已回答問題第1題/)).toBeInTheDocument();
      expect(screen.getByText(/Q: 已回答問題第10題/)).toBeInTheDocument();
    });

    it(`超過 ${VIRTUALIZATION_THRESHOLD} 個問題時，啟用虛擬化（有 data-testid="virtualized-container"）`, () => {
      const questions = generateAnsweredQuestions(VIRTUALIZATION_THRESHOLD + 5);

      const { container } = render(<QASection viewerRole="resident" questions={questions} />);

      // 應有虛擬化容器
      const virtualContainer = container.querySelector('[data-testid="virtualized-container"]');
      expect(virtualContainer).not.toBeNull();
      expect(virtualContainer).toBeInTheDocument();
    });

    it('虛擬化時，容器應有正確的結構', () => {
      const totalCount = 20;
      const questions = generateAnsweredQuestions(totalCount);

      const { container } = render(<QASection viewerRole="resident" questions={questions} />);

      // 虛擬化容器存在
      const virtualContainer = container.querySelector('[data-testid="virtualized-container"]');
      expect(virtualContainer).toBeInTheDocument();

      // 容器應有 overflow-auto class
      expect(virtualContainer).toHaveClass('overflow-auto');

      // 容器應有 maxHeight 樣式
      const style = virtualContainer?.getAttribute('style');
      expect(style).toContain('max-height');
    });
  });

  describe('非虛擬化模式 props 傳遞', () => {
    it('非虛擬化列表應正確傳遞 onAnswer prop，按鈕可點擊', () => {
      // 使用少量問題，確保不觸發虛擬化
      const questions = generateAnsweredQuestions(5);
      const onAnswerQuestion = vi.fn();

      render(
        <QASection
          viewerRole="resident"
          questions={questions}
          onAnswerQuestion={onAnswerQuestion}
        />
      );

      // 找到回答按鈕
      const answerButtons = screen.getAllByRole('button', {
        name: /回答/,
      });
      expect(answerButtons.length).toBeGreaterThan(0);

      // 點擊第一個按鈕應開啟 modal
      fireEvent.click(answerButtons[0]!);

      // 應該看到回答 modal
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('回答問題')).toBeInTheDocument();
    });

    it('非虛擬化列表應正確傳遞 isAnswering 狀態', async () => {
      const questions = generateAnsweredQuestions(5);
      // 模擬 onAnswerQuestion 延遲返回
      const onAnswerQuestion = vi.fn(
        () => new Promise<void>((resolve) => setTimeout(resolve, 100))
      );

      render(
        <QASection
          viewerRole="resident"
          questions={questions}
          onAnswerQuestion={onAnswerQuestion}
        />
      );

      // 點擊回答按鈕開啟 modal
      const answerButton = screen.getAllByRole('button', { name: /回答/ })[0]!;
      fireEvent.click(answerButton);

      // 在 modal 中輸入內容
      const textarea = screen.getByPlaceholderText(/提供實際經驗/);
      fireEvent.change(textarea, { target: { value: '這是測試回答內容' } });

      // 點擊送出
      const submitButton = screen.getByRole('button', { name: '送出回答' });
      fireEvent.click(submitButton);

      // 應該顯示送出中狀態
      expect(screen.getByText('送出中…')).toBeInTheDocument();
    });

    it('訪客模式下列表應正確傳遞 onUnlock prop', () => {
      const questions = generateAnsweredQuestions(5);
      const onUnlock = vi.fn();

      render(<QASection viewerRole="guest" questions={questions} onUnlock={onUnlock} />);

      // 訪客應該看到解鎖按鈕
      const unlockButtons = screen.getAllByRole('button', {
        name: /解鎖|免費註冊/,
      });
      expect(unlockButtons.length).toBeGreaterThan(0);

      // 點擊解鎖按鈕
      fireEvent.click(unlockButtons[0]!);

      // onUnlock 應被調用
      expect(onUnlock).toHaveBeenCalled();
    });
  });

  describe('activeQuestion 狀態測試', () => {
    it('點擊回答按鈕後，activeQuestion 應正確設定', () => {
      const questions = generateAnsweredQuestions(5);
      const onAnswerQuestion = vi.fn();

      render(
        <QASection
          viewerRole="resident"
          questions={questions}
          onAnswerQuestion={onAnswerQuestion}
        />
      );

      // 點擊第一個回答按鈕
      const answerButton = screen.getAllByRole('button', { name: /回答/ })[0]!;
      fireEvent.click(answerButton);

      // Modal 應顯示對應問題
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // 檢查 modal 標題或內容包含問題資訊
      expect(dialog).toHaveTextContent(/已回答問題第1題/);
    });

    it('關閉 modal 後，activeQuestion 應重置', () => {
      const questions = generateAnsweredQuestions(5);

      render(<QASection viewerRole="resident" questions={questions} />);

      // 開啟 modal
      const answerButton = screen.getAllByRole('button', { name: /回答/ })[0]!;
      fireEvent.click(answerButton);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // 關閉 modal
      const closeButton = screen.getByLabelText('關閉回答視窗');
      fireEvent.click(closeButton);

      // Modal 應關閉
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('邊界案例', () => {
    it('空問題列表應正確處理，顯示空狀態訊息', () => {
      render(<QASection viewerRole="resident" questions={[]} />);

      // 應顯示「目前沒有待回答的問題」
      expect(screen.getByText(/目前沒有待回答的問題/)).toBeInTheDocument();
    });

    it(`剛好 ${VIRTUALIZATION_THRESHOLD} 個問題時不啟用虛擬化`, () => {
      const questions = generateAnsweredQuestions(VIRTUALIZATION_THRESHOLD);

      const { container } = render(<QASection viewerRole="resident" questions={questions} />);

      // 不應有虛擬化容器
      const virtualContainer = container.querySelector('[data-testid="virtualized-container"]');
      expect(virtualContainer).toBeNull();
    });

    it(`${VIRTUALIZATION_THRESHOLD + 1} 個問題時應啟用虛擬化`, () => {
      const questions = generateAnsweredQuestions(VIRTUALIZATION_THRESHOLD + 1);

      const { container } = render(<QASection viewerRole="resident" questions={questions} />);

      // 應有虛擬化容器
      const virtualContainer = container.querySelector('[data-testid="virtualized-container"]');
      expect(virtualContainer).not.toBeNull();
    });

    it('問題以物件格式 { items: [] } 傳入時應正確處理', () => {
      const questions = generateAnsweredQuestions(5);

      render(<QASection viewerRole="resident" questions={{ items: questions }} />);

      // 應該能找到第一個問題
      expect(screen.getByText(/Q: 已回答問題第1題/)).toBeInTheDocument();
    });

    it('混合已回答與未回答問題時應分別處理', () => {
      const questions = generateQuestions(8); // 會有已回答和未回答的混合

      render(<QASection viewerRole="resident" questions={questions} />);

      // 應該有「還沒人回答的問題」區塊
      expect(screen.getByText(/還沒人回答的問題/)).toBeInTheDocument();
    });
  });

  describe('虛擬化容器樣式', () => {
    it('虛擬化容器應有 maxHeight 樣式限制', () => {
      const questions = generateAnsweredQuestions(20);

      const { container } = render(<QASection viewerRole="resident" questions={questions} />);

      const virtualContainer = container.querySelector('[data-testid="virtualized-container"]');
      expect(virtualContainer).not.toBeNull();

      // 檢查 maxHeight 樣式存在
      const style = virtualContainer?.getAttribute('style');
      expect(style).toContain('max-height');
    });

    it('虛擬化容器應有 overflow-auto class', () => {
      const questions = generateAnsweredQuestions(20);

      const { container } = render(<QASection viewerRole="resident" questions={questions} />);

      const virtualContainer = container.querySelector('[data-testid="virtualized-container"]');
      expect(virtualContainer).toHaveClass('overflow-auto');
    });
  });
});
