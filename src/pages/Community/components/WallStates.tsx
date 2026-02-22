/**
 * Wall State Components
 *
 * 社區牆的各種狀態畫面：無 ID、載入中、Auth 錯誤、API 錯誤
 * 從 Wall.tsx 抽出以降低主組件行數
 */

import type { ReactNode } from 'react';
import { Compass, Loader2, Lock, Frown, RefreshCw, FlaskConical } from 'lucide-react';
import { GlobalHeader } from '../../../components/layout/GlobalHeader';
import { ROUTES } from '../../../constants/routes';
import { VersionBadge } from './VersionBadge';

// ─── 共用 Layout ─────────────────────────────────────────────────────────────

const WALL_BG = 'bg-gradient-to-b from-[var(--bg-base)] to-[var(--bg-alt)]';

interface WallStateLayoutProps {
  children: ReactNode;
  title?: string;
  centered?: boolean;
}

function WallStateLayout({ children, title, centered }: WallStateLayoutProps) {
  return (
    <div className={`min-h-screen ${WALL_BG} ${centered ? 'flex items-center justify-center' : ''}`}>
      {title !== undefined && <GlobalHeader mode="community" title={title} />}
      {children}
    </div>
  );
}

// ─── WallEmptyState（無 communityId）─────────────────────────────────────────

export function WallEmptyState() {
  return (
    <WallStateLayout centered>
      <div className="border-brand/10 rounded-2xl border bg-white px-8 py-10 text-center shadow-[0_10px_30px_var(--mh-shadow-elevated)]">
        <div className="mb-3">
          <Compass size={40} aria-hidden="true" className="mx-auto text-brand-700" />
        </div>
        <p className="mb-4 text-base font-semibold text-ink-900">找不到指定的社區牆</p>
        <p className="mb-6 text-sm text-ink-600">請確認網址是否正確，或回到首頁重新選擇社區。</p>
        <a
          href={ROUTES.HOME}
          className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-brand-600"
        >
          回到首頁
        </a>
      </div>
    </WallStateLayout>
  );
}

// ─── WallLoadingState（Auth 或 API 載入中）───────────────────────────────────

interface WallLoadingStateProps {
  skeleton: ReactNode;
}

export function WallLoadingState({ skeleton }: WallLoadingStateProps) {
  return (
    <WallStateLayout title="載入中...">
      <div className="mx-auto max-w-[960px] p-2.5">{skeleton}</div>
    </WallStateLayout>
  );
}

// ─── WallAuthErrorState ──────────────────────────────────────────────────────

interface WallAuthErrorStateProps {
  message: string;
  isReloading: boolean;
  onReload: () => void;
}

export function WallAuthErrorState({ message, isReloading, onReload }: WallAuthErrorStateProps) {
  return (
    <WallStateLayout title="登入異常">
      <div className="mx-auto max-w-[960px] p-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center shadow-sm">
          <p className="text-lg font-semibold text-red-700">登入狀態異常</p>
          <p className="mt-2 text-sm text-red-600">{message}</p>
          <button
            type="button"
            onClick={onReload}
            disabled={isReloading}
            aria-busy={isReloading}
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-700"
          >
            {isReloading ? (
              <>
                <Loader2 size={14} className="inline animate-spin" aria-hidden="true" /> 重新整理中…
              </>
            ) : (
              '重新載入'
            )}
          </button>
        </div>
      </div>
    </WallStateLayout>
  );
}

// ─── WallErrorState（API 錯誤）───────────────────────────────────────────────

interface WallErrorStateProps {
  error: Error;
  isReloading: boolean;
  onReload: () => void;
  onLogin: () => void;
  onForceEnableMock: () => void;
}

export function WallErrorState({
  error,
  isReloading,
  onReload,
  onLogin,
  onForceEnableMock,
}: WallErrorStateProps) {
  const errorMsg = error.message || '';
  const isAuthError =
    errorMsg.includes('401') || errorMsg.includes('403') || errorMsg.includes('權限');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-bg-base to-bg-soft">
      <div className="text-center">
        <div className="mb-2">
          {isAuthError ? (
            <Lock size={28} className="mx-auto text-brand-600" aria-hidden="true" />
          ) : (
            <Frown size={28} className="mx-auto text-ink-500" aria-hidden="true" />
          )}
        </div>
        <div className="mb-2 text-sm text-ink-600">
          {isAuthError ? '請先登入' : '載入失敗，請稍後再試'}
        </div>
        {isAuthError ? (
          <button
            type="button"
            onClick={onLogin}
            className="rounded-lg bg-brand px-4 py-2 text-sm text-white"
          >
            前往登入
          </button>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={onReload}
              disabled={isReloading}
              aria-busy={isReloading}
              className={`border-brand/40 hover:bg-brand/10 rounded-lg border px-4 py-2 text-sm font-semibold transition ${isReloading ? 'text-brand/60 cursor-not-allowed' : 'text-brand'}`}
            >
              {isReloading ? (
                <>
                  <Loader2 size={14} className="inline animate-spin" aria-hidden="true" />{' '}
                  重新整理中…
                </>
              ) : (
                <>
                  <RefreshCw size={14} className="inline" aria-hidden="true" /> 重新整理
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onForceEnableMock}
              className="rounded-lg bg-[var(--mh-color-1a1a2e)] px-4 py-2 text-sm font-semibold text-white shadow hover:brightness-110"
            >
              <FlaskConical size={14} className="inline" aria-hidden="true" /> 改用示範資料
            </button>
          </div>
        )}
      </div>
      <VersionBadge />
    </div>
  );
}
