import { useCallback, useMemo } from 'react';
import { useFeedData } from '../../hooks/useFeedData';
import { STRINGS } from '../../constants/strings';
import { notify } from '../../lib/notify';
import type { UagSummary, PerformanceStats, TodoItem } from '../../types/agent';

export function useAgentFeed(userId?: string, forceMock?: boolean) {
    const feed = useFeedData({
        persistMockState: true,
    });

    // Mock UAG Data
    const uagSummary = useMemo<UagSummary>(() => ({
        grade: 'S',
        score: 92,
        growth: 15,
        tags: ['回覆迅速', '市場觀點獨到', '親和力高'],
    }), []);

    // Mock Performance Stats
    const performanceStats = useMemo<PerformanceStats>(() => ({
        score: 2560,
        days: 128,
        liked: 73,
        views: 1250,
        replies: 45,
        contacts: 8,
    }), []);

    // Mock Todo List
    const todoList = useMemo<TodoItem[]>(() => [
        { id: 't1', type: 'reply', content: '回覆陳小姐關於「惠宇上晴」的詢問', isDone: false, time: '10:00' },
        { id: 't2', type: 'contact', content: '聯繫李先生安排看房', isDone: false, time: '14:30' },
        { id: 't3', type: 'system', content: '更新個人簡介以提升信任度', isDone: true, time: 'Yesterday' },
    ], []);

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
