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
import { useThrottle } from '../../../hooks/useThrottle';
import { LockedOverlay } from './LockedOverlay';
import { PostModal } from './PostModal';
import { formatRelativeTimeLabel } from '../../../lib/time';
import { notify } from '../../../lib/notify';

// P2-UI-1: 提取 UI 字串
const STRINGS = {
  AGENT_BADGE: '認證房仲',
  OFFICIAL_BADGE: '官方公告',
  RESIDENT_BADGE_SUFFIX: ' 住戶',
  PRIVATE_POST_LABEL: '僅社區可見',
  BTN_MSG_AGENT: '私訊房仲',
  BTN_LIKE: '讚',
  BTN_LIKING: '處理中',
  BTN_REPLY: '回覆',
  BTN_REPLY_TOOLTIP: '功能開發中，敬請期待',
  BTN_REPLY_ARIA: '回覆功能開發中',
  BTN_POST_PUBLIC: '發布貼文',
  BTN_POST_PRIVATE: '發布私密貼文',
  SECTION_TITLE: '社區熱帖',
  TAB_PUBLIC: '公開牆',
  TAB_PRIVATE: '私密牆',
  MSG_AGENT_VIEW_ONLY: '房仲可查看私密牆，但無法發文',
  LOCKED_TITLE: '私密牆僅限本社區住戶查看',
  LOCKED_DESC_GUEST: '請先登入或註冊',
  LOCKED_DESC_USER: '驗證住戶身份後即可加入討論',
  BTN_UNLOCK_GUEST: '免費註冊 / 登入',
  BTN_UNLOCK_USER: '我是住戶，驗證身份',
  NOTIFY_LOGIN_TITLE: '請先登入或註冊',
  NOTIFY_LOGIN_DESC: '登入後才能發布貼文',
  NOTIFY_PERM_ERROR: '目前無法發文',
  NOTIFY_PERM_CHECK: '請確認帳號權限或稍後再試',
  NOTIFY_PRIVATE_ONLY: '僅住戶可發佈私密貼文',
  NOTIFY_PRIVATE_ACCESS_DENIED: '請先登入或註冊',
  NOTIFY_PRIVATE_ACCESS_DENIED_DESC: '登入/註冊後可查看私密牆',
  NOTIFY_VERIFY_REQUIRED: '請完成住戶驗證',
  NOTIFY_VERIFY_REQUIRED_DESC: '上傳水電帳單或管理費收據後即可查看',
  LOCKED_OVERLAY_COUNT_LABEL: '則熱帖',
  LOCKED_OVERLAY_BENEFIT_1: '查看完整動態',
  LOCKED_OVERLAY_BENEFIT_2: '新回應通知',
};

// P2-UI-4: 封裝 Badge 邏輯
function PostBadge({ post }: { post: Post }) {
  const isAgent = post.type === 'agent';
  const isOfficial = post.type === 'official';

  if (isAgent) {
    return <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[9px] font-bold text-brand-600">{STRINGS.AGENT_BADGE}</span>;
  }
  if (isOfficial) {
    return <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[9px] font-bold text-brand">{STRINGS.OFFICIAL_BADGE}</span>;
  }
  if (post.floor) {
    return <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[9px] font-bold text-brand">{post.floor}{STRINGS.RESIDENT_BADGE_SUFFIX}</span>;
  }
  return null;
}

interface PostCardProps {
  post: Post;
  onLike?: (postId: number | string) => Promise<void> | void;
}

function PostCard({ post, onLike }: PostCardProps) {
  const [isLiking, setIsLiking] = useState(false);
  const isMountedRef = useRef(true);
  const isAgent = post.type === 'agent';
  const displayTime = formatRelativeTimeLabel(post.time);

  // P2-UI-2: 優化 Emoji 可訪問性
  const stats = post.likes !== undefined 
    ? <span className="flex items-center gap-1"><span role="img" aria-label="愛心">❤️</span> {post.likes}</span>
    : post.views !== undefined
      ? <span className="flex items-center gap-1"><span role="img" aria-label="觀看數">👁️</span> {post.views}</span>
      : null;
  const commentsStat = post.comments !== undefined
    ? <span className="flex items-center gap-1"><span role="img" aria-label="留言數">💬</span> {post.comments}</span>
    : null;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // P2-UI-3: 使用標準 Throttle Hook（leading+trailing，避免吞按）
  const handleLike = useThrottle(
    async () => {
      if (!onLike || isLiking) return;

      setIsLiking(true);
      try {
        await onLike(post.id);
      } catch (error) {
        console.error('Failed to toggle like', error);
        notify.error('按讚失敗', '請稍後重試');
      } finally {
        if (isMountedRef.current) {
          setIsLiking(false);
        }
      }
    },
    1000,
    { trailing: true }
  );

  return (
    <article className="flex gap-2.5 rounded-[14px] border border-border-light bg-white p-3 transition-all hover:border-brand-600 hover:shadow-[0_2px_8px_rgba(0,56,90,0.06)]">
      <div 
        className={`flex size-10 shrink-0 items-center justify-center rounded-full border-2 bg-gradient-to-br from-brand-100/50 to-white text-base font-extrabold ${isAgent ? 'border-brand-light text-brand-600' : 'border-brand text-brand'}`}
        aria-hidden="true"
      >
        {post.author.charAt(0)}
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-bold text-ink-900">{post.author}</span>
          <PostBadge post={post} />
          <span className="text-[11px] text-ink-600">{displayTime}</span>
        </div>
        <div className="text-[13px] leading-relaxed text-ink-900">
          <b>{post.title}</b><br/>
          {post.content}
        </div>
        <div className="flex gap-3 text-[11px] text-ink-600">
          {stats}
          {commentsStat}
          {post.private && <span className="flex items-center gap-1"><span role="img" aria-label="鎖頭">🔒</span> {STRINGS.PRIVATE_POST_LABEL}</span>}
        </div>
        <div className="mt-1 flex gap-2">
          {isAgent ? (
            <button 
              className="bg-brand/6 hover:bg-brand/12 flex items-center gap-1 rounded-lg border border-brand/10 px-2.5 py-1.5 text-[11px] font-semibold text-brand transition-all"
              aria-label={STRINGS.BTN_MSG_AGENT}
            >
              <span role="img" aria-label="信封">📩</span> {STRINGS.BTN_MSG_AGENT}
            </button>
          ) : (
            <>
              <button 
                className="bg-brand/6 hover:bg-brand/12 flex items-center gap-1 rounded-lg border border-brand/10 px-2.5 py-1.5 text-[11px] font-semibold text-brand transition-all disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleLike}
                aria-label="按讚這則貼文"
                aria-busy={isLiking}
                disabled={isLiking}
              >
                {isLiking ? <><span role="img" aria-label="沙漏">⏳</span> {STRINGS.BTN_LIKING}</> : <><span role="img" aria-label="愛心">❤️</span> {STRINGS.BTN_LIKE}</>}
              </button>
              <button 
                className="bg-brand/6 flex cursor-not-allowed items-center gap-1 rounded-lg border border-brand/10 px-2.5 py-1.5 text-[11px] font-semibold text-brand/50 opacity-60 transition-all"
                aria-label={STRINGS.BTN_REPLY_ARIA}
                title={STRINGS.BTN_REPLY_TOOLTIP}
                disabled
              >
                <span role="img" aria-label="對話框">💬</span> {STRINGS.BTN_REPLY}
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
  // 角色已由父層統一計算，直接使用 perm 判斷訪客狀態
  const isGuest = perm.isGuest;
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
    if (isGuest) {
      notify.error(STRINGS.NOTIFY_LOGIN_TITLE, STRINGS.NOTIFY_LOGIN_DESC);
      return;
    }
    if (visibility === 'public' && !perm.canPostPublic) {
      notify.error(STRINGS.NOTIFY_PERM_ERROR, STRINGS.NOTIFY_PERM_CHECK);
      return;
    }
    if (visibility === 'private' && !perm.canPostPrivate) {
      notify.error(STRINGS.NOTIFY_PRIVATE_ONLY);
      return;
    }
    setPostModalVisibility(visibility);
    setPostModalOpen(true);
  };

  const handlePostSubmit = async (content: string) => {
    if (isGuest) {
      notify.error(STRINGS.NOTIFY_LOGIN_TITLE, STRINGS.NOTIFY_LOGIN_DESC);
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
        perm.isGuest ? STRINGS.NOTIFY_PRIVATE_ACCESS_DENIED : STRINGS.NOTIFY_VERIFY_REQUIRED,
        perm.isGuest ? `🔐 ${STRINGS.NOTIFY_PRIVATE_ACCESS_DENIED_DESC}` : `🏠 ${STRINGS.NOTIFY_VERIFY_REQUIRED_DESC}`
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
    <section id="public-wall" className="bg-white/98 scroll-mt-20 overflow-hidden rounded-[18px] border border-border-light shadow-[0_2px_12px_rgba(0,51,102,0.04)]" aria-labelledby="posts-heading">
      <div className="from-brand/3 to-brand-600/1 flex items-center justify-between border-b border-brand/5 bg-gradient-to-br px-4 py-3.5">
        <h2 id="posts-heading" className="flex items-center gap-1.5 text-[15px] font-extrabold text-brand-700">
          <span role="img" aria-label="火焰">🔥</span> {STRINGS.SECTION_TITLE}
        </h2>
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
          className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${currentTab === 'public' ? 'border-brand-600 bg-brand/10 font-bold text-brand' : 'hover:bg-brand/8 border-transparent bg-brand-100/80 text-ink-600 hover:text-brand'}`}
        >
          {STRINGS.TAB_PUBLIC}
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
          className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${currentTab === 'private' ? 'border-brand-600 bg-brand/10 font-bold text-brand' : 'hover:bg-brand/8 border-transparent bg-brand-100/80 text-ink-600 hover:text-brand'} ${!perm.canAccessPrivate ? 'opacity-60' : ''}`}
        >
          {STRINGS.TAB_PRIVATE} {!perm.canAccessPrivate && <span role="img" aria-label="鎖頭">🔒</span>}
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
              countLabel={STRINGS.LOCKED_OVERLAY_COUNT_LABEL}
              benefits={[STRINGS.LOCKED_OVERLAY_BENEFIT_1, STRINGS.LOCKED_OVERLAY_BENEFIT_2]}
              showCta
              {...(onUnlock ? { onCtaClick: onUnlock } : {})}
            >
              {nextHiddenPost && (
                <PostCard post={nextHiddenPost} />
              )}
            </LockedOverlay>
            
            {perm.canPostPublic && (
              <div className="bg-brand/3 flex justify-center rounded-[14px] border border-dashed border-border-light p-5">
                <button 
                  onClick={() => openPostModal('public')}
                  className="bg-brand/6 hover:bg-brand/12 flex w-full items-center justify-center gap-1 rounded-lg border border-brand/10 px-2.5 py-1.5 text-[11px] font-semibold text-brand"
                >
                  <span role="img" aria-label="鉛筆">✏️</span> {STRINGS.BTN_POST_PUBLIC}
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
              <div className="bg-brand/3 flex justify-center rounded-[14px] border border-dashed border-border-light p-5">
                <button 
                  onClick={() => openPostModal('private')}
                  className="bg-brand/6 hover:bg-brand/12 flex w-full items-center justify-center gap-1 rounded-lg border border-brand/10 px-2.5 py-1.5 text-[11px] font-semibold text-brand"
                >
                  <span role="img" aria-label="鉛筆">✏️</span> {STRINGS.BTN_POST_PRIVATE}
                </button>
              </div>
            ) : (
              <p className="py-3 text-center text-[11px] text-ink-600">💡 {STRINGS.MSG_AGENT_VIEW_ONLY}</p>
            )}
          </>
        ) : (
          <div className="bg-brand/3 flex flex-col items-center justify-center rounded-[14px] px-5 py-10 text-center">
            <div className="mb-3 text-5xl opacity-50" aria-hidden="true">🔐</div>
            <h4 className="mb-1.5 text-sm font-bold text-brand-700">{STRINGS.LOCKED_TITLE}</h4>
            <p className="mb-4 text-xs text-ink-600">{perm.isGuest ? STRINGS.LOCKED_DESC_GUEST : STRINGS.LOCKED_DESC_USER}</p>
            <button 
              onClick={onUnlock}
              className="rounded-full bg-brand px-5 py-2.5 text-xs font-bold text-white"
            >
              {perm.isGuest ? STRINGS.BTN_UNLOCK_GUEST : STRINGS.BTN_UNLOCK_USER}
            </button>
          </div>
        )}
      </div>

      {/* 發文 Modal - B3: guest 時 openPostModal 已阻擋，此處傳 role 作為最後防線 */}
      <PostModal
        isOpen={postModalOpen}
        onClose={() => setPostModalOpen(false)}
        onSubmit={handlePostSubmit}
        visibility={postModalVisibility}
        role={isGuest ? 'guest' : role}
      />
    </section>
  );
}
