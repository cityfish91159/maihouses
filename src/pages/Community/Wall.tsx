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
import {
  WallEmptyState,
  WallLoadingState,
  WallAuthErrorState,
  WallErrorState,
} from './components/WallStates';
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

  const candidate = (metadata as Record<string, unknown>)[key];
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

type CreatePostPayload = {
  content: string;
  visibility: 'public' | 'private';
};

type AskQuestionPayload = {
  question: string;
};

type AnswerQuestionPayload = {
  questionId: string;
  content: string;
};

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
    // Mount-only initialization; later sync is handled by URL/storage effects below.
    return resolveInitialWallRole({
      isDev: import.meta.env.DEV,
      urlRoleParam: searchParamsRef.current.get(COMMUNITY_WALL_ROLE_PARAM),
      storedRole: safeLocalStorage.getItem(COMMUNITY_WALL_ROLE_STORAGE_KEY),
    });
  }, []);

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

      const nextParams = updateURLParam(
        searchParamsRef.current,
        COMMUNITY_WALL_ROLE_PARAM,
        newRole
      );
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
  }, [role, searchParams]);

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

  const showPostRegisterGuide = useCallback(
    (_payload: CreatePostPayload) => {
      showRegisterGuide('註冊後即可發表貼文', '免費註冊即可分享社區生活與參與討論');
    },
    [showRegisterGuide]
  );

  const showDiscussionRegisterGuide = useCallback(
    (_payload: AskQuestionPayload | AnswerQuestionPayload) => {
      showRegisterGuide('註冊後即可參與討論', '免費註冊即可提出問題、回答與追蹤最新回覆');
    },
    [showRegisterGuide]
  );

  const runCreatePost = useCallback(
    async ({ content, visibility }: CreatePostPayload) => {
      await createPost(content, visibility);
    },
    [createPost]
  );

  const dispatchCreatePost = useModeAwareAction<CreatePostPayload>({
    visitor: showPostRegisterGuide,
    demo: runCreatePost,
    live: runCreatePost,
  });

  // 發文處理
  const handleCreatePost = useCallback(
    async (content: string, visibility: 'public' | 'private' = 'public') => {
      const result = await dispatchCreatePost({ content, visibility });
      if (!result.ok) {
        logger.error('[Wall] Failed to create post', { error: result.error });
        notify.error('發文失敗', result.error);
      }
    },
    [dispatchCreatePost]
  );

  const runAskQuestion = useCallback(
    async ({ question }: AskQuestionPayload) => {
      await askQuestion(question);
    },
    [askQuestion]
  );

  const runAnswerQuestion = useCallback(
    async ({ questionId, content }: AnswerQuestionPayload) => {
      await answerQuestion(questionId, content);
    },
    [answerQuestion]
  );

  const dispatchAskQuestion = useModeAwareAction<AskQuestionPayload>({
    visitor: showDiscussionRegisterGuide,
    demo: runAskQuestion,
    live: runAskQuestion,
  });

  const dispatchAnswerQuestion = useModeAwareAction<AnswerQuestionPayload>({
    visitor: showDiscussionRegisterGuide,
    demo: runAnswerQuestion,
    live: runAnswerQuestion,
  });

  const handleAskQuestion = useCallback(
    async (question: string) => {
      const result = await dispatchAskQuestion({ question });
      if (!result.ok) {
        logger.error('[Wall] Failed to submit question', { error: result.error });
        notify.error('提問失敗', result.error);
        throw new Error(result.error);
      }
    },
    [dispatchAskQuestion]
  );

  const handleAnswerQuestion = useCallback(
    async (questionId: string, content: string) => {
      const result = await dispatchAnswerQuestion({ questionId, content });
      if (!result.ok) {
        logger.error('[Wall] Failed to submit answer', { error: result.error });
        notify.error('回答失敗', result.error);
        throw new Error(result.error);
      }
    },
    [dispatchAnswerQuestion]
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

  if (!communityId) return <WallEmptyState />;
  if (authLoading) return <WallLoadingState skeleton={<WallSkeleton />} />;
  if (authError) {
    return (
      <WallAuthErrorState
        message={authError.message}
        isReloading={isReloading}
        onReload={handleReload}
      />
    );
  }
  if (isLoading) return <WallLoadingState skeleton={<WallSkeleton />} />;
  if (error) {
    return (
      <WallErrorState
        error={error}
        isReloading={isReloading}
        onReload={handleReload}
        onLogin={handleLogin}
        onForceEnableMock={forceEnableMock}
      />
    );
  }

  // 從統一資料來源取得資料
  const { communityInfo, posts, reviews, questions } = data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--bg-base)] to-[var(--bg-alt)]">
      <GlobalHeader mode="community" title={communityInfo.name} />

      <div className="mx-auto flex max-w-[960px] gap-5 p-2.5 pb-[calc(80px+env(safe-area-inset-bottom,20px))] lg:p-2.5">
        {/* 主內容區 */}
        <main className="flex max-w-[600px] flex-1 animate-fadeIn flex-col gap-3">
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
            mode={mode}
            onRegisterGuide={showRegisterGuide}
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
