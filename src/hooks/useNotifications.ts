/**
 * useNotifications Hook
 * 
 * 負責管理用戶通知的 Hook
 * 目前回傳固定值 0 (空實作)，預留未來接上 real-time notification 邏輯
 */

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface UseNotificationsReturn {
    count: number;
    isLoading: boolean;
}

export function useNotifications(): UseNotificationsReturn {
    const { isAuthenticated } = useAuth();
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!isAuthenticated) {
            setCount(0);
            return;
        }

        // Future: Fetch from API or subscribe to websocket
        // For now, clean zero state (No fake numbers)
        setCount(0);
    }, [isAuthenticated]);

    return {
        count,
        isLoading: false
    };
}
