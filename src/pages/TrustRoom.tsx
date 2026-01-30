import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { TrustRoomView, TrustStep, ConfirmResult } from '../types/trust.types';
import { STEP_ICONS_SVG, STEP_DESCRIPTIONS } from '../types/trust.types';
import { logger } from '../lib/logger';

const COLORS = {
  primary: '#1749D7',
  primaryLight: '#EBF0FF',
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  gray: '#6B7280',
  grayLight: '#F3F4F6',
  white: '#FFFFFF',
  dark: '#0A2246',
  red: '#EF4444',
};

export default function TrustRoom() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const token = searchParams.get('token');

  const [data, setData] = useState<TrustRoomView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const getDaysRemaining = (expiresAt: string): number => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
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
        setError('連結已過期或不存在，請聯繫您的房仲取得新連結');
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
    const oldData = { ...data };
    setData({
      ...data,
      steps_data: data.steps_data.map((s) => (s.step === stepNum ? { ...s, confirmed: true } : s)),
    });

    try {
      const { data: result, error: rpcError } = (await supabase.rpc('confirm_trust_step', {
        p_id: id,
        p_token: token,
        p_step: stepNum,
      })) as { data: ConfirmResult | null; error: Error | null };

      if (rpcError) throw rpcError;

      if (result?.success) {
        showMessage('success', '確認成功！');
      } else {
        setData(oldData);
        showMessage('error', result?.error || '確認失敗');
      }
    } catch (err) {
      logger.error('[TrustRoom] 確認失敗', { error: err });
      setData(oldData);
      showMessage('error', '確認失敗，請稍後再試');
    } finally {
      setConfirming(null);
    }
  };

  const { sortedSteps, progressPercent, completedCount, totalSteps } = useMemo(() => {
    if (!data || !Array.isArray(data.steps_data))
      return {
        sortedSteps: [],
        progressPercent: 0,
        completedCount: 0,
        totalSteps: 0,
      };
    const sorted = [...data.steps_data].sort((a, b) => a.step - b.step);
    const count = sorted.filter((s) => s.confirmed).length;
    const total = sorted.length;
    const percent = total > 0 ? (count / total) * 100 : 0;
    return {
      sortedSteps: sorted,
      progressPercent: percent,
      completedCount: count,
      totalSteps: total,
    };
  }, [data]);

  if (loading)
    return (
      <div
        style={{
          ...styles.container,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        載入中...
      </div>
    );
  if (error || !data)
    return (
      <div
        style={{
          ...styles.container,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'red',
        }}
      >
        {error}
      </div>
    );

  const daysRemaining = getDaysRemaining(data.token_expires_at);

  return (
    <div style={styles.container}>
      {message && (
        <div
          style={{
            ...styles.toast,
            background: message.type === 'success' ? COLORS.success : COLORS.red,
          }}
        >
          {message.text}
        </div>
      )}
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.badgeRow}>
            <span style={styles.badge}>🛡️ 安心交易</span>
            {daysRemaining <= 7 && (
              <span style={styles.warningBadge}>
                ⏰ {daysRemaining > 0 ? `${daysRemaining} 天後過期` : '即將過期'}
              </span>
            )}
          </div>
          <h1 style={styles.title}>{data.case_name}</h1>
          {data.agent_name && <p style={styles.agentInfo}>承辦人：{data.agent_name}</p>}
          <p style={styles.caseId}>案件編號：{data.id.slice(0, 8).toUpperCase()}</p>
        </div>

        <div style={styles.progressContainer}>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${progressPercent}%` }} />
          </div>
          <p style={styles.progressText}>
            已確認 {completedCount}/{totalSteps} 步驟
          </p>
        </div>

        <div style={styles.stepsContainer}>
          {sortedSteps.map((step: TrustStep) => {
            const isCurrent = step.step === data.current_step;
            const isDone = step.done;
            const canConfirm = isDone && !step.confirmed;
            return (
              <div
                key={step.step}
                style={{
                  ...styles.stepItem,
                  opacity: step.step > data.current_step ? 0.4 : 1,
                  background: isCurrent ? COLORS.primaryLight : COLORS.white,
                  border: isCurrent ? `2px solid ${COLORS.primary}` : '1px solid #eee',
                }}
              >
                <div
                  style={{
                    ...styles.stepNumber,
                    background: step.confirmed
                      ? COLORS.success
                      : isCurrent
                        ? COLORS.primary
                        : isDone
                          ? '#9CA3AF'
                          : COLORS.grayLight,
                    color: step.confirmed || isCurrent || isDone ? COLORS.white : COLORS.gray,
                  }}
                >
                  {step.confirmed ? (
                    '✓'
                  ) : STEP_ICONS_SVG[step.step] ? (
                    (() => {
                      const StepIcon = STEP_ICONS_SVG[step.step];
                      return <StepIcon className="size-4" />;
                    })()
                  ) : (
                    step.step
                  )}
                </div>

                <div style={styles.stepContent}>
                  <div style={styles.stepHeader}>
                    <span style={styles.stepName}>{step.name}</span>
                    {isCurrent && !isDone && <span style={styles.currentBadge}>進行中</span>}
                    {step.confirmed && <span style={styles.confirmedBadge}>✓ 已確認</span>}
                  </div>
                  <p style={styles.stepDesc}>{STEP_DESCRIPTIONS[step.step]}</p>
                  {step.confirmedAt && (
                    <p style={styles.confirmedTime}>
                      確認於 {new Date(step.confirmedAt).toLocaleDateString()}
                    </p>
                  )}
                  {canConfirm && (
                    <button
                      onClick={() => handleConfirm(step.step)}
                      disabled={confirming === step.step}
                      style={{
                        ...styles.confirmButton,
                        opacity: confirming === step.step ? 0.7 : 1,
                        cursor: confirming === step.step ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {confirming === step.step ? '處理中...' : '✓ 確認此步驟已完成'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #F6F9FF 0%, #EBF0FF 100%)',
    padding: '24px 16px',
    fontFamily: 'sans-serif',
  },
  toast: {
    position: 'fixed',
    top: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 24px',
    borderRadius: 8,
    color: COLORS.white,
    fontWeight: 600,
    zIndex: 1000,
  },
  card: {
    maxWidth: 480,
    margin: '0 auto',
    background: COLORS.white,
    borderRadius: 16,
    boxShadow: '0 4px 24px rgba(23, 73, 215, 0.1)',
    overflow: 'hidden',
  },
  header: {
    padding: '24px 24px 16px',
    borderBottom: `1px solid ${COLORS.grayLight}`,
  },
  badgeRow: { display: 'flex', gap: 8, marginBottom: 12 },
  badge: {
    background: COLORS.primaryLight,
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 600,
    padding: '4px 12px',
    borderRadius: 20,
  },
  warningBadge: {
    background: COLORS.warningLight,
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: 600,
    padding: '4px 12px',
    borderRadius: 20,
  },
  title: { margin: 0, fontSize: 22, fontWeight: 700, color: COLORS.dark },
  agentInfo: { margin: '8px 0 0', fontSize: 14, color: COLORS.gray },
  caseId: { margin: '4px 0 0', fontSize: 12, color: COLORS.gray },
  progressContainer: { padding: '16px 24px', background: COLORS.grayLight },
  progressBar: {
    height: 8,
    background: COLORS.white,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.success})`,
    borderRadius: 4,
    transition: 'width 0.5s ease',
  },
  progressText: {
    margin: '8px 0 0',
    fontSize: 13,
    fontWeight: 600,
    color: COLORS.gray,
    textAlign: 'center',
  },
  stepsContainer: { padding: 16 },
  stepItem: {
    display: 'flex',
    gap: 16,
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    transition: 'all 0.2s ease',
  },
  stepNumber: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: 600,
    flexShrink: 0,
  },
  stepContent: { flex: 1, minWidth: 0 },
  stepHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  stepName: { fontSize: 16, fontWeight: 700, color: COLORS.dark },
  currentBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: COLORS.primary,
    background: COLORS.white,
    padding: '2px 8px',
    borderRadius: 10,
    border: `1px solid ${COLORS.primary}`,
  },
  confirmedBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: COLORS.success,
    background: COLORS.successLight,
    padding: '2px 8px',
    borderRadius: 10,
  },
  stepDesc: {
    margin: '4px 0 0',
    fontSize: 13,
    color: COLORS.gray,
    lineHeight: 1.4,
  },
  confirmedTime: { margin: '4px 0 0', fontSize: 11, color: COLORS.gray },
  confirmButton: {
    marginTop: 12,
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    color: COLORS.white,
    background: COLORS.primary,
    border: 'none',
    borderRadius: 8,
    width: '100%',
  },
};
