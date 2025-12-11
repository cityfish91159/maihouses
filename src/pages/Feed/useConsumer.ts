
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useFeedData } from '../../hooks/useFeedData';
import { useAuth } from '../../hooks/useAuth';
import { notify } from '../../lib/notify';
import { STRINGS } from '../../constants/strings';
import type { UserProfile, ActiveTransaction, SidebarData } from '../../types/feed';
import { MOCK_FEED_STATS, MOCK_SALE_ITEMS, MOCK_ACTIVE_TRANSACTION } from '../../services/mock/feed';

const S = STRINGS.FEED;

export function useConsumer(userId?: string, forceMock?: boolean) {
    const { user, isAuthenticated, role, loading: authLoading } = useAuth();
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
    } = useFeedData();

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
        if (!isAuthenticated || !user) return null;
        return {
            id: user.id,
            name: user.user_metadata?.name || user.email?.split('@')[0] || S.DEFAULT_USER,
            role: role || 'member',
            stats: MOCK_FEED_STATS,
            communityId: 'test-uuid',
            communityName: S.DEFAULT_COMMUNITY_NAME,
        };
    }, [isAuthenticated, user, role]);

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
    const sidebarData = useMemo<SidebarData>(() => ({
        hotPosts: data.posts.slice(0, 3).map((p) => ({
            id: p.id,
            title: p.title,
            communityName: p.communityName || '社區',
            likes: p.likes || 0,
        })),
        saleItems: MOCK_SALE_ITEMS,
    }), [data.posts]);

    const handleLike = useCallback(async (postId: string | number) => {
        if (!isAuthenticated) {
            notify.error(S.NOTIFY.LOGIN_REQUIRED, S.NOTIFY.LOGIN_REQUIRED_LIKE);
            return;
        }
        try {
            await toggleLike(postId);
        } catch (err) {
            console.error('Failed to toggle like', err);
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
            console.error('Failed to create post', err);
            throw err;
        }
    }, [createPost, isAuthenticated, userProfile]);

    const handleReply = useCallback((postId: string | number) => {
        notify.info(S.NOTIFY.FEATURE_WIP, S.NOTIFY.REPLY_WIP);
        console.log('Reply to post:', postId);
    }, []);

    const handleShare = useCallback((postId: string | number) => {
        notify.info(S.NOTIFY.FEATURE_WIP, S.NOTIFY.SHARE_WIP);
        console.log('Share post:', postId);
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
        handleShare,
    };
}
