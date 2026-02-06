/**
 * MSG-5: Messaging Service
 *
 * 處理對話建立與訊息發送
 */

import { supabase } from '../lib/supabase';
import {
  ConversationSchema,
  MessageSchema,
  type CreateConversationRequest,
  type SendMessageRequest,
  type Conversation,
  type Message,
} from '../types/messaging.types';
import { logger } from '../lib/logger';

/**
 * 建立新對話
 *
 * 問題 #13 修復：使用 fn_create_conversation RPC 替代直接 insert
 * RPC 有幂等性檢查，避免重複建立對話
 */
export async function createConversation(req: CreateConversationRequest): Promise<Conversation> {
  // 使用 RPC 建立對話（有幂等性檢查）
  const { data: conversationId, error } = await supabase.rpc('fn_create_conversation', {
    p_agent_id: req.agent_id,
    p_consumer_session_id: req.consumer_session_id,
    p_property_id: req.property_id ?? null,
    p_lead_id: req.lead_id ?? null,
  });

  if (error) {
    logger.error('[messagingService] Failed to create conversation via RPC', {
      error: error.message,
    });
    throw new Error(`建立對話失敗: ${error.message}`);
  }

  if (!conversationId) {
    logger.error('[messagingService] RPC returned null conversation_id');
    throw new Error('建立對話失敗: 無效的回傳值');
  }

  // 查詢剛建立的對話以返回完整資料
  const { data: convData, error: fetchError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (fetchError) {
    logger.error('[messagingService] Failed to fetch created conversation', {
      error: fetchError.message,
    });
    throw new Error(`建立對話失敗: ${fetchError.message}`);
  }

  // Zod 驗證取代 as 斷言
  const parsed = ConversationSchema.safeParse(convData);
  if (!parsed.success) {
    logger.error('[messagingService] Invalid conversation data', {
      error: parsed.error.message,
    });
    throw new Error('對話資料格式錯誤');
  }

  return parsed.data;
}

/**
 * 發送訊息
 *
 * 問題 #8-9 修復：使用 fn_send_message RPC 替代直接 insert
 * 這樣可以確保：
 * 1. unread 計數原子遞增（無競態條件）
 * 2. 消費者首次回覆時 status 自動更新為 active
 * 3. consumer_profile_id 自動填入
 */
export async function sendMessage(req: SendMessageRequest): Promise<Message> {
  // 使用 RPC 發送訊息（與 useChat.ts 保持一致）
  const { data: messageId, error } = await supabase.rpc('fn_send_message', {
    p_conversation_id: req.conversation_id,
    p_sender_type: req.sender_type,
    p_sender_id: req.sender_id,
    p_content: req.content,
  });

  if (error) {
    logger.error('[messagingService] Failed to send message via RPC', {
      error: error.message,
    });
    throw new Error(`發送訊息失敗: ${error.message}`);
  }

  if (!messageId) {
    logger.error('[messagingService] RPC returned null message_id');
    throw new Error('發送訊息失敗: 無效的回傳值');
  }

  // 查詢剛建立的訊息以返回完整資料
  const { data: messageData, error: fetchError } = await supabase
    .from('messages')
    .select('*')
    .eq('id', messageId)
    .single();

  if (fetchError) {
    logger.error('[messagingService] Failed to fetch sent message', {
      error: fetchError.message,
    });
    throw new Error(`發送訊息失敗: ${fetchError.message}`);
  }

  // Zod 驗證取代 as 斷言
  const parsed = MessageSchema.safeParse(messageData);
  if (!parsed.success) {
    logger.error('[messagingService] Invalid message data', {
      error: parsed.error.message,
    });
    throw new Error('訊息資料格式錯誤');
  }

  return parsed.data;
}

/**
 * 刪除對話（用於清理孤兒對話）
 */
async function deleteConversation(conversationId: string): Promise<void> {
  const { error } = await supabase.from('conversations').delete().eq('id', conversationId);

  if (error) {
    logger.error('[messagingService] Failed to delete conversation', {
      error: error.message,
      conversationId,
    });
  }
}

/**
 * 建立對話並發送第一則訊息（半原子操作：失敗時回滾）
 *
 * 如果訊息發送失敗，會刪除剛建立的對話以避免孤兒記錄
 */
export async function createConversationAndSendMessage(
  conversationReq: CreateConversationRequest,
  messageContent: string,
  senderId: string
): Promise<{ conversation: Conversation; message: Message }> {
  // 1. 建立對話
  const conversation = await createConversation(conversationReq);

  try {
    // 2. 發送第一則訊息
    const message = await sendMessage({
      conversation_id: conversation.id,
      sender_type: 'agent',
      sender_id: senderId,
      content: messageContent,
    });

    return { conversation, message };
  } catch (error) {
    // 訊息發送失敗，刪除孤兒對話
    logger.error('[messagingService] Message send failed, rolling back conversation', {
      conversationId: conversation.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    await deleteConversation(conversation.id);
    throw error;
  }
}

export const messagingService = {
  createConversation,
  sendMessage,
  createConversationAndSendMessage,
};
