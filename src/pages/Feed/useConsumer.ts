/**
 * useConsumer
 *
 * Consumer 專用 Feed Hook
 * P6-REFACTOR: Mock 資料已抽離至 mockData/posts/consumer.ts
 * MSG-3: 整合 useNotifications 支援未讀私訊提醒橫幅
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useFeedData, type UseFeedDataOptions } from '../../hooks/useFeedData';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { notify } from '../../lib/notify';
import { logger } from '../../lib/logger';
import { STRINGS } from '../../constants/strings';
import type { UserProfile, ActiveTransaction, SidebarData } from '../../types/feed';
import type { Role } from '../../types/community';
import type { ConversationListItem } from '../../types/messaging.types';
import { MOCK_FEED_STATS, MOCK_ACTIVE_TRANSACTION } from '../../constants/mockData';
// P7-Audit-C6: Use shared mock data
import { getConsumerFeedData } from './mockData';
import { safeLocalStorage } from '../../lib/safeStorage';
import type { PageMode } from '../../hooks/usePageMode';

const DEFAULT_MOCK_DATA = getConsumerFeedData();

const S = STRINGS.FEED;

export function useConsumer(userId?: string, mode?: PageMode) {
  const { user, isAuthenticated: realAuth, role, loading: authLoading } = useAuth();

  // MSG-3: 取得未讀私訊通知（只在真正登入時查詢）
  const { notifications, error: notificationsError } = useNotifications();

  // MSG-3: 處理通知查詢錯誤（不影響主要功能）
  useEffect(() => {
    if (notificationsError) {
      logger.warn('useConsumer.notifications.loadFailed', {
        error: notificationsError,
      });
      // 不顯示 toast，避免干擾用戶體驗
    }
  }, [notificationsError]);

  /**
   * MSG-3: 獲取最新未讀私訊通知
   *
   * 規則：
   * - 只有真正登入的用戶才顯示（Demo 模式不顯示）
   * - 返回未讀通知列表中的第一條
   * - 如果沒有通知或未登入，返回 null
   *
   * @returns {ConversationListItem | null} 最新通知或 null
   */
  const latestNotification = useMemo<ConversationListItem | null>(() => {
    if (!realAuth || !user || !notifications || notifications.length === 0) {
      return null;
    }
    return notifications[0] ?? null;
  }, [realAuth, user, notifications]);

  const feedOptions: UseFeedDataOptions = {
    // P6-REFACTOR: Use shared mock data instance to prevent duplication (C6)
    initialMockData: DEFAULT_MOCK_DATA,
  };
  if (mode !== undefined) {
    feedOptions.mode = mode;
  }

  const {
    data,
    useMock,
    setUseMock,
    isLoading,
    error,
    refresh,
    toggleLike,
    createPost,
    addComment,
    isLiked,
  } = useFeedData(feedOptions);

  const isDemo = mode === 'demo';
  // 在 Demo 模式下，如果沒有真實登入，則視為「模擬登入」
  const isAuthenticated = realAuth || isDemo;

  // 設置頁面標題
  useEffect(() => {
    document.title = STRINGS.FEED.PAGE_TITLE;
  }, []);

  // Mock 用戶資料
  const userProfile = useMemo<UserProfile | null>(() => {
    if (!isAuthenticated) return null;

    // 優先使用真實用戶資料
    if (realAuth && user) {
      return {
        id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || S.DEFAULT_USER,
        role: role || 'member',
        stats: MOCK_FEED_STATS,
        communityId: S.DEFAULT_COMMUNITY_ID,
        communityName: S.DEFAULT_COMMUNITY_NAME,
      };
    }

    // Demo 模式且未登入時，回傳模擬用戶資料
    if (isDemo) {
      return {
        id: 'demo-user',
        name: S.DEFAULT_USER, // '用戶'
        role: 'member',
        stats: MOCK_FEED_STATS,
        communityId: S.DEFAULT_COMMUNITY_ID,
        communityName: S.DEFAULT_COMMUNITY_NAME,
      };
    }

    return null;
  }, [realAuth, user, role, isDemo, isAuthenticated]);

  // Mock 交易狀態
  const [activeTransaction] = useState<ActiveTransaction>(() => {
    const hasActive = safeLocalStorage.getItem('mai_active_tx') === 'true';
    if (hasActive) {
      return MOCK_ACTIVE_TRANSACTION;
    }
    return { hasActive: false };
  });

  // Mock 側邊欄資料
  // P5-A2 修復：使用 useFeedData 提供的 sidebarData (來源：API 或 Mock)
  const sidebarData = useMemo<SidebarData>(() => data.sidebarData, [data.sidebarData]);

  const handleLike = useCallback(
    async (postId: string | number) => {
      if (!isAuthenticated) {
        notify.error(S.NOTIFY.LOGIN_REQUIRED, S.NOTIFY.LOGIN_REQUIRED_LIKE);
        return;
      }
      try {
        await toggleLike(postId);
      } catch (err) {
        // console.error('Failed to toggle like', err); // B2: Removed console.error
        notify.error(S.NOTIFY.LIKE_FAILED, S.NOTIFY.LIKE_FAILED_DESC);
      }
    },
    [toggleLike, isAuthenticated]
  );

  const handleCreatePost = useCallback(
    async (content: string, images?: File[]) => {
      if (!isAuthenticated) {
        notify.error(S.NOTIFY.LOGIN_REQUIRED, S.NOTIFY.LOGIN_REQUIRED_POST);
        return;
      }
      const communityId = userProfile?.communityId || 'mock-community';
      try {
        if (images && images.length > 0) {
          await createPost(content, communityId, images);
        } else {
          await createPost(content, communityId);
        }
      } catch (err) {
        // console.error('Failed to create post', err); // B2: Removed console.error
        throw err;
      }
    },
    [createPost, isAuthenticated, userProfile]
  );

  const handleReply = useCallback((postId: string | number) => {
    if (import.meta.env.DEV) {
      logger.debug('[Consumer] Reply toggled for post', { postId });
    }
    // 測試期望：reply 為 no-op，不彈出通知
  }, []);

  const handleComment = useCallback(
    async (postId: string | number, content: string) => {
      if (!isAuthenticated) {
        notify.error(S.NOTIFY.LOGIN_REQUIRED, S.NOTIFY.LOGIN_REQUIRED_POST);
        return;
      }
      try {
        await addComment(postId, content);
        notify.success(S.POST.COMMENT_SUCCESS.TITLE, S.POST.COMMENT_SUCCESS.DESC);
      } catch (err) {
        // E7 Fix: Removed console.error
        notify.error('留言失敗', '請稍後再試');
      }
    },
    [isAuthenticated, addComment]
  );

  const handleShare = useCallback(async (postId: string | number) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?post=${postId}`;
    const shareData = {
      title: 'MaiHouses 社區動態',
      text: '來看看這則有趣的社區貼文！',
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // [NASA TypeScript Safety] 使用 instanceof 取代 as Error
        if (!(err instanceof Error) || err.name !== 'AbortError') {
          notify.error('分享失敗', '請稍後再試');
        }
      }
      return;
    }

    if (!navigator?.clipboard?.writeText) {
      notify.info('分享功能暫未支援', '請在瀏覽器中操作');
      return;
    }

    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        notify.success('連結已複製', '您可以將連結分享給朋友');
      })
      .catch(() => {
        notify.error('複製失敗', '請手動複製網址');
      });
  }, []);

  const userInitial = userProfile?.name.charAt(0).toUpperCase() || 'U';

  // Phase 7: 提供 currentUserId 給留言系統
  const currentUserId = realAuth && user ? user.id : undefined;

  return {
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
    // MSG-3: 新增通知相關資料
    latestNotification,
    // Phase 7: 留言系統需要的 currentUserId
    currentUserId,
  };
}
