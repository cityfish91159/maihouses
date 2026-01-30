import { useEffect, useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { TrustRoomView, TrustStep, ConfirmResult } from '../types/trust.types';
import { STEP_ICONS_SVG, STEP_DESCRIPTIONS, STEP_NAMES } from '../types/trust.types';
import { calcProgressWidthClass } from '../constants/progress';
import { logger } from '../lib/logger';
import { ShieldCheck, Clock, Check, Loader2, AlertTriangle } from 'lucide-react';
import { useTrustRoomMaiMai } from '../hooks/useTrustRoomMaiMai';

const LazyTrustRoomMaiMai = lazy(() => import('../components/TrustRoom/TrustRoomMaiMai'));

/** Toast 訊息顯示時間（毫秒） */
const TOAST_DURATION_MS = 3000;
/** 到期警告顯示閾值（天） */
const EXPIRY_WARNING_DAYS = 7;
/** 每天毫秒數 */
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export default function TrustRoom() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  // NOTE: URL token 可能會留在瀏覽器歷史紀錄，連結請避免外部分享
  const token = searchParams.get('token');

  const [data, setData] = useState<TrustRoomView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const {
    maiMaiState,
    triggerHappy,
    triggerCelebrate,
    triggerShyOnce,
    triggerError,
    clearError,
  } = useTrustRoomMaiMai();

  const getDaysRemaining = (expiresAt: string): number => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / MS_PER_DAY));
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), TOAST_DURATION_MS);
  };

  const loadData = useCallback(async () => {
    if (!id || !token) {
      setError('連結無效，請確認網址是否正確');
      setLoading(false);
      return;
    }

    try {
      const { data: result, error: rpcError } = await supabase.rpc('get_trust_room_by_token', {
        p_id: id,
        p_token: token,
      });

      if (rpcError) throw rpcError;
      if (!Array.isArray(result) || result.length === 0) {
        setError('連結已過期或不存在，請聯繫房仲取得新連結');
        return;
      }
      // [NASA TypeScript Safety] 使用類型守衛驗證 TrustRoomView
      const firstResult = result[0];
      if (firstResult && typeof firstResult === 'object') {
        setData(firstResult as TrustRoomView);
      }
      setError(null);
    } catch (err) {
      logger.error('[TrustRoom] 載入失敗', { error: err });
      setError('載入失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    loadData();
    if (!id) return;

    const channel = supabase
      .channel(`trust:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trust_transactions',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          if (payload.new) {
            setData((prev) =>
              prev
                ? {
                    ...prev,
                    current_step: payload.new.current_step,
                    steps_data: payload.new.steps_data,
                    status: payload.new.status,
                  }
                : null
            );
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, loadData]);

  const handleConfirm = async (stepNum: number) => {
    if (!id || !token || confirming || !data) return;
    setConfirming(stepNum);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
    const oldData = { ...data };
    const updatedSteps = data.steps_data.map((s) =>
      s.step === stepNum ? { ...s, confirmed: true } : s
    );
    const nextData = {
      ...data,
      steps_data: updatedSteps,
    };
    setData(nextData);

    try {
      const { data: result, error: rpcError } = (await supabase.rpc('confirm_trust_step', {
        p_id: id,
        p_token: token,
        p_step: stepNum,
      })) as { data: ConfirmResult | null; error: Error | null };

      if (rpcError) throw rpcError;

      if (result?.success) {
        showMessage('success', '確認成功！');
        const allConfirmed = updatedSteps.every((step) => step.confirmed);
        if (allConfirmed) {
          triggerCelebrate();
        } else {
          triggerHappy();
        }
      } else {
        setData(oldData);
        showMessage('error', result?.error || '確認失敗');
        triggerShyOnce();
      }
    } catch (err) {
      logger.error('[TrustRoom] 確認失敗', { error: err });
      setData(oldData);
      showMessage('error', '確認失敗，請稍後再試');
      triggerShyOnce();
    } finally {
      setConfirming(null);
    }
  };

  const { sortedSteps, completedCount, totalSteps, progressWidthClass } = useMemo(() => {
    if (!data || !Array.isArray(data.steps_data))
      return {
        sortedSteps: [],
        completedCount: 0,
        totalSteps: 0,
        progressWidthClass: calcProgressWidthClass(0),
      };
    const sorted = [...data.steps_data].sort((a, b) => a.step - b.step);
    const count = sorted.filter((s) => s.confirmed).length;
    const total = sorted.length;
    return {
      sortedSteps: sorted,
      completedCount: count,
      totalSteps: total,
      progressWidthClass: calcProgressWidthClass(count, total),
    };
  }, [data]);

  useEffect(() => {
    if (error) {
      triggerError();
    } else {
      clearError();
    }
  }, [error, triggerError, clearError]);

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-bg-base to-brand-50 p-6 font-sans dark:from-slate-950 dark:to-slate-900">
        <div className="w-full max-w-md space-y-4 rounded-2xl bg-bg-card p-6 shadow-brand-lg">
          <div className="mh-shimmer h-5 w-1/2 rounded-full" />
          <div className="mh-shimmer h-4 w-2/3 rounded-full" />
          <div className="mh-shimmer h-2 w-full rounded-full" />
          <div className="space-y-3">
            <div className="mh-shimmer h-20 rounded-xl" />
            <div className="mh-shimmer h-20 rounded-xl" />
          </div>
        </div>
      </div>
    );
  if (error || !data)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-bg-base to-brand-50 p-6 font-sans dark:from-slate-950 dark:to-slate-900">
        <div className="border-danger/20 dark:border-danger/40 w-full max-w-md rounded-2xl border bg-bg-card p-6 text-center shadow-brand-lg dark:bg-slate-900">
          <div className="bg-danger/10 mx-auto mb-4 flex size-12 items-center justify-center rounded-full text-danger">
            <AlertTriangle className="size-6" />
          </div>
          <p className="text-sm font-semibold text-danger">{error}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError(null);
              void loadData();
            }}
            className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            重試載入
          </button>
        </div>
      </div>
    );

  const daysRemaining = getDaysRemaining(data.token_expires_at);

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-base to-brand-50 px-[calc(1rem+env(safe-area-inset-left))] pb-[calc(1rem+env(safe-area-inset-bottom))] pr-[calc(1rem+env(safe-area-inset-right))] pt-4 font-sans sm:p-6 dark:from-slate-950 dark:to-slate-900">
      {/* Toast 訊息 */}
      {message && (
        <div
          role="alert"
          aria-live="polite"
          className={`fixed inset-x-4 top-[calc(1rem+env(safe-area-inset-top))] z-modal rounded-lg px-4 py-3 text-center font-medium text-white shadow-brand-md sm:left-1/2 sm:right-auto sm:top-5 sm:-translate-x-1/2 sm:px-6 sm:text-left sm:font-semibold ${
            message.type === 'success' ? 'bg-success' : 'bg-danger'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 主卡片 */}
      <div className="mx-auto max-w-md overflow-hidden rounded-2xl bg-white shadow-brand-lg dark:bg-slate-900">
        {/* Header */}
        <div className="border-b border-border px-4 pb-4 pt-6 sm:px-6">
          <div className="mb-3 flex flex-nowrap items-center gap-2 overflow-x-auto pr-2">
            <span className="dark:border-brand-400/40 dark:bg-brand-900/30 dark:text-brand-200 inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              <ShieldCheck className="size-3.5" />
              交易紀錄
            </span>
            {daysRemaining <= EXPIRY_WARNING_DAYS && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:border-amber-400/40 dark:bg-amber-900/20 dark:text-amber-200">
                <Clock className="size-3" />
                {daysRemaining > 0 ? `${daysRemaining} 天後到期` : '即將過期'}
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-ink-900 dark:text-slate-100">{data.case_name}</h1>
          {data.agent_name && (
            <p className="mt-2 text-sm text-text-muted dark:text-slate-400">
              承辦人：{data.agent_name}
            </p>
          )}
          <p className="mt-1 max-w-[200px] truncate text-xs text-text-muted sm:max-w-none dark:text-slate-400">
            案件編號：{data.id.slice(0, 8).toUpperCase()}
          </p>
        </div>

        {/* 進度條 */}
        <div className="bg-bg-base p-4 sm:px-6 dark:bg-slate-900">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-border">
            <div
              className={`h-full rounded-full bg-gradient-to-r from-brand-700 to-success transition-all duration-500 ${progressWidthClass}`}
            />
          </div>
          <p className="mt-2 text-center text-sm font-semibold text-text-muted dark:text-slate-400">
            已確認 {completedCount}/{totalSteps} 步驟
          </p>
        </div>

        {/* 步驟列表 */}
        <div className="space-y-4 p-4">
          {sortedSteps.map((step: TrustStep) => {
            const isCurrent = step.step === data.current_step;
            const isDone = step.done;
            const isConfirmingStep = confirming === step.step;
            const canConfirm = isConfirmingStep || (isDone && !step.confirmed);
            const isFuture = step.step > data.current_step;
            const renderStepIcon = () => {
              if (step.confirmed) return <Check className="size-5" />;
              const StepIcon = STEP_ICONS_SVG[step.step];
              if (StepIcon) return <StepIcon className="size-5" />;
              return <span className="text-sm font-semibold">{step.step}</span>;
            };

            return (
              <div
                key={step.step}
                className={`flex gap-4 rounded-xl p-4 transition-all ${
                  isFuture ? 'opacity-40' : 'opacity-100'
                } ${
                  isCurrent
                    ? 'bg-brand-50/50 dark:bg-brand-900/25 dark:border-brand-400 border-2 border-brand-500'
                    : 'border border-border bg-white dark:bg-slate-900'
                }`}
              >
                {/* 步驟圖示 */}
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-full text-lg font-semibold sm:size-11 ${
                    step.confirmed
                      ? 'bg-success text-white'
                      : isCurrent
                        ? 'bg-brand-700 text-white'
                      : isDone
                        ? 'bg-brand-200 dark:bg-brand-900/40 dark:text-brand-200 text-brand-700'
                        : 'bg-bg-base text-text-muted dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {renderStepIcon()}
                </div>

                {/* 步驟內容 */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-ink-900 sm:text-base dark:text-slate-100">
                      {STEP_NAMES[step.step] ?? step.name}
                    </span>
                    {isCurrent && !isDone && (
                      <span className="dark:border-brand-400/60 dark:text-brand-200 rounded-full border border-brand-500 bg-white px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-slate-900/60">
                        進行中
                      </span>
                    )}
                    {step.confirmed && (
                      <span className="bg-success/10 dark:bg-success/20 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-success">
                        <Check className="size-3" />
                        已確認
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-text-muted dark:text-slate-400">
                    {STEP_DESCRIPTIONS[step.step]}
                  </p>
                  {step.confirmedAt && (
                    <p className="mt-1 text-xs text-text-muted dark:text-slate-400">
                      確認於 {new Date(step.confirmedAt).toLocaleDateString()}
                    </p>
                  )}
                  {canConfirm && (
                    <button
                      onClick={() => handleConfirm(step.step)}
                      disabled={isConfirmingStep}
                      aria-busy={isConfirmingStep}
                      className={`mt-3 inline-flex min-h-[48px] w-full items-center justify-center gap-1.5 rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white shadow-brand-sm transition-all hover:bg-brand-600 hover:shadow-brand-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 ${
                        isConfirmingStep ? 'ring-1 ring-brand-100' : ''
                      }`}
                    >
                      {isConfirmingStep ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          處理中...
                        </>
                      ) : (
                        <>
                          <Check className="size-4" />
                          確認此步驟已完成
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {maiMaiState.visible && (
        <div className="pointer-events-none fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-[calc(1.5rem+env(safe-area-inset-right))] z-50 sm:bottom-[calc(1rem+env(safe-area-inset-bottom))] sm:right-[calc(1rem+env(safe-area-inset-right))]">
          <Suspense fallback={null}>
            <LazyTrustRoomMaiMai
              mood={maiMaiState.mood}
              showConfetti={maiMaiState.showConfetti}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}
