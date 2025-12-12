/**
 * useAgentFeed
 *
 * Agent 專用 Feed Hook
 * P6-REFACTOR: Mock 資料已抽離至 mockData/posts/agent.ts
 */

import { useCallback, useMemo } from 'react';
import { useFeedData } from '../../hooks/useFeedData';
import { notify } from '../../lib/notify';
import { STRINGS } from '../../constants/strings';
import {
    getAgentFeedData,
    getAgentUagSummary,
    getAgentPerformanceStats,
    getAgentTodoList,
} from './mockData';

const S = STRINGS.FEED;

export function useAgentFeed(userId?: string, forceMock?: boolean) {
    // P6-REFACTOR: Use Agent-specific mock data with deep copy
    const agentMockData = useMemo(() => getAgentFeedData(), []);

    const feed = useFeedData({
        persistMockState: true,
        initialMockData: agentMockData,
    });

    // P6-REFACTOR: UAG Data from external mockData (deep copy)
    const uagSummary = useMemo(() => getAgentUagSummary(), []);

    // P6-REFACTOR: Performance Stats from external mockData (deep copy)
    const performanceStats = useMemo(() => getAgentPerformanceStats(), []);

    // P6-REFACTOR: Todo List from external mockData (deep copy)
    const todoList = useMemo(() => getAgentTodoList(), []);

    const handleComment = useCallback(async (postId: string | number, content: string) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        notify.success(S.NOTIFY.COMMENT_SUCCESS, S.NOTIFY.COMMENT_SUCCESS_DESC);
    }, []);

    return {
        ...feed,
        uagSummary,
        performanceStats,
        todoList,
        handleComment,
    };
}
