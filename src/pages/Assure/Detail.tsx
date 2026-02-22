import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrustRoom } from '../../hooks/useTrustRoom';
import { RotateCcw, User, Briefcase, Zap, ShieldCheck, FilePlus } from 'lucide-react';
import { getAgentDisplayInfo } from '../../lib/trustPrivacy';
import { DataCollectionModal } from '../../components/TrustRoom/DataCollectionModal';
import { notify } from '../../lib/notify';
import { logger } from '../../lib/logger';
import { safeLocalStorage } from '../../lib/safeStorage';
import { calcProgressWidthClass } from '../../constants/progress';
import { UAG_LAST_AID_STORAGE_KEY } from '../../constants/strings';
import { mockService, realService } from '../../services/trustService';
import { usePageMode } from '../../hooks/usePageMode';
import { StepCard } from '../../components/Assure/StepCard';
import { StepContent } from '../../components/Assure/StepContent';
import { ReviewPromptModal } from '../../components/Assure/ReviewPromptModal';

/** 房仲代付金額（新台幣） */
const AGENT_PAYMENT_AMOUNT = 2000;

/** pendingAction 自動取消時間（毫秒） */
const PENDING_ACTION_TIMEOUT_MS = 3000;

/** Modal 延遲顯示時間（毫秒），避免與頁面渲染衝突 */
const MODAL_DELAY_MS = 500;
/** Step 2 確認成功後顯示評價提示的延遲（毫秒） */
const REVIEW_PROMPT_DELAY_MS = 500;

export default function AssureDetail() {
  const mode = usePageMode();
  const isDemoMode = mode === 'demo';
  const navigate = useNavigate();

  const {
    caseId,
    role,
    setRole,
    tx,
    loading,
    isBusy,
    timeLeft,
    startMockMode,
    dispatchAction,
    fetchData,
  } = useTrustRoom({ isDemoMode });

  // Inputs
  const [inputBuffer, setInputBuffer] = useState('');
  const [supplementInput, setSupplementInput] = useState('');

  // [Team 3 修復] M4 Modal 狀態管理
  const [showDataModal, setShowDataModal] = useState(false);
  const [isSubmittingData, setIsSubmittingData] = useState(false);
  const [pendingAction, setPendingAction] = useState<null | 'pay' | 'reset'>(null);
  const [hasDismissedDataModal, setHasDismissedDataModal] = useState(false);

  // 評價提示 Modal
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);

  // Note: Token handling and initialization is now managed by useTrustRoom hook
  // We just need to handle the "No Token" state in the UI

  const handleAction = useCallback(
    async (endpoint: string, body: Record<string, unknown> = {}) => {
      setPendingAction(null);
      const success = await dispatchAction(endpoint, body);
      if (success) {
        setInputBuffer('');
        setSupplementInput('');
      }
      return success;
    },
    [dispatchAction]
  );

  const submitAgent = useCallback(
    (step: string) => handleAction('submit', { step, data: { note: inputBuffer } }),
    [handleAction, inputBuffer]
  );

  const confirmStep = useCallback(
    async (step: string) => {
      const success = await handleAction('confirm', { step, note: inputBuffer });
      // Step 2 確認成功後 500ms 彈出評價提示
      if (success && step === '2' && role === 'buyer') {
        setTimeout(() => {
          setShowReviewPrompt(true);
        }, REVIEW_PROMPT_DELAY_MS);
      }
    },
    [handleAction, inputBuffer, role]
  );

  const pay = useCallback(() => {
    if (pendingAction !== 'pay') {
      setPendingAction('pay');
      notify.info('再點一次確認付款');
      return;
    }
    setPendingAction(null);
    handleAction('payment');
  }, [handleAction, pendingAction]);

  const toggleCheck = useCallback(
    (itemId: string, checked: boolean) => {
      if (role === 'buyer') handleAction('checklist', { itemId, checked });
    },
    [handleAction, role]
  );

  const addSupplement = useCallback(() => {
    const content = supplementInput.trim();
    if (!content) return;
    handleAction('supplement', { content });
  }, [handleAction, supplementInput]);

  const reset = useCallback(() => {
    if (pendingAction !== 'reset') {
      setPendingAction('reset');
      notify.warning('再點一次確認重置');
      return;
    }
    setPendingAction(null);
    handleAction('reset');
  }, [handleAction, pendingAction]);

  useEffect(() => {
    if (!pendingAction) return;
    const timer = setTimeout(() => setPendingAction(null), PENDING_ACTION_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [pendingAction]);

  const toggleRole = () => {
    const newRole = role === 'agent' ? 'buyer' : 'agent';
    setRole(newRole);
  };

  // visitor mode guard：visitor 不允許進入 /assure 頁面，導回首頁
  useEffect(() => {
    if (mode === 'visitor') {
      notify.info('請先登入或進入演示模式', '安心留痕功能需要登入後才能使用。');
      navigate('/', { replace: true });
    }
  }, [mode, navigate]);

  // demo mode 進入時自動啟動 mock 資料（避免 tx=null 顯示訪客 CTA）
  useEffect(() => {
    if (isDemoMode && !tx && !loading) {
      void startMockMode();
    }
  }, [isDemoMode, tx, loading, startMockMode]);

  // [Team 3 修復] M4 資料收集 Modal 觸發邏輯
  useEffect(() => {
    if (!tx || role !== 'buyer' || showDataModal || hasDismissedDataModal) return;

    // 檢查是否需要顯示 Modal（stage === 4 且為臨時代號）
    const isStage4 = tx.currentStep === 4;
    const isTempBuyer = tx.buyerName?.startsWith('買方-') && tx.buyerUserId === null;

    if (isStage4 && isTempBuyer) {
      const timer = setTimeout(() => {
        setShowDataModal(true);
      }, MODAL_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [tx, role, showDataModal, hasDismissedDataModal]);

  // 當案件狀態已不需要資料收集時，重置略過狀態
  useEffect(() => {
    if (!tx) {
      setHasDismissedDataModal(false);
      return;
    }
    const shouldPromptDataModal =
      tx.currentStep === 4 && tx.buyerName?.startsWith('買方-') && tx.buyerUserId === null;
    if (!shouldPromptDataModal) {
      setHasDismissedDataModal(false);
    }
  }, [caseId, tx]);

  // [Team 3 修復] M4 資料收集表單提交
  const handleDataSubmit = async (data: { name: string; phone: string; email: string }) => {
    setIsSubmittingData(true);
    try {
      const service = isDemoMode ? mockService : realService;
      const buyerInfoPayload: { name: string; phone: string; email?: string } = {
        name: data.name,
        phone: data.phone,
      };
      if (data.email) {
        buyerInfoPayload.email = data.email;
      }
      await service.completeBuyerInfo(caseId ?? '', buyerInfoPayload);

      notify.success('資料提交成功！', '資料已安全儲存，感謝你的配合。');
      setHasDismissedDataModal(false);
      setShowDataModal(false);

      // 重新載入案件資料（觸發 useTrustRoom 重新 fetch）
      await fetchData(caseId || undefined);
    } catch (error) {
      logger.error('handleDataSubmit error', {
        error: error instanceof Error ? error.message : 'Unknown',
        caseId,
      });
      notify.error('提交失敗', error instanceof Error ? error.message : '請稍後再試');
    } finally {
      setIsSubmittingData(false);
    }
  };

  // [Team 3 修復] M4 Modal 跳過處理
  const handleDataSkip = () => {
    notify.info('已跳過資料填寫', '你可以稍後在案件頁面中補充資料。');
    setHasDismissedDataModal(true);
    setShowDataModal(false);
  };

  const lastAgentId = safeLocalStorage.getItem(UAG_LAST_AID_STORAGE_KEY);

  // --- RENDERING ---

  if (!tx && !loading && !isDemoMode) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg-page p-4 font-sans">
        <div className="w-full max-w-sm rounded-2xl bg-bg-card p-8 text-center shadow-brand-lg">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <ShieldCheck size={32} />
          </div>
          <h2 className="mb-2 text-xl font-bold text-ink-900">安心留痕</h2>
          <p className="mb-6 text-sm text-text-muted">沒有找到你的交易紀錄，想先體驗看看嗎？</p>

          <button
            type="button"
            onClick={startMockMode}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 py-3 font-bold text-white shadow-brand-sm transition hover:bg-brand-600 hover:shadow-brand-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            <Zap size={18} />
            體驗看看
          </button>
          <p className="mt-4 text-xs text-text-muted">演示模式，資料不會保存。</p>
        </div>
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-page">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 animate-spin rounded-full border-4 border-border border-t-brand-700"></div>
          <p className="text-sm text-text-muted">載入中...</p>
        </div>
      </div>
    );
  }

  const progressWidthClass = calcProgressWidthClass(tx.currentStep);

  return (
    <div className="relative mx-auto min-h-screen max-w-md bg-bg-card pb-24 font-sans text-ink-900 shadow-brand-lg">
      {/* Global Toaster is now used */}

      {/* Header */}
      <header
        className={`sticky top-0 z-overlay flex items-center justify-between p-4 text-white shadow-header transition-colors ${isDemoMode ? 'bg-brand-600' : 'bg-brand-700'}`}
      >
        <div>
          <h1 className="flex items-center gap-2 text-lg font-bold tracking-wide">
            <ShieldCheck className="size-5 text-brand-light" />
            安心留痕
            {isDemoMode && (
              <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-200">
                演示模式
              </span>
            )}
          </h1>
          <div className="flex items-center gap-2 text-xs text-white/60">
            <span>案號: {caseId}</span>
            {loading && <span className="animate-pulse">●</span>}
          </div>
          {/* 房仲資訊顯示（買方視角） */}
          {tx && role === 'buyer' && (
            <div className="mt-1 text-xs text-brand-light">
              {getAgentDisplayInfo(tx.agentName, tx.agentCompany, 'buyer').fullText}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={reset}
            aria-label="重置案件"
            className="flex size-11 items-center justify-center rounded bg-white/10 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-700"
          >
            <RotateCcw size={14} />
          </button>
          <button
            type="button"
            onClick={toggleRole}
            className={`flex min-h-[44px] items-center gap-1 rounded-md border border-white/20 px-3 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-700 ${role === 'agent' ? 'bg-brand-500' : 'bg-success'}`}
          >
            {role === 'agent' ? <Briefcase size={12} /> : <User size={12} />}
            {role === 'agent' ? '房仲' : '買方'}
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="sticky top-[60px] z-40 border-b border-border bg-bg-base p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-bold text-text-muted">進度 {tx.currentStep}/6</span>
          {tx.isPaid && (
            <span className="bg-success/10 rounded-full px-2 py-0.5 text-xs font-bold text-success">
              已履約
            </span>
          )}
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-border">
          <div
            className={`h-2 rounded-full bg-gradient-to-r from-brand-700 to-success transition-all duration-700 ${progressWidthClass}`}
          ></div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-0 p-4">
        {Object.entries(tx.steps).map(([key, step]) => {
          const stepNum = parseInt(key, 10);
          const isCurrent = stepNum === tx.currentStep;
          const isPast = stepNum < tx.currentStep;
          const isFuture = stepNum > tx.currentStep;

          return (
            <StepCard
              key={key}
              stepKey={key}
              step={step}
              isCurrent={isCurrent}
              isPast={isPast}
              isFuture={isFuture}
            >
              <StepContent
                stepKey={key}
                step={step}
                state={{
                  isCurrent,
                  role,
                  isBusy,
                  inputValue: inputBuffer,
                  timeLeft,
                  isPaid: tx.isPaid,
                  supplements: tx.supplements,
                  agentPaymentAmount: AGENT_PAYMENT_AMOUNT,
                }}
                handlers={{
                  onInputChange: setInputBuffer,
                  onSubmit: submitAgent,
                  onConfirm: confirmStep,
                  onPay: pay,
                  onToggleCheck: toggleCheck,
                }}
              />
            </StepCard>
          );
        })}

        {/* Add Supplement */}
        <div className="mt-8 rounded-xl border border-border bg-bg-card p-4 shadow-card">
          <div className="mb-2 flex items-center gap-2">
            <FilePlus className="size-4 text-text-muted" />
            <h4 className="text-xs font-bold text-text-muted">補充紀錄</h4>
          </div>
          <p className="mb-2 text-xs text-text-muted">
            有話要補充？之前送出的改不了，但可以在這裡加註。
          </p>
          <div className="flex gap-2">
            <input
              name="supplement"
              value={supplementInput}
              onChange={(e) => setSupplementInput(e.target.value)}
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              placeholder="輸入備註..."
            />
            <button
              type="button"
              onClick={addSupplement}
              disabled={!supplementInput.trim()}
              aria-label="送出補充紀錄"
              className="min-h-[44px] rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              送出
            </button>
          </div>
        </div>
      </div>

      {/* [Team 3 修復] M4 資料收集 Modal */}
      {showDataModal && (
        <DataCollectionModal
          isOpen={showDataModal}
          onSubmit={handleDataSubmit}
          onSkip={handleDataSkip}
          isSubmitting={isSubmittingData}
        />
      )}

      {/* 評價提示 Modal */}
      {showReviewPrompt && tx && caseId && lastAgentId && (
        <ReviewPromptModal
          open={showReviewPrompt}
          agentId={lastAgentId}
          agentName={tx.agentName || ''}
          trustCaseId={caseId}
          onClose={() => setShowReviewPrompt(false)}
          onSubmitted={() => {
            logger.info('Review submitted successfully from Assure Detail');
            notify.success('評價已送出！');
          }}
        />
      )}
    </div>
  );
}
