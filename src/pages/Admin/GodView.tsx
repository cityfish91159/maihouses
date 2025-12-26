"use client";
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Trash2, Send, MessageCircle, Eye, Heart, Gem, Brain, X, Download, Archive, Lock, Unlock, Check, XCircle } from 'lucide-react';

interface ShadowLog {
  id: string;
  user_id: string;
  hesitation_count: number;
  mode: string;
  content: string;
  created_at: string;
  metadata?: {
    type?: string;
    confession_type?: 'dark' | 'fantasy';
    is_dark_thought?: boolean;
    is_fantasy?: boolean;
    is_muse_response?: boolean;
    media_type?: 'text' | 'voice' | 'photo';
    media_url?: string;
  };
}

interface RivalDecoder {
  id: string;
  user_id: string;
  image_url: string;
  risk_score: number;
  analysis_report: {
    muse_whisper: string;
    physiognomy: string;
    socio_status: string;
  };
  created_at: string;
}

interface UserProgress {
  user_id: string;
  sync_level: number;
  total_messages: number;
  intimacy_score: number;
  muse_avatar_url?: string;
  muse_name?: string;
  current_mode?: 'normal' | 'naughty' | 'work';
}

interface MemoryVault {
  id: string;
  user_id: string;
  fact_type: string;
  content: string;
  emotional_weight: number;
  created_at: string;
}

interface AdminMessage {
  id: string;
  user_id: string;
  content: string;
  from_admin: boolean;
  created_at: string;
}

interface SoulTreasure {
  id: string;
  user_id: string;
  treasure_type: string;
  title: string;
  content: string;
  media_url?: string;
  rarity: string;
  unlocked_at: string;
}

// 🔒 聊色解鎖請求
interface SexyUnlockRequest {
  id: string;
  user_id: string;
  message_type: string;
  content: string;
  metadata: {
    timestamp: string;
    current_hour: number;
  };
  created_at: string;
}

// 💬 統一聊天訊息格式 - metadata 屬性明確允許 undefined
interface ChatMessageMetadata {
  type?: string | undefined;
  confession_type?: 'dark' | 'fantasy' | undefined;
  is_muse_response?: boolean | undefined;
  media_type?: 'text' | 'voice' | 'photo' | undefined;
  media_url?: string | undefined;
  naughty_mode?: boolean | undefined;
  task_type?: 'selfie' | 'voice' | 'photo' | 'confession' | undefined;
}

interface ChatMessage {
  id: string;
  content: string;
  from_admin: boolean;
  created_at: string;
  source: 'shadow_logs' | 'godview_messages';
  metadata?: ChatMessageMetadata | undefined;
}

// 🔞 性癖偏好
interface SexualPreference {
  id: string;
  user_id: string;
  category: 'position' | 'masturbation' | 'toys' | 'experience' | 'fantasy' | 'body';
  preference_key: string;
  preference_value: string;
  context?: string;
  confidence: number;
  discovered_at: string;
}

// 💦 親密統計
interface IntimateStats {
  total_sessions: number;
  avg_duration: number;
  last_session: string | null;
  by_hour: Record<number, number>;
  by_day: Record<number, number>;
}

export default function GodView() {
  const [logs, setLogs] = useState<ShadowLog[]>([]);
  const [rivals, setRivals] = useState<RivalDecoder[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [memories, setMemories] = useState<MemoryVault[]>([]);

  // 管理員接管對話狀態
  const [showTakeover, setShowTakeover] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [adminMessage, setAdminMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([]);

  // 圖片預覽狀態
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [userTreasures, setUserTreasures] = useState<SoulTreasure[]>([]);
  const [showTreasuresPanel, setShowTreasuresPanel] = useState(false);

  // 🔒 聊色解鎖請求狀態
  const [sexyUnlockRequests, setSexyUnlockRequests] = useState<SexyUnlockRequest[]>([]);

  // 🔞 性癖偏好收集
  const [sexualPreferences, setSexualPreferences] = useState<SexualPreference[]>([]);

  // 💦 親密統計
  const [intimateStats, setIntimateStats] = useState<IntimateStats | null>(null);

  // 📨 直接發訊息面板狀態
  const [directMessage, setDirectMessage] = useState('');
  const [directSending, setDirectSending] = useState(false);
  const [detectedUserId, setDetectedUserId] = useState<string | null>(null);
  const [manualUserId, setManualUserId] = useState('');

  // 💬 完整對話記錄
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Initial fetch
    const fetchInitial = async () => {
      const { data: logData } = await supabase.from('shadow_logs').select('*').order('created_at', { ascending: false }).limit(50);
      if (logData) setLogs(logData);

      const { data: rivalData } = await supabase.from('rival_decoder').select('*').order('created_at', { ascending: false }).limit(20);
      if (rivalData) setRivals(rivalData as RivalDecoder[]);

      const { data: progressData } = await supabase.from('user_progress').select('*').order('sync_level', { ascending: false });

      // 🎮 從 shadow_logs 取得每個用戶的最新模式狀態
      if (progressData) {
        // 獲取所有用戶的最新 shadow_log
        const userIds = progressData.map(u => u.user_id);
        const { data: latestLogs } = await supabase
          .from('shadow_logs')
          .select('user_id, metadata, created_at')
          .in('user_id', userIds)
          .order('created_at', { ascending: false });

        // 建立用戶 -> 最新 log 的映射
        const userModeMap: Record<string, 'normal' | 'naughty' | 'work'> = {};
        if (latestLogs) {
          const seenUsers = new Set<string>();
          for (const log of latestLogs) {
            if (seenUsers.has(log.user_id)) continue;
            seenUsers.add(log.user_id);
            const meta = log.metadata as { naughty_mode?: boolean; work_mode?: boolean } | null;
            if (meta?.naughty_mode) {
              userModeMap[log.user_id] = 'naughty';
            } else if (meta?.work_mode) {
              userModeMap[log.user_id] = 'work';
            } else {
              userModeMap[log.user_id] = 'normal';
            }
          }
        }

        // 合併模式狀態到 progressData
        const enrichedProgress = progressData.map(user => ({
          ...user,
          current_mode: userModeMap[user.user_id] || user.current_mode || 'normal'
        }));
        setUserProgress(enrichedProgress);
      }

      const { data: memoryData } = await supabase.from('muse_memory_vault').select('*').order('created_at', { ascending: false }).limit(50);
      if (memoryData) setMemories(memoryData);

      // 🔒 獲取待處理的聊色解鎖請求
      const { data: sexyUnlockData } = await supabase
        .from('godview_messages')
        .select('*')
        .eq('message_type', 'sexy_unlock_request')
        .eq('is_read', false)
        .order('created_at', { ascending: false });
      if (sexyUnlockData) setSexyUnlockRequests(sexyUnlockData as SexyUnlockRequest[]);

      // 🔞 獲取性癖偏好收集資料
      const { data: prefData } = await supabase
        .from('sexual_preferences')
        .select('*')
        .order('discovered_at', { ascending: false });
      if (prefData) setSexualPreferences(prefData as SexualPreference[]);

      // 💦 獲取親密統計
      const { data: intimateData } = await supabase
        .from('intimate_sessions')
        .select('*')
        .order('started_at', { ascending: false });
      if (intimateData && intimateData.length > 0) {
        const byHour: Record<number, number> = {};
        const byDay: Record<number, number> = {};
        let totalDuration = 0;
        let durationCount = 0;

        intimateData.forEach((session: { metadata?: { hour?: number; day_of_week?: number }; duration_seconds?: number }) => {
          const hour = session.metadata?.hour;
          const day = session.metadata?.day_of_week;
          if (hour !== undefined) byHour[hour] = (byHour[hour] || 0) + 1;
          if (day !== undefined) byDay[day] = (byDay[day] || 0) + 1;
          if (session.duration_seconds) {
            totalDuration += session.duration_seconds;
            durationCount++;
          }
        });

        setIntimateStats({
          total_sessions: intimateData.length,
          avg_duration: durationCount > 0 ? Math.round(totalDuration / durationCount) : 0,
          last_session: intimateData[0]?.started_at || null,
          by_hour: byHour,
          by_day: byDay
        });
      }
    };
    fetchInitial();

    // Helper functions for polling
    const fetchLogs = async () => {
      const { data } = await supabase.from('shadow_logs').select('*').order('created_at', { ascending: false }).limit(50);
      if (data) {
        setLogs(prev => {
          const currentIds = new Set(prev.map(l => l.id));
          const newItems = data.filter(d => !currentIds.has(d.id));
          if (newItems.length === 0) return prev;
          return [...newItems, ...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 50);
        });
      }
    };

    const fetchRivals = async () => {
      const { data } = await supabase.from('rival_decoder').select('*').order('created_at', { ascending: false }).limit(20);
      if (data) {
        setRivals(prev => {
          const currentIds = new Set(prev.map(r => r.id));
          const newItems = data.filter(d => !currentIds.has(d.id));
          if (newItems.length === 0) return prev;
          return [...newItems, ...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 20);
        });
      }
    };

    // Real-time subscriptions
    const channel = supabase
      .channel('god_view_shadow')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'shadow_logs' },
        (payload) => {
          const newLog = payload.new as ShadowLog;
          setLogs((prev) => [newLog, ...prev]);
          toast('SIGNAL DETECTED', {
            description: `ID: ${newLog.user_id.slice(0, 8)}... | LEN: ${newLog.content.length}`,
            className: 'bg-amber-900 border-amber-500 text-amber-100'
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') toast.success("SHADOW_LOGS CONNECTED");
        else if (status === 'CHANNEL_ERROR') toast.error("REALTIME DISCONNECTED - RETRYING...");
      });

    const rivalSub = supabase.channel('rival_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rival_decoder' }, (p) => {
        setRivals(prev => [p.new as RivalDecoder, ...prev]);
        toast.success("NEW SIGNAL INTERCEPTED", {
          description: `Target ID: ${(p.new as RivalDecoder).id.slice(0, 8)}`,
          className: 'bg-red-950 text-red-500 border-red-900'
        });
      })
      .subscribe();

    // 🔒 聊色解鎖請求訂閱
    const sexyUnlockSub = supabase.channel('sexy_unlock_requests')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'godview_messages' }, (p) => {
        const msg = p.new as SexyUnlockRequest;
        if (msg.message_type === 'sexy_unlock_request') {
          setSexyUnlockRequests(prev => [msg, ...prev]);
          toast('💕 想聊色色！', {
            description: `資欣老師想在上班時間聊色色`,
            className: 'bg-pink-950 text-pink-200 border border-pink-800',
            duration: 15000
          });
        }
      })
      .subscribe();

    // BACKUP POLLING
    const interval = setInterval(() => {
      fetchLogs();
      fetchRivals();
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(rivalSub);
      supabase.removeChannel(sexyUnlockSub);
      clearInterval(interval);
    };
  }, []);

  // 📨 自動檢測最新用戶 ID
  useEffect(() => {
    const detectUserId = async () => {
      // 優先從 shadow_logs 獲取
      const { data: latestLogs } = await supabase
        .from('shadow_logs')
        .select('user_id')
        .order('created_at', { ascending: false })
        .limit(1);

      if (latestLogs?.[0]?.user_id) {
        setDetectedUserId(latestLogs[0].user_id);
        return;
      }

      // 備選：從 user_progress 獲取
      const { data: latestProgress } = await supabase
        .from('user_progress')
        .select('user_id')
        .order('last_interaction', { ascending: false })
        .limit(1);

      if (latestProgress?.[0]?.user_id) {
        setDetectedUserId(latestProgress[0].user_id);
      }
    };

    detectUserId();
  }, [logs]); // 當 logs 更新時重新檢測

  // 💬 載入完整對話記錄
  const loadChatHistory = async (userId: string) => {
    setLoadingChat(true);
    try {
      // 載入用戶發送的訊息 (從 shadow_logs)
      const { data: userMessages } = await supabase
        .from('shadow_logs')
        .select('id, content, created_at, metadata')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      // 載入管理員發送的訊息 (從 godview_messages)
      const { data: adminMessages } = await supabase
        .from('godview_messages')
        .select('id, content, created_at, message_type')
        .eq('user_id', userId)
        .eq('message_type', 'chat')
        .order('created_at', { ascending: true });

      // 合併並排序
      const combined: ChatMessage[] = [
        ...(userMessages || []).map(m => {
          // 處理 metadata，確保類型正確
          const metadata = m.metadata && typeof m.metadata === 'object'
            ? {
                type: (m.metadata as Record<string, unknown>).type as string | undefined,
                confession_type: (m.metadata as Record<string, unknown>).confession_type as 'dark' | 'fantasy' | undefined,
                is_muse_response: (m.metadata as Record<string, unknown>).is_muse_response as boolean | undefined,
                media_type: (m.metadata as Record<string, unknown>).media_type as 'text' | 'voice' | 'photo' | undefined,
                media_url: (m.metadata as Record<string, unknown>).media_url as string | undefined
              }
            : undefined;

          return {
            id: m.id,
            content: m.content,
            from_admin: false,
            created_at: m.created_at,
            source: 'shadow_logs' as const,
            ...(metadata && { metadata })
          };
        }),
        ...(adminMessages || []).map(m => ({
          id: m.id,
          content: m.content,
          from_admin: true,
          created_at: m.created_at,
          source: 'godview_messages' as const
        }))
      ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      setChatHistory(combined);

      // 滾動到底部
      setTimeout(() => {
        chatContainerRef.current?.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);

    } catch (error) {
      console.error('Load chat error:', error);
      toast.error('載入對話記錄失敗');
    } finally {
      setLoadingChat(false);
    }
  };

  // 💬 當檢測到用戶 ID 時自動載入對話
  useEffect(() => {
    const targetId = manualUserId.trim() || detectedUserId;
    if (targetId) {
      loadChatHistory(targetId);
    }
  }, [detectedUserId, manualUserId]);

  // 💬 即時監聽新訊息並更新對話框
  useEffect(() => {
    const targetId = manualUserId.trim() || detectedUserId;
    if (!targetId) return;

    console.log('🔔 開始監聽用戶訊息:', targetId);

    // 監聽 shadow_logs（用戶發送的訊息）
    const shadowSub = supabase
      .channel(`chat_shadow_${targetId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'shadow_logs' },
        (payload) => {
          const newLog = payload.new as ShadowLog;
          if (newLog.user_id === targetId) {
            const metadata = newLog.metadata && typeof newLog.metadata === 'object'
              ? {
                  type: (newLog.metadata as Record<string, unknown>).type as string | undefined,
                  confession_type: (newLog.metadata as Record<string, unknown>).confession_type as 'dark' | 'fantasy' | undefined,
                  is_muse_response: (newLog.metadata as Record<string, unknown>).is_muse_response as boolean | undefined,
                  media_type: (newLog.metadata as Record<string, unknown>).media_type as 'text' | 'voice' | 'photo' | undefined,
                  media_url: (newLog.metadata as Record<string, unknown>).media_url as string | undefined
                }
              : undefined;

            const newMessage: ChatMessage = {
              id: newLog.id,
              content: newLog.content,
              from_admin: false,
              created_at: newLog.created_at,
              source: 'shadow_logs',
              ...(metadata && { metadata })
            };

            setChatHistory(prev => [...prev, newMessage]);

            // 滾動到底部
            setTimeout(() => {
              chatContainerRef.current?.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
              });
            }, 100);
          }
        }
      )
      .subscribe();

    // 監聽 godview_messages（管理員發送的訊息）
    const godviewSub = supabase
      .channel(`chat_godview_${targetId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'godview_messages' },
        (payload) => {
          const newMsg = payload.new as AdminMessage;
          if (newMsg.user_id === targetId && (newMsg as { message_type?: string }).message_type === 'chat') {
            const newMessage: ChatMessage = {
              id: newMsg.id,
              content: newMsg.content,
              from_admin: true,
              created_at: newMsg.created_at,
              source: 'godview_messages'
            };

            setChatHistory(prev => [...prev, newMessage]);

            // 滾動到底部
            setTimeout(() => {
              chatContainerRef.current?.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
              });
            }, 100);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(shadowSub);
      supabase.removeChannel(godviewSub);
    };
  }, [detectedUserId, manualUserId]);

  // 💬 刪除對話訊息
  const deleteChatMessage = async (msg: ChatMessage) => {
    try {
      if (msg.source === 'shadow_logs') {
        const { error } = await supabase.from('shadow_logs').delete().eq('id', msg.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('godview_messages').delete().eq('id', msg.id);
        if (error) throw error;
      }

      setChatHistory(prev => prev.filter(m => m.id !== msg.id));
      toast.success('訊息已刪除');
    } catch (error) {
      console.error('Delete message error:', error);
      toast.error('刪除失敗');
    }
  };

  const handleDeleteLog = async (id: string) => {
    setLogs(prev => prev.filter(l => l.id !== id));

    const { error, data } = await supabase.from('shadow_logs').delete().eq('id', id).select();

    if (error) {
      toast.error(`DELETE ERROR: ${error.message}`);
    } else if (!data || data.length === 0) {
      toast.error("PERMISSION DENIED: RLS Policy blocked deletion.");
    } else {
      toast.success("LOG DELETED");
    }
  };

  const handleDeleteRival = async (id: string) => {
    setRivals(prev => prev.filter(r => r.id !== id));

    const { error, data } = await supabase.from('rival_decoder').delete().eq('id', id).select();

    if (error) {
      toast.error(`DELETE ERROR: ${error.message}`);
    } else if (!data || data.length === 0) {
      toast.error("PERMISSION DENIED: RLS Policy blocked deletion.");
    } else {
      toast.success("TARGET ELIMINATED");
    }
  };

  // 🗑️ 刪除用戶及其所有相關資料
  const handleDeleteUser = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止觸發卡片的 onClick

    if (!confirm(`確定要刪除此用戶嗎？\n\n這將清除該用戶的：\n• 聊天記錄\n• 上傳的照片\n• 所有互動數據\n\nID: ${userId.slice(0, 12)}...`)) {
      return;
    }

    toast.loading('正在刪除用戶資料...', { id: 'deleteUser' });

    try {
      // 1. 刪除 shadow_logs（聊天記錄）
      await supabase.from('shadow_logs').delete().eq('user_id', userId);

      // 2. 刪除 godview_messages（管理員訊息）
      await supabase.from('godview_messages').delete().eq('user_id', userId);

      // 3. 刪除 soul_treasures（上傳的圖片/寶物）
      await supabase.from('soul_treasures').delete().eq('user_id', userId);

      // 4. 刪除 rival_decoder（情敵分析）
      await supabase.from('rival_decoder').delete().eq('user_id', userId);

      // 5. 刪除 muse_memory_vault（記憶庫）
      await supabase.from('muse_memory_vault').delete().eq('user_id', userId);

      // 6. 最後刪除 user_progress
      const { error } = await supabase.from('user_progress').delete().eq('user_id', userId);

      if (error) throw error;

      // 更新本地狀態
      setUserProgress(prev => prev.filter(u => u.user_id !== userId));
      setLogs(prev => prev.filter(l => l.user_id !== userId));
      setRivals(prev => prev.filter(r => r.user_id !== userId));
      setMemories(prev => prev.filter(m => m.user_id !== userId));

      toast.success('用戶已完全刪除', { id: 'deleteUser' });

    } catch (error) {
      console.error('Delete user error:', error);
      toast.error('刪除失敗，可能需要管理員權限', { id: 'deleteUser' });
    }
  };

  // 打開接管對話模式
  const openTakeover = (userId: string) => {
    setSelectedUserId(userId);
    setShowTakeover(true);
    // 獲取該用戶的對話記錄和寶物（含圖片）
    fetchUserMessages(userId);
    fetchUserTreasures(userId);
  };

  // 獲取用戶的寶物（含上傳的圖片）
  const fetchUserTreasures = async (userId: string) => {
    const { data } = await supabase
      .from('soul_treasures')
      .select('*')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    if (data) {
      setUserTreasures(data);
    }
  };

  // 獲取用戶訊息
  const fetchUserMessages = async (userId: string) => {
    const { data } = await supabase
      .from('shadow_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(50);

    if (data) {
      setAdminMessages(data.map(d => ({
        id: d.id,
        user_id: d.user_id,
        content: d.content,
        from_admin: false,
        created_at: d.created_at
      })));
    }
  };

  // 管理員發送訊息（偽裝成 MUSE）- 使用 godview_messages 表實現即時推送
  const sendAdminMessage = async () => {
    if (!adminMessage.trim() || !selectedUserId || isSending) return;

    setIsSending(true);
    const messageToSend = adminMessage;
    setAdminMessage('');

    try {
      // 插入到 godview_messages 表 - 這會觸發 NightMode 的即時訂閱
      const { error } = await supabase.from('godview_messages').insert({
        user_id: selectedUserId,
        message_type: 'chat',
        content: messageToSend,
        metadata: {},
        is_read: false
      });

      if (error) throw error;

      // 添加到本地訊息列表
      setAdminMessages(prev => [...prev, {
        id: Date.now().toString(),
        user_id: selectedUserId,
        content: messageToSend,
        from_admin: true,
        created_at: new Date().toISOString()
      }]);

      toast.success("MESSAGE PUSHED TO USER", { className: 'bg-purple-900 text-purple-200' });

    } catch (error) {
      console.error('Send error:', error);
      toast.error("PUSH FAILED");
      setAdminMessage(messageToSend);
    } finally {
      setIsSending(false);
    }
  };

  // 發送語音訊息給用戶
  const sendVoiceMessage = async (audioUrl: string) => {
    if (!selectedUserId) return;

    try {
      const { error } = await supabase.from('godview_messages').insert({
        user_id: selectedUserId,
        message_type: 'voice',
        content: '🎤 語音訊息',
        metadata: { audioUrl },
        is_read: false
      });

      if (error) throw error;
      toast.success("VOICE MESSAGE PUSHED");
    } catch (error) {
      console.error('Voice send error:', error);
      toast.error("VOICE PUSH FAILED");
    }
  };

  // 發送任務給用戶
  const sendTask = async (taskData: { task_type: string; instruction: string; reward_rarity: string }) => {
    if (!selectedUserId) return;

    try {
      const { error } = await supabase.from('godview_messages').insert({
        user_id: selectedUserId,
        message_type: 'task',
        content: `📋 新任務：${taskData.instruction}`,
        metadata: {
          taskData: {
            id: crypto.randomUUID(),
            task_type: taskData.task_type,
            instruction: taskData.instruction,
            status: 'pending',
            reward_rarity: taskData.reward_rarity,
            created_at: new Date().toISOString()
          }
        },
        is_read: false
      });

      if (error) throw error;
      toast.success("TASK PUSHED TO USER");
    } catch (error) {
      console.error('Task send error:', error);
      toast.error("TASK PUSH FAILED");
    }
  };

  // 🔒 同意聊色
  const approveSexyUnlock = async (request: SexyUnlockRequest) => {
    try {
      // 標記原始請求為已讀
      await supabase.from('godview_messages').update({ is_read: true }).eq('id', request.id);

      // 發送解鎖回應給用戶
      const { error } = await supabase.from('godview_messages').insert({
        user_id: request.user_id,
        message_type: 'sexy_unlock_response',
        content: '✅ 允許聊色',
        metadata: { approved: true, message: '好吧...今天特別允許妳 💕' },
        is_read: false
      });

      if (error) throw error;

      // 從列表中移除
      setSexyUnlockRequests(prev => prev.filter(r => r.id !== request.id));
      toast.success("已允許聊色", { className: 'bg-pink-900 text-pink-200' });
    } catch (error) {
      console.error('Approve sexy unlock error:', error);
      toast.error("操作失敗");
    }
  };

  // 🔒 拒絕聊色
  const denySexyUnlock = async (request: SexyUnlockRequest, message: string = '認真上課！不准色色') => {
    try {
      // 標記原始請求為已讀
      await supabase.from('godview_messages').update({ is_read: true }).eq('id', request.id);

      // 發送拒絕回應給用戶
      const { error } = await supabase.from('godview_messages').insert({
        user_id: request.user_id,
        message_type: 'sexy_unlock_response',
        content: '❌ 不准聊色',
        metadata: { approved: false, message },
        is_read: false
      });

      if (error) throw error;

      // 從列表中移除
      setSexyUnlockRequests(prev => prev.filter(r => r.id !== request.id));
      toast('已拒絕', {
        description: '要認真上課！',
        className: 'bg-red-900 text-red-200'
      });
    } catch (error) {
      console.error('Deny sexy unlock error:', error);
      toast.error("操作失敗");
    }
  };

  // 📨 直接發訊息給資欣
  const sendDirectMessage = async () => {
    if (!directMessage.trim() || directSending) return;

    // 使用手動輸入的 ID 或自動檢測的 ID
    const targetUserId = manualUserId.trim() || detectedUserId;

    if (!targetUserId) {
      toast.error('找不到用戶 ID，請先讓資欣訪問 MUSE 頁面，或手動輸入 Session ID');
      return;
    }

    setDirectSending(true);
    const messageToSend = directMessage;
    setDirectMessage('');

    try {
      console.log('📨 發送訊息給:', targetUserId);

      const { error, data } = await supabase.from('godview_messages').insert({
        user_id: targetUserId,
        message_type: 'chat',
        content: messageToSend,
        metadata: {},
        is_read: false
      }).select();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      console.log('✅ 訊息已插入:', data);

      // 添加到對話記錄
      if (data && data[0]) {
        setChatHistory(prev => [...prev, {
          id: data[0].id,
          content: messageToSend,
          from_admin: true,
          created_at: data[0].created_at,
          source: 'godview_messages'
        }]);

        // 滾動到底部
        setTimeout(() => {
          chatContainerRef.current?.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }, 100);
      }

      toast.success("訊息已推送", {
        description: `發送給 ${targetUserId.slice(0, 8)}...`,
        className: 'bg-purple-900 text-purple-200'
      });

    } catch (error) {
      console.error('Direct send error:', error);
      toast.error("推送失敗 - 請檢查 godview_messages 表是否存在");
      setDirectMessage(messageToSend);
    } finally {
      setDirectSending(false);
    }
  };

  // 獲取唯一用戶列表
  const uniqueUsers = Array.from(new Set(logs.map(l => l.user_id))).slice(0, 10);

  // 下載用戶所有照片
  const downloadUserPhotos = async (userId: string) => {
    toast.loading('準備下載...', { id: 'download' });

    try {
      // 獲取用戶的所有寶物
      const { data: allTreasures } = await supabase
        .from('soul_treasures')
        .select('*')
        .eq('user_id', userId);

      const photosToDownload = allTreasures?.filter(t => t.media_url) || [];

      if (photosToDownload.length === 0) {
        toast.error('此用戶沒有上傳過照片', { id: 'download' });
        return;
      }

      // 獲取用戶進度資訊
      const userInfo = userProgress.find(u => u.user_id === userId);

      // 創建備份 JSON
      const backupData = {
        exported_at: new Date().toISOString(),
        user_id: userId,
        muse_name: userInfo?.muse_name || 'MUSE',
        sync_level: userInfo?.sync_level || 0,
        total_photos: photosToDownload.length,
        photos: photosToDownload.map(t => ({
          id: t.id,
          title: t.title,
          content: t.content,
          rarity: t.rarity,
          type: t.treasure_type,
          media_url: t.media_url,
          unlocked_at: t.unlocked_at
        }))
      };

      // 下載 JSON
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user_${userId.slice(0, 8)}_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`已下載 ${photosToDownload.length} 張照片備份`, { id: 'download' });

    } catch (error) {
      console.error('Download error:', error);
      toast.error('下載失敗', { id: 'download' });
    }
  };

  // 下載所有用戶的所有照片
  const downloadAllPhotos = async () => {
    toast.loading('準備下載所有照片...', { id: 'downloadAll' });

    try {
      const { data: allTreasures } = await supabase
        .from('soul_treasures')
        .select('*')
        .order('unlocked_at', { ascending: false });

      const photosToDownload = allTreasures?.filter(t => t.media_url) || [];

      if (photosToDownload.length === 0) {
        toast.error('沒有任何照片', { id: 'downloadAll' });
        return;
      }

      // 按用戶分組
      const groupedByUser: Record<string, typeof photosToDownload> = {};
      for (const photo of photosToDownload) {
        const userId = photo.user_id;
        if (!groupedByUser[userId]) {
          groupedByUser[userId] = [];
        }
        const userPhotos = groupedByUser[userId];
        if (userPhotos) {
          userPhotos.push(photo);
        }
      }

      const backupData = {
        exported_at: new Date().toISOString(),
        total_users: Object.keys(groupedByUser).length,
        total_photos: photosToDownload.length,
        users: Object.entries(groupedByUser).map(([userId, photos]) => ({
          user_id: userId,
          photo_count: photos.length,
          photos: photos.map(p => ({
            id: p.id,
            title: p.title,
            rarity: p.rarity,
            media_url: p.media_url,
            unlocked_at: p.unlocked_at
          }))
        }))
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all_users_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`已下載 ${photosToDownload.length} 張照片 (${Object.keys(groupedByUser).length} 位用戶)`, { id: 'downloadAll' });

    } catch (error) {
      console.error('Download all error:', error);
      toast.error('下載失敗', { id: 'downloadAll' });
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-amber-500 font-mono p-6 text-[10px] uppercase overflow-hidden">
      <h1 className="text-xl mb-8 border-b border-amber-900 pb-4 flex justify-between items-end">
        <span>GOD_VIEW: REAL-TIME SOUL MONITORING</span>
        <div className="flex gap-4 items-center">
          <button
            onClick={downloadAllPhotos}
            className="text-xs px-3 py-1.5 bg-pink-900/30 text-pink-400 hover:bg-pink-900/50 rounded-lg flex items-center gap-2 transition-colors border border-pink-900/30"
          >
            <Archive size={14} />
            BACKUP ALL PHOTOS
          </button>
          <button
            onClick={async () => {
              toast.loading("DIAGNOSTIC CHECK...", { id: 'diag' });
              const { error } = await supabase.from('shadow_logs').insert({
                user_id: '00000000-0000-0000-0000-000000000000',
                content: 'DIAGNOSTIC_SIGNAL_CHECK',
                hesitation_count: 0,
                mode: 'night'
              });

              if (error) {
                toast.error(`DB ERROR: ${error.message} (${error.code})`, { id: 'diag' });
              } else {
                toast.success("DB CONNECTION HEALTHY", { id: 'diag', className: 'bg-green-900 text-green-200' });
              }
            }}
            className="text-xs animate-pulse text-red-500 hover:text-red-400 cursor-pointer"
          >
            LIVE CONNECTION ACTIVE (CLICK TO DIAGNOSE)
          </button>
        </div>
      </h1>

      {/* 🔒 聊色解鎖控制面板 - 固定在頂部 */}
      <div className={`mb-6 p-4 rounded-xl border transition-all ${
        sexyUnlockRequests.length > 0
          ? 'bg-pink-950/50 border-pink-500/50 animate-pulse'
          : 'bg-stone-950/30 border-stone-800/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {sexyUnlockRequests.length > 0 ? (
              <Lock className="text-pink-400" size={20} />
            ) : (
              <Unlock className="text-stone-600" size={20} />
            )}
            <h3 className={`text-sm uppercase tracking-wider ${
              sexyUnlockRequests.length > 0 ? 'text-pink-400' : 'text-stone-600'
            }`}>
              8-17 聊色管制
            </h3>
            {sexyUnlockRequests.length > 0 && (
              <span className="px-2 py-0.5 bg-pink-500 text-white text-xs rounded-full animate-bounce">
                {sexyUnlockRequests.length} 個請求
              </span>
            )}
          </div>
          <span className="text-stone-500 text-[10px]">
            {new Date().getHours() >= 8 && new Date().getHours() < 17
              ? '🔒 管制時段中'
              : '🔓 自由時段'}
          </span>
        </div>

        {sexyUnlockRequests.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sexyUnlockRequests.map(req => (
              <div key={req.id} className="bg-pink-900/30 border border-pink-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-pink-300 text-sm font-bold">💕 資欣想聊色</span>
                  <span className="text-pink-500/60 text-[10px]">
                    {new Date(req.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-stone-400 text-xs mb-3 line-clamp-2">
                  被阻擋的訊息: {(req.metadata as { blocked_message?: string })?.blocked_message || req.content}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => approveSexyUnlock(req)}
                    className="flex-1 py-2.5 bg-pink-600 text-white rounded-lg text-sm font-bold hover:bg-pink-500 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check size={16} />
                    允許
                  </button>
                  <button
                    onClick={() => denySexyUnlock(req)}
                    className="flex-1 py-2.5 bg-red-900/50 text-red-300 rounded-lg text-sm hover:bg-red-900/70 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle size={16} />
                    拒絕
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-stone-600 text-[10px]">
            目前沒有待處理的聊色請求。當資欣在 8:00-17:00 發送色色內容時，會在這裡顯示請求。
          </p>
        )}
      </div>

      {/* 💬 完整對話面板 */}
      <div className="mb-6 bg-purple-950/20 border border-purple-500/30 rounded-xl overflow-hidden">
        {/* 標題列 */}
        <div className="p-4 border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="text-purple-400" size={20} />
            <h3 className="text-purple-400 text-sm uppercase tracking-wider">
              與資欣老師的對話
            </h3>
            <span className="text-[10px] text-stone-500">
              ({chatHistory.length} 則訊息)
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* 顯示目標用戶 ID */}
            {detectedUserId ? (
              <span className="text-[10px] text-green-400">
                ID: {detectedUserId.slice(0, 12)}...
              </span>
            ) : (
              <span className="text-[10px] text-red-400">⚠️ 未檢測到用戶</span>
            )}
            {/* 手動輸入 Session ID */}
            <input
              type="text"
              value={manualUserId}
              onChange={(e) => setManualUserId(e.target.value)}
              className="w-48 bg-stone-900/50 border border-stone-800 rounded-lg px-2 py-1 text-stone-300 text-[10px] font-mono focus:border-purple-500/50 focus:outline-none"
              placeholder="手動輸入 Session ID"
            />
          </div>
        </div>

        {/* 對話記錄 */}
        <div
          ref={chatContainerRef}
          className="h-64 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-purple-900"
        >
          {loadingChat ? (
            <div className="text-center text-stone-500 py-8">載入中...</div>
          ) : chatHistory.length === 0 ? (
            <div className="text-center text-stone-600 py-8 italic">
              還沒有對話記錄，開始聊天吧！
            </div>
          ) : (
            chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`group flex ${msg.from_admin ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`relative max-w-[75%] p-3 rounded-xl ${
                    msg.from_admin
                      ? 'bg-purple-900/40 border border-purple-500/30'
                      : 'bg-stone-900/60 border border-stone-800'
                  }`}
                >
                  {/* 刪除按鈕 */}
                  <button
                    onClick={() => deleteChatMessage(msg)}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-900/80 text-red-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-800"
                  >
                    <X size={12} />
                  </button>

                  {/* 發送者標籤 */}
                  <p className={`text-[9px] mb-1 ${msg.from_admin ? 'text-purple-400' : 'text-stone-500'}`}>
                    {msg.from_admin ? '你 (MUSE)' : '資欣老師'}
                    {/* 🔥 焚燒內容標籤 */}
                    {msg.metadata?.type === 'burning' && (
                      <span className="ml-2 text-amber-400">
                        🔥 焚燒
                        {msg.metadata?.media_type === 'photo' && ' [照片]'}
                        {msg.metadata?.media_type === 'voice' && ' [語音]'}
                        {msg.metadata?.media_type === 'text' && ' [文字]'}
                        {msg.metadata?.naughty_mode && ' 🔞'}
                      </span>
                    )}
                    {/* ✅ 任務完成標籤 */}
                    {msg.metadata?.type === 'task_complete' && (
                      <span className="ml-2 text-green-400">
                        ✅ 任務完成
                        {msg.metadata?.task_type === 'selfie' && ' [自拍]'}
                        {msg.metadata?.task_type === 'photo' && ' [照片]'}
                        {msg.metadata?.task_type === 'voice' && ' [語音]'}
                        {msg.metadata?.naughty_mode && ' 🔞'}
                      </span>
                    )}
                  </p>

                  {/* 照片顯示 - 焚燒照片或任務完成照片 */}
                  {((msg.metadata?.media_type === 'photo' && msg.metadata?.media_url) ||
                    (msg.metadata?.type === 'task_complete' && msg.metadata?.media_url)) && (
                    <img
                      src={msg.metadata?.media_url}
                      alt="照片"
                      className="max-w-[200px] rounded-lg border border-amber-500/30 mb-2 cursor-pointer hover:opacity-80"
                      onClick={() => setPreviewImage(msg.metadata?.media_url || null)}
                    />
                  )}

                  {/* 語音顯示 */}
                  {msg.metadata?.media_type === 'voice' && msg.metadata?.media_url && (
                    <audio
                      src={msg.metadata.media_url}
                      controls
                      className="w-full max-w-[250px] mb-2"
                    />
                  )}

                  {/* 訊息內容 */}
                  <p className="text-stone-200 text-sm normal-case font-sans whitespace-pre-wrap">
                    {msg.content}
                  </p>

                  {/* 時間戳 */}
                  <p className="text-[8px] text-stone-600 mt-1">
                    {new Date(msg.created_at).toLocaleString('zh-TW', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 輸入區 */}
        <div className="p-4 border-t border-purple-500/20 flex gap-3">
          <textarea
            value={directMessage}
            onChange={(e) => setDirectMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendDirectMessage();
              }
            }}
            className="flex-1 bg-stone-900/50 border border-stone-800 rounded-xl px-4 py-3 text-stone-200 text-sm normal-case font-sans focus:border-purple-500/50 focus:outline-none resize-none"
            placeholder="以 MUSE 身份發送訊息..."
            rows={2}
          />
          <button
            onClick={sendDirectMessage}
            disabled={directSending || !directMessage.trim() || (!detectedUserId && !manualUserId.trim())}
            className="px-6 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 self-end"
          >
            <Send size={16} />
            {directSending ? '發送中...' : '發送'}
          </button>
        </div>
      </div>

      {/* 用戶進度概覽 */}
      <div className="mb-8 grid grid-cols-5 gap-4">
        {userProgress.slice(0, 5).map(user => (
          <div
            key={user.user_id}
            className="relative group bg-purple-900/10 border border-purple-500/20 p-4 rounded-lg cursor-pointer hover:border-purple-500/50 transition-colors"
            onClick={() => openTakeover(user.user_id)}
          >
            {/* 刪除按鈕 - 懸停時顯示 */}
            <button
              onClick={(e) => handleDeleteUser(user.user_id, e)}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-900/80 text-red-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-800 z-10"
              title="刪除此用戶"
            >
              <Trash2 size={12} />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-purple-900/30 overflow-hidden">
                {user.muse_avatar_url ? (
                  <img src={user.muse_avatar_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Heart size={14} className="text-purple-400" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-purple-400 text-xs">{user.muse_name || 'MUSE'}</p>
                <p className="text-stone-500 text-[8px]">ID: {user.user_id.slice(0, 8)}</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[9px]">
                <span>SYNC</span>
                <span className="text-purple-400">{user.sync_level}%</span>
              </div>
              <div className="h-1 bg-stone-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-600" style={{ width: `${user.sync_level}%` }} />
              </div>
              <div className="flex justify-between text-[8px] text-stone-600">
                <span>MSG: {user.total_messages}</span>
                <span>INT: {user.intimacy_score}</span>
              </div>
              {/* 模式狀態 */}
              <div className="mt-1 text-center">
                <span className={`text-[9px] px-2 py-0.5 rounded-full ${
                  user.current_mode === 'naughty'
                    ? 'bg-pink-900/50 text-pink-400'
                    : user.current_mode === 'work'
                      ? 'bg-blue-900/50 text-blue-400'
                      : 'bg-stone-800 text-stone-500'
                }`}>
                  {user.current_mode === 'naughty' ? '🔥 壞壞模式' : user.current_mode === 'work' ? '💼 工作模式' : '💕 正常模式'}
                </span>
              </div>
            </div>
            <button className="mt-2 w-full py-1 bg-purple-900/30 text-purple-400 rounded text-[9px] hover:bg-purple-900/50 flex items-center justify-center gap-1">
              <MessageCircle size={10} />
              TAKEOVER
            </button>
          </div>
        ))}
      </div>

      {/* 🔞 性癖偏好收集面板 */}
      {/* 💦 親密統計面板 */}
      {intimateStats && intimateStats.total_sessions > 0 && (
        <div className="mb-6 p-4 bg-pink-950/30 border border-pink-500/30 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="text-pink-400" size={20} />
            <h3 className="text-pink-400 text-sm uppercase tracking-wider">
              親密統計 💦
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-pink-900/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-pink-400">{intimateStats.total_sessions}</div>
              <div className="text-[10px] text-pink-500/60">總次數</div>
            </div>
            <div className="bg-pink-900/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-pink-400">
                {intimateStats.avg_duration > 0 ? `${Math.floor(intimateStats.avg_duration / 60)}分${intimateStats.avg_duration % 60}秒` : '-'}
              </div>
              <div className="text-[10px] text-pink-500/60">平均時長</div>
            </div>
            <div className="bg-pink-900/20 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-pink-400">
                {intimateStats.last_session ? new Date(intimateStats.last_session).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' }) : '-'}
              </div>
              <div className="text-[10px] text-pink-500/60">最近一次</div>
            </div>
            <div className="bg-pink-900/20 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-pink-400">
                {Object.entries(intimateStats.by_hour).length > 0
                  ? `${Object.entries(intimateStats.by_hour).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'}點`
                  : '-'}
              </div>
              <div className="text-[10px] text-pink-500/60">最常時段</div>
            </div>
          </div>
          {/* 時段分佈 */}
          {Object.keys(intimateStats.by_hour).length > 0 && (
            <div className="bg-pink-900/10 rounded-lg p-3">
              <div className="text-[10px] text-pink-500/60 mb-2">時段分佈</div>
              <div className="flex gap-1 h-12">
                {Array.from({ length: 24 }, (_, i) => {
                  const count = intimateStats.by_hour[i] || 0;
                  const maxCount = Math.max(...Object.values(intimateStats.by_hour), 1);
                  const height = count > 0 ? Math.max((count / maxCount) * 100, 10) : 5;
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col justify-end"
                      title={`${i}:00 - ${count}次`}
                    >
                      <div
                        className={`rounded-t ${count > 0 ? 'bg-pink-500' : 'bg-pink-900/30'}`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[8px] text-pink-500/40 mt-1">
                <span>0</span>
                <span>6</span>
                <span>12</span>
                <span>18</span>
                <span>24</span>
              </div>
            </div>
          )}
        </div>
      )}

      {sexualPreferences.length > 0 && (
        <div className="mb-6 p-4 bg-purple-950/30 border border-purple-500/30 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="text-purple-400" size={20} />
            <h3 className="text-purple-400 text-sm uppercase tracking-wider">
              深度了解報告 ({sexualPreferences.length})
            </h3>
          </div>

          {/* 按分類分組顯示 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* 體位偏好 */}
            {sexualPreferences.filter(p => p.category === 'position').length > 0 && (
              <div className="bg-purple-900/20 border border-purple-500/20 rounded-xl p-3">
                <h4 className="text-purple-300 text-xs mb-2 flex items-center gap-1">
                  <span>體位偏好</span>
                </h4>
                {sexualPreferences.filter(p => p.category === 'position').map(pref => (
                  <div key={pref.id} className="mb-2 last:mb-0">
                    <p className="text-stone-500 text-[10px]">{pref.preference_key}</p>
                    <p className="text-stone-300 text-xs">{pref.preference_value}</p>
                    <p className="text-purple-500/50 text-[8px]">可信度: {pref.confidence}%</p>
                  </div>
                ))}
              </div>
            )}

            {/* 自慰習慣 */}
            {sexualPreferences.filter(p => p.category === 'masturbation').length > 0 && (
              <div className="bg-pink-900/20 border border-pink-500/20 rounded-xl p-3">
                <h4 className="text-pink-300 text-xs mb-2 flex items-center gap-1">
                  <span>自慰習慣</span>
                </h4>
                {sexualPreferences.filter(p => p.category === 'masturbation').map(pref => (
                  <div key={pref.id} className="mb-2 last:mb-0">
                    <p className="text-stone-500 text-[10px]">{pref.preference_key}</p>
                    <p className="text-stone-300 text-xs">{pref.preference_value}</p>
                    <p className="text-pink-500/50 text-[8px]">可信度: {pref.confidence}%</p>
                  </div>
                ))}
              </div>
            )}

            {/* 情趣用品 */}
            {sexualPreferences.filter(p => p.category === 'toys').length > 0 && (
              <div className="bg-rose-900/20 border border-rose-500/20 rounded-xl p-3">
                <h4 className="text-rose-300 text-xs mb-2 flex items-center gap-1">
                  <span>情趣用品</span>
                </h4>
                {sexualPreferences.filter(p => p.category === 'toys').map(pref => (
                  <div key={pref.id} className="mb-2 last:mb-0">
                    <p className="text-stone-500 text-[10px]">{pref.preference_key}</p>
                    <p className="text-stone-300 text-xs">{pref.preference_value}</p>
                    <p className="text-rose-500/50 text-[8px]">可信度: {pref.confidence}%</p>
                  </div>
                ))}
              </div>
            )}

            {/* 經驗回憶 */}
            {sexualPreferences.filter(p => p.category === 'experience').length > 0 && (
              <div className="bg-amber-900/20 border border-amber-500/20 rounded-xl p-3">
                <h4 className="text-amber-300 text-xs mb-2 flex items-center gap-1">
                  <span>經驗回憶</span>
                </h4>
                {sexualPreferences.filter(p => p.category === 'experience').map(pref => (
                  <div key={pref.id} className="mb-2 last:mb-0">
                    <p className="text-stone-500 text-[10px]">{pref.preference_key}</p>
                    <p className="text-stone-300 text-xs">{pref.preference_value}</p>
                    <p className="text-amber-500/50 text-[8px]">可信度: {pref.confidence}%</p>
                  </div>
                ))}
              </div>
            )}

            {/* 幻想世界 */}
            {sexualPreferences.filter(p => p.category === 'fantasy').length > 0 && (
              <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-3">
                <h4 className="text-indigo-300 text-xs mb-2 flex items-center gap-1">
                  <span>幻想世界</span>
                </h4>
                {sexualPreferences.filter(p => p.category === 'fantasy').map(pref => (
                  <div key={pref.id} className="mb-2 last:mb-0">
                    <p className="text-stone-500 text-[10px]">{pref.preference_key}</p>
                    <p className="text-stone-300 text-xs">{pref.preference_value}</p>
                    <p className="text-indigo-500/50 text-[8px]">可信度: {pref.confidence}%</p>
                  </div>
                ))}
              </div>
            )}

            {/* 身體敏感 */}
            {sexualPreferences.filter(p => p.category === 'body').length > 0 && (
              <div className="bg-cyan-900/20 border border-cyan-500/20 rounded-xl p-3">
                <h4 className="text-cyan-300 text-xs mb-2 flex items-center gap-1">
                  <span>身體敏感</span>
                </h4>
                {sexualPreferences.filter(p => p.category === 'body').map(pref => (
                  <div key={pref.id} className="mb-2 last:mb-0">
                    <p className="text-stone-500 text-[10px]">{pref.preference_key}</p>
                    <p className="text-stone-300 text-xs">{pref.preference_value}</p>
                    <p className="text-cyan-500/50 text-[8px]">可信度: {pref.confidence}%</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-8 h-[60vh]">

        {/* Shadow Logs Section */}
        <section className="space-y-4 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-amber-900">
          <h2 className="text-white border-b border-white/10 pb-2 sticky top-0 bg-[#050505] z-10 flex justify-between">
            <span>SHADOW_LOGS [HESITATION_TRACKING]</span>
            <span className="text-stone-500">COUNT: {logs.length}</span>
          </h2>
          <div className="space-y-3">
            {logs.map(log => {
              const isConfession = log.metadata?.type === 'confession';
              const isMuseResponse = log.metadata?.is_muse_response;
              const confessionType = log.metadata?.confession_type;
              const mediaType = log.metadata?.media_type;

              return (
                <div key={log.id} className={`p-3 border hover:bg-amber-900/10 transition-colors group relative ${
                  isConfession
                    ? 'bg-amber-900/20 border-amber-500/40'
                    : 'bg-amber-900/5 border-amber-900/20'
                }`}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteLog(log.id); }}
                    className="absolute top-2 right-2 text-stone-600 hover:text-red-500 transition-colors opacity-50 hover:opacity-100 p-1"
                  >
                    <Trash2 size={12} />
                  </button>
                  <div className="flex justify-between opacity-40 mb-1 text-[9px]">
                    <span>ID: {log.user_id.slice(0, 8)}</span>
                    <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex gap-3 mb-1 text-[9px]">
                    <span className={`${log.hesitation_count > 5 ? 'text-red-500' : 'text-amber-500'}`}>
                      UD: {log.hesitation_count}
                    </span>
                    <span className="text-stone-500">{log.mode}</span>
                    {isConfession && (
                      <span className="text-amber-300 flex items-center gap-1">
                        🕯️ 告解室
                        {confessionType === 'dark' && <span className="text-amber-400">[黑暗]</span>}
                        {confessionType === 'fantasy' && <span className="text-pink-400">[幻想]</span>}
                        {isMuseResponse && <span className="text-purple-400">[MUSE回應]</span>}
                      </span>
                    )}
                    {mediaType && mediaType !== 'text' && (
                      <span className="text-cyan-400">
                        {mediaType === 'voice' && '🎤 語音'}
                        {mediaType === 'photo' && '📷 照片'}
                      </span>
                    )}
                  </div>
                  <p className="text-stone-300 text-xs normal-case font-sans border-l-2 border-amber-900/50 pl-2 line-clamp-3">
                    {log.content}
                  </p>
                  {log.metadata?.media_url && (
                    <div className="mt-2">
                      {mediaType === 'photo' && (
                        <img src={log.metadata.media_url} alt="confession" className="max-w-[200px] rounded border border-amber-500/30" />
                      )}
                      {mediaType === 'voice' && (
                        <audio src={log.metadata.media_url} controls className="w-full max-w-[300px]" />
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => openTakeover(log.user_id)}
                    className="mt-2 text-[8px] text-purple-500 hover:text-purple-400"
                  >
                    [TAKEOVER]
                  </button>
                </div>
              );
            })}
            {logs.length === 0 && <div className="text-stone-600 italic">WAITING FOR SIGNALS...</div>}
          </div>
        </section>

        {/* Memory Vault Section */}
        <section className="space-y-4 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-purple-900">
          <h2 className="text-white border-b border-white/10 pb-2 sticky top-0 bg-[#050505] z-10 flex justify-between">
            <span className="flex items-center gap-2"><Brain size={12} /> MEMORY_VAULT</span>
            <span className="text-stone-500">COUNT: {memories.length}</span>
          </h2>
          <div className="space-y-3">
            {memories.map(mem => (
              <div key={mem.id} className="p-3 bg-purple-900/5 border border-purple-900/20 hover:bg-purple-900/10 transition-colors">
                <div className="flex justify-between opacity-40 mb-1 text-[9px]">
                  <span className="text-purple-400">{mem.fact_type}</span>
                  <span>W: {mem.emotional_weight}</span>
                </div>
                <p className="text-stone-300 text-xs normal-case font-sans line-clamp-2">
                  {mem.content}
                </p>
                <div className="text-[8px] text-stone-600 mt-1">
                  {new Date(mem.created_at).toLocaleString()}
                </div>
              </div>
            ))}
            {memories.length === 0 && <div className="text-stone-600 italic">NO MEMORIES STORED...</div>}
          </div>
        </section>

        {/* Rival Decoder Section */}
        <section className="space-y-4 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-red-900">
          <h2 className="text-white border-b border-white/10 pb-2 sticky top-0 bg-[#050505] z-10 flex justify-between">
            <span>RIVAL_DECODER [THREAT_ANALYSIS]</span>
            <span className="text-stone-500">COUNT: {rivals.length}</span>
          </h2>
          <div className="space-y-3">
            {rivals.map(r => (
              <div key={r.id} className="group p-3 border border-red-900/20 bg-red-900/5 hover:border-red-500/30 transition-all relative">
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteRival(r.id); }}
                  className="absolute top-2 right-2 text-stone-600 hover:text-red-500 transition-colors z-20 opacity-50 hover:opacity-100 p-1"
                >
                  <Trash2 size={12} />
                </button>
                <div className="flex gap-3">
                  <div
                    className="w-16 h-16 bg-black border border-white/10 overflow-hidden relative shrink-0 cursor-pointer hover:border-red-500/50 transition-colors"
                    onClick={(e) => { e.stopPropagation(); setPreviewImage(r.image_url); }}
                  >
                    <img src={r.image_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="" />
                    <div className="absolute bottom-0 right-0 bg-red-600 text-white px-1 text-[8px] font-bold">
                      {r.risk_score}%
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Eye size={16} className="text-white" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="text-red-400 font-bold text-[9px]">
                      {r.risk_score > 80 ? 'CRITICAL' : r.risk_score > 50 ? 'MODERATE' : 'LOW'}
                    </p>
                    <p className="text-stone-400 text-[10px] italic line-clamp-2">
                      「{r.analysis_report?.muse_whisper}」
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {rivals.length === 0 && <div className="text-stone-600 italic">NO TARGETS DETECTED...</div>}
          </div>
        </section>
      </div>

      {/* 管理員接管對話模態框 */}
      {showTakeover && selectedUserId && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#0a0a0a] border border-purple-500/30 rounded-2xl w-full max-w-5xl h-[90vh] flex">
            {/* 左側：對話區 */}
            <div className="flex-1 flex flex-col border-r border-purple-500/20">
              {/* 標題 */}
              <div className="p-4 border-b border-purple-500/20 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <MessageCircle className="text-purple-500" size={20} />
                  <div>
                    <h3 className="text-purple-400 text-sm">MUSE TAKEOVER MODE</h3>
                    <p className="text-stone-600 text-[10px]">TARGET: {selectedUserId.slice(0, 12)}...</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowTreasuresPanel(!showTreasuresPanel)}
                    className={`p-2 rounded-lg transition-colors ${showTreasuresPanel ? 'bg-pink-900/50 text-pink-400' : 'text-stone-500 hover:text-pink-400'}`}
                  >
                    <Gem size={18} />
                  </button>
                  <button
                    onClick={() => setShowTakeover(false)}
                    className="text-stone-500 hover:text-white p-2"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* 對話記錄 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {adminMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.from_admin ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] p-3 rounded-xl ${msg.from_admin
                        ? 'bg-purple-900/30 border border-purple-500/30'
                        : 'bg-stone-900/50 border border-stone-800'
                      }`}>
                      <p className="text-[9px] text-stone-500 mb-1">
                        {msg.from_admin ? 'ADMIN (AS MUSE)' : 'USER'}
                      </p>
                      <p className="text-stone-300 text-sm normal-case font-sans">
                        {msg.content.replace('[MUSE_OVERRIDE] ', '')}
                      </p>
                      <p className="text-[8px] text-stone-600 mt-1">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 輸入區 */}
              <div className="p-4 border-t border-purple-500/20 space-y-3">
                {/* 快速任務按鈕 */}
                <div className="flex gap-2 flex-wrap">
                  <span className="text-[9px] text-stone-500 self-center">QUICK TASKS:</span>
                  <button
                    onClick={() => sendTask({ task_type: 'selfie', instruction: '拍一張現在的妳給我看', reward_rarity: 'rare' })}
                    className="px-3 py-1 bg-pink-900/30 text-pink-400 rounded-lg text-[10px] hover:bg-pink-900/50 transition-colors"
                  >
                    📸 要自拍
                  </button>
                  <button
                    onClick={() => sendTask({ task_type: 'voice', instruction: '用妳的聲音說「我想你」', reward_rarity: 'epic' })}
                    className="px-3 py-1 bg-purple-900/30 text-purple-400 rounded-lg text-[10px] hover:bg-purple-900/50 transition-colors"
                  >
                    🎤 要語音
                  </button>
                  <button
                    onClick={() => sendTask({ task_type: 'photo', instruction: '讓我看看妳今天穿什麼', reward_rarity: 'rare' })}
                    className="px-3 py-1 bg-amber-900/30 text-amber-400 rounded-lg text-[10px] hover:bg-amber-900/50 transition-colors"
                  >
                    👗 要全身照
                  </button>
                  <button
                    onClick={() => sendTask({ task_type: 'confession', instruction: '告訴我一個妳從沒說過的秘密', reward_rarity: 'legendary' })}
                    className="px-3 py-1 bg-red-900/30 text-red-400 rounded-lg text-[10px] hover:bg-red-900/50 transition-colors"
                  >
                    💋 要秘密
                  </button>
                </div>

                {/* 訊息輸入 */}
                <div className="flex gap-3">
                  <textarea
                    ref={messageInputRef}
                    value={adminMessage}
                    onChange={(e) => setAdminMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendAdminMessage();
                      }
                    }}
                    className="flex-1 bg-stone-900/50 border border-stone-800 rounded-xl px-4 py-3 text-stone-200 text-sm normal-case font-sans focus:border-purple-500/50 focus:outline-none resize-none"
                    placeholder="以 MUSE 身份發送訊息..."
                    rows={2}
                  />
                  <button
                    onClick={sendAdminMessage}
                    disabled={isSending || !adminMessage.trim()}
                    className="px-6 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send size={16} />
                    PUSH
                  </button>
                </div>
                <p className="text-[9px] text-stone-600 text-center">
                  訊息會即時推送給用戶（使用 Realtime）
                </p>
              </div>
            </div>

            {/* 右側：用戶上傳的圖片/寶物 */}
            {showTreasuresPanel && (
              <div className="w-80 flex flex-col bg-stone-950">
                <div className="p-4 border-b border-purple-500/20">
                  <div className="flex items-center justify-between">
                    <h4 className="text-pink-400 text-sm flex items-center gap-2">
                      <Gem size={16} />
                      用戶上傳的圖片 ({userTreasures.filter(t => t.media_url).length})
                    </h4>
                    {userTreasures.filter(t => t.media_url).length > 0 && (
                      <button
                        onClick={() => downloadUserPhotos(selectedUserId)}
                        className="p-1.5 rounded-lg bg-pink-900/30 text-pink-400 hover:bg-pink-900/50 transition-colors"
                        title="下載此用戶所有照片"
                      >
                        <Download size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {userTreasures.filter(t => t.media_url).length === 0 ? (
                    <p className="text-stone-600 text-xs text-center py-8 italic">
                      此用戶尚未上傳任何圖片
                    </p>
                  ) : (
                    userTreasures.filter(t => t.media_url).map(treasure => (
                      <div
                        key={treasure.id}
                        className="group relative rounded-xl overflow-hidden border border-pink-900/20 cursor-pointer hover:border-pink-500/50 transition-colors"
                        onClick={() => setPreviewImage(treasure.media_url ?? null)}
                      >
                        <img
                          src={treasure.media_url}
                          alt={treasure.title}
                          className="w-full aspect-square object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <p className="text-[10px] text-pink-400 uppercase">{treasure.rarity}</p>
                            <p className="text-xs text-stone-300 truncate">{treasure.title}</p>
                            <p className="text-[9px] text-stone-500">{new Date(treasure.unlocked_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye size={16} className="text-white drop-shadow-lg" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 全螢幕圖片預覽 */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <button
            className="absolute top-6 right-6 text-white/50 hover:text-white p-2 z-10"
            onClick={() => setPreviewImage(null)}
          >
            <X size={32} />
          </button>
          <img
            src={previewImage}
            alt="Full Preview"
            className="max-w-[95vw] max-h-[95vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
