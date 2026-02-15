/**
 * TrustFlow - 安心流程管理組件 (重構後)
 *
 * [code-simplifier] 主組件精簡版，子組件已抽取
 * [react_perf_perfection] 使用 ref 追蹤初始化狀態
 * [agentic_architecture] 清晰的模組邊界
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, RefreshCw, Plus, AlertCircle } from 'lucide-react';
import styles from '../../UAG.module.css';
import { logger } from '../../../../lib/logger';
import { usePageMode } from '../../../../hooks/usePageMode';
import {
  TrustCasesApiResponseSchema,
  transformToLegacyCase,
} from '../../../../types/trust-flow.types';
import { CreateCaseModal } from '../CreateCaseModal';

// 子組件
import type { TrustCase } from './types';
import { CaseSelector } from './CaseSelector';
import { ProgressSteps } from './ProgressSteps';
import { EventTimeline } from './EventTimeline';
import { MOCK_CASES } from './mockData';

export default function TrustFlow() {
  const mode = usePageMode();
  const useMock = mode === 'demo';
  const [cases, setCases] = useState<TrustCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // [react_perf_perfection] 使用 ref 追蹤初始化狀態
  const isInitializedRef = useRef(false);

  // Handle create case success
  const handleCreateSuccess = useCallback(
    (caseId: string) => {
      setSelectedCaseId(caseId);
      setLoading(true);
      setTimeout(() => {
        if (useMock) {
          const newCase: TrustCase = {
            id: caseId,
            buyerId: caseId.slice(-4).toUpperCase(),
            buyerName: `新案件 ${caseId.slice(-4)}`,
            propertyTitle: '新建案件',
            currentStep: 1,
            status: 'active',
            lastUpdate: Date.now(),
            token: crypto.randomUUID(),
            tokenExpiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000,
            events: [
              {
                id: `${caseId}-e1`,
                step: 1,
                stepName: 'M1 接洽',
                action: '初次接洽建立',
                actor: 'agent',
                timestamp: Date.now(),
                hash: `${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`,
              },
            ],
          };
          setCases((prev) => [newCase, ...prev]);
        }
        setLoading(false);
      }, 300);
    },
    [useMock]
  );

  // Load data [Backend Safeguard] + [NASA TypeScript Safety]
  const loadCases = useCallback(async () => {
    setLoading(true);
    try {
      if (useMock) {
        await new Promise((r) => setTimeout(r, 300));
        setCases(MOCK_CASES);
        if (!isInitializedRef.current) {
          const firstCase = MOCK_CASES[0];
          if (firstCase) {
            setSelectedCaseId(firstCase.id);
          }
          isInitializedRef.current = true;
        }
      } else {
        const res = await fetch('/api/trust/cases', {
          credentials: 'include',
        });
        if (res.ok) {
          const rawData: unknown = await res.json();
          // [NASA TypeScript Safety] Zod 驗證 API 回應，取代不安全的 type assertion
          const parseResult = TrustCasesApiResponseSchema.safeParse(rawData);
          if (!parseResult.success) {
            logger.error('[TrustFlow] API response validation failed', {
              error: parseResult.error.message,
            });
            setCases([]);
            return;
          }
          const data = parseResult.data;
          if (data.success && data.data?.cases) {
            const loadedCases: TrustCase[] = data.data.cases.map((c) =>
              transformToLegacyCase(c, [])
            );
            setCases(loadedCases);
            if (!isInitializedRef.current && loadedCases.length > 0) {
              const firstLoadedCase = loadedCases[0];
              if (firstLoadedCase) {
                setSelectedCaseId(firstLoadedCase.id);
              }
              isInitializedRef.current = true;
            }
          } else {
            logger.warn('[TrustFlow] API returned non-success', { data });
            setCases([]);
          }
        } else if (res.status === 401) {
          logger.warn('[TrustFlow] Unauthorized, please login');
          setCases([]);
        } else {
          logger.error('[TrustFlow] API error', { status: res.status });
          setCases([]);
        }
      }
    } catch (e) {
      logger.error('[TrustFlow] Failed to load cases', { error: e });
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, [useMock]);

  // [react_perf_perfection] 模式切換時重置初始化狀態
  useEffect(() => {
    isInitializedRef.current = false;
    loadCases();
  }, [loadCases]);

  const selectedCase = cases.find((c) => c.id === selectedCaseId);

  return (
    <section className={`${styles['uag-card']} ${styles['k-span-3']}`}>
      {/* Header */}
      <div className={styles['uag-card-header']}>
        <div>
          <div className={styles['uag-card-title']}>安心流程管理</div>
          <div className={styles['uag-card-sub']}>
            六階段・交易留痕
            {useMock && <span className="ml-2 text-[11px] text-amber-500">● Mock</span>}
          </div>
        </div>
        <div className={styles['uag-actions']}>
          <span
            className={styles['uag-btn']}
            title={useMock ? '目前為 Demo 模式' : '目前為 Live 模式'}
            aria-label={useMock ? '目前為 Demo 模式' : '目前為 Live 模式'}
          >
            {useMock ? 'Mock' : 'Live'}
          </span>
          <button className={styles['uag-btn']} onClick={loadCases} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Case Selector */}
      <CaseSelector
        cases={cases}
        selectedCaseId={selectedCaseId}
        onSelectCase={setSelectedCaseId}
        onCreateNew={() => setIsCreateModalOpen(true)}
      />

      {/* Progress Steps */}
      {selectedCase && <ProgressSteps currentStep={selectedCase.currentStep} />}

      {/* Event Timeline */}
      {selectedCase && <EventTimeline selectedCase={selectedCase} />}

      {/* Empty State */}
      {!selectedCase && !loading && (
        <div className="text-ink-300 px-4 py-8 text-center">
          <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
          <div className="mb-2 text-[13px]">目前沒有進行中的案件</div>
          <button
            className={`${styles['uag-btn']} ${styles['primary']}`}
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={14} className="mr-1" />
            建立新案件
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-ink-300 p-6 text-center">
          <RefreshCw size={20} className="mx-auto mb-2 animate-spin" />
          <div className="text-xs">載入中...</div>
        </div>
      )}

      {/* Action Footer */}
      {selectedCase && (
        <div className="flex gap-2 border-t border-slate-200 pt-2">
          <Link
            to={`/assure?case=${selectedCase.id}`}
            className={`${styles['uag-btn']} ${styles['primary']} flex flex-1 items-center justify-center gap-1.5 text-center no-underline`}
          >
            進入 Trust Room
            <ChevronRight size={14} />
          </Link>
        </div>
      )}

      {/* Summary Stats */}
      {cases.length > 0 && (
        <div className="grid grid-cols-3 gap-2 border-t border-slate-200 pt-3">
          <div className="text-center">
            <div className="text-[20px] font-bold text-brand">{cases.length}</div>
            <div className="text-ink-300 text-[11px]">進行中案件</div>
          </div>
          <div className="text-center">
            <div className="text-[20px] font-bold text-green-600">
              {cases.filter((c) => c.currentStep >= 3).length}
            </div>
            <div className="text-ink-300 text-[11px]">已出價</div>
          </div>
          <div className="text-center">
            <div className="text-[20px] font-bold text-amber-500">
              {cases.filter((c) => c.status === 'pending').length || 0}
            </div>
            <div className="text-ink-300 text-[11px]">待處理</div>
          </div>
        </div>
      )}

      {/* Create Case Modal */}
      <CreateCaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        useMock={useMock}
        onSuccess={handleCreateSuccess}
      />
    </section>
  );
}

// 維持向後相容的 export
export { TrustFlow };
