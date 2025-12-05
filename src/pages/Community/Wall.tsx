/**
 * Community Wall Page
 * 
 * 社區牆主頁面
 * 重構版 - 統一資料來源、組件化、React Query、a11y 優化
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

// Components
import {
  Topbar,
  ReviewsSection,
  PostsSection,
  QASection,
  Sidebar,
  RoleSwitcher,
  MockToggle,
  BottomCTA,
  WallSkeleton,
  WallErrorBoundary,
  VersionBadge,
} from './components';

// Types
import type { Role, WallTab } from './types';
import { getPermissions } from './types';

// Hooks - 統一資料來源
import { useCommunityWallData } from '../../hooks/useCommunityWallData';

// ============ URL / Storage Helpers ============
const MOCK_PARAM = 'mock';
const ROLE_PARAM = 'role';
const MOCK_STORAGE_KEY = 'community-wall-use-mock';
const MOCK_OVERRIDE_KEY = 'community-wall-mock-override';
const ROLE_STORAGE_KEY = 'community-wall-dev-role';
const VALID_ROLES: Role[] = ['guest', 'member', 'resident', 'agent'];
const GLOBAL_MOCK_TOGGLE_ENABLED = import.meta.env.DEV || import.meta.env.VITE_COMMUNITY_WALL_ALLOW_MOCK === 'true';

const parseBoolParam = (value: string | null): boolean | null => {
  if (value === null) return null;
  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes'].includes(normalized)) return true;
  if (['false', '0', 'no'].includes(normalized)) return false;
  return null;
};

const parseRoleParam = (value: string | null): Role | null => {
  if (!value) return null;
  return VALID_ROLES.includes(value as Role) ? (value as Role) : null;
};

const safeGetBoolean = (key: string, fallback: boolean): boolean => {
  try {
    const stored = localStorage.getItem(key);
    const parsed = parseBoolParam(stored);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const safeSetBoolean = (key: string, value: boolean): { success: boolean; error?: string } => {
  try {
    localStorage.setItem(key, String(value));
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

const updateURLParam = (params: URLSearchParams, key: string, value: string | null) => {
  const next = new URLSearchParams(params);
  if (!value) {
    next.delete(key);
  } else {
    next.set(key, value);
  }
  return next;
};

// ============ Inner Component (Wrapped by ErrorBoundary) ============
function WallInner() {
  const params = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const communityId = params.id;
  const searchParamsRef = useRef(searchParams);

  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  if (!communityId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[var(--bg-base)] to-[var(--bg-alt)]">
        <div className="rounded-2xl border border-brand/10 bg-white px-8 py-10 text-center shadow-[0_10px_30px_rgba(0,34,73,0.08)]">
          <div className="mb-3 text-4xl">🧭</div>
          <p className="mb-4 text-base font-semibold text-ink-900">找不到指定的社區牆</p>
          <p className="mb-6 text-sm text-ink-600">請確認網址是否正確，或回到首頁重新選擇社區。</p>
          <a
            href="/maihouses/"
            className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-brand-600"
          >
            回到首頁
          </a>
        </div>
      </div>
    );
  }

  // 初始化 mock/override：URL > override > 儲存偏好
  const initialMockState = useMemo(() => {
    const urlParam = parseBoolParam(searchParamsRef.current.get(MOCK_PARAM));
    const storedOverride = safeGetBoolean(MOCK_OVERRIDE_KEY, false);
    const storedPreference = safeGetBoolean(MOCK_STORAGE_KEY, false);

    if (urlParam !== null) {
      return {
        useMock: urlParam,
        override: storedOverride || urlParam,
      };
    }

    if (storedOverride) {
      return { useMock: true, override: true };
    }

    if (storedPreference) {
      const treatAsOverride = !GLOBAL_MOCK_TOGGLE_ENABLED;
      return {
        useMock: true,
        override: treatAsOverride,
      };
    }

    return { useMock: false, override: false };
  }, []);

  const initialUseMock = initialMockState.useMock;

  // 初始化 role：僅開發環境從 URL/localStorage 讀取
  const initialRole = useMemo<Role>(() => {
    if (!import.meta.env.DEV) return 'guest';
    const urlRole = parseRoleParam(searchParamsRef.current.get(ROLE_PARAM));
    if (urlRole) {
      return urlRole;
    }
    try {
      const stored = localStorage.getItem(ROLE_STORAGE_KEY) as Role | null;
      if (stored && VALID_ROLES.includes(stored)) {
        return stored;
      }
    } catch {}
    return 'guest';
  }, []);

  const [role, setRoleInternal] = useState<Role>(initialRole);
  const [hasMockOverride, setHasMockOverride] = useState(initialMockState.override);
  const [currentTab, setCurrentTab] = useState<WallTab>('public');
  const [isReloading, setIsReloading] = useState(false);
  const [localStorageError, setLocalStorageError] = useState<string | null>(null);
  const perm = getPermissions(role);
  const allowManualMockToggle = GLOBAL_MOCK_TOGGLE_ENABLED;
  const canToggleMock = allowManualMockToggle || hasMockOverride;

  // 統一資料來源 Hook
  const { 
    data,
    useMock,
    setUseMock: setUseMockInternal,
    isLoading,
    error,
    refresh,
    toggleLike,
    createPost,
    askQuestion,
    answerQuestion,
    viewerRole,
  } = useCommunityWallData(communityId, {
    includePrivate: perm.canAccessPrivate,
    initialUseMock, // 傳入初始值
  });
  const mockToggleDisabled = !canToggleMock && !useMock;

  // 生產環境依後端角色自動對齊權限
  useEffect(() => {
    if (import.meta.env.DEV) return;
    if (viewerRole && viewerRole !== role) {
      setRoleInternal(viewerRole);
    }
  }, [viewerRole, role]);

  const persistMockPreference = useCallback((value: boolean) => {
    setUseMockInternal(value);
    const nextParams = updateURLParam(searchParamsRef.current, MOCK_PARAM, value ? 'true' : null);
    setSearchParams(nextParams, { replace: true });
    const result = safeSetBoolean(MOCK_STORAGE_KEY, value);
    if (!result.success) {
      setLocalStorageError(`無法儲存 Mock 偏好：${result.error}`);
      if (import.meta.env.PROD) {
        console.error('[CommunityWall] Failed to persist mock preference', result.error);
      }
    } else {
      setLocalStorageError(null);
    }
  }, [setUseMockInternal, setSearchParams]);

  const persistMockOverride = useCallback((value: boolean) => {
    setHasMockOverride(value);
    const result = safeSetBoolean(MOCK_OVERRIDE_KEY, value);
    if (!result.success) {
      setLocalStorageError(`無法更新 Mock 權限：${result.error}`);
      if (import.meta.env.PROD) {
        console.error('[CommunityWall] Failed to persist mock override', result.error);
      }
    } else {
      setLocalStorageError(null);
    }
  }, [setLocalStorageError]);

  const setUseMock = useCallback((value: boolean) => {
    if (value && !canToggleMock) {
      setLocalStorageError('Mock 模式僅限內部測試使用');
      return;
    }
    persistMockPreference(value);
    if (value && !hasMockOverride) {
      persistMockOverride(true);
    }
  }, [canToggleMock, persistMockPreference, hasMockOverride, persistMockOverride]);

  const forceEnableMock = useCallback(() => {
    if (!hasMockOverride) {
      persistMockOverride(true);
    }
    persistMockPreference(true);
  }, [hasMockOverride, persistMockOverride, persistMockPreference]);

  // 包裝 setRole，同步 URL 和 localStorage（僅開發環境）
  const setRole = useCallback((newRole: Role) => {
    if (!import.meta.env.DEV) return;
    setRoleInternal(newRole);
    const nextParams = updateURLParam(searchParamsRef.current, ROLE_PARAM, newRole);
    setSearchParams(nextParams, { replace: true });
    try {
      localStorage.setItem(ROLE_STORAGE_KEY, newRole);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.warn('[CommunityWall] Failed to persist role preference', message);
      setLocalStorageError(`無法儲存角色設定：${message}`);
    }
  }, [setSearchParams]);

  useEffect(() => {
    if (!localStorageError) return;
    const timer = window.setTimeout(() => setLocalStorageError(null), 5000);
    return () => window.clearTimeout(timer);
  }, [localStorageError]);

  useEffect(() => {
    const urlValue = parseBoolParam(searchParams.get(MOCK_PARAM));
    if (urlValue === null) {
      return;
    }
    if (urlValue && !hasMockOverride) {
      persistMockOverride(true);
    }
    if (!urlValue && hasMockOverride) {
      persistMockOverride(false);
    }
    if (urlValue !== useMock) {
      setUseMockInternal(urlValue);
    }
  }, [hasMockOverride, persistMockOverride, searchParams, setUseMockInternal, useMock]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const urlRole = parseRoleParam(searchParams.get(ROLE_PARAM));
    if (urlRole && urlRole !== role) {
      setRoleInternal(urlRole);
    }
  }, [role, searchParams, setRoleInternal]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage || event.newValue === null) return;
      if (event.key === MOCK_STORAGE_KEY) {
        const parsed = parseBoolParam(event.newValue);
        if (parsed !== null && parsed !== useMock) {
          setUseMockInternal(parsed);
        }
        return;
      }
      if (event.key === MOCK_OVERRIDE_KEY) {
        const parsedOverride = parseBoolParam(event.newValue);
        setHasMockOverride(Boolean(parsedOverride));
        return;
      }
      if (import.meta.env.DEV && event.key === ROLE_STORAGE_KEY) {
        const parsedRole = parseRoleParam(event.newValue);
        if (parsedRole && parsedRole !== role) {
          setRoleInternal(parsedRole);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [role, setRoleInternal, setUseMockInternal, useMock]);

  const handleUnlock = useCallback(() => {
    navigate('/auth');
  }, [navigate]);
  
  // Tab 切換
  const handleTabChange = useCallback((tab: WallTab) => {
    if (tab === 'private' && !perm.canAccessPrivate) {
      return;
    }
    setCurrentTab(tab);
  }, [perm.canAccessPrivate]);

  // 如果身份變更導致無法存取私密牆，切回公開牆
  useEffect(() => {
    if (currentTab === 'private' && !perm.canAccessPrivate) {
      setCurrentTab('public');
    }
  }, [currentTab, perm.canAccessPrivate]);

  // 按讚處理
  const handleLike = useCallback(async (postId: number | string) => {
    try {
      await toggleLike(postId);
    } catch (err) {
      console.error('Failed to toggle like', err);
      alert('按讚失敗，請稍後再試');
    }
  }, [toggleLike]);

  // 發文處理
  const handleCreatePost = useCallback(async (content: string, visibility: 'public' | 'private' = 'public') => {
    try {
      await createPost(content, visibility);
    } catch (err) {
      console.error('Failed to create post', err);
      alert('發文失敗，請稍後再試');
    }
  }, [createPost]);

  const handleAskQuestion = useCallback(async (question: string) => {
    try {
      await askQuestion(question);
    } catch (err) {
      console.error('Failed to submit question', err);
      alert('提問失敗，請稍後再試');
      throw err;
    }
  }, [askQuestion]);

  const handleAnswerQuestion = useCallback(async (questionId: string, content: string) => {
    try {
      await answerQuestion(questionId, content);
    } catch (err) {
      console.error('Failed to submit answer', err);
      alert('回答失敗，請稍後再試');
      throw err;
    }
  }, [answerQuestion]);

  const handleReload = useCallback(async () => {
    if (isReloading) return;
    setIsReloading(true);
    try {
      await refresh();
    } catch (err) {
      console.error('Failed to refresh community wall', err);
    } finally {
      setIsReloading(false);
    }
  }, [isReloading, refresh]);

  // Loading 狀態（僅 API 模式）
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--bg-base)] to-[var(--bg-alt)]">
        <Topbar communityName="載入中..." />
        <div className="mx-auto max-w-[960px] p-2.5">
          <WallSkeleton />
        </div>
      </div>
    );
  }

  // Error 狀態（僅 API 模式）
  if (error) {
    const errorMsg = error.message || '';
    const isAuthError = errorMsg.includes('401') || errorMsg.includes('403') || errorMsg.includes('權限');

    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-bg-base to-bg-soft">
        <div className="text-center">
          <div className="mb-2 text-2xl">{isAuthError ? '🔐' : '😢'}</div>
          <div className="mb-2 text-sm text-ink-600">
            {isAuthError ? '請先登入' : '載入失敗，請稍後再試'}
          </div>
          {isAuthError ? (
            <button 
              onClick={() => window.location.href = '/auth'}
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
                className={`rounded-lg border border-brand/40 px-4 py-2 text-sm font-semibold transition hover:bg-brand/10 ${isReloading ? 'cursor-not-allowed text-brand/60' : 'text-brand'}`}
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
      <Topbar communityName={communityInfo.name} />
      
      <div className="mx-auto flex max-w-[960px] gap-5 p-2.5 pb-[calc(80px+env(safe-area-inset-bottom,20px))] lg:p-2.5">
        {/* 主內容區 */}
        <main className="flex max-w-[600px] flex-1 animate-[fadeInUp_0.5s_ease-out] flex-col gap-3">
          <ReviewsSection role={role} reviews={reviews} onUnlock={handleUnlock} />
          <PostsSection 
            role={role} 
            currentTab={currentTab} 
            onTabChange={handleTabChange}
            publicPosts={posts.public}
            privatePosts={posts.private}
            onLike={handleLike}
            onCreatePost={handleCreatePost}
            onUnlock={handleUnlock}
          />
          <QASection 
            role={role} 
            questions={questions}
            onAskQuestion={handleAskQuestion}
            onAnswerQuestion={handleAnswerQuestion}
            onUnlock={handleUnlock}
          />
        </main>

        {/* 側邊欄 - 使用同一個資料來源 */}
        <Sidebar 
          info={communityInfo} 
          questions={questions}
          posts={posts.public}
        />
      </div>

      {/* 底部 CTA */}
      <BottomCTA role={role} />

      {/* Mock 切換僅於開發或白名單環境顯示 */}
      {(allowManualMockToggle || useMock) && (
        <MockToggle
          useMock={useMock}
          onToggle={() => setUseMock(!useMock)}
          disabled={mockToggleDisabled}
        />
      )}

      {/* 開發專用角色切換器 */}
      {import.meta.env.DEV && (
        <RoleSwitcher role={role} onRoleChange={setRole} />
      )}

      {localStorageError && (
        <div
          role="status"
          aria-live="assertive"
          className="fixed bottom-24 right-5 z-50 max-w-sm rounded-xl border border-error-200 bg-error-50/95 p-4 text-left shadow-lg"
        >
          <p className="text-sm font-semibold text-error-900">⚠️ 儲存偏好失敗</p>
          <p className="mt-1 text-xs text-error-700">{localStorageError}</p>
        </div>
      )}

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
