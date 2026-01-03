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
 */
export async function createConversation(
  req: CreateConversationRequest
): Promise<Conversation> {
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      agent_id: req.agent_id,
      consumer_session_id: req.consumer_session_id,
      property_id: req.property_id ?? null,
      lead_id: req.lead_id ?? null,
      status: 'pending',
      unread_agent: 0,
      unread_consumer: 0,
    })
    .select()
    .single();

  if (error) {
    logger.error('[messagingService] Failed to create conversation', { error: error.message });
    throw new Error(`建立對話失敗: ${error.message}`);
  }

  // Zod 驗證取代 as 斷言
  const parsed = ConversationSchema.safeParse(data);
  if (!parsed.success) {
    logger.error('[messagingService] Invalid conversation data', { error: parsed.error.message });
    throw new Error('對話資料格式錯誤');
  }

  return parsed.data;
}

/**
 * 發送訊息
 */
export async function sendMessage(req: SendMessageRequest): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: req.conversation_id,
      sender_type: req.sender_type,
      sender_id: req.sender_id,
      content: req.content,
    })
    .select()
    .single();

  if (error) {
    logger.error('[messagingService] Failed to send message', { error: error.message });
    throw new Error(`發送訊息失敗: ${error.message}`);
  }

  // Zod 驗證取代 as 斷言
  const parsed = MessageSchema.safeParse(data);
  if (!parsed.success) {
    logger.error('[messagingService] Invalid message data', { error: parsed.error.message });
    throw new Error('訊息資料格式錯誤');
  }

  // 更新對話的未讀數（對方 +1）
  const unreadField = req.sender_type === 'agent' ? 'unread_consumer' : 'unread_agent';

  const { error: rpcError } = await supabase.rpc('increment_unread', {
    p_conversation_id: req.conversation_id,
    p_field: unreadField,
  });

  if (rpcError) {
    // 非致命錯誤，記錄但不拋出
    logger.warn('[messagingService] Failed to increment unread count', {
      error: rpcError.message,
      conversationId: req.conversation_id,
      field: unreadField,
    });
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
