/**
 * Community Wall Page
 *
 * 社區牆主頁面
 * 重構版 - 統一資料來源、組件化、React Query、a11y 優化
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import { useParams, useSearchParams } from 'react-router-dom';

import { GlobalHeader } from '../../components/layout/GlobalHeader';

// Components
import {
  ReviewsSection,
  PostsSection,
  QASection,
  Sidebar,
  RoleSwitcher,
  BottomCTA,
  WallSkeleton,
  WallErrorBoundary,
  VersionBadge,
} from './components';
import { notify } from '../../lib/notify';
import { MockToggle } from '../../components/common/MockToggle';
import { mhEnv } from '../../lib/mhEnv';
import { safeLocalStorage } from '../../lib/safeStorage';
import { logger } from '../../lib/logger';
import { getCurrentPath, navigateToAuth } from '../../lib/authUtils';

// Types
import type { Role, WallTab } from './types';
import { getPermissions } from './types';
import { canPerformAction } from './lib';

// Hooks - 統一資料來源
import { useCommunityWallData } from '../../hooks/useCommunityWallData';
import { useAuth } from '../../hooks/useAuth';
import { useModeAwareAction } from '../../hooks/useModeAwareAction';
import { usePageModeWithAuthState, type PageMode } from '../../hooks/usePageMode';
import { useEffectiveRole } from '../../hooks/useEffectiveRole';
import { ROUTES } from '../../constants/routes';
import {
  COMMUNITY_WALL_ROLE_PARAM,
  COMMUNITY_WALL_ROLE_STORAGE_KEY,
  parseWallRoleParam,
  resolveInitialWallRole,
} from './lib/roleState';

// ============ URL / Storage Helpers ============
const rawMockFlag = `${import.meta.env.VITE_COMMUNITY_WALL_ALLOW_MOCK ?? ''}`.trim().toLowerCase();
const GLOBAL_MOCK_TOGGLE_ENABLED = rawMockFlag !== 'false';

function getMetadataString(metadata: unknown, key: 'name' | 'full_name'): string | null {
  if (typeof metadata !== 'object' || metadata === null) {
    return null;
  }

  if (!Object.prototype.hasOwnProperty.call(metadata, key)) {
    return null;
  }

  const candidate = Reflect.get(metadata, key);
  if (typeof candidate !== 'string') {
    return null;
  }

  const normalized = candidate.trim();
  return normalized.length > 0 ? normalized : null;
}

const updateURLParam = (params: URLSearchParams, key: string, value: string | null) => {
  const next = new URLSearchParams(params);
  if (!value) {
    next.delete(key);
  } else {
    next.set(key, value);
  }
  return next;
};

function getUserDisplayName(user: User | null): string | undefined {
  if (!user) return undefined;

  const metadata = user.user_metadata;
  const name = getMetadataString(metadata, 'name');
  if (name) return name;

  const fullName = getMetadataString(metadata, 'full_name');
  if (fullName) return fullName;

  return user.email ?? undefined;
}

interface UseDemoModeMockSyncOptions {
  mode: PageMode;
  useMock: boolean;
  setUseMock: (value: boolean) => void;
}

/**
 * #8a (.claude/tickets/MOCK-SYSTEM.md):
 * demo mode forces mock data to avoid accidental API calls.
 */
function useDemoModeMockSync({ mode, useMock, setUseMock }: UseDemoModeMockSyncOptions): void {
  useEffect(() => {
    const forcedUseMock = mode === 'demo' ? true : import.meta.env.DEV ? null : false;
    if (forcedUseMock === null || forcedUseMock === useMock) {
      return;
    }

    setUseMock(forcedUseMock);
  }, [mode, setUseMock, useMock]);
}

// ============ Inner Component (Wrapped by ErrorBoundary) ============
function WallInner() {
  const params = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const communityId = params.id;
  const searchParamsRef = useRef(searchParams);

  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  // 初始化 role：僅開發環境從 URL/localStorage 讀取
  const initialRole = useMemo<Role>(() => {
    // Read initial value on mount only; later URL sync is handled by the effect below.
    return resolveInitialWallRole({
      isDev: import.meta.env.DEV,
      urlRoleParam: searchParamsRef.current.get(COMMUNITY_WALL_ROLE_PARAM),
      storedRole: safeLocalStorage.getItem(COMMUNITY_WALL_ROLE_STORAGE_KEY),
    });
  }, []); // Empty deps: mount-only initialization.

  const [role, setRoleInternal] = useState<Role>(initialRole);
  const [currentTab, setCurrentTab] = useState<WallTab>('public');
  const [isReloading, setIsReloading] = useState(false);

  // B1/B4/B5: 統一 auth 狀態，單一來源
  const {
    isAuthenticated,
    role: authRole,
    loading: authLoading,
    error: authError,
    user,
  } = useAuth();
  const mode = usePageModeWithAuthState(isAuthenticated);

  // 取得 currentUserId 和 userInitial 供留言系統使用
  const currentUserId = user?.id;
  const userName = getUserDisplayName(user);
  const userInitial =
    typeof userName === 'string' && userName.length > 0 ? userName.charAt(0).toUpperCase() : 'U';

  // B4: 統一計算 effectiveRole，子組件不再自行計算
  const effectiveRole = useEffectiveRole({
    mode,
    authLoading,
    isAuthenticated,
    authRole,
    devRole: role,
  });

  const perm = useMemo(() => getPermissions(effectiveRole), [effectiveRole]);
  const allowManualMockToggle = GLOBAL_MOCK_TOGGLE_ENABLED;

  // AUDIT-01 Phase 7: 使用統一權限檢查函數
  // 統一資料來源 Hook - 必須在所有條件渲染之前呼叫
  const {
    data,
    useMock,
    setUseMock,
    isLoading,
    error,
    refresh,
    toggleLike,
    createPost,
    askQuestion,
    answerQuestion,
    viewerRole,
  } = useCommunityWallData(communityId ?? '', {
    includePrivate: canPerformAction(perm, 'view_private'),
  });

  useDemoModeMockSync({ mode, useMock, setUseMock }); // demo mode enforces mock

  const canToggleMock = allowManualMockToggle || useMock;
  const allowManualRoleSwitch = import.meta.env.DEV || useMock;
  const mockToggleDisabled = mode === 'demo' || !canToggleMock;

  // 提前處理 auth 錯誤 toast
  useEffect(() => {
    if (authError) {
      notify.error('登入狀態異常', authError.message);
    }
  }, [authError]);

  // 生產環境依後端角色自動對齊權限
  useEffect(() => {
    if (import.meta.env.DEV || useMock) return;
    if (viewerRole && viewerRole !== role) {
      setRoleInternal(viewerRole);
    }
  }, [viewerRole, role, useMock]);

  const forceEnableMock = useCallback(() => {
    const next = mhEnv.setMock(true);
    setUseMock(next);
  }, [setUseMock]);

  // 包裝 setRole，同步 URL 和 localStorage（僅開發環境）
  const setRole = useCallback(
    (newRole: Role) => {
      if (!allowManualRoleSwitch) return;
      setRoleInternal(newRole);

      if (!import.meta.env.DEV) {
        return;
      }

      const nextParams = updateURLParam(searchParamsRef.current, COMMUNITY_WALL_ROLE_PARAM, newRole);
      setSearchParams(nextParams, { replace: true });
      safeLocalStorage.setItem(COMMUNITY_WALL_ROLE_STORAGE_KEY, newRole);
    },
    [allowManualRoleSwitch, setSearchParams]
  );

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const urlRole = parseWallRoleParam(searchParams.get(COMMUNITY_WALL_ROLE_PARAM));
    if (urlRole && urlRole !== role) {
      setRoleInternal(urlRole);
    }
  }, [role, searchParams, setRoleInternal]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStorage = (event: StorageEvent) => {
      // safeLocalStorage uses standard localStorage so this event still fires.
      // However, reading from event.newValue is safe (it's a string or null).
      // We just need to check if we can trust it.
      // In private mode, this event might not fire or might be weird, but reading event properties is safe.
      if (event.key === COMMUNITY_WALL_ROLE_STORAGE_KEY && import.meta.env.DEV) {
        const parsedRole = parseWallRoleParam(event.newValue);
        if (parsedRole && parsedRole !== role) {
          setRoleInternal(parsedRole);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [role, setRoleInternal]);

  const handleLogin = useCallback(() => {
    navigateToAuth('login');
  }, []);

  // Tab 切換
  const handleTabChange = useCallback(
    (tab: WallTab) => {
      if (tab === 'private' && !canPerformAction(perm, 'view_private')) {
        return;
      }
      setCurrentTab(tab);
    },
    [perm]
  );

  // 如果身份變更導致無法存取私密牆，切回公開牆
  useEffect(() => {
    if (currentTab === 'private' && !canPerformAction(perm, 'view_private')) {
      setCurrentTab('public');
    }
  }, [currentTab, perm]);

  const showRegisterGuide = useCallback((title: string, description: string) => {
    notify.info(title, description, {
      action: {
        label: '免費註冊',
        onClick: () => navigateToAuth('signup', getCurrentPath()),
      },
    });
  }, []);

  const showLikeRegisterGuide = useCallback(
    (_postId: number | string) => {
      showRegisterGuide('註冊後即可鼓勵評價', '免費註冊即可鼓勵評價與參與討論');
    },
    [showRegisterGuide]
  );

  // #8a: 按讚改用 useModeAwareAction（visitor/demo/live 分流）
  const dispatchToggleLike = useModeAwareAction<number | string>({
    visitor: showLikeRegisterGuide,
    demo: toggleLike,
    live: toggleLike,
  });

  const handleLike = useCallback(
    (postId: number | string) => {
      void dispatchToggleLike(postId).then((result) => {
        if (!result.ok) {
          logger.error('[Wall] Failed to toggle like', {
            postId,
            error: result.error,
          });
          notify.error('按讚失敗', result.error);
        }
      });
    },
    [dispatchToggleLike]
  );

  const handleUnlock = useCallback(
    (id?: string) => {
      logger.debug('[Wall] Unlock post', { id });
      showRegisterGuide('註冊後即可解鎖完整社區牆', '免費註冊即可查看完整評價與互動');
    },
    [showRegisterGuide]
  );

  // 發文處理
  const handleCreatePost = useCallback(
    async (content: string, visibility: 'public' | 'private' = 'public') => {
      try {
        await createPost(content, visibility);
      } catch (err) {
        logger.error('[Wall] Failed to create post', { error: err });
        notify.error('發文失敗', '請稍後再試');
      }
    },
    [createPost]
  );

  const handleAskQuestion = useCallback(
    async (question: string) => {
      try {
        await askQuestion(question);
      } catch (err) {
        logger.error('[Wall] Failed to submit question', { error: err });
        notify.error('提問失敗', '請稍後再試');
        throw err;
      }
    },
    [askQuestion]
  );

  const handleAnswerQuestion = useCallback(
    async (questionId: string, content: string) => {
      try {
        await answerQuestion(questionId, content);
      } catch (err) {
        logger.error('[Wall] Failed to submit answer', { error: err });
        notify.error('回答失敗', '請稍後再試');
        throw err;
      }
    },
    [answerQuestion]
  );

  const handleReload = useCallback(async () => {
    if (isReloading) return;
    setIsReloading(true);
    try {
      await refresh();
    } catch (err) {
      logger.error('[Wall] Failed to refresh community wall', { error: err });
    } finally {
      setIsReloading(false);
    }
  }, [isReloading, refresh]);

  // ============ 條件渲染區（所有 Hooks 已在上方宣告完畢）============

  // 無 communityId
  if (!communityId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[var(--bg-base)] to-[var(--bg-alt)]">
        <div className="border-brand/10 rounded-2xl border bg-white px-8 py-10 text-center shadow-[0_10px_30px_rgba(0,34,73,0.08)]">
          <div className="mb-3 text-4xl">🧭</div>
          <p className="mb-4 text-base font-semibold text-ink-900">找不到指定的社區牆</p>
          <p className="mb-6 text-sm text-ink-600">請確認網址是否正確，或回到首頁重新選擇社區。</p>
          <a
            href={ROUTES.HOME}
            className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-brand-600"
          >
            回到首頁
          </a>
        </div>
      </div>
    );
  }

  // Auth 載入中
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--bg-base)] to-[var(--bg-alt)]">
        <GlobalHeader mode="community" title="載入中..." />
        <div className="mx-auto max-w-[960px] p-2.5">
          <WallSkeleton />
        </div>
      </div>
    );
  }

  // Auth 錯誤
  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--bg-base)] to-[var(--bg-alt)]">
        <GlobalHeader mode="community" title="登入異常" />
        <div className="mx-auto max-w-[960px] p-4">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center shadow-sm">
            <p className="text-lg font-semibold text-red-700">登入狀態異常</p>
            <p className="mt-2 text-sm text-red-600">{authError.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-700"
            >
              重新載入
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading 狀態（僅 API 模式）
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--bg-base)] to-[var(--bg-alt)]">
        <GlobalHeader mode="community" title="載入中..." />
        <div className="mx-auto max-w-[960px] p-2.5">
          <WallSkeleton />
        </div>
      </div>
    );
  }

  // Error 狀態（僅 API 模式）
  if (error) {
    const errorMsg = error.message || '';
    const isAuthError =
      errorMsg.includes('401') || errorMsg.includes('403') || errorMsg.includes('權限');

    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-bg-base to-bg-soft">
        <div className="text-center">
          <div className="mb-2 text-2xl">{isAuthError ? '🔐' : '😢'}</div>
          <div className="mb-2 text-sm text-ink-600">
            {isAuthError ? '請先登入' : '載入失敗，請稍後再試'}
          </div>
          {isAuthError ? (
            <button
              onClick={handleLogin}
              className="rounded-lg bg-brand px-4 py-2 text-sm text-white"
            >
              前往登入
            </button>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                onClick={handleReload}
                disabled={isReloading}
                aria-busy={isReloading}
                className={`border-brand/40 hover:bg-brand/10 rounded-lg border px-4 py-2 text-sm font-semibold transition ${isReloading ? 'text-brand/60 cursor-not-allowed' : 'text-brand'}`}
              >
                {isReloading ? '⏳ 重新整理中…' : '🔄 重新整理'}
              </button>
              <button
                onClick={forceEnableMock}
                className="rounded-lg bg-[#1a1a2e] px-4 py-2 text-sm font-semibold text-white shadow hover:brightness-110"
              >
                🧪 改用示範資料
              </button>
            </div>
          )}
        </div>
        <VersionBadge />
      </div>
    );
  }

  // 從統一資料來源取得資料
  const { communityInfo, posts, reviews, questions } = data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--bg-base)] to-[var(--bg-alt)]">
      <GlobalHeader mode="community" title={communityInfo.name} />

      <div className="mx-auto flex max-w-[960px] gap-5 p-2.5 pb-[calc(80px+env(safe-area-inset-bottom,20px))] lg:p-2.5">
        {/* 主內容區 */}
        <main className="flex max-w-[600px] flex-1 animate-[fadeInUp_0.5s_ease-out] flex-col gap-3">
          <ReviewsSection viewerRole={effectiveRole} reviews={reviews} onUnlock={handleUnlock} />
          <PostsSection
            viewerRole={effectiveRole}
            currentTab={currentTab}
            onTabChange={handleTabChange}
            publicPosts={posts.public}
            privatePosts={posts.private}
            communityId={communityId}
            currentUserId={currentUserId}
            userInitial={userInitial}
            onLike={handleLike}
            onCreatePost={handleCreatePost}
            onUnlock={handleUnlock}
          />
          <QASection
            viewerRole={effectiveRole}
            questions={questions}
            onAskQuestion={handleAskQuestion}
            onAnswerQuestion={handleAnswerQuestion}
            onUnlock={handleUnlock}
          />
        </main>

        {/* 側邊欄 - 使用同一個資料來源 */}
        <Sidebar info={communityInfo} questions={questions} posts={posts.public} />
      </div>

      {/* 底部 CTA */}
      <BottomCTA viewerRole={effectiveRole} />

      {/* Mock 切換僅於開發或白名單環境顯示 */}
      {(allowManualMockToggle || useMock) && (
        <MockToggle
          useMock={useMock}
          onToggle={() => setUseMock(!useMock)}
          disabled={mockToggleDisabled}
        />
      )}

      {/* 開發專用角色切換器 */}
      {allowManualRoleSwitch && <RoleSwitcher role={role} onRoleChange={setRole} />}

      <VersionBadge />

      {/* 動畫 keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-25deg); }
          40% { transform: rotate(10deg); }
          60% { transform: rotate(-20deg); }
          80% { transform: rotate(5deg); }
        }
      `}</style>
    </div>
  );
}

// ============ Main Export with ErrorBoundary ============
export default function Wall() {
  return (
    <WallErrorBoundary>
      <WallInner />
    </WallErrorBoundary>
  );
}
