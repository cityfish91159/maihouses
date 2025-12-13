
/**
 * useConsumer
 *
 * Consumer 專用 Feed Hook
 * P6-REFACTOR: Mock 資料已抽離至 mockData/posts/consumer.ts
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useFeedData } from '../../hooks/useFeedData';
import { useAuth } from '../../hooks/useAuth';
import { notify } from '../../lib/notify';
import { STRINGS } from '../../constants/strings';
import type { UserProfile, ActiveTransaction, SidebarData } from '../../types/feed';
import type { Role } from '../../types/community';
import { MOCK_FEED_STATS, MOCK_ACTIVE_TRANSACTION } from '../../services/mock/feed';
// P7-Audit-C6: Use shared mock data
import { getConsumerFeedData } from './mockData';

const DEFAULT_MOCK_DATA = getConsumerFeedData();


const S = STRINGS.FEED;

export function useConsumer(userId?: string, forceMock?: boolean) {
    const { user, isAuthenticated: realAuth, role, loading: authLoading } = useAuth();


    const {
        data,
        useMock,
        setUseMock,
        isLoading,
        error,
        refresh,
        toggleLike,
        createPost,
        isLiked,
    } = useFeedData({
        // P6-REFACTOR: Inject Consumer-specific mock data with deep copy
        initialMockData: useMemo(() => getConsumerFeedData(), []),
    });

    // 判定是否為 Demo 模式 (forceMock or userId starts with demo-)
    const isDemo = forceMock || userId?.startsWith('demo-');
    // 在 Demo 模式下，如果沒有真實登入，則視為「模擬登入」
    const isAuthenticated = realAuth || isDemo;

    // 根據 forceMock 設置初始 mock 狀態
    useEffect(() => {
        if (forceMock !== undefined) {
            setUseMock(forceMock);
        }
    }, [forceMock, setUseMock]);

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
                role: (userId === 'demo-agent' ? 'agent' : 'member') as Role,
                stats: MOCK_FEED_STATS,
                communityId: S.DEFAULT_COMMUNITY_ID,
                communityName: S.DEFAULT_COMMUNITY_NAME,
            };
        }

        return null;
    }, [realAuth, user, role, isDemo, userId, isAuthenticated]);

    // Mock 交易狀態
    const [activeTransaction] = useState<ActiveTransaction>(() => {
        try {
            const hasActive = localStorage.getItem('mai_active_tx') === 'true';
            if (hasActive) {
                return MOCK_ACTIVE_TRANSACTION;
            }
            return { hasActive: false };
        } catch {
            return { hasActive: false };
        }
    });

    // Mock 側邊欄資料
    // P5-A2 修復：使用 useFeedData 提供的 sidebarData (來源：API 或 Mock)
    const sidebarData = useMemo<SidebarData>(() => data.sidebarData, [data.sidebarData]);

    const handleLike = useCallback(async (postId: string | number) => {
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
    }, [toggleLike, isAuthenticated]);

    const handleCreatePost = useCallback(async (content: string) => {
        if (!isAuthenticated) {
            notify.error(S.NOTIFY.LOGIN_REQUIRED, S.NOTIFY.LOGIN_REQUIRED_POST);
            return;
        }
        try {
            await createPost(content, userProfile?.communityId);
        } catch (err) {
            // console.error('Failed to create post', err); // B2: Removed console.error
            throw err;
        }
    }, [createPost, isAuthenticated, userProfile]);

    const handleReply = useCallback((postId: string | number) => {
        notify.info(S.NOTIFY.FEATURE_WIP, S.NOTIFY.REPLY_WIP);
        // P6 Phase 1: Toggle UI only, logic handled in FeedPostCard via onComment
    }, []);

    const handleComment = useCallback(async (postId: string | number, content: string) => {
        if (!isAuthenticated) {
            notify.error(S.NOTIFY.LOGIN_REQUIRED, S.NOTIFY.LOGIN_REQUIRED_POST);
            return;
        }
        // P6 Phase 1: Submitting comment (Mock)
        // In Phase 2/3, this will call createComment in useFeedData
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate latency
        notify.success(S.POST.COMMENT_SUCCESS.TITLE, S.POST.COMMENT_SUCCESS.DESC);
    }, [isAuthenticated]);

    const handleShare = useCallback((postId: string | number) => {
        notify.info(S.NOTIFY.FEATURE_WIP, S.NOTIFY.SHARE_WIP);
    }, []);

    const userInitial = userProfile?.name.charAt(0).toUpperCase() || 'U';

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
    };
}
