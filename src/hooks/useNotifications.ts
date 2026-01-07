/**
 * useNotifications Hook
 *
 * MSG-2: 鈴鐺通知功能（消費者 + 房仲共用）
 * 查詢 conversations 表，計算未讀私訊數量並返回通知列表
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "../lib/supabase";
import { logger } from "../lib/logger";
import { MESSAGING_CONFIG } from "../constants/messaging";
import type {
  ConversationListItem,
  ConversationStatus,
  SenderType,
} from "../types/messaging.types";

interface UseNotificationsReturn {
  count: number;
  notifications: ConversationListItem[];
  isLoading: boolean;
  error: Error | null;
  isStale: boolean;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

/**
 * Supabase 查詢返回的原始對話數據結構（JOIN 返回陣列）
 */
interface RawConversationData {
  id: string;
  status: ConversationStatus;
  unread_agent?: number;
  unread_consumer?: number;
  agent_id: string | null;
  consumer_session_id: string;
  consumer_profile_id: string | null;
  property_id: string | null;
  updated_at: string;
  consumer_profile?: Array<{ name: string; email: string }> | null;
  agent_profile?: Array<{ name: string; email: string }> | null;
  property?: Array<{
    public_id: string;
    title: string;
    images: string[];
  }> | null;
  messages?: Array<{
    content: string;
    created_at: string;
    sender_type: SenderType;
  }>;
}

/**
 * 判斷錯誤是否可重試
 * - 網路錯誤（TypeError: Failed to fetch）：可重試
 * - 5xx 伺服器錯誤：可重試
 * - Timeout/AbortError：不重試（用戶取消）
 * - 4xx 用戶端錯誤：不重試（重試無意義）
 */
function isRetryableError(err: unknown): boolean {
  // AbortError 不重試
  if (err instanceof DOMException && err.name === "AbortError") {
    return false;
  }

  // 網路錯誤（fetch 失敗）：可重試
  if (err instanceof TypeError && err.message.includes("fetch")) {
    return true;
  }

  // Supabase/PostgrestError 檢查 HTTP 狀態碼
  if (err && typeof err === "object" && "code" in err) {
    const code = String((err as { code: unknown }).code);
    // PGRST 錯誤碼或 HTTP 狀態碼
    // 5xx 錯誤：可重試
    if (code.startsWith("5") || code === "PGRST") {
      return true;
    }
    // 4xx 錯誤：不重試
    if (code.startsWith("4")) {
      return false;
    }
  }

  // 通用 Error 檢查訊息
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    // 網路相關錯誤：可重試
    if (
      msg.includes("network") ||
      msg.includes("timeout") ||
      msg.includes("connection")
    ) {
      return true;
    }
    // 明確的用戶端錯誤：不重試
    if (
      msg.includes("bad request") ||
      msg.includes("unauthorized") ||
      msg.includes("forbidden") ||
      msg.includes("not found")
    ) {
      return false;
    }
  }

  // 預設：暫時性錯誤，可重試
  return true;
}

/**
 * Exponential Backoff Retry 機制
 * 只對可重試的錯誤進行重試，避免浪費資源
 */
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries = MESSAGING_CONFIG.RETRY_COUNT,
  delay = MESSAGING_CONFIG.RETRY_INITIAL_DELAY_MS,
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      // 檢查是否為可重試的錯誤
      if (!isRetryableError(err)) {
        throw err; // 4xx/AbortError 直接拋出，不重試
      }

      // 最後一次嘗試失敗，拋出錯誤
      if (i === retries - 1) {
        throw err;
      }

      // 等待後重試（指數退避）
      await new Promise((resolve) =>
        setTimeout(resolve, delay * Math.pow(2, i)),
      );
    }
  }
  throw new Error("Retry failed");
}

/**
 * 轉換 Supabase 查詢結果為 ConversationListItem
 */
function transformConversation(
  conv: RawConversationData,
  isAgent: boolean,
): ConversationListItem {
  // 對方資訊（Supabase JOIN 返回陣列，取第一個元素）
  let counterpartName = "Unknown";
  const profileArray = isAgent ? conv.consumer_profile : conv.agent_profile;
  const profileData = profileArray?.[0];

  if (profileData) {
    counterpartName =
      profileData.name ||
      profileData.email?.split("@")[0] ||
      (isAgent ? "User" : "Agent");
  } else if (isAgent && conv.consumer_session_id) {
    counterpartName = `訪客-${conv.consumer_session_id.slice(-4).toUpperCase()}`;
  }

  // 物件資訊（Supabase JOIN 返回陣列，取第一個元素）
  let propertyInfo: { id: string; title: string; image?: string } | undefined =
    undefined;
  const propertyArray = conv.property;
  const propertyData = propertyArray?.[0];

  if (propertyData) {
    propertyInfo = {
      id: propertyData.public_id,
      title: propertyData.title,
      ...(propertyData.images?.[0] && { image: propertyData.images[0] }),
    };
  }

  // 最新訊息
  const messages = Array.isArray(conv.messages) ? conv.messages : [];
  const latestMessage =
    messages.length > 0
      ? messages.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )[0]
      : undefined;

  return {
    id: conv.id,
    status: conv.status,
    unread_count: isAgent ? conv.unread_agent || 0 : conv.unread_consumer || 0,
    last_message: latestMessage
      ? {
          content: latestMessage.content,
          created_at: latestMessage.created_at,
          sender_type: latestMessage.sender_type,
        }
      : undefined,
    counterpart: {
      name: counterpartName,
    },
    property: propertyInfo,
  };
}

// 從 config 解構常用常數
const { STALE_THRESHOLD_MS, QUERY_LIMIT, RETRY_COUNT, RETRY_INITIAL_DELAY_MS } =
  MESSAGING_CONFIG;

export function useNotifications(): UseNotificationsReturn {
  const { isAuthenticated, user, role } = useAuth();
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState<ConversationListItem[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // AbortController 用於取消進行中的請求
  const abortControllerRef = useRef<AbortController | null>(null);

  // 計算是否為過期資料（有錯誤 或 超過閾值時間）
  const isStale =
    error !== null ||
    (lastUpdated !== null &&
      Date.now() - lastUpdated.getTime() > STALE_THRESHOLD_MS);

  const fetchNotifications = useCallback(async () => {
    // 取消之前的請求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    if (!isAuthenticated || !user) {
      setCount(0);
      setNotifications([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 根據用戶角色決定查詢條件
      const isAgent = role === "agent";

      // 查詢有未讀訊息的對話（使用 JOIN 一次查詢所有資料 + Retry 機制）
      if (isAgent) {
        const result = await fetchWithRetry(async () => {
          // 檢查是否已被取消
          if (signal.aborted) {
            throw new DOMException("Aborted", "AbortError");
          }

          const { data, error } = await supabase
            .from("conversations")
            .select(
              `
                            id,
                            status,
                            unread_agent,
                            agent_id,
                            consumer_session_id,
                            consumer_profile_id,
                            property_id,
                            updated_at,
                            consumer_profile:profiles!consumer_profile_id(name, email),
                            property:properties!property_id(public_id, title, images),
                            messages(content, created_at, sender_type)
                        `,
            )
            .eq("agent_id", user.id)
            .gt("unread_agent", 0)
            .order("updated_at", { ascending: false })
            .limit(QUERY_LIMIT)
            .abortSignal(signal);

          if (error) throw error;
          return data;
        });

        // 計算總未讀數
        const totalUnread =
          result?.reduce(
            (sum: number, conv: RawConversationData) =>
              sum + (conv.unread_agent || 0),
            0,
          ) || 0;
        setCount(totalUnread);

        // 轉換為 ConversationListItem 格式
        const notificationList = (result || []).map(
          (conv: RawConversationData) => transformConversation(conv, true),
        );
        setNotifications(notificationList);
        setLastUpdated(new Date());
      } else {
        // Consumer（使用 JOIN 一次查詢所有資料 + Retry 機制）
        const result = await fetchWithRetry(async () => {
          // 檢查是否已被取消
          if (signal.aborted) {
            throw new DOMException("Aborted", "AbortError");
          }

          const { data, error } = await supabase
            .from("conversations")
            .select(
              `
                            id,
                            status,
                            unread_consumer,
                            agent_id,
                            consumer_session_id,
                            consumer_profile_id,
                            property_id,
                            updated_at,
                            agent_profile:profiles!agent_id(name, email),
                            property:properties!property_id(public_id, title, images),
                            messages(content, created_at, sender_type)
                        `,
            )
            .eq("consumer_profile_id", user.id)
            .gt("unread_consumer", 0)
            .order("updated_at", { ascending: false })
            .limit(QUERY_LIMIT)
            .abortSignal(signal);

          if (error) throw error;
          return data;
        });

        // 計算總未讀數
        const totalUnread =
          result?.reduce(
            (sum: number, conv: RawConversationData) =>
              sum + (conv.unread_consumer || 0),
            0,
          ) || 0;
        setCount(totalUnread);

        // 轉換為 ConversationListItem 格式
        const notificationList = (result || []).map(
          (conv: RawConversationData) => transformConversation(conv, false),
        );
        setNotifications(notificationList);
        setLastUpdated(new Date());
      }
    } catch (err) {
      // 忽略 AbortError（請求被取消）
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }

      logger.error("useNotifications.fetchNotifications.failed", {
        error: err,
        userId: user?.id,
        role,
        isAgent: role === "agent",
      });
      setError(
        err instanceof Error ? err : new Error("Failed to fetch notifications"),
      );
      // 保留舊資料，不清空 count 和 notifications
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, role]);

  // 組件卸載時取消進行中的請求
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // 初始載入和用戶變更時重新查詢
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Supabase Realtime 訂閱
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const isAgent = role === "agent";
    const channelName = `notifications-${user.id}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: isAgent
            ? `agent_id=eq.${user.id}`
            : `consumer_profile_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchNotifications();
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          logger.info("useNotifications.realtime.subscribed", {
            channelName,
            userId: user.id,
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, user, role, fetchNotifications]);

  return {
    count,
    notifications,
    isLoading,
    error,
    isStale,
    lastUpdated,
    refresh: fetchNotifications,
  };
}
