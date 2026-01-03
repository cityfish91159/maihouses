/**
 * MSG-5: Messaging Service
 * 
 * 處理對話建立與訊息發送
 */

import { supabase } from '../lib/supabase';
import type {
  CreateConversationRequest,
  SendMessageRequest,
  Conversation,
  Message,
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

  return data as Conversation;
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

  // 更新對話的未讀數（對方 +1）
  const unreadField =
    req.sender_type === 'agent' ? 'unread_consumer' : 'unread_agent';
  
  await supabase.rpc('increment_unread', {
    p_conversation_id: req.conversation_id,
    p_field: unreadField,
  });

  return data as Message;
}

/**
 * 建立對話並發送第一則訊息（原子操作）
 */
export async function createConversationAndSendMessage(
  conversationReq: CreateConversationRequest,
  messageContent: string,
  senderId: string
): Promise<{ conversation: Conversation; message: Message }> {
  // 1. 建立對話
  const conversation = await createConversation(conversationReq);

  // 2. 發送第一則訊息
  const message = await sendMessage({
    conversation_id: conversation.id,
    sender_type: 'agent',
    sender_id: senderId,
    content: messageContent,
  });

  return { conversation, message };
}

export const messagingService = {
  createConversation,
  sendMessage,
  createConversationAndSendMessage,
};
