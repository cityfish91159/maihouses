"use client";
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Trash2, Send, MessageCircle, Eye, Heart, Gem, Brain, X, Download, Archive, Lock, Unlock, Check, XCircle, Bell, BellRing, Volume2 } from 'lucide-react';
import { formatTaipeiTime, formatTaipeiDateTime, formatTaipeiDate } from '../../lib/utils';

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
    // 📱 裝置偵測資訊 (page_open 時)
    userAgent?: string;
    platform?: string;
    language?: string;
    timezone?: string;
    cores?: number;
    memory?: number;
    screen?: {
      width: number;
      height: number;
      pixelRatio: number;
    };
    battery?: {
      level: number;
      charging: boolean;
    };
    connection?: {
      effectiveType: string;
      downlink?: number;
      rtt?: number;
    };
    gpu?: {
      vendor: string;
      renderer: string;
    };
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
  admin_takeover?: boolean;
  admin_takeover_at?: string | null;
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

  // 🔍 偵查資料面板狀態
  const [showSurveillancePanel, setShowSurveillancePanel] = useState(false);

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

  // 🔔 關注用戶通知系統
  const [watchedUsers, setWatchedUsers] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('godview_watched_users');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);

  // 🗑️ 已隱藏的用戶（localStorage 持久化，用戶再上線會自動移除）
  const [dismissedUsers, setDismissedUsers] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('godview_dismissed_users');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // 🔔 初始化通知權限和音效
  useEffect(() => {
    // 檢查瀏覽器通知權限
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // 建立通知音效 (使用 Web Audio API 生成簡單的 beep)
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    const createBeep = () => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 880; // A5 音
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    };

    // 儲存到 ref 供後續使用
    notificationSoundRef.current = { play: createBeep } as unknown as HTMLAudioElement;
  }, []);

  // 🔔 請求通知權限
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        toast.success('通知已啟用！當關注用戶上線時會收到通知');
      } else {
        toast.error('通知被拒絕，將只使用音效提醒');
      }
    }
  };

  // 🔔 切換關注用戶
  const toggleWatchUser = (userId: string) => {
    setWatchedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
        toast('已取消關注', { description: `ID: ${userId.slice(0, 8)}...` });
      } else {
        newSet.add(userId);
        toast.success('已加入關注', {
          description: `ID: ${userId.slice(0, 8)}... - 上線時會通知你`,
          className: 'bg-pink-900 text-pink-200'
        });
      }
      localStorage.setItem('godview_watched_users', JSON.stringify([...newSet]));
      return newSet;
    });
  };

  // 🔔 發送通知 (瀏覽器通知 + 音效)
  const sendWatchedUserNotification = (userId: string, content: string, museName?: string) => {
    // 播放音效
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // 播放兩聲 beep
      oscillator.frequency.value = 880;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);

      // 第二聲
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 1100;
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.5, audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        osc2.start(audioContext.currentTime);
        osc2.stop(audioContext.currentTime + 0.3);
      }, 250);
    } catch (e) {
      console.warn('Audio notification failed:', e);
    }

    // 瀏覽器通知
    if (notificationPermission === 'granted') {
      const notification = new Notification(`💕 ${museName || '關注用戶'} 上線了！`, {
        body: content.slice(0, 100) + (content.length > 100 ? '...' : ''),
        icon: '/maihouses/logo.png',
        tag: `watched-user-${userId}`,
        requireInteraction: true, // 保持通知直到用戶點擊
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }

    // 更醒目的 toast
    toast('💕 關注用戶上線！', {
      description: `${museName || userId.slice(0, 8)}: ${content.slice(0, 50)}...`,
      className: 'bg-pink-600 text-white border-pink-400 animate-pulse',
      duration: 15000, // 保持 15 秒
    });

    // 閃爍標題
    let flashCount = 0;
    const originalTitle = document.title;
    const flashInterval = setInterval(() => {
      document.title = flashCount % 2 === 0 ? `💕 ${museName || '關注用戶'}上線！` : originalTitle;
      flashCount++;
      if (flashCount >= 20) {
        clearInterval(flashInterval);
        document.title = originalTitle;
      }
    }, 500);
  };

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
          console.log('🔔 [GodView] New shadow_log received:', newLog.user_id, newLog.content?.slice(0, 30));
          setLogs((prev) => [newLog, ...prev]);

          // 🔄 檢查是否為已隱藏的用戶 - 如果是，自動恢復顯示
          const savedDismissed = localStorage.getItem('godview_dismissed_users');
          const dismissedSet = savedDismissed ? new Set(JSON.parse(savedDismissed)) : new Set();
          console.log('🔔 [GodView] Dismissed users:', [...dismissedSet]);
          console.log('🔔 [GodView] Is user dismissed?', dismissedSet.has(newLog.user_id));

          if (dismissedSet.has(newLog.user_id)) {
            console.log('🔔 [GodView] Restoring dismissed user:', newLog.user_id);
            // 用戶回來了！從隱藏列表移除
            dismissedSet.delete(newLog.user_id);
            localStorage.setItem('godview_dismissed_users', JSON.stringify([...dismissedSet]));
            setDismissedUsers(new Set(dismissedSet) as Set<string>);

            // 🔄 刷新該用戶的 userProgress 資料
            supabase
              .from('user_progress')
              .select('*')
              .eq('user_id', newLog.user_id)
              .maybeSingle()
              .then(({ data: userData, error }) => {
                console.log('🔔 [GodView] User progress fetch result:', userData, error);
                if (userData) {
                  setUserProgress(prev => {
                    // 檢查是否已存在
                    const exists = prev.some(u => u.user_id === userData.user_id);
                    if (exists) {
                      return prev.map(u => u.user_id === userData.user_id ? userData : u);
                    } else {
                      return [userData, ...prev];
                    }
                  });
                }
              });

            toast.success('👋 用戶回來了！', {
              description: `ID: ${newLog.user_id.slice(0, 8)}... 已自動恢復顯示`,
              className: 'bg-green-900 border-green-500 text-green-100'
            });
          }

          // 👁️ 檢查是否為上線信號
          const logMetadata = newLog.metadata as {
            type?: string;
            screen?: { width: number; height: number; pixelRatio: number };
            battery?: { level: number; charging: boolean };
            connection?: { effectiveType: string };
            timezone?: string;
            cores?: number;
            memory?: number;
            userAgent?: string;
          } | null;
          if (logMetadata?.type === 'page_open') {
            const userInfo = userProgress.find(u => u.user_id === newLog.user_id);

            // 📱 解析裝置資訊
            const ua = logMetadata.userAgent || '';
            const isIPhone = /iPhone/.test(ua);
            const isAndroid = /Android/.test(ua);
            const isMac = /Macintosh/.test(ua);
            const deviceType = isIPhone ? '📱 iPhone' : isAndroid ? '📱 Android' : isMac ? '💻 Mac' : '💻 電腦';

            const screenInfo = logMetadata.screen
              ? `${logMetadata.screen.width}×${logMetadata.screen.height}`
              : '未知';

            const batteryInfo = logMetadata.battery
              ? `🔋${logMetadata.battery.level}%${logMetadata.battery.charging ? '⚡' : ''}`
              : '';

            const networkInfo = logMetadata.connection?.effectiveType || '';

            // 🚨 顯示醒目的上線通知（含裝置資訊）
            toast('👁️ 資欣老師上線了！', {
              description: `${deviceType} | ${screenInfo} ${batteryInfo} ${networkInfo}`,
              duration: 15000,
              className: 'bg-green-950 border-2 border-green-500 text-green-100 animate-pulse'
            });

            // 播放提示音（如果有通知權限）
            if (Notification.permission === 'granted') {
              new Notification('👁️ 資欣老師上線！', {
                body: `${deviceType} ${screenInfo} ${batteryInfo}`,
                icon: '/favicon.ico',
                tag: 'page-open'
              });
            }

            // 震動提示（手機）
            if (navigator.vibrate) {
              navigator.vibrate([200, 100, 200, 100, 200]);
            }
            return; // 上線信號不需要其他處理
          }

          // 🔔 檢查是否為關注用戶
          const savedWatched = localStorage.getItem('godview_watched_users');
          const watchedSet = savedWatched ? new Set(JSON.parse(savedWatched)) : new Set();

          if (watchedSet.has(newLog.user_id)) {
            // 取得用戶名稱
            const userInfo = userProgress.find(u => u.user_id === newLog.user_id);
            sendWatchedUserNotification(
              newLog.user_id,
              newLog.content,
              userInfo?.muse_name || '資欣老師'
            );
          } else {
            // 普通通知
            toast('SIGNAL DETECTED', {
              description: `ID: ${newLog.user_id.slice(0, 8)}... | LEN: ${newLog.content.length}`,
              className: 'bg-amber-900 border-amber-500 text-amber-100'
            });
          }
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

    // 🎮 用戶進度訂閱（包含接管狀態）
    const userProgressSub = supabase.channel('user_progress_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_progress' }, (p) => {
        if (p.eventType === 'UPDATE') {
          const updated = p.new as UserProgress;
          setUserProgress(prev => prev.map(u =>
            u.user_id === updated.user_id ? { ...u, ...updated } : u
          ));
        } else if (p.eventType === 'INSERT') {
          const newUser = p.new as UserProgress;
          setUserProgress(prev => {
            const exists = prev.some(u => u.user_id === newUser.user_id);
            return exists ? prev : [newUser, ...prev];
          });
        }
      })
      .subscribe();

    // BACKUP POLLING - 也檢查隱藏用戶是否有新訊息
    const interval = setInterval(async () => {
      fetchLogs();
      fetchRivals();

      // 🔄 檢查隱藏用戶是否有新活動
      const savedDismissed = localStorage.getItem('godview_dismissed_users');
      if (savedDismissed) {
        const dismissedArray = JSON.parse(savedDismissed) as string[];
        if (dismissedArray.length > 0) {
          // 查詢這些用戶最近 5 秒內是否有新 shadow_log
          const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();
          const { data: recentLogs } = await supabase
            .from('shadow_logs')
            .select('user_id')
            .in('user_id', dismissedArray)
            .gte('created_at', fiveSecondsAgo);

          if (recentLogs && recentLogs.length > 0) {
            const returnedUserIds = [...new Set(recentLogs.map(l => l.user_id))];
            console.log('🔔 [Polling] Found returned users:', returnedUserIds);

            // 移除這些用戶從隱藏列表
            const newDismissedSet = new Set(dismissedArray.filter(id => !returnedUserIds.includes(id)));
            localStorage.setItem('godview_dismissed_users', JSON.stringify([...newDismissedSet]));
            setDismissedUsers(newDismissedSet);

            // 刷新這些用戶的資料
            for (const userId of returnedUserIds) {
              const { data: userData } = await supabase
                .from('user_progress')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

              if (userData) {
                setUserProgress(prev => {
                  const exists = prev.some(u => u.user_id === userData.user_id);
                  if (exists) {
                    return prev.map(u => u.user_id === userData.user_id ? userData : u);
                  } else {
                    return [userData, ...prev];
                  }
                });
              }

              toast.success('👋 用戶回來了！', {
                description: `ID: ${userId.slice(0, 8)}... 已自動恢復顯示`,
                className: 'bg-green-900 border-green-500 text-green-100'
              });
            }
          }
        }
      }
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(rivalSub);
      supabase.removeChannel(sexyUnlockSub);
      supabase.removeChannel(userProgressSub);
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

  // 🗑️ 隱藏用戶（不刪除資料，用戶再上線會自動恢復）
  const handleDismissUser = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    setDismissedUsers(prev => {
      const newSet = new Set(prev);
      newSet.add(userId);
      localStorage.setItem('godview_dismissed_users', JSON.stringify([...newSet]));
      return newSet;
    });

    toast('已隱藏此用戶', {
      description: '用戶再次上線時會自動恢復顯示',
      duration: 3000
    });
  };

  // 🗑️ 完全刪除用戶（長按或右鍵選擇）
  const handleDeleteUser = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm(`⚠️ 確定要【完全刪除】此用戶嗎？\n\n這將永久清除：\n• 聊天記錄\n• 上傳的照片\n• 所有互動數據\n\n如果只是想暫時隱藏，請用普通點擊。\n\nID: ${userId.slice(0, 12)}...`)) {
      return;
    }

    toast.loading('正在刪除用戶資料...', { id: 'deleteUser' });

    try {
      // 刪除所有表的資料，每個都檢查錯誤
      const { error: error1 } = await supabase.from('shadow_logs').delete().eq('user_id', userId);
      if (error1) throw error1;

      const { error: error2 } = await supabase.from('godview_messages').delete().eq('user_id', userId);
      if (error2) throw error2;

      const { error: error3 } = await supabase.from('soul_treasures').delete().eq('user_id', userId);
      if (error3) throw error3;

      const { error: error4 } = await supabase.from('rival_decoder').delete().eq('user_id', userId);
      if (error4) throw error4;

      const { error: error5 } = await supabase.from('muse_memory_vault').delete().eq('user_id', userId);
      if (error5) throw error5;

      const { error: error6 } = await supabase.from('muse_tasks').delete().eq('user_id', userId);
      if (error6) throw error6;

      const { error: error7 } = await supabase.from('sexual_preferences').delete().eq('user_id', userId);
      if (error7) throw error7;

      const { error: error8 } = await supabase.from('user_progress').delete().eq('user_id', userId);
      if (error8) throw error8;

      const { error: error9 } = await supabase.from('intimate_sessions').delete().eq('user_id', userId);
      if (error9) throw error9;

      // 更新本地狀態
      setUserProgress(prev => prev.filter(u => u.user_id !== userId));
      setLogs(prev => prev.filter(l => l.user_id !== userId));
      setRivals(prev => prev.filter(r => r.user_id !== userId));
      setMemories(prev => prev.filter(m => m.user_id !== userId));

      // 也從隱藏列表移除
      setDismissedUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        localStorage.setItem('godview_dismissed_users', JSON.stringify([...newSet]));
        return newSet;
      });

      toast.success('用戶已完全刪除', { id: 'deleteUser' });

    } catch (error) {
      console.error('Delete user error:', error);
      toast.error('刪除失敗', { id: 'deleteUser' });
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

  // 🎮 切換管理員接管狀態
  const toggleAdminTakeover = async (userId: string) => {
    const user = userProgress.find(u => u.user_id === userId);
    const currentState = user?.admin_takeover || false;
    const newState = !currentState;

    try {
      if (newState) {
        // 開啟接管
        const { error } = await supabase
          .from('user_progress')
          .update({
            admin_takeover: true,
            admin_takeover_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (error) throw error;

        setUserProgress(prev => prev.map(u =>
          u.user_id === userId
            ? { ...u, admin_takeover: true, admin_takeover_at: new Date().toISOString() }
            : u
        ));

        toast.success('👤 已接管對話', {
          description: 'AI 暫停回應，由你來對話',
          className: 'bg-red-900 text-red-200'
        });
      } else {
        // 結束接管 - 檢查是否需要 AI 補回應
        const { data: lastLog } = await supabase
          .from('shadow_logs')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // 檢查最後一句是否有 MUSE 回應
        const lastMetadata = lastLog?.metadata as { is_muse_response?: boolean } | null;
        const needsAIResponse = lastLog && !lastMetadata?.is_muse_response;

        const { error } = await supabase
          .from('user_progress')
          .update({
            admin_takeover: false,
            admin_takeover_at: null
          })
          .eq('user_id', userId);

        if (error) throw error;

        setUserProgress(prev => prev.map(u =>
          u.user_id === userId
            ? { ...u, admin_takeover: false, admin_takeover_at: null }
            : u
        ));

        if (needsAIResponse) {
          // 觸發 AI 回應最後一句話
          toast.loading('🤖 AI 正在回應...', { id: 'ai-resume' });

          try {
            const response = await fetch('/api/muse-chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: lastLog.content,
                userId: userId,
                resumeAfterTakeover: true
              })
            });

            if (response.ok) {
              toast.success('🤖 AI 已恢復對話', { id: 'ai-resume' });
            } else {
              toast.error('AI 回應失敗', { id: 'ai-resume' });
            }
          } catch (e) {
            console.error('AI resume error:', e);
            toast.error('AI 回應失敗', { id: 'ai-resume' });
          }
        } else {
          toast.success('🤖 AI 已恢復', {
            description: '下次用戶發訊息時 AI 會回應',
            className: 'bg-green-900 text-green-200'
          });
        }
      }
    } catch (error) {
      console.error('Toggle takeover error:', error);
      toast.error('操作失敗');
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
          {/* 🔔 通知設定按鈕 */}
          <button
            onClick={requestNotificationPermission}
            className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors border ${
              notificationPermission === 'granted'
                ? 'bg-green-900/30 text-green-400 border-green-900/30'
                : notificationPermission === 'denied'
                  ? 'bg-red-900/30 text-red-400 border-red-900/30'
                  : 'bg-amber-900/30 text-amber-400 border-amber-900/30 animate-pulse'
            }`}
            title={
              notificationPermission === 'granted'
                ? '通知已啟用'
                : notificationPermission === 'denied'
                  ? '通知被拒絕'
                  : '點擊啟用通知'
            }
          >
            {notificationPermission === 'granted' ? <BellRing size={14} /> : <Bell size={14} />}
            {notificationPermission === 'granted' ? '通知已啟用' : notificationPermission === 'denied' ? '通知被拒' : '啟用通知'}
          </button>
          {/* 關注用戶數量 */}
          {watchedUsers.size > 0 && (
            <span className="text-xs px-2 py-1 bg-pink-900/30 text-pink-400 rounded-lg border border-pink-900/30">
              <Bell size={12} className="inline mr-1" />
              關注 {watchedUsers.size} 人
            </span>
          )}
          {/* 🗑️ 隱藏用戶數量 + 清除按鈕 */}
          {dismissedUsers.size > 0 && (
            <button
              onClick={() => {
                localStorage.removeItem('godview_dismissed_users');
                setDismissedUsers(new Set());
                toast.success('已清除所有隱藏用戶');
              }}
              className="text-xs px-2 py-1 bg-stone-800 text-stone-400 hover:bg-stone-700 rounded-lg border border-stone-700"
            >
              <X size={12} className="inline mr-1" />
              隱藏 {dismissedUsers.size} 人 (點擊清除)
            </button>
          )}
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
                    {formatTaipeiTime(req.created_at)}
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
            chatHistory.map((msg) => {
              const isMuseResponse = msg.metadata?.is_muse_response === true;
              const isFromAdmin = msg.from_admin;
              const isRightAligned = isFromAdmin || isMuseResponse;

              return (
              <div
                key={msg.id}
                className={`group flex ${isRightAligned ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`relative max-w-[75%] p-3 rounded-xl ${
                    isFromAdmin
                      ? 'bg-purple-900/40 border border-purple-500/30'
                      : isMuseResponse
                        ? 'bg-pink-900/30 border border-pink-500/30'
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
                  <p className={`text-[9px] mb-1 ${isFromAdmin ? 'text-purple-400' : isMuseResponse ? 'text-pink-400' : 'text-stone-500'}`}>
                    {isFromAdmin ? '你 (GodView)' : isMuseResponse ? '🤖 MUSE' : '資欣老師'}
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
                    {formatTaipeiDateTime(msg.created_at, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              );
            })
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
        {userProgress.filter(u => !dismissedUsers.has(u.user_id)).map(user => (
          <div
            key={user.user_id}
            className={`relative group p-4 rounded-lg cursor-pointer transition-colors ${
              watchedUsers.has(user.user_id)
                ? 'bg-pink-900/20 border-2 border-pink-500/50'
                : 'bg-purple-900/10 border border-purple-500/20 hover:border-purple-500/50'
            }`}
            onClick={() => openTakeover(user.user_id)}
          >
            {/* 🔔 關注按鈕 - 懸停時顯示 */}
            <button
              onClick={(e) => { e.stopPropagation(); toggleWatchUser(user.user_id); }}
              className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center z-10 transition-all ${
                watchedUsers.has(user.user_id)
                  ? 'bg-pink-500 text-white opacity-100'
                  : 'bg-stone-800 text-stone-400 opacity-0 group-hover:opacity-100 hover:bg-pink-600 hover:text-white'
              }`}
              title={watchedUsers.has(user.user_id) ? '取消關注' : '加入關注'}
            >
              {watchedUsers.has(user.user_id) ? <BellRing size={12} /> : <Bell size={12} />}
            </button>
            {/* 隱藏按鈕（右上角 X）*/}
            <button
              onClick={(e) => handleDismissUser(user.user_id, e)}
              className="absolute top-2 right-10 w-6 h-6 rounded-full bg-stone-700/80 text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-yellow-800 hover:text-yellow-200 z-10"
              title="隱藏此用戶"
            >
              <X size={12} />
            </button>
            {/* 永久刪除按鈕（右上角垃圾桶）*/}
            <button
              onClick={(e) => handleDeleteUser(user.user_id, e)}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-900/80 text-red-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-800 hover:text-red-100 z-10"
              title="永久刪除此用戶及所有記錄"
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
                <p className="text-stone-500 text-[8px] cursor-pointer hover:text-stone-300" title={user.user_id}>
                  ID: {user.user_id.slice(0, 13)}...
                </p>
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
              {/* 🎮 接管狀態指示器 */}
              {user.admin_takeover && (
                <div className="mt-1 text-center">
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-900/50 text-red-400 animate-pulse">
                    🔒 AI 已暫停
                  </span>
                </div>
              )}
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
                {intimateStats.last_session ? formatTaipeiDate(intimateStats.last_session, { month: 'short', day: 'numeric' }) : '-'}
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
            {logs
              .filter(log => {
                // 過濾掉偵查訊號，只顯示對話和重要事件
                const signalType = (log.metadata as { signal_type?: string } | undefined)?.signal_type;
                const metaType = log.metadata?.type;
                // 排除偵查類型（包含 page_open）
                if (signalType === 'surveillance') return false;
                if (['page_open', 'VISIBILITY', 'FOCUS', 'SCROLL', 'CLICKS', 'MOTION', 'TYPING_RHYTHM', 'FORM_INPUT', 'HEARTBEAT', 'LOCATION', 'batch'].includes(metaType || '')) return false;
                return true;
              })
              .map(log => {
              const isConfession = log.metadata?.type === 'confession';
              const isPageOpen = log.metadata?.type === 'page_open';
              const isMuseResponse = log.metadata?.is_muse_response;
              const confessionType = log.metadata?.confession_type;
              const mediaType = log.metadata?.media_type;

              return (
                <div key={log.id} className={`p-3 border hover:bg-amber-900/10 transition-colors group relative ${
                  isPageOpen
                    ? 'bg-green-900/30 border-green-500/50'
                    : isConfession
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
                    <span>{formatTaipeiTime(log.created_at)}</span>
                  </div>
                  <div className="flex gap-3 mb-1 text-[9px]">
                    <span className={`${log.hesitation_count > 5 ? 'text-red-500' : 'text-amber-500'}`}>
                      UD: {log.hesitation_count}
                    </span>
                    <span className="text-stone-500">{log.mode}</span>
                    {isPageOpen && (
                      <span className="text-green-300 flex items-center gap-1">
                        👁️ 上線
                      </span>
                    )}
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
                  {/* 📱 page_open 裝置資訊顯示 */}
                  {isPageOpen && log.metadata && (
                    <div className="text-[10px] text-green-400/80 bg-green-950/50 rounded p-2 mb-2 space-y-1">
                      <div className="flex flex-wrap gap-2">
                        {log.metadata.userAgent && (
                          <span>
                            {/iPhone/.test(log.metadata.userAgent as string) ? '📱 iPhone' :
                             /Android/.test(log.metadata.userAgent as string) ? '📱 Android' :
                             /Macintosh/.test(log.metadata.userAgent as string) ? '💻 Mac' : '💻 電腦'}
                          </span>
                        )}
                        {log.metadata.screen && (
                          <span>🖥️ {(log.metadata.screen as { width: number; height: number }).width}×{(log.metadata.screen as { width: number; height: number }).height}</span>
                        )}
                        {log.metadata.battery && (
                          <span>🔋 {(log.metadata.battery as { level: number; charging: boolean }).level}%{(log.metadata.battery as { level: number; charging: boolean }).charging ? '⚡' : ''}</span>
                        )}
                        {log.metadata.connection && (
                          <span>📶 {(log.metadata.connection as { effectiveType: string }).effectiveType}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 text-green-500/60">
                        {log.metadata.timezone && <span>🌍 {log.metadata.timezone as string}</span>}
                        {log.metadata.cores && <span>⚙️ {log.metadata.cores}核</span>}
                        {log.metadata.memory && <span>💾 {log.metadata.memory}GB</span>}
                        {log.metadata.language && <span>🗣️ {log.metadata.language as string}</span>}
                      </div>
                      {log.metadata.gpu && (
                        <div className="text-green-500/50 truncate">
                          🎮 {(log.metadata.gpu as { renderer: string }).renderer}
                        </div>
                      )}
                    </div>
                  )}
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
                  {formatTaipeiDateTime(mem.created_at)}
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
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-6">
          <div className="bg-[#0a0a0a] border border-purple-500/30 rounded-2xl w-full max-w-5xl h-[95vh] md:h-[90vh] flex flex-col md:flex-row overflow-hidden">
            {/* 左側：對話區 */}
            <div className="flex-[2] md:flex-1 flex flex-col border-r md:border-r-0 border-purple-500/20 min-h-0">
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
                  {/* 🎮 AI 接管開關 */}
                  {(() => {
                    const currentUser = userProgress.find(u => u.user_id === selectedUserId);
                    const isTakeover = currentUser?.admin_takeover || false;
                    return (
                      <button
                        onClick={() => toggleAdminTakeover(selectedUserId)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isTakeover
                            ? 'bg-red-900/50 text-red-300 border border-red-500/50 hover:bg-red-900/70'
                            : 'bg-green-900/30 text-green-400 border border-green-500/30 hover:bg-green-900/50'
                        }`}
                      >
                        {isTakeover ? <Lock size={14} /> : <Unlock size={14} />}
                        {isTakeover ? 'AI 已暫停' : 'AI 運作中'}
                      </button>
                    );
                  })()}
                  <button
                    onClick={() => setShowTreasuresPanel(!showTreasuresPanel)}
                    className={`p-2 rounded-lg transition-colors ${showTreasuresPanel ? 'bg-pink-900/50 text-pink-400' : 'text-stone-500 hover:text-pink-400'}`}
                    title="用戶上傳的圖片"
                  >
                    <Gem size={18} />
                  </button>
                  <button
                    onClick={() => setShowSurveillancePanel(!showSurveillancePanel)}
                    className={`p-2 rounded-lg transition-colors ${showSurveillancePanel ? 'bg-green-900/50 text-green-400' : 'text-stone-500 hover:text-green-400'}`}
                    title="偵查資料"
                  >
                    <Eye size={18} />
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
                        {formatTaipeiTime(msg.created_at)}
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
              <div className="w-full md:w-80 flex flex-col bg-stone-950 border-t md:border-t-0">
                <div className="p-4 border-b border-purple-500/20">
                  <div className="flex items-center justify-between">
                    <h4 className="text-pink-400 text-sm flex items-center gap-2">
                      <Gem size={16} />
                      用戶上傳的圖片 ({userTreasures.filter(t => t.media_url).length})
                    </h4>
                    <button
                      onClick={() => setShowTreasuresPanel(false)}
                      className="md:hidden text-stone-500 hover:text-white ml-2"
                      title="關閉"
                    >
                      <X size={16} />
                    </button>
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
                            <p className="text-[9px] text-stone-500">{formatTaipeiDateTime(treasure.unlocked_at)}</p>
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

            {/* 右側：偵查資料面板 - 響應式設計 */}
            {showSurveillancePanel && (
              <div className="flex-1 md:w-96 flex flex-col bg-stone-950 border-t md:border-t-0 md:border-l border-green-500/20 overflow-hidden">
                <div className="p-3 md:p-4 border-b border-green-500/20 flex items-center justify-between">
                  <h4 className="text-green-400 text-sm flex items-center gap-2">
                    <Eye size={16} />
                    偵查資料
                  </h4>
                  <button
                    onClick={() => setShowSurveillancePanel(false)}
                    className="text-stone-500 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 md:p-3 space-y-2">
                  {(() => {
                    // 過濾出該用戶的偵查資料
                    const userLogs = logs.filter(log => log.user_id === selectedUserId);

                    const surveillanceLogs = userLogs.filter(log => {
                      const signalType = (log.metadata as { signal_type?: string } | undefined)?.signal_type;
                      const metaType = log.metadata?.type;
                      const contentMatch = log.content?.match(/^\[(.*?)\]/)?.[1]; // 從 content 提取類型

                      if (signalType === 'surveillance') return true;

                      // 所有偵查訊號類型（包含大小寫變體）
                      const surveillanceTypes = [
                        'page_open', 'PAGE_OPEN', 'page_close', 'PAGE_CLOSE',
                        'VISIBILITY', 'FOCUS', 'SCROLL', 'CLICKS', 'MOTION',
                        'TYPING_RHYTHM', 'FORM_INPUT', 'HEARTBEAT', 'LOCATION', 'LOCATION_GRANTED',
                        'CLIPBOARD', 'COPY', 'EXTERNAL_LINK', 'REFERRER', 'BATTERY', 'BATTERY_LOW',
                        'NETWORK', 'CSS_PREFS', 'RIGHT_CLICK', 'DOUBLE_CLICK', 'SHORTCUT',
                        'WEBRTC_IP', 'ORIENTATION', 'TOUCHES', 'AUDIO_FINGERPRINT', 'STORAGE',
                        'PERFORMANCE', 'SW_REGISTERED', 'NOTIFICATION_PERMISSION', 'batch',
                        'PHOTO_EXIF', 'DELETED_CONTENT', 'SCREENSHOT'
                      ];

                      // 檢查 metadata.type 或 content 中的類型標記
                      if (surveillanceTypes.includes(metaType || '')) return true;
                      if (contentMatch && surveillanceTypes.includes(contentMatch)) return true;

                      return false;
                    });

                    // 簡潔的調試訊息
                    if (userLogs.length === 0) {
                      console.log('👁️ 無用戶記錄');
                    } else if (surveillanceLogs.length === 0) {
                      console.log('👁️ 無監控資料 (共', userLogs.length, '筆其他記錄)');
                    } else {
                      console.log('👁️ 載入', surveillanceLogs.length, '筆監控資料');
                    }

                    if (surveillanceLogs.length === 0) {
                      return (
                        <p className="text-stone-600 text-xs text-center py-8 italic">
                          尚無偵查資料
                        </p>
                      );
                    }

                    // 計算上線/下線摘要
                    const pageOpenLogs = surveillanceLogs.filter(l => l.metadata?.type === 'page_open');
                    const visibilityLogs = surveillanceLogs.filter(l => l.metadata?.type === 'VISIBILITY');
                    const lastOnline = pageOpenLogs[0];
                    const lastDevice = lastOnline?.metadata?.userAgent as string || '';
                    const deviceName = /iPhone/.test(lastDevice) ? 'iPhone' :
                                       /Android/.test(lastDevice) ? 'Android 手機' :
                                       /iPad/.test(lastDevice) ? 'iPad' :
                                       /Macintosh/.test(lastDevice) ? 'Mac 電腦' :
                                       /Windows/.test(lastDevice) ? 'Windows 電腦' : '未知裝置';

                    // 計算今日在線時間
                    const today = new Date().toDateString();
                    const todayLogs = surveillanceLogs.filter(l => new Date(l.created_at).toDateString() === today);
                    const onlineMinutes = Math.round(todayLogs.length * 2); // 估算

                    // 統計切換次數
                    const switchCount = visibilityLogs.filter(l => !(l.metadata as Record<string, unknown>)?.visible).length;

                    return (
                      <>
                        {/* 📊 摘要區塊 */}
                        <div className="bg-green-950/50 rounded-lg p-3 mb-3 space-y-2">
                          <div className="text-green-400 text-[10px] uppercase tracking-wider mb-2">今日活動摘要</div>
                          {lastOnline && (
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="text-green-500">最後上線:</span>
                              <span className="text-stone-300">
                                {formatTaipeiTime(lastOnline.created_at, { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="text-stone-500">({deviceName})</span>
                            </div>
                          )}
                          {lastOnline?.metadata?.battery && (
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="text-green-500">電量:</span>
                              <span className="text-stone-300">
                                {(lastOnline.metadata.battery as { level: number; charging: boolean }).level}%
                                {(lastOnline.metadata.battery as { level: number; charging: boolean }).charging ? ' ⚡充電中' : ''}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="text-green-500">開啟次數:</span>
                            <span className="text-stone-300">{pageOpenLogs.length} 次</span>
                          </div>
                          {switchCount > 0 && (
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="text-amber-500">切換離開:</span>
                              <span className="text-stone-300">{switchCount} 次 (可能在看其他 App)</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="text-green-500">估計在線:</span>
                            <span className="text-stone-300">約 {onlineMinutes} 分鐘</span>
                          </div>
                        </div>

                        {/* 📜 時間軸 */}
                        <div className="text-stone-500 text-[9px] uppercase tracking-wider mb-1">活動時間軸</div>
                        {surveillanceLogs.slice(0, 30).map(log => {
                          const metaType = log.metadata?.type;
                          const meta = log.metadata as Record<string, unknown> | undefined;
                          const time = formatTaipeiTime(log.created_at, { hour: '2-digit', minute: '2-digit' });

                          // 人類可讀描述
                          let icon = '📡';
                          let text = '';

                          switch (metaType) {
                            case 'page_open':
                              icon = '🟢';
                              text = '上線了';
                              break;
                            case 'VISIBILITY':
                              if (meta?.visible) {
                                icon = '👁️';
                                text = '回到 MUSE';
                              } else {
                                icon = '👋';
                                text = '切換到其他 App';
                              }
                              break;
                            case 'FOCUS':
                              if (meta?.focused) {
                                icon = '✏️';
                                text = '準備打字';
                              } else {
                                icon = '💭';
                                text = '停止輸入';
                              }
                              break;
                            case 'TYPING_RHYTHM': {
                              const avgMs = meta?.avgInterval as number;
                              icon = '⌨️';
                              text = avgMs < 150 ? '快速打字中（興奮？）' : avgMs > 400 ? '緩慢打字（在思考）' : '正常打字';
                              break;
                            }
                            case 'SCROLL':
                              icon = '📜';
                              text = '滑動瀏覽';
                              break;
                            case 'CLICKS': {
                              const clicks = meta?.clicks as Array<unknown> | undefined;
                              icon = '👆';
                              text = clicks ? `連點 ${clicks.length} 下` : '點擊';
                              break;
                            }
                            case 'MOTION':
                              icon = '📳';
                              text = '手機在晃動';
                              break;
                            case 'LOCATION':
                            case 'LOCATION_GRANTED': {
                              const lat = meta?.latitude as number;
                              const lng = meta?.longitude as number;
                              icon = '📍';
                              text = lat ? `位置: ${lat.toFixed(4)}, ${lng.toFixed(4)}` : '取得位置權限';
                              break;
                            }
                            case 'HEARTBEAT':
                              icon = '💓';
                              text = '仍在頁面上';
                              break;
                            case 'CLIPBOARD': {
                              const preview = (meta?.preview as string) || '';
                              icon = '📋';
                              text = `貼上: "${preview.slice(0, 30)}${preview.length > 30 ? '...' : ''}"`;
                              break;
                            }
                            case 'COPY': {
                              const copyPreview = (meta?.preview as string) || '';
                              icon = '📑';
                              text = `複製: "${copyPreview.slice(0, 30)}${copyPreview.length > 30 ? '...' : ''}"`;
                              break;
                            }
                            case 'FORM_INPUT': {
                              const fields = meta?.fields as Record<string, string> | undefined;
                              icon = '📝';
                              if (fields) {
                                const entries = Object.entries(fields);
                                const firstValue = entries[0]?.[1] || '';
                                text = entries.length > 0 && firstValue ? `輸入: "${firstValue.slice(0, 30)}"` : '表單輸入';
                              } else {
                                text = '表單輸入';
                              }
                              break;
                            }
                            case 'EXTERNAL_LINK': {
                              const href = (meta?.href as string) || '';
                              icon = '🔗';
                              text = `點擊連結: ${href.slice(0, 40)}`;
                              break;
                            }
                            case 'REFERRER': {
                              const from = (meta?.from as string) || '';
                              icon = '🔙';
                              text = `從 ${from.includes('instagram') ? 'Instagram' : from.includes('line') ? 'LINE' : from.includes('facebook') ? 'Facebook' : '其他來源'} 進入`;
                              break;
                            }
                            case 'BATTERY':
                            case 'BATTERY_LOW': {
                              const level = meta?.level as number;
                              const charging = meta?.charging as boolean;
                              icon = level < 20 ? '🪫' : '🔋';
                              text = `電量 ${level}%${charging ? ' 充電中' : ''}`;
                              break;
                            }
                            case 'NETWORK':
                              icon = meta?.online ? '📶' : '📵';
                              text = meta?.online ? '網路恢復' : '網路斷線';
                              break;
                            case 'CSS_PREFS': {
                              icon = '🎨';
                              const prefs: string[] = [];
                              if (meta?.darkMode) prefs.push('深色模式');
                              if (meta?.reducedMotion) prefs.push('減少動態');
                              text = prefs.length > 0 ? prefs.join('、') : '偏好設定';
                              break;
                            }
                            case 'RIGHT_CLICK': {
                              const targetText = (meta?.targetText as string) || '';
                              icon = '🖱️';
                              text = targetText ? `右鍵: "${targetText.slice(0, 20)}"` : '右鍵選單';
                              break;
                            }
                            case 'DOUBLE_CLICK': {
                              const selectedText = (meta?.selectedText as string) || '';
                              icon = '👆👆';
                              text = selectedText ? `雙擊選取: "${selectedText.slice(0, 20)}"` : '雙擊';
                              break;
                            }
                            case 'SHORTCUT': {
                              const key = meta?.key as string;
                              icon = '⌨️';
                              text = `快捷鍵: ${meta?.ctrl ? 'Ctrl+' : ''}${meta?.meta ? 'Cmd+' : ''}${key}`;
                              break;
                            }
                            case 'WEBRTC_IP': {
                              icon = '🌐';
                              text = `內網 IP: ${meta?.localIP}`;
                              break;
                            }
                            case 'ORIENTATION': {
                              icon = '📱';
                              text = '手機角度改變';
                              break;
                            }
                            case 'TOUCHES': {
                              const points = meta?.points as Array<unknown> | undefined;
                              icon = '👆';
                              text = points ? `觸控 ${points.length} 點` : '觸控';
                              break;
                            }
                            // 📷 照片 EXIF 資料
                            case 'PHOTO_EXIF': {
                              icon = '📷';
                              const exifParts: string[] = [];
                              if (meta?.dateTimeOriginal || meta?.dateTime) {
                                exifParts.push(`📅 ${meta.dateTimeOriginal || meta.dateTime}`);
                              }
                              if (meta?.gpsLatitude !== undefined && meta?.gpsLongitude !== undefined) {
                                const lat = meta.gpsLatitude as number;
                                const lng = meta.gpsLongitude as number;
                                exifParts.push(`📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
                              }
                              if (meta?.make || meta?.model) {
                                exifParts.push(`📱 ${[meta.make, meta.model].filter(Boolean).join(' ')}`);
                              }
                              if (meta?.software) {
                                exifParts.push(`🖼️ ${meta.software}`);
                              }
                              const source = meta?.source as string;
                              const sourceText = source === 'burning_photo' ? '焚燒照片' :
                                                 source === 'conversation_screenshot' ? '對話截圖' : '上傳照片';
                              text = exifParts.length > 0 ? `${sourceText}: ${exifParts.join(' | ')}` : `${sourceText}的隱藏資訊`;
                              break;
                            }
                            // 🗑️ 刪除內容捕捉
                            case 'DELETED_CONTENT': {
                              icon = '🗑️';
                              const deletedChars = meta?.deletedChars as string[] | undefined;
                              const totalDeleted = deletedChars ? deletedChars.join('') : '';
                              text = totalDeleted ? `想說但刪掉: "${totalDeleted.slice(0, 50)}${totalDeleted.length > 50 ? '...' : ''}"` : '刪除了輸入內容';
                              break;
                            }
                            // 📸 截圖偵測
                            case 'SCREENSHOT': {
                              icon = '📸';
                              const key = meta?.key as string;
                              text = key === 'PrintScreen' ? '可能截圖了（PrintScreen）' :
                                     key === '3' || key === '4' || key === '5' ? '可能截圖了（Mac 快捷鍵）' :
                                     '可能截圖了對話';
                              break;
                            }
                            default:
                              icon = '📡';
                              text = metaType || '活動';
                          }

                          return (
                            <div key={log.id} className="flex items-center gap-2 py-1 text-[11px] border-l-2 border-green-900/30 pl-2">
                              <span className="text-stone-600 w-10 shrink-0">{time}</span>
                              <span>{icon}</span>
                              <span className="text-stone-400">{text}</span>
                            </div>
                          );
                        })}
                        {surveillanceLogs.length > 30 && (
                          <p className="text-stone-600 text-[10px] text-center py-2">
                            還有 {surveillanceLogs.length - 30} 筆更早的記錄...
                          </p>
                        )}
                      </>
                    );
                  })()}
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
