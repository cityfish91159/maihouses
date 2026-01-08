import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { supabase } from "../../lib/supabase";
import { logger } from "../../lib/logger";
import { useAuth } from "../../hooks/useAuth";
import { useConsumerSession } from "../../hooks/useConsumerSession";
import type {
  Conversation,
  Message,
  SenderType,
} from "../../types/messaging.types";

const MessageSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  sender_type: z.enum(["agent", "consumer"]),
  sender_id: z.string().uuid().nullable(),
  content: z.string(),
  created_at: z.string(),
  read_at: z.string().nullable(),
});

const ProfileSchema = z.object({
  name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
});

const PropertySchema = z.object({
  public_id: z.string(),
  title: z.string().nullable().optional(),
  images: z.array(z.string()).nullable().optional(),
  address: z.string().nullable().optional(),
});

const PropertyQueryResultSchema = z.array(PropertySchema);

/**
 * 問題 #5 修復：移除 property JOIN（TEXT FK 無法 JOIN UUID）
 * 改為分開查詢 properties 表
 */
const ConversationSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "active", "closed"]),
  agent_id: z.string(),
  consumer_session_id: z.string(),
  consumer_profile_id: z.string().uuid().nullable(),
  property_id: z.string().nullable(), // TEXT 格式如 'MH-100001'
  lead_id: z.string().uuid().nullable(),
  unread_agent: z.number(),
  unread_consumer: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  agent_profile: z.array(ProfileSchema).nullable().optional(),
  consumer_profile: z.array(ProfileSchema).nullable().optional(),
  // 問題 #5 修復：移除 property，改用分開查詢
});

const ConversationUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "active", "closed"]),
  updated_at: z.string(),
});

const MessageListSchema = z.array(MessageSchema);

export interface ChatHeaderData {
  counterpartName: string;
  counterpartSubtitle: string;
  statusLabel: string;
  propertyTitle?: string | undefined;
  propertySubtitle?: string | undefined;
  propertyImage?: string | undefined;
}

const STATUS_LABELS: Record<Conversation["status"], string> = {
  pending: "等待回覆",
  active: "對話中",
  closed: "已結束",
};

export function useChat(conversationId?: string) {
  const { user, role, isAuthenticated } = useAuth();
  // 使用統一的 session hook（含過期檢查）
  const { sessionId, hasValidSession } = useConsumerSession();
  const isAgent = role === "agent";
  const senderType: SenderType = isAgent ? "agent" : "consumer";

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [header, setHeader] = useState<ChatHeaderData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<number | null>(null);
  const typingSentAtRef = useRef(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const statusLabel = useMemo(() => {
    if (!conversation) return "";
    return STATUS_LABELS[conversation.status];
  }, [conversation]);

  /**
   * 問題 #5 修復：移除 property JOIN，改為分開查詢
   * 修2: 允許匿名用戶（有 sessionId）載入對話
   */
  const loadConversation = useCallback(async () => {
    if (!conversationId) return;
    // 修2: 允許有 sessionId 的匿名用戶
    if (!user && !hasValidSession) return;

    // 1. 查詢對話（不含 property JOIN）
    const { data, error } = await supabase
      .from("conversations")
      .select(
        `
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
        consumer_profile:profiles!consumer_profile_id(name, email)
      `,
      )
      .eq("id", conversationId)
      .single();

    if (error) {
      throw error;
    }

    const row = ConversationSchema.parse(data);
    // 修2: 權限檢查支援匿名用戶（user 可能為 null）
    const isParticipant = isAgent
      ? user && row.agent_id === user.id
      : (user && row.consumer_profile_id === user.id) ||
        (hasValidSession && row.consumer_session_id === sessionId);
    if (!isParticipant) {
      setError(new Error("您無權查看此對話"));
      throw new Error("Unauthorized");
    }
    setHasAccess(true);
    setConversation(row);

    const profileData = isAgent
      ? row.consumer_profile?.[0]
      : row.agent_profile?.[0];
    const fallbackName =
      isAgent && row.consumer_session_id
        ? `訪客-${row.consumer_session_id.slice(-4).toUpperCase()}`
        : "對方";
    const counterpartName =
      profileData?.name || profileData?.email?.split("@")[0] || fallbackName;
    const counterpartSubtitle =
      profileData?.email || (isAgent ? "匿名訪客" : "認證房仲");

    // 2. 問題 #5 修復：分開查詢 property（用 public_id 匹配）
    let propertyTitle: string | undefined;
    let propertySubtitle: string | undefined;
    let propertyImage: string | undefined;

    if (row.property_id) {
      const { data: propertyData, error: propertyError } = await supabase
        .from("properties")
        .select("public_id, title, images, address")
        .eq("public_id", row.property_id)
        .maybeSingle();

      if (propertyError) {
        logger.warn("chat.loadProperty.failed", {
          error: propertyError,
          property_id: row.property_id,
        });
      }

      if (propertyData) {
        const parsed = PropertySchema.safeParse(propertyData);
        if (parsed.success) {
          propertyTitle = parsed.data.title ?? "物件資訊";
          propertySubtitle = parsed.data.address ?? `編號 ${row.property_id}`;
          propertyImage = parsed.data.images?.[0];
        }
      } else {
        propertyTitle = "物件資訊";
        propertySubtitle = `編號 ${row.property_id}`;
      }
    }

    setHeader({
      counterpartName,
      counterpartSubtitle,
      statusLabel: STATUS_LABELS[row.status],
      propertyTitle,
      propertySubtitle,
      propertyImage,
    });
  }, [conversationId, isAgent, user, hasValidSession, sessionId]);

  const loadMessages = useCallback(async () => {
    // 修2: 允許匿名用戶載入訊息
    if (!conversationId) return;
    if (!user && !hasValidSession) return;
    const { data, error } = await supabase
      .from("messages")
      .select(
        "id, conversation_id, sender_type, sender_id, content, created_at, read_at",
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    const validatedMessages = MessageListSchema.parse(data ?? []);
    setMessages(validatedMessages);
  }, [conversationId, user, hasValidSession]);

  const markRead = useCallback(async () => {
    if (!conversationId || !isAuthenticated || !user || !hasAccess) return;
    const { error } = await supabase.rpc("fn_mark_messages_read", {
      p_conversation_id: conversationId,
      p_reader_type: senderType,
    });
    if (error) {
      logger.warn("chat.markRead.failed", {
        error,
        conversationId,
        senderType,
      });
    }
  }, [conversationId, isAuthenticated, user, senderType, hasAccess]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !isAuthenticated || !user || !hasAccess) return;
      const trimmed = content.trim();
      if (!trimmed) return;
      const tempId = `temp-${crypto.randomUUID?.() ?? Date.now()}`;
      const optimisticMessage: Message = {
        id: tempId,
        conversation_id: conversationId,
        sender_type: senderType,
        sender_id: user.id,
        content: trimmed,
        created_at: new Date().toISOString(),
        read_at: null,
      };

      setIsSending(true);
      setMessages((prev) => [...prev, optimisticMessage]);
      try {
        const { data: messageId, error } = await supabase.rpc(
          "fn_send_message",
          {
            p_conversation_id: conversationId,
            p_sender_type: senderType,
            p_sender_id: user.id,
            p_content: trimmed,
          },
        );

        if (error) {
          throw error;
        }
        if (messageId) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempId
                ? {
                    ...msg,
                    id: String(messageId),
                  }
                : msg,
            ),
          );
        }
      } catch (err) {
        logger.error("chat.sendMessage.failed", {
          err,
          conversationId,
          senderType,
        });
        setError(
          err instanceof Error ? err : new Error("Failed to send message"),
        );
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, isAuthenticated, user, senderType, hasAccess],
  );

  useEffect(() => {
    let isMounted = true;
    if (!conversationId) {
      setIsLoading(false);
      setError(new Error("Missing conversation ID"));
      return;
    }
    // 修2: 允許有 sessionId 的匿名用戶
    if (!isAuthenticated && !hasValidSession) {
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setError(null);
      setHasAccess(false);
      setConversation(null);
      setHeader(null);
      setMessages([]);
      setIsTyping(false);
      try {
        await loadConversation();
        await loadMessages();
        if (isMounted) {
          await markRead();
        }
      } catch (err) {
        if (isMounted) {
          logger.error("chat.load.failed", { err, conversationId });
          setError(
            err instanceof Error
              ? err
              : new Error("Failed to load conversation"),
          );
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
  }, [
    conversationId,
    isAuthenticated,
    hasValidSession,
    user,
    loadConversation,
    loadMessages,
    markRead,
  ]);

  useEffect(() => {
    if (!conversationId || !conversation || !user || !hasAccess) return;

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload?.senderId === user.id) return;
        setIsTyping(true);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = window.setTimeout(() => {
          setIsTyping(false);
        }, 1500);
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const parsedIncoming = MessageSchema.safeParse(payload.new);
          if (!parsedIncoming.success) {
            logger.warn("chat.realtime.invalidMessage", {
              errors: parsedIncoming.error.issues,
            });
            return;
          }
          const incoming = parsedIncoming.data;
          setMessages((prev) => {
            if (prev.some((msg) => msg.id === incoming.id)) {
              return prev;
            }
            return [...prev, incoming];
          });
          if (incoming.sender_type !== senderType) {
            markRead();
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `id=eq.${conversationId}`,
        },
        (payload) => {
          const parsedUpdate = ConversationUpdateSchema.safeParse(payload.new);
          if (!parsedUpdate.success) {
            logger.warn("chat.realtime.invalidConversation", {
              errors: parsedUpdate.error.issues,
            });
            return;
          }
          const updated = parsedUpdate.data;
          setConversation((prev) =>
            prev
              ? {
                  ...prev,
                  status: updated.status,
                  updated_at: updated.updated_at,
                }
              : prev,
          );
          setHeader((prev) =>
            prev
              ? {
                  ...prev,
                  statusLabel: STATUS_LABELS[updated.status],
                }
              : prev,
          );
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, conversation, user, senderType, markRead, hasAccess]);

  const sendTyping = useCallback(() => {
    if (!channelRef.current || !user || !hasAccess) return;
    const now = Date.now();
    if (now - typingSentAtRef.current < 1000) return;
    typingSentAtRef.current = now;
    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { senderId: user.id },
    });
  }, [user, hasAccess]);

  return {
    conversation,
    header,
    statusLabel,
    messages,
    isLoading,
    isSending,
    isTyping,
    error,
    sendMessage,
    sendTyping,
    markRead,
    isAgent,
  };
}
