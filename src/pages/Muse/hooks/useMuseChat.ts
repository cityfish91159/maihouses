/**
 * 🎯 useMuseChat Hook
 * 職責：聊天核心 - 訊息發送、歷史記錄載入、API 通訊
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import type { ChatMessage } from '../types';

export interface UseMuseChatOptions {
  sessionId: string;
  onError?: (error: Error) => void;
}

export interface UseMuseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  sendMessage: (content: string) => Promise<void>;
  loadHistory: () => Promise<void>;
  clearMessages: () => void;
}

/**
 * Chat messaging hook
 *
 * @example
 * const { messages, sendMessage, isLoading } = useMuseChat({ sessionId });
 */
export function useMuseChat(options: UseMuseChatOptions): UseMuseChatReturn {
  const { sessionId, onError } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ═══════════════════════════════════════════════════════════════
  // 載入歷史記錄
  // ═══════════════════════════════════════════════════════════════

  const loadHistory = useCallback(async () => {
    if (!sessionId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('muse_chat_logs')
        .select('*')
        .eq('user_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;

      if (data) {
        const formattedMessages: ChatMessage[] = data.map(log => ({
          role: log.role as 'user' | 'muse',
          content: log.content,
          timestamp: new Date(log.created_at)
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('載入歷史記錄失敗:', error);
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, onError]);

  // ═══════════════════════════════════════════════════════════════
  // 發送訊息
  // ═══════════════════════════════════════════════════════════════

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !sessionId || isSending) return;

    // 取消之前的請求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsSending(true);

    // 立即顯示用戶訊息
    const userMessage: ChatMessage = {
      role: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/muse-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          sessionId
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`API 錯誤: ${response.status}`);
      }

      const data = await response.json();

      // 添加 AI 回應
      const aiMessage: ChatMessage = {
        role: 'muse',
        content: data.reply,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('請求已取消');
        return;
      }

      console.error('發送訊息失敗:', error);
      onError?.(error as Error);

      // 移除失敗的用戶訊息
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsSending(false);
      abortControllerRef.current = null;
    }
  }, [sessionId, isSending, onError]);

  // ═══════════════════════════════════════════════════════════════
  // 清空訊息
  // ═══════════════════════════════════════════════════════════════

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // 初始化：載入歷史記錄
  // ═══════════════════════════════════════════════════════════════

  useEffect(() => {
    if (sessionId) {
      loadHistory();
    }
  }, [sessionId, loadHistory]);

  // ═══════════════════════════════════════════════════════════════
  // 清理
  // ═══════════════════════════════════════════════════════════════

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    messages,
    isLoading,
    isSending,
    sendMessage,
    loadHistory,
    clearMessages
  };
}
