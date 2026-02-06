/**
 * MSG-5: useAgentConversations
 *
 * 獲取房仲的客戶對話列表
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { logger } from '../lib/logger';
import {
  ConversationStatusSchema,
  SenderTypeSchema,
  type ConversationListItem,
} from '../types/messaging.types';

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

      // 查詢對話及關聯的最後訊息
      // 注意：conversations.property_id 是 TEXT (如 'MH-100001')，無法直接 JOIN properties.id (UUID)
      // 需要額外查詢 properties 表並用 public_id 匹配
      const { data: conversations, error: queryError } = await supabase
        .from('conversations')
        .select(
          `
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
          )
        `
        )
        .eq('agent_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (queryError) {
        logger.error('[useAgentConversations] Query failed', {
          error: queryError.message,
        });
        throw new Error(queryError.message);
      }

      if (!conversations || conversations.length === 0) {
        return [];
      }

      // 收集所有 property_id，用於批次查詢 properties 表
      const propertyIds = conversations
        .map((c) => c.property_id)
        .filter((id): id is string => id !== null && id !== undefined);

      // 批次查詢 properties（用 public_id 匹配）
      let propertiesMap: Map<string, { title: string; images: string[] | null }> = new Map();
      if (propertyIds.length > 0) {
        const { data: properties } = await supabase
          .from('properties')
          .select('public_id, title, images')
          .in('public_id', propertyIds);

        if (properties) {
          propertiesMap = new Map(
            properties.map((p) => [p.public_id, { title: p.title, images: p.images }])
          );
        }
      }

      // 轉換為 ConversationListItem 格式，使用 Zod 驗證
      const items: ConversationListItem[] = conversations.map((conv) => {
        // Zod 驗證 status
        const statusResult = ConversationStatusSchema.safeParse(conv.status);
        const status = statusResult.success ? statusResult.data : 'pending';

        // 取得最後一則訊息（按 created_at 排序）- 使用展開運算符避免突變原陣列
        const messages = Array.isArray(conv.messages) ? conv.messages : [];
        const sortedMessages = [...messages].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const lastMsg = sortedMessages[0];

        // Zod 驗證 sender_type
        const senderTypeResult = lastMsg ? SenderTypeSchema.safeParse(lastMsg.sender_type) : null;
        const senderType = senderTypeResult?.success ? senderTypeResult.data : 'consumer';

        // 從 propertiesMap 取得物件資訊（用 public_id 匹配）
        const propertyData = conv.property_id ? propertiesMap.get(conv.property_id) : null;

        return {
          id: conv.id,
          status,
          unread_count: conv.unread_agent ?? 0,
          counterpart: {
            name: `訪客-${conv.consumer_session_id?.slice(-4).toUpperCase() ?? 'XXXX'}`,
          },
          property: conv.property_id
            ? {
                id: conv.property_id,
                title: propertyData?.title ?? conv.property_id,
                image: propertyData?.images?.[0],
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
