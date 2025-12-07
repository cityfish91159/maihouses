/**
 * PostsSection Component
 * 
 * 社區貼文區塊（公開牆/私密牆）
 * 重構：使用 LockedOverlay + Tailwind brand 色系
 */

import { useState, useCallback, useId, useMemo, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import type { Role, Post, WallTab } from '../types';
import { getPermissions } from '../types';
import { useGuestVisibleItems } from '../../../hooks/useGuestVisibleItems';
import { LockedOverlay } from './LockedOverlay';
import { PostModal } from './PostModal';
import { formatRelativeTimeLabel } from '../../../lib/time';
import { notify } from '../../../lib/notify';
import { useAuth } from '../../../hooks/useAuth';

interface PostCardProps {
  post: Post;
  onLike?: (postId: number | string) => Promise<void> | void;
}

function PostCard({ post, onLike }: PostCardProps) {
  const [isLiking, setIsLiking] = useState(false);
  const likeThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const isAgent = post.type === 'agent';
  const isOfficial = post.type === 'official';
  const displayTime = formatRelativeTimeLabel(post.time);

  const badge = isAgent 
    ? <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[9px] font-bold text-brand-600">認證房仲</span>
    : isOfficial 
      ? <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[9px] font-bold text-brand">官方公告</span>
      : post.floor 
        ? <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[9px] font-bold text-brand">{post.floor} 住戶</span>
        : null;

  // 修復：likes=0 / comments=0 時也應顯示，不再依賴 truthy 判斷
  const stats = post.likes !== undefined 
    ? <span className="flex items-center gap-1">❤️ {post.likes}</span>
    : post.views !== undefined
      ? <span className="flex items-center gap-1">👁️ {post.views}</span>
      : null;
  const commentsStat = post.comments !== undefined
    ? <span className="flex items-center gap-1">💬 {post.comments}</span>
    : null;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (likeThrottleRef.current) {
        clearTimeout(likeThrottleRef.current);
      }
    };
  }, []);

  const handleLike = useCallback(() => {
    if (!onLike || isLiking) return;
    if (likeThrottleRef.current) return;

    likeThrottleRef.current = setTimeout(async () => {
      likeThrottleRef.current = null;
      setIsLiking(true);
      try {
        await onLike(post.id);
      } catch (error) {
        console.error('Failed to toggle like', error);
      } finally {
        if (isMountedRef.current) {
          setIsLiking(false);
        }
      }
    }, 250);
  }, [onLike, post.id, isLiking]);

  return (
    <article className="flex gap-2.5 rounded-[14px] border border-border-light bg-white p-3 transition-all hover:border-brand-600 hover:shadow-[0_2px_8px_rgba(0,56,90,0.06)]">
      <div 
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-gradient-to-br from-brand-100/50 to-white text-base font-extrabold ${isAgent ? 'border-brand-light text-brand-600' : 'border-brand text-brand'}`}
        aria-hidden="true"
      >
        {post.author.charAt(0)}
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-bold text-ink-900">{post.author}</span>
          {badge}
          <span className="text-[11px] text-ink-600">{displayTime}</span>
        </div>
        <div className="text-[13px] leading-relaxed text-ink-900">
          <b>{post.title}</b><br/>
          {post.content}
        </div>
        <div className="flex gap-3 text-[11px] text-ink-600">
          {stats}
          {commentsStat}
          {post.private && <span className="flex items-center gap-1">🔒 僅社區可見</span>}
        </div>
        <div className="mt-1 flex gap-2">
          {isAgent ? (
            <button 
              className="flex items-center gap-1 rounded-lg border border-brand/10 bg-brand/6 px-2.5 py-1.5 text-[11px] font-semibold text-brand transition-all hover:bg-brand/12"
              aria-label="私訊房仲"
            >
              📩 私訊房仲
            </button>
          ) : (
            <>
              <button 
                className="flex items-center gap-1 rounded-lg border border-brand/10 bg-brand/6 px-2.5 py-1.5 text-[11px] font-semibold text-brand transition-all hover:bg-brand/12 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleLike}
                aria-label="按讚這則貼文"
                aria-busy={isLiking}
                disabled={isLiking}
              >
                {isLiking ? '⏳ 處理中' : '❤️ 讚'}
              </button>
              <button 
                className="flex items-center gap-1 rounded-lg border border-brand/10 bg-brand/6 px-2.5 py-1.5 text-[11px] font-semibold text-brand/50 cursor-not-allowed opacity-60 transition-all"
                aria-label="回覆功能開發中"
                title="🚧 功能開發中，敬請期待"
                disabled
              >
                💬 回覆
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

interface PostsSectionProps {
  role: Role;
  currentTab: WallTab;
  onTabChange: (tab: WallTab) => void;
  publicPosts: Post[];
  privatePosts: Post[];
  onLike?: (postId: number | string) => Promise<void> | void;
  onCreatePost?: (content: string, visibility: 'public' | 'private') => void;
  onUnlock?: () => void;
}

export function PostsSection({ 
  role, 
  currentTab, 
  onTabChange, 
  publicPosts, 
  privatePosts,
  onLike,
  onCreatePost,
  onUnlock,
}: PostsSectionProps) {
  const perm = getPermissions(role);
  const { isAuthenticated } = useAuth();
  const effectiveIsGuest = !isAuthenticated || perm.isGuest;
  const tabListId = useId();
  const publicTabId = `${tabListId}-public`;
  const privateTabId = `${tabListId}-private`;
  const panelId = `${tabListId}-panel`;
  const tabRefs = useRef<Record<WallTab, HTMLButtonElement | null>>({
    public: null,
    private: null,
  });

  // PostModal 狀態
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [postModalVisibility, setPostModalVisibility] = useState<'public' | 'private'>('public');

  const openPostModal = (visibility: 'public' | 'private') => {
    if (effectiveIsGuest) {
      notify.error('請先登入或註冊', '登入後才能發布貼文');
      return;
    }
    if (visibility === 'public' && !perm.canPostPublic) {
      notify.error('目前無法發文', '請確認帳號權限或稍後再試');
      return;
    }
    if (visibility === 'private' && !perm.canPostPrivate) {
      notify.error('僅住戶可發佈私密貼文');
      return;
    }
    setPostModalVisibility(visibility);
    setPostModalOpen(true);
  };

  const handlePostSubmit = async (content: string) => {
    if (effectiveIsGuest) {
      notify.error('請先登入或註冊', '登入後才能發布貼文');
      return;
    }
    if (onCreatePost) {
      onCreatePost(content, postModalVisibility);
    }
  };

  // 使用統一的 hook 處理訪客可見項目
  const { visible: visiblePublic, hiddenCount: hiddenPublicCount, nextHidden: nextHiddenPost } = 
    useGuestVisibleItems(publicPosts, perm.canSeeAllPosts);

  const focusTab = useCallback((tab: WallTab) => {
    tabRefs.current[tab]?.focus();
  }, []);

  const activeTabs = useMemo<WallTab[]>(() => {
    return perm.canAccessPrivate ? ['public', 'private'] : ['public'];
  }, [perm.canAccessPrivate]);

  const handlePrivateClick = () => {
    if (!perm.canAccessPrivate) {
      notify.error(
        perm.isGuest ? '請先登入或註冊' : '請完成住戶驗證',
        perm.isGuest ? '🔐 登入/註冊後可查看私密牆' : '🏠 上傳水電帳單或管理費收據後即可查看'
      );
      return;
    }
    onTabChange('private');
  };

  const handleTabKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>, current: WallTab) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      return;
    }
    event.preventDefault();

    const lastAvailableTab = activeTabs[activeTabs.length - 1];

    if (event.key === 'Home') {
      focusTab('public');
      if (currentTab !== 'public') {
        onTabChange('public');
      }
      return;
    }

    if (event.key === 'End') {
      // 無論權限如何，跳到最後一個可用 Tab
      if (lastAvailableTab && lastAvailableTab !== currentTab) {
        focusTab(lastAvailableTab);
        onTabChange(lastAvailableTab);
      } else if (lastAvailableTab) {
        focusTab(lastAvailableTab);
      }
      return;
    }

    const currentIndex = activeTabs.indexOf(current);
    if (currentIndex === -1) return;

    const delta = event.key === 'ArrowLeft' ? -1 : 1;
    const nextIndex = (currentIndex + delta + activeTabs.length) % activeTabs.length;
    const nextTab = activeTabs[nextIndex];
    if (!nextTab) {
      return;
    }

    if (nextTab === 'private' && !perm.canAccessPrivate) {
      focusTab('public');
      onTabChange('public');
      return;
    }

    focusTab(nextTab);
    onTabChange(nextTab);
  }, [activeTabs, currentTab, focusTab, onTabChange, perm.canAccessPrivate]);

  return (
    <section id="public-wall" className="scroll-mt-20 overflow-hidden rounded-[18px] border border-border-light bg-white/98 shadow-[0_2px_12px_rgba(0,51,102,0.04)]" aria-labelledby="posts-heading">
      <div className="flex items-center justify-between border-b border-brand/5 bg-gradient-to-br from-brand/3 to-brand-600/1 px-4 py-3.5">
        <h2 id="posts-heading" className="flex items-center gap-1.5 text-[15px] font-extrabold text-brand-700">🔥 社區熱帖</h2>
      </div>
      
      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 px-3.5 pb-3.5 pt-2" role="tablist" aria-label="社區牆分類">
        <button 
          role="tab"
          id={publicTabId}
          ref={(node) => { tabRefs.current.public = node; }}
          aria-selected={currentTab === 'public'}
          aria-controls={panelId}
          onClick={() => onTabChange('public')}
          onKeyDown={(event) => handleTabKeyDown(event, 'public')}
          tabIndex={currentTab === 'public' ? 0 : -1}
          className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${currentTab === 'public' ? 'border-brand-600 bg-brand/10 font-bold text-brand' : 'border-transparent bg-brand-100/80 text-ink-600 hover:bg-brand/8 hover:text-brand'}`}
        >
          公開牆
        </button>
        <button 
          role="tab"
          id={privateTabId}
          ref={(node) => { tabRefs.current.private = node; }}
          aria-selected={currentTab === 'private'}
          aria-controls={panelId}
          aria-disabled={!perm.canAccessPrivate}
          onClick={handlePrivateClick}
          onKeyDown={(event) => handleTabKeyDown(event, 'private')}
          tabIndex={perm.canAccessPrivate ? (currentTab === 'private' ? 0 : -1) : -1}
          className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${currentTab === 'private' ? 'border-brand-600 bg-brand/10 font-bold text-brand' : 'border-transparent bg-brand-100/80 text-ink-600 hover:bg-brand/8 hover:text-brand'} ${!perm.canAccessPrivate ? 'opacity-60' : ''}`}
        >
          私密牆 {!perm.canAccessPrivate && '🔒'}
        </button>
      </div>

      {/* Content */}
      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={currentTab === 'public' ? publicTabId : privateTabId}
        tabIndex={0}
        className="flex flex-col gap-2.5 px-3.5 pb-3.5"
      >
        {currentTab === 'public' ? (
          <>
            {visiblePublic.map(post => (
              <PostCard key={post.id} post={post} {...(onLike ? { onLike } : {})} />
            ))}
            
            {/* 使用 LockedOverlay 組件 */}
            <LockedOverlay
              visible={hiddenPublicCount > 0 && !!nextHiddenPost}
              hiddenCount={hiddenPublicCount}
              countLabel="則熱帖"
              benefits={['查看完整動態', '新回答通知']}
              {...(onUnlock ? { onCtaClick: onUnlock } : {})}
            >
              {nextHiddenPost && (
                <PostCard post={nextHiddenPost} />
              )}
            </LockedOverlay>
            
            {perm.canPostPublic ? (
              <div className="flex justify-center rounded-[14px] border border-dashed border-border-light bg-brand/3 p-5">
                <button 
                  onClick={() => openPostModal('public')}
                  className="flex w-full items-center justify-center gap-1 rounded-lg border border-brand/10 bg-brand/6 px-2.5 py-1.5 text-[11px] font-semibold text-brand hover:bg-brand/12"
                >
                  ✏️ 發布貼文
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 rounded-[14px] border border-dashed border-border-light bg-brand/3 p-4 text-center text-[11px] text-ink-700">
                <span>✏️ 請先登入後再發文</span>
                <button
                  onClick={() => {
                    if (onUnlock) {
                      onUnlock();
                    } else {
                      notify.error('請先登入或註冊', '登入後才能發布貼文');
                    }
                  }}
                  className="mx-auto rounded-full bg-brand px-4 py-2 font-bold text-white"
                >
                  立即登入 / 註冊
                </button>
              </div>
            )}
          </>
        ) : perm.canAccessPrivate ? (
          <>
            {privatePosts.map(post => (
              <PostCard key={post.id} post={post} {...(onLike ? { onLike } : {})} />
            ))}
            {perm.canPostPrivate ? (
              <div className="flex justify-center rounded-[14px] border border-dashed border-border-light bg-brand/3 p-5">
                <button 
                  onClick={() => openPostModal('private')}
                  className="flex w-full items-center justify-center gap-1 rounded-lg border border-brand/10 bg-brand/6 px-2.5 py-1.5 text-[11px] font-semibold text-brand hover:bg-brand/12"
                >
                  ✏️ 發布私密貼文
                </button>
              </div>
            ) : (
              <p className="py-3 text-center text-[11px] text-ink-600">💡 房仲可查看私密牆，但無法發文</p>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-[14px] bg-brand/3 px-5 py-10 text-center">
            <div className="mb-3 text-5xl opacity-50" aria-hidden="true">🔐</div>
            <h4 className="mb-1.5 text-sm font-bold text-brand-700">私密牆僅限本社區住戶查看</h4>
            <p className="mb-4 text-xs text-ink-600">{perm.isGuest ? '請先登入或註冊' : '驗證住戶身份後即可加入討論'}</p>
            <button 
              onClick={onUnlock}
              className="rounded-full bg-brand px-5 py-2.5 text-xs font-bold text-white"
            >
              {perm.isGuest ? '免費註冊 / 登入' : '我是住戶，驗證身份'}
            </button>
          </div>
        )}
      </div>

      {/* 發文 Modal */}
      <PostModal
        isOpen={postModalOpen}
        onClose={() => setPostModalOpen(false)}
        onSubmit={handlePostSubmit}
        visibility={postModalVisibility}
        role={effectiveIsGuest ? 'guest' : role}
      />
    </section>
  );
}
