import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import { useAuth } from '../../hooks/useAuth';
import type { Conversation, Message, SenderType } from '../../types/messaging.types';

type ProfileRow = {
  name: string | null;
  email: string | null;
};

type PropertyRow = {
  public_id: string | null;
  title: string | null;
  images: string[] | null;
  address: string | null;
};

interface RawConversationRow extends Conversation {
  agent_profile?: ProfileRow[] | null;
  consumer_profile?: ProfileRow[] | null;
  property?: PropertyRow[] | null;
}

export interface ChatHeaderData {
  counterpartName: string;
  counterpartSubtitle: string;
  statusLabel: string;
  propertyTitle?: string | undefined;
  propertySubtitle?: string | undefined;
  propertyImage?: string | undefined;
}

const STATUS_LABELS: Record<Conversation['status'], string> = {
  pending: '等待回覆',
  active: '對話中',
  closed: '已結束',
};

export function useChat(conversationId?: string) {
  const { user, role, isAuthenticated } = useAuth();
  const isAgent = role === 'agent';
  const senderType: SenderType = isAgent ? 'agent' : 'consumer';

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [header, setHeader] = useState<ChatHeaderData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const statusLabel = useMemo(() => {
    if (!conversation) return '';
    return STATUS_LABELS[conversation.status];
  }, [conversation]);

  const loadConversation = useCallback(async () => {
    if (!conversationId) return;
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        id,
        status,
        agent_id,
        consumer_session_id,
        consumer_profile_id,
        property_id,
        lead_id,
        unread_agent,
        unread_consumer,
        created_at,
        updated_at,
        agent_profile:profiles!agent_id(name, email),
        consumer_profile:profiles!consumer_profile_id(name, email),
        property:properties!property_id(public_id, title, images, address)
      `)
      .eq('id', conversationId)
      .single();

    if (error) {
      throw error;
    }

    const row = data as RawConversationRow;
    setConversation(row);

    const profileData = isAgent ? row.consumer_profile?.[0] : row.agent_profile?.[0];
    const fallbackName = isAgent && row.consumer_session_id
      ? `訪客-${row.consumer_session_id.slice(-4).toUpperCase()}`
      : '對方';
    const counterpartName = profileData?.name || profileData?.email?.split('@')[0] || fallbackName;
    const counterpartSubtitle = profileData?.email || (isAgent ? '匿名訪客' : '認證房仲');

    const propertyData = row.property?.[0];
    const propertyTitle = propertyData?.title || (row.property_id ? '物件資訊' : undefined);
    const propertySubtitle = propertyData?.address || (row.property_id ? `編號 ${row.property_id}` : undefined);
    const propertyImage = propertyData?.images?.[0] || undefined;

    setHeader({
      counterpartName,
      counterpartSubtitle,
      statusLabel: STATUS_LABELS[row.status],
      propertyTitle,
      propertySubtitle,
      propertyImage,
    });
  }, [conversationId, isAgent]);

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;
    const { data, error } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_type, sender_id, content, created_at, read_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    setMessages((data as Message[]) || []);
  }, [conversationId]);

  const markRead = useCallback(async () => {
    if (!conversationId || !isAuthenticated || !user) return;
    const { error } = await supabase.rpc('fn_mark_messages_read', {
      p_conversation_id: conversationId,
      p_reader_type: senderType,
    });
    if (error) {
      logger.warn('chat.markRead.failed', { error, conversationId, senderType });
    }
  }, [conversationId, isAuthenticated, user, senderType]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !isAuthenticated || !user) return;
      const trimmed = content.trim();
      if (!trimmed) return;

      setIsSending(true);
      try {
        const { error } = await supabase.rpc('fn_send_message', {
          p_conversation_id: conversationId,
          p_sender_type: senderType,
          p_sender_id: user.id,
          p_content: trimmed,
        });

        if (error) {
          throw error;
        }

        await loadMessages();
      } catch (err) {
        logger.error('chat.sendMessage.failed', { err, conversationId, senderType });
        setError(err instanceof Error ? err : new Error('Failed to send message'));
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, isAuthenticated, user, senderType, loadMessages]
  );

  useEffect(() => {
    let isMounted = true;
    if (!conversationId) {
      setIsLoading(false);
      setError(new Error('Missing conversation ID'));
      return;
    }
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await Promise.all([loadConversation(), loadMessages()]);
        if (isMounted) {
          await markRead();
        }
      } catch (err) {
        if (isMounted) {
          logger.error('chat.load.failed', { err, conversationId });
          setError(err instanceof Error ? err : new Error('Failed to load conversation'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [conversationId, isAuthenticated, user, loadConversation, loadMessages, markRead]);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((msg) => msg.id === incoming.id)) {
              return prev;
            }
            return [...prev, incoming].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          });
          if (incoming.sender_type !== senderType) {
            markRead();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations', filter: `id=eq.${conversationId}` },
        (payload) => {
          const updated = payload.new as Conversation;
          setConversation((prev) => (prev ? { ...prev, status: updated.status, updated_at: updated.updated_at } : prev));
          setHeader((prev) =>
            prev
              ? {
                  ...prev,
                  statusLabel: STATUS_LABELS[updated.status],
                }
              : prev
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, senderType, markRead]);

  return {
    conversation,
    header,
    statusLabel,
    messages,
    isLoading,
    isSending,
    error,
    sendMessage,
    markRead,
    isAgent,
  };
}
