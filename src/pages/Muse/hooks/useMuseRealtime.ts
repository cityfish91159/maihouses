/**
 * 👂 useMuseRealtime Hook
 * 職責：Realtime 訂閱 - GodView 推送、指令接收
 */

import { useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';

export interface GodViewCommand {
  type: 'voice' | 'task' | 'control' | 'mode_change';
  payload: unknown;
  timestamp: Date;
}

export interface UseMuseRealtimeOptions {
  sessionId: string;
  onCommand?: (command: GodViewCommand) => void;
  onVoice?: (audioUrl: string) => void;
  onTask?: (task: unknown) => void;
  onError?: (error: Error) => void;
}

/**
 * Realtime subscription hook for GodView commands
 *
 * @example
 * useMuseRealtime({
 *   sessionId,
 *   onVoice: (url) => playAudio(url),
 *   onTask: (task) => showTask(task)
 * });
 */
export function useMuseRealtime(options: UseMuseRealtimeOptions): void {
  const { sessionId, onCommand, onVoice, onTask, onError } = options;
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    console.log('🔌 訂閱 Realtime:', sessionId);

    // ═══════════════════════════════════════════════════════════════
    // 建立 Realtime 頻道
    // ═══════════════════════════════════════════════════════════════

    const channel = supabase.channel(`muse_godview_${sessionId}`);

    // 監聽 godview_messages 表的新增
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'godview_messages',
        filter: `user_id=eq.${sessionId}`
      },
      (payload) => {
        console.log('📨 收到 GodView 訊息:', payload);

        try {
          const message = payload.new as {
            command_type: string;
            command_data: unknown;
            created_at: string;
          };

          const command: GodViewCommand = {
            type: message.command_type as GodViewCommand['type'],
            payload: message.command_data,
            timestamp: new Date(message.created_at)
          };

          // 觸發通用回調
          onCommand?.(command);

          // 根據類型觸發特定回調
          switch (command.type) {
            case 'voice':
              if (typeof command.payload === 'string') {
                onVoice?.(command.payload);
              }
              break;
            case 'task':
              onTask?.(command.payload);
              break;
            case 'control':
            case 'mode_change':
              // 可以添加更多處理
              break;
          }
        } catch (error) {
          console.error('❌ 處理 Realtime 訊息失敗:', error);
          onError?.(error as Error);
        }
      }
    );

    // 訂閱頻道
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Realtime 連線成功');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Realtime 連線失敗');
        onError?.(new Error('Realtime 連線失敗'));
      } else if (status === 'TIMED_OUT') {
        console.error('⏱️ Realtime 連線逾時');
        onError?.(new Error('Realtime 連線逾時'));
      }
    });

    channelRef.current = channel;

    // ═══════════════════════════════════════════════════════════════
    // 清理：取消訂閱
    // ═══════════════════════════════════════════════════════════════

    return () => {
      console.log('🔌 取消 Realtime 訂閱');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [sessionId, onCommand, onVoice, onTask, onError]);
}
