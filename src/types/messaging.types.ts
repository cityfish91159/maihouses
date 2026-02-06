/**
 * MSG-1: 私訊系統類型定義
 * @see supabase/migrations/20251231_003_messaging_schema.sql
 */

import { z } from 'zod';

// =============================================================================
// Conversation (對話)
// =============================================================================

export const ConversationStatusSchema = z.enum(['pending', 'active', 'closed']);
export type ConversationStatus = z.infer<typeof ConversationStatusSchema>;

export const ConversationSchema = z.object({
  id: z.string().uuid(),
  agent_id: z.string().uuid(),
  consumer_session_id: z.string(),
  consumer_profile_id: z.string().uuid().nullable(),
  property_id: z.string().nullable(),
  lead_id: z.string().uuid().nullable(),
  status: ConversationStatusSchema,
  unread_agent: z.number().int().min(0),
  unread_consumer: z.number().int().min(0),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Conversation = z.infer<typeof ConversationSchema>;

// =============================================================================
// Message (訊息)
// =============================================================================

export const SenderTypeSchema = z.enum(['agent', 'consumer']);
export type SenderType = z.infer<typeof SenderTypeSchema>;

export const MessageSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  sender_type: SenderTypeSchema,
  sender_id: z.string().uuid().nullable(),
  content: z.string().min(1).max(2000),
  created_at: z.string(),
  read_at: z.string().nullable(),
});

export type Message = z.infer<typeof MessageSchema>;

// =============================================================================
// API Request/Response Types
// =============================================================================

export const CreateConversationRequestSchema = z.object({
  agent_id: z.string().uuid(),
  consumer_session_id: z.string().min(1),
  property_id: z.string().optional(),
  lead_id: z.string().uuid().optional(),
});

export type CreateConversationRequest = z.infer<typeof CreateConversationRequestSchema>;

export const SendMessageRequestSchema = z.object({
  conversation_id: z.string().uuid(),
  sender_type: SenderTypeSchema,
  sender_id: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

export type SendMessageRequest = z.infer<typeof SendMessageRequestSchema>;

export const MarkReadRequestSchema = z.object({
  conversation_id: z.string().uuid(),
  reader_type: SenderTypeSchema,
});

export type MarkReadRequest = z.infer<typeof MarkReadRequestSchema>;

// =============================================================================
// Conversation with Messages (擴展型)
// =============================================================================

export const ConversationWithMessagesSchema = ConversationSchema.extend({
  messages: z.array(MessageSchema),
});

export type ConversationWithMessages = z.infer<typeof ConversationWithMessagesSchema>;

// =============================================================================
// Conversation List Item (列表顯示用)
// =============================================================================

export const ConversationListItemSchema = z.object({
  id: z.string().uuid(),
  status: ConversationStatusSchema,
  unread_count: z.number().int().min(0),
  last_message: z
    .object({
      content: z.string(),
      created_at: z.string(),
      sender_type: SenderTypeSchema,
    })
    .optional(),
  counterpart: z.object({
    name: z.string(),
    avatar: z.string().optional(),
  }),
  property: z
    .object({
      id: z.string(),
      title: z.string(),
      image: z.string().optional(),
    })
    .optional(),
});

export type ConversationListItem = z.infer<typeof ConversationListItemSchema>;
