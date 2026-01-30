import React, { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { notify } from '../lib/notify';
import { logger } from '../lib/logger';
import type { TrustTransaction, TrustStep } from '../types/trust.types';
import { STEP_NAMES } from '../types/trust.types';
import { ROUTES } from '../constants/routes';

// [NASA TypeScript Safety] Zod schema 用於驗證外部資料
// 注意：使用 transform 來處理 optional 欄位，確保類型與 TrustStep 介面相容
const TrustStepSchema = z
  .object({
    step: z.number(),
    name: z.string(),
    done: z.boolean(),
    confirmed: z.boolean(),
    date: z.string().nullable(),
    note: z.string(),
    confirmedAt: z.string().optional(),
  })
  .transform(
    (data): TrustStep => ({
      step: data.step,
      name: data.name,
      done: data.done,
      confirmed: data.confirmed,
      date: data.date,
      note: data.note,
      ...(data.confirmedAt !== undefined && { confirmedAt: data.confirmedAt }),
    })
  );

const TrustTransactionSchema = z
  .object({
    id: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
    case_name: z.string(),
    agent_id: z.string(),
    agent_name: z.string().nullable(),
    guest_token: z.string(),
    token_expires_at: z.string(),
    current_step: z.number(),
    steps_data: z.array(TrustStepSchema),
    status: z.enum(['active', 'completed', 'cancelled']),
  })
  .transform((data): TrustTransaction => data);

const TrustTransactionArraySchema = z.array(TrustTransactionSchema);

const COLORS = {
  primary: '#1749D7',
  primaryLight: '#EBF0FF',
  success: '#10B981',
  successLight: '#D1FAE5',
  gray: '#6B7280',
  grayLight: '#F3F4F6',
  white: '#FFFFFF',
  dark: '#0A2246',
  red: '#EF4444',
  redLight: '#FEE2E2',
};

interface TrustManagerProps {
  defaultCaseName?: string;
  showList?: boolean;
  linkPath?: string;
  style?: React.CSSProperties;
}

export default function TrustManager({
  defaultCaseName = '',
  showList = true,
  linkPath = ROUTES.TRUST,
  style,
}: TrustManagerProps) {
  const [loading, setLoading] = useState(false);
  const [cases, setCases] = useState<TrustTransaction[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newCaseName, setNewCaseName] = useState(defaultCaseName);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingStep, setUpdatingStep] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const loadCases = useCallback(async (agentId: string) => {
    try {
      const { data, error } = await supabase
        .from('trust_transactions')
        .select('*')
        .eq('agent_id', agentId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // [NASA TypeScript Safety] 使用 Zod safeParse 驗證外部資料
      const parseResult = TrustTransactionArraySchema.safeParse(data || []);
      if (!parseResult.success) {
        logger.error('Load cases data validation failed', {
          error: parseResult.error,
        });
        setCases([]);
        return;
      }
      setCases(parseResult.data);
    } catch (err) {
      logger.error('Load cases failed', { error: err });
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id);
        if (showList) loadCases(user.id);
      } else {
        setListLoading(false);
      }
    });
  }, [showList, loadCases]);

  const createCase = async () => {
    if (!newCaseName.trim() || !currentUserId) return notify.error('請輸入名稱或登入');
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', currentUserId)
        .single();

      const { data, error } = await supabase
        .from('trust_transactions')
        .insert({
          case_name: newCaseName.trim(),
          agent_id: currentUserId,
          agent_name: profile?.full_name || user?.email?.split('@')[0] || '房仲',
        })
        .select()
        .single();

      if (error) throw error;

      // [NASA TypeScript Safety] 使用 Zod safeParse 驗證新建立的案件資料
      const parseResult = TrustTransactionSchema.safeParse(data);
      if (!parseResult.success) {
        logger.error('Create case data validation failed', {
          error: parseResult.error,
        });
        notify.error('資料驗證失敗', '建立的案件資料格式不正確');
        return;
      }
      await copyLink(parseResult.data);
      setNewCaseName('');
      setShowForm(false);
      await loadCases(currentUserId);
    } catch (err) {
      notify.error('建立失敗', err instanceof Error ? err.message : '未知錯誤');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async (tx: TrustTransaction) => {
    const origin = import.meta.env.VITE_APP_URL || window.location.origin;
    const link = `${origin}${linkPath}?id=${tx.id}&token=${tx.guest_token}`;
    try {
      await navigator.clipboard.writeText(link);
      notify.success('連結已複製', '已複製案件分享連結');
    } catch {
      prompt('請手動複製:', link);
    }
  };

  const updateStep = async (tx: TrustTransaction, newStep: number) => {
    if (!currentUserId) return;
    setUpdatingStep(`${tx.id}-${newStep}`);
    try {
      const newStepsData: TrustStep[] = JSON.parse(JSON.stringify(tx.steps_data));
      newStepsData.forEach((s) => {
        if (s.step < newStep) {
          if (!s.done) {
            s.done = true;
            s.date = new Date().toISOString();
          }
        } else {
          s.done = false;
          s.date = null;
        }
      });
      const allDone = newStepsData.every((s) => s.done && s.confirmed);
      const { error } = await supabase
        .from('trust_transactions')
        .update({
          current_step: newStep,
          steps_data: newStepsData,
          status: allDone ? 'completed' : 'active',
        })
        .eq('id', tx.id);
      if (error) throw error;
      await loadCases(currentUserId);
    } catch (err) {
      notify.error('更新失敗');
    } finally {
      setUpdatingStep(null);
    }
  };

  const toggleStepDone = async (tx: TrustTransaction, stepNum: number) => {
    if (!currentUserId) return;
    setUpdatingStep(`${tx.id}-${stepNum}`);
    try {
      const newStepsData: TrustStep[] = JSON.parse(JSON.stringify(tx.steps_data));
      const idx = newStepsData.findIndex((s) => s.step === stepNum);
      if (idx === -1) return;

      const step = newStepsData[idx];
      if (!step) return;

      step.done = !step.done;
      step.date = step.done ? new Date().toISOString() : null;

      let newCurrent = 1;
      for (let i = 0; i < newStepsData.length; i++) {
        const s = newStepsData[i];
        if (s && s.done) {
          newCurrent = s.step + 1;
        } else {
          break;
        }
      }
      if (newCurrent > 6) newCurrent = 6;

      const { error } = await supabase
        .from('trust_transactions')
        .update({
          steps_data: newStepsData,
          current_step: newCurrent,
        })
        .eq('id', tx.id);
      if (error) throw error;
      await loadCases(currentUserId);
    } catch {
      notify.error('更新失敗');
    } finally {
      setUpdatingStep(null);
    }
  };

  const deleteCase = async (tx: TrustTransaction) => {
    if (!confirm(`刪除「${tx.case_name}」？`) || !currentUserId) return;
    try {
      await supabase.from('trust_transactions').update({ status: 'cancelled' }).eq('id', tx.id);
      loadCases(currentUserId);
    } catch {
      notify.error('刪除失敗');
    }
  };

  if (!currentUserId && !loading) {
    return (
      <div
        style={{
          ...styles.container,
          ...style,
          textAlign: 'center',
          padding: '40px 20px',
        }}
      >
        <h3 style={styles.title}>請先登入</h3>
        <p style={{ ...styles.subtitle, marginBottom: 20 }}>您需要登入才能管理案件</p>
        <a
          href="/maihouses/auth.html?mode=login"
          style={{
            ...styles.createButton,
            background: COLORS.primary,
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          前往登入
        </a>
      </div>
    );
  }

  return (
    <div style={{ ...styles.container, ...style }}>
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>安心流程管理</h3>
          <p style={styles.subtitle}>建立專屬連結，追蹤交易進度</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            ...styles.createButton,
            background: showForm ? COLORS.gray : COLORS.primary,
          }}
        >
          {showForm ? '取消' : '＋ 新增案件'}
        </button>
      </div>
      {showForm && (
        <div style={styles.formContainer}>
          <input
            id="trust-case-name"
            name="caseName"
            type="text"
            placeholder="輸入案件名稱"
            value={newCaseName}
            onChange={(e) => setNewCaseName(e.target.value)}
            style={styles.input}
          />
          <button onClick={createCase} disabled={loading} style={styles.submitButton}>
            {loading ? '...' : '建立'}
          </button>
        </div>
      )}
      {showList && (
        <div style={styles.listContainer}>
          {listLoading ? (
            <p>載入中...</p>
          ) : cases.length === 0 ? (
            <p style={styles.emptyText}>暫無案件</p>
          ) : (
            cases.map((tx) => {
              const isExpanded = expandedId === tx.id;
              return (
                <div key={tx.id} style={styles.caseItem}>
                  <div
                    style={styles.caseHeader}
                    role="button"
                    tabIndex={0}
                    onClick={() => setExpandedId(isExpanded ? null : tx.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setExpandedId(isExpanded ? null : tx.id);
                      }
                    }}
                  >
                    <div style={styles.caseInfo}>
                      <span style={styles.caseName}>{tx.case_name}</span>
                    </div>
                    <div style={styles.caseActions}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyLink(tx);
                        }}
                        style={styles.iconButton}
                      >
                        📋
                      </button>
                      <span>{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>
                  {isExpanded && (
                    <div style={styles.caseContent}>
                      {tx.steps_data
                        .slice()
                        .sort((a, b) => a.step - b.step)
                        .map((step) => (
                          <label key={step.step} style={styles.stepRow}>
                            <input
                              type="checkbox"
                              checked={step.done}
                              disabled={updatingStep === `${tx.id}-${step.step}`}
                              onChange={() => toggleStepDone(tx, step.step)}
                              style={styles.checkbox}
                            />
                            <span
                              style={{
                                ...styles.stepText,
                                textDecoration: step.done ? 'line-through' : 'none',
                              }}
                            >
                              {STEP_NAMES[step.step]}
                            </span>
                            {step.confirmed && <span style={styles.confirmedTag}>已確認</span>}
                          </label>
                        ))}
                      <div style={styles.caseFooter}>
                        <span style={styles.caseDate}>
                          {new Date(tx.created_at).toLocaleDateString()}
                        </span>
                        <button onClick={() => deleteCase(tx)} style={styles.deleteButton}>
                          刪除
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: COLORS.primaryLight,
    border: `1px solid ${COLORS.primary}20`,
    borderRadius: 16,
    marginTop: 32,
    fontFamily: 'sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
  },
  title: { margin: 0, fontSize: 18, fontWeight: 700, color: COLORS.dark },
  subtitle: { margin: '2px 0 0', fontSize: 13, color: COLORS.gray },
  createButton: {
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    color: COLORS.white,
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
  },
  formContainer: { padding: '0 24px 20px', display: 'flex', gap: 12 },
  input: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: 10,
    border: `1px solid ${COLORS.grayLight}`,
  },
  submitButton: {
    padding: '12px 24px',
    fontWeight: 600,
    color: COLORS.white,
    background: COLORS.success,
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
  },
  listContainer: { padding: '0 16px 16px' },
  emptyText: { color: COLORS.gray, textAlign: 'center' },
  caseItem: {
    background: COLORS.white,
    borderRadius: 12,
    marginBottom: 8,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  caseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '14px 16px',
    cursor: 'pointer',
    alignItems: 'center',
  },
  caseInfo: { flex: 1 },
  caseName: { fontWeight: 600 },
  caseActions: { display: 'flex', gap: 8, alignItems: 'center' },
  iconButton: {
    padding: '6px 10px',
    background: COLORS.grayLight,
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  caseContent: {
    padding: '0 16px 16px',
    borderTop: `1px solid ${COLORS.grayLight}`,
  },
  stepRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 0',
    borderBottom: `1px solid ${COLORS.grayLight}`,
    cursor: 'pointer',
  },
  checkbox: {
    width: 18,
    height: 18,
    cursor: 'pointer',
    accentColor: COLORS.primary,
  },
  stepText: { flex: 1, fontSize: 14 },
  confirmedTag: {
    fontSize: 11,
    color: COLORS.success,
    background: COLORS.successLight,
    padding: '2px 8px',
    borderRadius: 10,
  },
  caseFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: 12,
    alignItems: 'center',
  },
  caseDate: { fontSize: 12, color: COLORS.gray },
  deleteButton: {
    padding: '6px 16px',
    fontSize: 12,
    color: COLORS.red,
    background: COLORS.redLight,
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
};
