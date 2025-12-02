/**
 * useCommunityWall
 * 
 * 社區牆資料獲取 Hook
 * 提供 SWR 風格的資料獲取與快取
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getCommunityWall, 
  getPublicPosts, 
  getPrivatePosts,
  toggleLike as apiToggleLike,
  createPost as apiCreatePost,
  CommunityWallData,
  CommunityPost,
  clearCommunityCache,
} from '../services/communityService';

export interface UseCommunityWallOptions {
  /** 是否包含私密貼文（需登入） */
  includePrivate?: boolean;
  /** 資料刷新間隔（毫秒），0 表示不自動刷新 */
  refreshInterval?: number;
  /** 是否在視窗聚焦時刷新 */
  refreshOnFocus?: boolean;
}

export interface UseCommunityWallReturn {
  /** 社區牆資料 */
  data: CommunityWallData | null;
  /** 是否載入中 */
  isLoading: boolean;
  /** 錯誤訊息 */
  error: string | null;
  /** 手動刷新 */
  refresh: () => Promise<void>;
  /** 按讚/取消按讚 */
  toggleLike: (postId: string) => Promise<void>;
  /** 發布貼文 */
  createPost: (content: string, visibility?: 'public' | 'private') => Promise<void>;
  /** 樂觀更新後的貼文列表（即時反映 UI） */
  optimisticPosts: CommunityPost[];
}

export function useCommunityWall(
  communityId: string | undefined,
  options: UseCommunityWallOptions = {}
): UseCommunityWallReturn {
  const { 
    includePrivate = false,
    refreshInterval = 0,
    refreshOnFocus = true,
  } = options;

  const [data, setData] = useState<CommunityWallData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [optimisticPosts, setOptimisticPosts] = useState<CommunityPost[]>([]);
  
  const mountedRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 獲取資料
  const fetchData = useCallback(async (force = false) => {
    if (!communityId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const wallData = await getCommunityWall(communityId, {
        forceRefresh: force,
        includePrivate,
      });
      
      if (mountedRef.current) {
        setData(wallData);
        // 初始化樂觀更新列表
        setOptimisticPosts([
          ...wallData.posts.public,
          ...(includePrivate ? wallData.posts.private : []),
        ]);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err.message || '載入社區牆失敗');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [communityId, includePrivate]);

  // 手動刷新
  const refresh = useCallback(async () => {
    clearCommunityCache(communityId);
    await fetchData(true);
  }, [communityId, fetchData]);

  // 按讚（樂觀更新）
  const toggleLike = useCallback(async (postId: string) => {
    // 樂觀更新 UI
    setOptimisticPosts(prev => 
      prev.map(post => {
        if (post.id !== postId) return post;
        const isLiked = post.liked_by.includes('current-user'); // 暫時用假 ID
        return {
          ...post,
          likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1,
          liked_by: isLiked 
            ? post.liked_by.filter(id => id !== 'current-user')
            : [...post.liked_by, 'current-user'],
        };
      })
    );

    try {
      await apiToggleLike(postId);
      // 成功後不需要做什麼，樂觀更新已經處理了
    } catch (err) {
      // 失敗時回滾
      await refresh();
    }
  }, [refresh]);

  // 發布貼文
  const createPost = useCallback(async (
    content: string, 
    visibility: 'public' | 'private' = 'public'
  ) => {
    if (!communityId) throw new Error('缺少社區 ID');
    
    await apiCreatePost(communityId, content, visibility);
    await refresh();
  }, [communityId, refresh]);

  // 初次載入
  useEffect(() => {
    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  // 自動刷新
  useEffect(() => {
    if (refreshInterval > 0 && communityId) {
      intervalRef.current = setInterval(() => {
        fetchData(true);
      }, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refreshInterval, communityId, fetchData]);

  // 視窗聚焦時刷新
  useEffect(() => {
    if (!refreshOnFocus) return;

    const handleFocus = () => {
      fetchData(true);
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshOnFocus, fetchData]);

  return {
    data,
    isLoading,
    error,
    refresh,
    toggleLike,
    createPost,
    optimisticPosts,
  };
}

/**
 * 分頁載入貼文 Hook
 */
export function useCommunityPosts(
  communityId: string | undefined,
  visibility: 'public' | 'private' = 'public',
  options: { pageSize?: number } = {}
) {
  const { pageSize = 20 } = options;
  
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    if (!communityId || isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const fetcher = visibility === 'public' ? getPublicPosts : getPrivatePosts;
      const { items, total } = await fetcher(communityId, { page, limit: pageSize });
      
      setPosts(prev => [...prev, ...items]);
      setPage(prev => prev + 1);
      setHasMore(posts.length + items.length < total);
    } catch (err: any) {
      setError(err.message || '載入失敗');
    } finally {
      setIsLoading(false);
    }
  }, [communityId, visibility, page, pageSize, isLoading, hasMore, posts.length]);

  const reset = useCallback(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, []);

  // 初次載入
  useEffect(() => {
    if (communityId) {
      loadMore();
    }
  }, [communityId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    posts,
    isLoading,
    error,
    hasMore,
    loadMore,
    reset,
  };
}

export default useCommunityWall;
