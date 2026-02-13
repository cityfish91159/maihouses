/**
 * TrustManager Component
 *
 * 信任交易案件管理元件（房仲端）
 * 功能：建立案件、複製連結、管理步驟、刪除案件
 *
 * 重構說明：
 * - 狀態管理抽取至 useTrustManager hook
 * - Supabase 呼叫抽取至 trustManagerService
 * - Zod schema 移至 service 層
 */

import { getLoginUrl, getCurrentPath } from '../lib/authUtils';
import { STEP_NAMES } from '../types/trust.types';
import { ROUTES } from '../constants/routes';
import { useTrustManager } from '../hooks/useTrustManager';

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
  const {
    loading,
    listLoading,
    cases,
    showForm,
    newCaseName,
    expandedId,
    updatingStep,
    currentUserId,
    setShowForm,
    setNewCaseName,
    setExpandedId,
    handleCreateCase,
    handleCopyLink,
    handleToggleStepDone,
    handleDeleteCase,
  } = useTrustManager({ defaultCaseName, showList, linkPath });

  // ========== Guard Clause: 未登入 ==========
  if (!currentUserId && !loading) {
    return (
      <div className="border-brand/20 mt-8 rounded-2xl border bg-bg-soft p-10 text-center font-sans">
        <h3 className="m-0 text-lg font-bold text-ink-900">請先登入</h3>
        <p className="mb-5 mt-0.5 text-sm text-ink-600">您需要登入才能管理案件</p>
        <a
          href={getLoginUrl(getCurrentPath())}
          className="inline-block cursor-pointer rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white no-underline"
        >
          前往登入
        </a>
      </div>
    );
  }

  return (
    <div className="border-brand/20 mt-8 rounded-2xl border bg-bg-soft font-sans">
      {/* Header */}
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

      {/* Create Form */}
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
            onClick={handleCreateCase}
            disabled={loading}
            className="cursor-pointer rounded-xl border-none bg-green-600 px-6 py-3 font-semibold text-white"
          >
            {loading ? '...' : '建立'}
          </button>
        </div>
      )}

      {/* Case List */}
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
                  {/* Case Header */}
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
                          void handleCopyLink(tx);
                        }}
                        className="cursor-pointer rounded-md border-none bg-gray-100 px-2.5 py-1.5"
                      >
                        📋
                      </button>
                      <span>{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {/* Expanded Steps */}
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
                              onChange={() => void handleToggleStepDone(tx, step.step)}
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
                          onClick={() => void handleDeleteCase(tx)}
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
