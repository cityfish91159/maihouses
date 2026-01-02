/**
 * Feed Consumer Page
 *
 * 消費者信息流主頁面
 * 顯示用戶的社區動態、跨社區貼文、交易狀態等
 */

import { Home, Search, Bell, User } from 'lucide-react';


import { GlobalHeader } from '../../components/layout/GlobalHeader';
import { FeedPostCard, ProfileCard, TxBanner, FeedSidebar, InlineComposer } from '../../components/Feed';
// FeedSkeleton is defined locally in this file
import { FeedErrorBoundary } from '../../components/Feed/FeedErrorBoundary';
import { MockToggle } from '../../components/common/MockToggle';

import { DEFAULTS } from '../../constants/defaults';

import { useConsumer } from './useConsumer';
import { STRINGS } from '../../constants/strings';
import { ROUTES } from '../../constants/routes';
import { RequirePermission } from '../../components/auth/Guard';
import { PERMISSIONS } from '../../types/permissions';
import PrivateWallLocked from '../../components/Feed/PrivateWallLocked';
import { useState, useEffect } from 'react';

const S = STRINGS.FEED;

/** 底部導航項目 */
interface BottomNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { id: 'home', label: S.NAV.HOME, icon: <Home size={20} />, href: ROUTES.HOME },
  { id: 'community', label: S.NAV.COMMUNITY, icon: <Search size={20} />, href: '#my-community' },
  { id: 'notifications', label: S.NAV.NOTIFICATIONS, icon: <Bell size={20} />, href: '#notifications' },
  { id: 'profile', label: S.NAV.PROFILE, icon: <User size={20} />, href: '#profile' },
];

/** 手機版底部導航 */
function BottomNav({ activeId = 'community' }: { activeId?: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-overlay flex items-center justify-around border-t border-gray-100 bg-white/95 pb-[env(safe-area-inset-bottom,20px)] pt-2 backdrop-blur-lg lg:hidden">
      {BOTTOM_NAV_ITEMS.map((item) => {
        const isActive = item.id === activeId;
        return (
          <a
            key={item.id}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 text-xs font-semibold transition-colors ${isActive ? 'text-brand-700' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}



/** Loading Skeleton */
function FeedSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-brand-100 bg-white p-4">
          <div className="flex items-center gap-3 border-b border-gray-50 pb-3">
            <div className="size-10 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 rounded bg-gray-200" />
              <div className="h-3 w-32 rounded bg-gray-200" />
            </div>
          </div>
          <div className="space-y-2 pt-3">
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-3/4 rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Empty State */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-brand-100 bg-white px-6 py-12 text-center shadow-sm">
      <div className="mb-3 text-4xl">📭</div>
      <h3 className="mb-1 text-base font-bold text-gray-900">{S.EMPTY.TITLE}</h3>
      <p className="text-sm text-gray-500">{S.EMPTY.DESC}</p>
    </div>
  );
}

/** Error State */
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50 px-6 py-12 text-center shadow-sm">
      <div className="mb-3 text-4xl">😢</div>
      <h3 className="mb-1 text-base font-bold text-red-700">{S.ERROR.LOAD_FAILED}</h3>
      <p className="mb-4 text-sm text-red-600">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-brand-600"
      >
        {S.ERROR.RETRY}
      </button>
    </div>
  );
}

/** Props */
interface ConsumerProps {
  userId?: string;
  forceMock?: boolean;
}

/** Main Consumer Page Content */
function ConsumerContent({ userId, forceMock }: ConsumerProps) {
  const {
    authLoading,
    activeTransaction,
    userProfile,
    userInitial,
    isAuthenticated,
    isLoading,
    error,
    data,
    sidebarData,
    useMock,
    setUseMock,
    refresh,
    isLiked,
    handleLike,
    handleCreatePost,
    handleReply,
    handleComment,
    handleShare,
  } = useConsumer(userId, forceMock);

  // F6/E5 Fix: Deep Linking and Profile Navigation
  useEffect(() => {
    // 1. Handle Profile Navigation (#profile)
    const handleNavigation = () => {
      if (window.location.hash === '#profile') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    handleNavigation();
    window.addEventListener('hashchange', handleNavigation);

    // 2. Handle Post Deep Linking (F6 Fix)
    // Runs once on mount to handle initial load
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('post');
    if (postId) {
      // Use retry mechanism for async post loading
      const tryScroll = (retries = 0) => {
        const element = document.getElementById(`post-${postId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-2', 'ring-brand-500', 'ring-offset-2');
          setTimeout(() => element.classList.remove('ring-2', 'ring-brand-500', 'ring-offset-2'), 2000);
        } else if (retries < 10) {
          setTimeout(() => tryScroll(retries + 1), 500);
        }
      };
      setTimeout(() => tryScroll(), 500);
    }

    return () => window.removeEventListener('hashchange', handleNavigation);
  }, [data.posts]); // Re-run when posts load

  const handleSearch = (q: string) => {
    // console.log('Search:', q);
  };

  const [activeTab, setActiveTab] = useState<'public' | 'private'>('public');

  const filteredPosts = data.posts.filter(post => {
    if (activeTab === 'private') return post.private;
    return !post.private;
  });

  // Auth 載入中
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-50 to-brand-100/50">
        <GlobalHeader mode="consumer" />
        <div className="mx-auto max-w-[960px] p-4">
          <FeedSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <GlobalHeader
        mode="consumer"
        onSearch={handleSearch}
        className="sticky top-0 z-30"
      />
      {/* 交易橫幅 */}
      {
        activeTransaction.hasActive && (
          <TxBanner transaction={activeTransaction} className="mt-2" />
        )
      }

      {/* 主要布局 */}
      <div className="mx-auto flex max-w-[960px] gap-5 p-4 pb-[calc(80px+env(safe-area-inset-bottom,20px))] lg:pb-4">
        {/* 主內容區 */}
        <main className="flex max-w-[560px] flex-1 flex-col gap-3">
          {/* 個人資料卡 */}
          {userProfile && <ProfileCard profile={userProfile} />}

          {/* 發文框 */}
          {/* 發文框 */}
          {isAuthenticated && (
            <InlineComposer
              onSubmit={(content, images) => (images && images.length > 0
                ? handleCreatePost(content, images)
                : handleCreatePost(content))}
              disabled={isLoading}
              userInitial={userInitial}
            />
          )}

          {/* P7: Wall Tabs */}
          <div className="flex rounded-lg bg-white p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('public')}
              className={`flex-1 rounded-md py-2 text-sm font-bold transition-all ${activeTab === 'public'
                ? 'bg-brand-50 text-brand-700 shadow-sm'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
            >
              {S.TABS.PUBLIC}
            </button>
            <button
              onClick={() => setActiveTab('private')}
              className={`flex-1 rounded-md py-2 text-sm font-bold transition-all ${activeTab === 'private'
                ? 'bg-brand-50 text-brand-700 shadow-sm'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
            >
              {S.TABS.PRIVATE}
            </button>
          </div>

          {/* 貼文列表 */}
          {isLoading ? (
            <FeedSkeleton />
          ) : error ? (
            <ErrorState message={error.message} onRetry={refresh} />
          ) : (
            <>
              {activeTab === 'private' ? (
                /* 私密牆守衛 */
                <RequirePermission
                  permission={PERMISSIONS.VIEW_PRIVATE_WALL}
                  fallback={<PrivateWallLocked />}
                >
                  {filteredPosts.length === 0 ? (
                    <EmptyState />
                  ) : (
                    <div className="space-y-3">
                      {filteredPosts.map((post) => (
                        <FeedPostCard
                          key={post.id}
                          post={post}
                          isLiked={isLiked(post.id)}
                          onLike={handleLike}
                          onReply={handleReply}
                          onComment={handleComment}
                          onShare={handleShare}
                        />
                      ))}
                    </div>
                  )}
                </RequirePermission>
              ) : (
                /* 公開牆直接顯示 */
                filteredPosts.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="space-y-3">
                    {filteredPosts.map((post) => (
                      <div key={post.id} id={`post-${post.id}`} className="space-y-3">
                        <FeedPostCard
                          post={post}
                          isLiked={isLiked(post.id)}
                          onLike={handleLike}
                          onReply={handleReply}
                          onComment={handleComment}
                          onShare={handleShare}
                        />
                      </div>
                    ))}
                  </div>
                )
              )}
            </>
          )}
        </main>

        <aside className="hidden w-[380px] lg:block">
          <FeedSidebar
            data={data.sidebarData}
          />
          {/* Debug/Demo Toggle */}
          <div className="mt-4 flex justify-center">
            <MockToggle useMock={useMock} onToggle={() => setUseMock(!useMock)} />
          </div>
        </aside>
      </div>
    </div >
  );
}

/** 
 * Main Consumer Page 
 * P7-Audit-C11: Error Boundary must wrap the content (which uses hooks)
 * to catch errors during rendering of the content.
 */
export default function Consumer(props: ConsumerProps) {
  return (
    <FeedErrorBoundary>
      <ConsumerContent {...props} />
    </FeedErrorBoundary>
  );
}


