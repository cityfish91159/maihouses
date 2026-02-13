import React, { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { notify } from '../lib/notify';
import { logger } from '../lib/logger';
import { getLoginUrl } from '../lib/authUtils';
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

interface TrustManagerProps {
  defaultCaseName?: string;
  showList?: boolean;
  linkPath?: string;
}

export default function TrustManager({
  defaultCaseName = '',
  showList = true,
  linkPath = ROUTES.TRUST,
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
      <div className="border-brand/20 mt-8 rounded-2xl border bg-bg-soft p-10 text-center font-sans">
        <h3 className="m-0 text-lg font-bold text-ink-900">請先登入</h3>
        <p className="mb-5 mt-0.5 text-sm text-ink-600">您需要登入才能管理案件</p>
        <a
          href={getLoginUrl('/maihouses/trust')}
          className="inline-block cursor-pointer rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white no-underline"
        >
          前往登入
        </a>
      </div>
    );
  }

  return (
    <div className="border-brand/20 mt-8 rounded-2xl border bg-bg-soft font-sans">
      <div className="flex items-center justify-between px-6 py-5">
        <div>
          <h3 className="m-0 text-lg font-bold text-ink-900">安心流程管理</h3>
          <p className="mb-0 mt-0.5 text-sm text-ink-600">建立專屬連結，追蹤交易進度</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`cursor-pointer rounded-xl border-none px-5 py-2.5 text-sm font-semibold text-white ${
            showForm ? 'bg-slate-500' : 'bg-brand'
          }`}
        >
          {showForm ? '取消' : '＋ 新增案件'}
        </button>
      </div>
      {showForm && (
        <div className="flex gap-3 px-6 pb-5">
          <input
            id="trust-case-name"
            name="caseName"
            type="text"
            placeholder="輸入案件名稱"
            value={newCaseName}
            onChange={(e) => setNewCaseName(e.target.value)}
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3"
          />
          <button
            onClick={createCase}
            disabled={loading}
            className="cursor-pointer rounded-xl border-none bg-green-600 px-6 py-3 font-semibold text-white"
          >
            {loading ? '...' : '建立'}
          </button>
        </div>
      )}
      {showList && (
        <div className="px-4 pb-4">
          {listLoading ? (
            <p>載入中...</p>
          ) : cases.length === 0 ? (
            <p className="text-center text-ink-600">暫無案件</p>
          ) : (
            cases.map((tx) => {
              const isExpanded = expandedId === tx.id;
              return (
                <div
                  key={tx.id}
                  className="mb-2 rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
                >
                  <div
                    className="flex cursor-pointer items-center justify-between px-4 py-3.5"
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
                    <div className="flex-1">
                      <span className="font-semibold">{tx.case_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyLink(tx);
                        }}
                        className="cursor-pointer rounded-md border-none bg-gray-100 px-2.5 py-1.5"
                      >
                        📋
                      </button>
                      <span>{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-4 pb-4">
                      {tx.steps_data
                        .slice()
                        .sort((a, b) => a.step - b.step)
                        .map((step) => (
                          <label
                            key={step.step}
                            className="flex cursor-pointer items-center gap-2.5 border-b border-gray-100 py-2.5"
                          >
                            <input
                              type="checkbox"
                              checked={step.done}
                              disabled={updatingStep === `${tx.id}-${step.step}`}
                              onChange={() => toggleStepDone(tx, step.step)}
                              className="size-[18px] cursor-pointer accent-brand"
                            />
                            <span
                              className={`flex-1 text-sm ${step.done ? 'line-through' : ''}`}
                            >
                              {STEP_NAMES[step.step]}
                            </span>
                            {step.confirmed && (
                              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] text-green-600">
                                已確認
                              </span>
                            )}
                          </label>
                        ))}
                      <div className="flex items-center justify-between pt-3">
                        <span className="text-xs text-ink-600">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => deleteCase(tx)}
                          className="cursor-pointer rounded-md border-none bg-red-100 px-4 py-1.5 text-xs text-red-500"
                        >
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
