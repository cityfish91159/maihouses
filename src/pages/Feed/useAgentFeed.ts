import { useCallback, useMemo } from 'react';
import { useFeedData } from '../../hooks/useFeedData';
import { STRINGS } from '../../constants/strings';
import { notify } from '../../lib/notify';
import type { UagSummary, PerformanceStats, TodoItem } from '../../types/agent';

import { MOCK_UAG_SUMMARY, MOCK_PERFORMANCE_STATS, MOCK_TODO_LIST } from '../../services/mock/agent';

export function useAgentFeed(userId?: string, forceMock?: boolean) {
    const feed = useFeedData({
        persistMockState: true,
        role: 'agent',
    });

    const { useMock } = feed;

    // Mock/API Data Logic (M1 Audit Fix)
    // Currently API is not deployed for Agent Stats, so we fall back to Mock if useMock is true OR API fails.
    // In strict production, this would be: if (useMock) return MOCK else return API_DATA

    const uagSummary = useMemo<UagSummary>(() => {
        // if (!useMock) { /* TODO: fetchApi(userId) */ }
        return MOCK_UAG_SUMMARY;
    }, [useMock]);

    const performanceStats = useMemo<PerformanceStats>(() => {
        return MOCK_PERFORMANCE_STATS;
    }, [useMock]);

    const todoList = useMemo<TodoItem[]>(() => {
        return MOCK_TODO_LIST;
    }, [useMock]);

    const handleComment = useCallback(async (postId: string | number, content: string) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        notify.success('留言成功', '您的留言已發佈');
    }, []);

    return {
        ...feed,
        uagSummary,
        performanceStats,
        todoList,
        handleComment,
    };
}
