/**
 * useNotifications Hook
 * 
 * 負責管理用戶通知的 Hook
 * 目前回傳固定值 0 (空實作)，預留未來接上 real-time notification 邏輯
 */

import { useMemo } from 'react';
import { useAuth } from './useAuth';

interface UseNotificationsReturn {
    count: number;
    isLoading: boolean;
}

export function useNotifications(): UseNotificationsReturn {
    const { isAuthenticated } = useAuth();

    // Use useMemo instead of useEffect + setState to avoid cascading renders
    // Future: Replace with real notification fetching logic
    const count = useMemo(() => {
        if (!isAuthenticated) return 0;
        // Future: Fetch from API or subscribe to websocket
        return 0;
    }, [isAuthenticated]);

    return {
        count,
        isLoading: false
    };
}
