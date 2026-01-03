/**
 * MSG-5: useAgentConversations
 *
 * 獲取房仲的客戶對話列表
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { logger } from '../lib/logger';
import type { ConversationListItem } from '../types/messaging.types';

interface UseAgentConversationsResult {
  conversations: ConversationListItem[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * 獲取房仲的所有客戶對話
 */
export function useAgentConversations(): UseAgentConversationsResult {
  const { user } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['agentConversations', user?.id],
    queryFn: async (): Promise<ConversationListItem[]> => {
      if (!user?.id) return [];

      const { data: conversations, error: queryError } = await supabase
        .from('conversations')
        .select(`
          id,
          status,
          unread_agent,
          property_id,
          consumer_session_id,
          created_at,
          updated_at
        `)
        .eq('agent_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (queryError) {
        logger.error('[useAgentConversations] Query failed', { error: queryError.message });
        throw new Error(queryError.message);
      }

      if (!conversations || conversations.length === 0) {
        return [];
      }

      // 轉換為 ConversationListItem 格式
      const items: ConversationListItem[] = conversations.map((conv) => ({
        id: conv.id,
        status: conv.status as ConversationListItem['status'],
        unread_count: conv.unread_agent ?? 0,
        counterpart: {
          // 匿名顯示：訪客-XXXX
          name: `訪客-${conv.consumer_session_id?.slice(-4).toUpperCase() ?? 'XXXX'}`,
        },
        property: conv.property_id
          ? { id: conv.property_id, title: conv.property_id }
          : undefined,
        last_message: undefined, // TODO: JOIN messages 取得最後訊息
      }));

      return items;
    },
    enabled: !!user?.id,
    staleTime: 30_000, // 30 秒
    refetchInterval: 60_000, // 1 分鐘自動刷新
  });

  return {
    conversations: data ?? [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
