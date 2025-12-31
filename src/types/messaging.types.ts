/**
 * MSG-1: 私訊系統類型定義
 * @see supabase/migrations/20251231_003_messaging_schema.sql
 */

// =============================================================================
// Conversation (對話)
// =============================================================================

export type ConversationStatus = 'pending' | 'active' | 'closed';

export interface Conversation {
  id: string;                          // UUID
  agent_id: string;                    // 房仲 profile_id
  consumer_session_id: string;         // UAG session_id
  consumer_profile_id: string | null;  // 消費者 profile_id（回覆後填入）
  property_id: string | null;          // 相關物件
  lead_id: string | null;              // 關聯的 uag_leads 記錄
  status: ConversationStatus;          // pending → active → closed
  unread_agent: number;                // 房仲未讀數
  unread_consumer: number;             // 消費者未讀數
  created_at: string;                  // ISO timestamp
  updated_at: string;                  // ISO timestamp
}

// =============================================================================
// Message (訊息)
// =============================================================================

export type SenderType = 'agent' | 'consumer';

export interface Message {
  id: string;                          // UUID
  conversation_id: string;             // FK to conversations
  sender_type: SenderType;             // 'agent' | 'consumer'
  sender_id: string | null;            // profile_id
  content: string;                     // 訊息內容
  created_at: string;                  // ISO timestamp
  read_at: string | null;              // 已讀時間
}

// =============================================================================
// API Request/Response Types
// =============================================================================

export interface CreateConversationRequest {
  agent_id: string;
  consumer_session_id: string;
  property_id?: string;
  lead_id?: string;
}

export interface SendMessageRequest {
  conversation_id: string;
  sender_type: SenderType;
  sender_id: string;
  content: string;
}

export interface MarkReadRequest {
  conversation_id: string;
  reader_type: SenderType;
}

// =============================================================================
// Conversation with Messages (擴展型)
// =============================================================================

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

// =============================================================================
// Conversation List Item (列表顯示用)
// =============================================================================

export interface ConversationListItem {
  id: string;
  status: ConversationStatus;
  unread_count: number;
  last_message?: {
    content: string;
    created_at: string;
    sender_type: SenderType;
  };
  // 對方資訊
  counterpart: {
    name: string;            // 房仲名稱 或 訪客-XXXX
    avatar?: string;
  };
  // 物件資訊
  property?: {
    id: string;
    title: string;
    image?: string;
  };
}
