/**
 * PostsSection Component
 *
 * 社區貼文區塊（公開牆/私密牆）
 * 重構：分離 PostCard / PostCommentSection，元件專注於區塊層邏輯
 */

import { useState, useCallback, useId, useMemo, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { Flame, Pencil, Lightbulb, Lock } from 'lucide-react';
import type { Role, Post, WallTab } from '../types';
import { getPermissions } from '../types';
import { canPerformAction, getPermissionDeniedMessage } from '../lib';
import { useGuestVisibleItems } from '../../../hooks/useGuestVisibleItems';
import { useModeAwareAction } from '../../../hooks/useModeAwareAction';
import type { PageMode } from '../../../hooks/usePageMode';
import { LockedOverlay } from './LockedOverlay';
import { ComposerModal } from '../../../components/Composer/ComposerModal';
import { notify } from '../../../lib/notify';
import { STRINGS } from '../../../constants/strings';
import { logger } from '../../../lib/logger';
import { PostCard } from './PostCard';

const { COMMUNITY: S } = STRINGS;

type RegisterGuideHandler = (title: string, description: string) => void;

interface PostsSectionProps {
  viewerRole: Role;
  currentTab: WallTab;
  onTabChange: (tab: WallTab) => void;
  publicPosts: Post[];
  privatePosts: Post[];
  communityId: string;
  currentUserId: string | undefined;
  userInitial: string;
  mode: PageMode;
  onRegisterGuide?: RegisterGuideHandler;
  onLike?: (postId: number | string) => Promise<void> | void;
  onCreatePost?: (content: string, visibility: 'public' | 'private') => Promise<void> | void;
  onUnlock?: () => void;
}

export function PostsSection({
  viewerRole,
  currentTab,
  onTabChange,
  publicPosts,
  privatePosts,
  communityId,
  currentUserId,
  userInitial,
  mode,
  onRegisterGuide,
  onLike,
  onCreatePost,
  onUnlock,
}: PostsSectionProps) {
  const perm = getPermissions(viewerRole);
  const isGuest = perm.isGuest;
  const tabListId = useId();
  const publicTabId = `${tabListId}-public`;
  const privateTabId = `${tabListId}-private`;
  const panelId = `${tabListId}-panel`;
  const tabRefs = useRef<Record<WallTab, HTMLButtonElement | null>>({
    public: null,
    private: null,
  });

  const [postModalOpen, setPostModalOpen] = useState(false);
  const [postModalVisibility, setPostModalVisibility] = useState<'public' | 'private'>('public');

  const openPostComposer = useCallback(
    (visibility: 'public' | 'private') => {
      const action = visibility === 'public' ? 'post_public' : 'post_private';
      if (!canPerformAction(perm, action)) {
        const msg = getPermissionDeniedMessage(action);
        notify.error(msg.title, msg.description);
        return;
      }

      setPostModalVisibility(visibility);
      setPostModalOpen(true);
    },
    [perm]
  );

  const showCreatePostRegisterGuide = useCallback(() => {
    if (onRegisterGuide) {
      onRegisterGuide('註冊後即可發表貼文', '免費註冊即可分享社區生活與參與討論');
      return;
    }
    notify.error(S.NOTIFY_LOGIN_TITLE, S.NOTIFY_LOGIN_DESC);
  }, [onRegisterGuide]);

  const dispatchOpenPostModal = useModeAwareAction<'public' | 'private'>({
    visitor: () => showCreatePostRegisterGuide(),
    demo: openPostComposer,
    live: openPostComposer,
  });

  const openPostModal = useCallback(
    (visibility: 'public' | 'private') => {
      void dispatchOpenPostModal(visibility).then((result) => {
        if (!result.ok) {
          logger.error('[PostsSection] Failed to open post composer', {
            visibility,
            error: result.error,
          });
          notify.error('操作失敗', result.error);
        }
      });
    },
    [dispatchOpenPostModal]
  );

  const {
    visible: visiblePublic,
    hiddenCount: hiddenPublicCount,
    nextHidden: nextHiddenPost,
  } = useGuestVisibleItems(publicPosts, perm.canSeeAllPosts);

  const focusTab = useCallback((tab: WallTab) => {
    tabRefs.current[tab]?.focus();
  }, []);

  const activeTabs = useMemo<WallTab[]>(() => {
    return canPerformAction(perm, 'view_private') ? ['public', 'private'] : ['public'];
  }, [perm]);

  const handlePrivateClick = () => {
    if (!canPerformAction(perm, 'view_private')) {
      notify.error(
        perm.isGuest ? S.NOTIFY_PRIVATE_ACCESS_DENIED : S.NOTIFY_VERIFY_REQUIRED,
        perm.isGuest
          ? S.NOTIFY_PRIVATE_ACCESS_DENIED_DESC
          : S.NOTIFY_VERIFY_REQUIRED_DESC
      );
      return;
    }
    onTabChange('private');
  };

  const handleTabKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, current: WallTab) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        return;
      }
      event.preventDefault();

      const lastAvailableTab = activeTabs.at(-1);

      if (event.key === 'Home') {
        focusTab('public');
        if (currentTab !== 'public') {
          onTabChange('public');
        }
        return;
      }

      if (event.key === 'End') {
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
      if (!nextTab) return;

      if (nextTab === 'private' && !canPerformAction(perm, 'view_private')) {
        focusTab('public');
        onTabChange('public');
        return;
      }

      focusTab(nextTab);
      onTabChange(nextTab);
    },
    [activeTabs, currentTab, focusTab, onTabChange, perm]
  );

  return (
    <section
      id="public-wall"
      className="bg-white/98 scroll-mt-20 overflow-hidden rounded-[18px] border border-border-light shadow-[0_2px_12px_var(--mh-shadow-card)]"
      aria-labelledby="posts-heading"
    >
      <div className="from-brand/3 to-brand-600/1 border-brand/5 flex items-center justify-between border-b bg-gradient-to-br px-4 py-3.5">
        <h2
          id="posts-heading"
          className="flex items-center gap-1.5 text-[15px] font-extrabold text-brand-700"
        >
          <Flame size={16} aria-hidden="true" />
          {S.SECTION_TITLE}
        </h2>
      </div>

      <div
        className="flex flex-wrap gap-1.5 px-3.5 pb-3.5 pt-2"
        role="tablist"
        aria-label="社區牆分類"
      >
        <button
          type="button"
          role="tab"
          id={publicTabId}
          ref={(node) => {
            tabRefs.current.public = node;
          }}
          aria-selected={currentTab === 'public'}
          aria-controls={panelId}
          onClick={() => onTabChange('public')}
          onKeyDown={(event) => handleTabKeyDown(event, 'public')}
          tabIndex={currentTab === 'public' ? 0 : -1}
          className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${currentTab === 'public' ? 'bg-brand/10 border-brand-600 font-bold text-brand' : 'hover:bg-brand/8 bg-brand-100/80 border-transparent text-ink-600 hover:text-brand'}`}
        >
          {S.TAB_PUBLIC}
        </button>
        <button
          type="button"
          role="tab"
          id={privateTabId}
          ref={(node) => {
            tabRefs.current.private = node;
          }}
          aria-selected={currentTab === 'private'}
          aria-controls={panelId}
          aria-disabled={!canPerformAction(perm, 'view_private')}
          onClick={handlePrivateClick}
          onKeyDown={(event) => handleTabKeyDown(event, 'private')}
          tabIndex={
            canPerformAction(perm, 'view_private') ? (currentTab === 'private' ? 0 : -1) : -1
          }
          className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${currentTab === 'private' ? 'bg-brand/10 border-brand-600 font-bold text-brand' : 'hover:bg-brand/8 bg-brand-100/80 border-transparent text-ink-600 hover:text-brand'} ${!canPerformAction(perm, 'view_private') ? 'opacity-60' : ''}`}
        >
          {S.TAB_PRIVATE}{' '}
          {!canPerformAction(perm, 'view_private') && (
            <Lock size={12} aria-hidden="true" />
          )}
        </button>
      </div>

      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={currentTab === 'public' ? publicTabId : privateTabId}
        tabIndex={0}
        className="flex flex-col gap-2.5 px-3.5 pb-3.5"
      >
        {currentTab === 'public' ? (
          <>
            {visiblePublic.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                communityId={communityId}
                currentUserId={currentUserId}
                userInitial={userInitial}
                mode={mode}
                {...(onRegisterGuide ? { onRegisterGuide } : {})}
                {...(onLike ? { onLike } : {})}
              />
            ))}

            <LockedOverlay
              visible={hiddenPublicCount > 0 && !!nextHiddenPost}
              hiddenCount={hiddenPublicCount}
              countLabel={S.LOCKED_OVERLAY_COUNT_LABEL}
              benefits={[S.LOCKED_OVERLAY_BENEFIT_1, S.LOCKED_OVERLAY_BENEFIT_2]}
              showCta
              {...(onUnlock ? { onCtaClick: onUnlock } : {})}
            >
              {nextHiddenPost && (
                <PostCard
                  post={nextHiddenPost}
                  communityId={communityId}
                  currentUserId={currentUserId}
                  userInitial={userInitial}
                  mode={mode}
                  {...(onRegisterGuide ? { onRegisterGuide } : {})}
                />
              )}
            </LockedOverlay>

            {(canPerformAction(perm, 'post_public') || isGuest) && (
              <div className="bg-brand/3 flex justify-center rounded-[14px] border border-dashed border-border-light p-5">
                <button
                  type="button"
                  onClick={() => openPostModal('public')}
                  className="bg-brand/6 hover:bg-brand/12 border-brand/10 flex w-full items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold text-brand"
                >
                  <Pencil size={12} aria-hidden="true" />
                  {S.BTN_POST_PUBLIC}
                </button>
              </div>
            )}
          </>
        ) : canPerformAction(perm, 'view_private') ? (
          <>
            {privatePosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                communityId={communityId}
                currentUserId={currentUserId}
                userInitial={userInitial}
                mode={mode}
                {...(onRegisterGuide ? { onRegisterGuide } : {})}
                {...(onLike ? { onLike } : {})}
              />
            ))}
            {canPerformAction(perm, 'post_private') ? (
              <div className="bg-brand/3 flex justify-center rounded-[14px] border border-dashed border-border-light p-5">
                <button
                  type="button"
                  onClick={() => openPostModal('private')}
                  className="bg-brand/6 hover:bg-brand/12 border-brand/10 flex w-full items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold text-brand"
                >
                  <Pencil size={12} aria-hidden="true" />
                  {S.BTN_POST_PRIVATE}
                </button>
              </div>
            ) : (
              <p className="flex items-center justify-center gap-1 py-3 text-center text-[11px] text-ink-600">
                <Lightbulb size={12} aria-hidden="true" />
                {S.MSG_AGENT_VIEW_ONLY}
              </p>
            )}
          </>
        ) : (
          <div className="bg-brand/3 flex flex-col items-center justify-center rounded-[14px] px-5 py-10 text-center">
            <Lock size={48} className="mb-3 opacity-50" aria-hidden="true" />
            <h4 className="mb-1.5 text-sm font-bold text-brand-700">{S.LOCKED_TITLE}</h4>
            <p className="mb-4 text-xs text-ink-600">
              {perm.isGuest ? S.LOCKED_DESC_GUEST : S.LOCKED_DESC_USER}
            </p>
            <button
              type="button"
              onClick={onUnlock}
              className="rounded-full bg-brand px-5 py-2.5 text-xs font-bold text-white"
            >
              {perm.isGuest ? S.BTN_UNLOCK_GUEST : S.BTN_UNLOCK_USER}
            </button>
          </div>
        )}
      </div>

      <ComposerModal
        isOpen={postModalOpen}
        onClose={() => setPostModalOpen(false)}
        onSubmit={async (data) => {
          if (isGuest) {
            showCreatePostRegisterGuide();
            return;
          }
          if (onCreatePost) {
            await onCreatePost(data.content, data.visibility);
          }
        }}
        mode="community"
        initialVisibility={postModalVisibility}
      />
    </section>
  );
}
