/**
 * MSG-5: useAgentConversations
 *
 * 獲取房仲的客戶對話列表
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { logger } from '../lib/logger';
import { ConversationStatusSchema, SenderTypeSchema, type ConversationListItem } from '../types/messaging.types';

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

      // 查詢對話及關聯的最後訊息和物件資訊
      const { data: conversations, error: queryError } = await supabase
        .from('conversations')
        .select(`
          id,
          status,
          unread_agent,
          property_id,
          consumer_session_id,
          updated_at,
          messages (
            content,
            created_at,
            sender_type
          ),
          properties:property_id (
            title,
            images
          )
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

      // 轉換為 ConversationListItem 格式，使用 Zod 驗證
      const items: ConversationListItem[] = conversations.map((conv) => {
        // Zod 驗證 status
        const statusResult = ConversationStatusSchema.safeParse(conv.status);
        const status = statusResult.success ? statusResult.data : 'pending';

        // 取得最後一則訊息（按 created_at 排序）
        const messages = Array.isArray(conv.messages) ? conv.messages : [];
        const lastMsg = messages.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        // Zod 驗證 sender_type
        const senderTypeResult = lastMsg ? SenderTypeSchema.safeParse(lastMsg.sender_type) : null;
        const senderType = senderTypeResult?.success ? senderTypeResult.data : 'consumer';

        // 取得物件資訊
        const propertyData = conv.properties as { title?: string; images?: string[] } | null;

        return {
          id: conv.id,
          status,
          unread_count: conv.unread_agent ?? 0,
          counterpart: {
            name: `訪客-${conv.consumer_session_id?.slice(-4).toUpperCase() ?? 'XXXX'}`,
          },
          property: conv.property_id && propertyData
            ? {
                id: conv.property_id,
                title: propertyData.title ?? '物件',
                image: propertyData.images?.[0],
              }
            : undefined,
          last_message: lastMsg
            ? {
                content: lastMsg.content,
                created_at: lastMsg.created_at,
                sender_type: senderType,
              }
            : undefined,
        };
      });

      return items;
    },
    enabled: !!user?.id,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return {
    conversations: data ?? [],
    isLoading,
    error: error instanceof Error ? error : null,
    refetch,
  };
}
