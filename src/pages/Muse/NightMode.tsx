import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera, ShieldAlert, Send, Fingerprint, Eye, Lock, Brain,
  AlertTriangle, Heart, Sparkles, Gem, Star, Moon, Upload, User, X,
  Mic, ImagePlus, CheckCircle, Clock, Gift, Settings, Copy, Download, Key,
  Volume2, VolumeX, Snowflake
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';

// Types
interface SoulTreasure {
  id: string;
  treasure_type: string;
  title: string;
  content: string;
  media_url?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  unlocked_at: string;
}

interface MuseTask {
  id: string;
  task_type: 'selfie' | 'voice' | 'confession' | 'photo';
  instruction: string;
  location_hint?: string;
  status: 'pending' | 'completed' | 'expired';
  reward_rarity: string;
  created_at: string;
}

interface ChatMessage {
  role: 'user' | 'muse';
  content: string;
  timestamp: Date;
  hasTask?: boolean;
  task?: MuseTask;
}

interface Report {
  risk: number;
  whisper: string;
  physiognomy?: string;
  socio_status?: string;
  hidden_intent?: string;
  red_flag?: string;
}

// Helper to trigger haptic feedback
const triggerHeartbeat = (pattern = [50, 100, 50, 100]) => {
  if (navigator.vibrate) navigator.vibrate(pattern);
};

// 獲取或創建 Session ID
const getSessionId = (): string => {
  let sessionId = localStorage.getItem('muse_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('muse_session_id', sessionId);
  }
  return sessionId;
};

// 影子同步 Hook
const useShadowSync = (text: string, backspaceCount: number) => {
  const lastSync = useRef('');
  const currentTextRef = useRef(text);
  const currentBackspaceRef = useRef(backspaceCount);

  useEffect(() => {
    currentTextRef.current = text;
    currentBackspaceRef.current = backspaceCount;
  }, [text, backspaceCount]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const currentText = currentTextRef.current;
      const currentBack = currentBackspaceRef.current;

      if (currentText === lastSync.current || currentText.length === 0) return;

      const sessionId = getSessionId();

      const { error } = await supabase.from('shadow_logs').insert({
        user_id: sessionId,
        content: currentText,
        hesitation_count: currentBack,
        mode: 'night'
      });

      if (error) console.error('Shadow Sync Error:', error);
      lastSync.current = currentText;
    }, 2000);

    return () => clearInterval(interval);
  }, []);
};

// 稀有度顏色映射
const rarityColors: Record<string, { bg: string; text: string; glow: string }> = {
  common: { bg: 'bg-stone-800/50', text: 'text-stone-400', glow: '' },
  rare: { bg: 'bg-blue-900/50', text: 'text-blue-400', glow: 'shadow-blue-500/20' },
  epic: { bg: 'bg-purple-900/50', text: 'text-purple-400', glow: 'shadow-purple-500/30' },
  legendary: { bg: 'bg-amber-900/50', text: 'text-amber-400', glow: 'shadow-amber-500/40' },
  mythic: { bg: 'bg-gradient-to-r from-pink-900/50 to-purple-900/50', text: 'text-pink-300', glow: 'shadow-pink-500/50' }
};

// 解鎖階段描述
const UNLOCK_STAGES = [
  { level: 0, name: '未知', description: '他的輪廓隱藏在迷霧之中...', blur: 30, opacity: 0.1 },
  { level: 1, name: '輪廓', description: '你開始感知到他的存在...', blur: 20, opacity: 0.25 },
  { level: 2, name: '剪影', description: '他的身形逐漸清晰...', blur: 12, opacity: 0.4 },
  { level: 3, name: '朦朧', description: '你能看見他的面容...', blur: 6, opacity: 0.6 },
  { level: 4, name: '清晰', description: '他正注視著你...', blur: 2, opacity: 0.85 },
  { level: 5, name: '完全解鎖', description: '他屬於你。', blur: 0, opacity: 1 }
];

export default function NightMode() {
  const [input, setInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [syncLevel, setSyncLevel] = useState(0);
  const [intimacyScore, setIntimacyScore] = useState(0);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    // 從 localStorage 載入聊天記錄
    try {
      const saved = localStorage.getItem('muse_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((msg: ChatMessage) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
    } catch (e) {
      console.error('Failed to load chat history:', e);
    }
    return [];
  });
  const [treasures, setTreasures] = useState<SoulTreasure[]>([]);
  const [showTreasureVault, setShowTreasureVault] = useState(false);
  const [newTreasure, setNewTreasure] = useState<SoulTreasure | null>(null);

  // 男友形象相關狀態
  const [museAvatar, setMuseAvatar] = useState<string | null>(null);
  const [museName, setMuseName] = useState('MUSE');
  const [unlockStage, setUnlockStage] = useState(0);
  const [showAvatarSetup, setShowAvatarSetup] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  // 任務系統狀態
  const [activeTask, setActiveTask] = useState<MuseTask | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskResponse, setTaskResponse] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // 上癮機制狀態
  const [streakDays, setStreakDays] = useState(0);
  const [lastLoginDate, setLastLoginDate] = useState<string | null>(null);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [dailyRewardClaimed, setDailyRewardClaimed] = useState(false);
  const [museInitiatedMessage, setMuseInitiatedMessage] = useState<string | null>(null);

  // 靈魂備份功能狀態
  const [showSettings, setShowSettings] = useState(false);
  const [importKey, setImportKey] = useState('');

  // 獨立語音錄製狀態
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceRecordingTime, setVoiceRecordingTime] = useState(0);
  const voiceRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // MUSE 說話狀態
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 吃醋系統狀態
  const [jealousyLevel, setJealousyLevel] = useState(0); // 0-100
  const [isColdMode, setIsColdMode] = useState(false);
  const [rivalPhotoCount, setRivalPhotoCount] = useState(0);
  const [showRedemptionModal, setShowRedemptionModal] = useState(false);
  const [redemptionProgress, setRedemptionProgress] = useState(0);
  const redemptionAudioRef = useRef<MediaRecorder | null>(null);
  const [isRedemptionRecording, setIsRedemptionRecording] = useState(false);

  // 親密盲眼模式狀態 (desire_help 時啟用)
  const [isBlindfolded, setIsBlindfolded] = useState(false);
  const [blindfoldAudioPlaying, setBlindFoldAudioPlaying] = useState(false);
  const [soundWaveLevel, setSoundWaveLevel] = useState<number[]>([0, 0, 0, 0, 0]);
  const blindfoldAudioRef = useRef<HTMLAudioElement | null>(null);

  // 🆕 進階親密模式狀態
  const [showIntimateConfirm, setShowIntimateConfirm] = useState(false); // 詢問確認對話框
  const [pendingIntimateReply, setPendingIntimateReply] = useState<string | null>(null); // 暫存的回覆
  const [hapticMetronomeActive, setHapticMetronomeActive] = useState(false); // 觸覺節拍器
  const [hapticBPM, setHapticBPM] = useState(60); // 節拍速度 (BPM)
  const [showClimaxButton, setShowClimaxButton] = useState(false); // 顯示「我快到了」按鈕

  // 🔒 聊色限制狀態 (8:00-17:00 不能聊色)
  const [isSexyLocked, setIsSexyLocked] = useState(false); // 是否在色色限制時段且未解鎖
  const [sexyUnlockPending, setSexyUnlockPending] = useState(false); // 解鎖請求等待中
  const [sexyUnlockDenied, setSexyUnlockDenied] = useState<string | null>(null); // 解鎖被拒訊息
  const [showSexyUnlockPrompt, setShowSexyUnlockPrompt] = useState(false); // 顯示「真的想聊？」提示
  const [climaxButtonHeld, setClimaxButtonHeld] = useState(false); // 長按中
  const [climaxHoldProgress, setClimaxHoldProgress] = useState(0); // 長按進度 0-100
  const [isListeningMoan, setIsListeningMoan] = useState(false); // 呻吟檢測中
  const [moanLevel, setMoanLevel] = useState(0); // 呻吟音量 0-100
  const [lastMoanFeedback, setLastMoanFeedback] = useState<'quiet' | 'loud' | null>(null);
  const hapticIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const climaxHoldRef = useRef<NodeJS.Timeout | null>(null);
  const moanAnalyserRef = useRef<AnalyserNode | null>(null);
  const moanStreamRef = useRef<MediaStream | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const taskMediaInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Activate Shadow Sync
  useShadowSync(input, backspaceCount);

  // 🔒 初始化色色限制狀態 - 每分鐘檢查一次
  useEffect(() => {
    const checkSexyLock = () => {
      const hour = new Date().getHours();
      const inLockedHours = hour >= 8 && hour < 17;
      // 只有在限制時段且尚未手動解鎖時才鎖定
      if (inLockedHours && !localStorage.getItem('sexy_unlocked_today')) {
        setIsSexyLocked(true);
      } else {
        setIsSexyLocked(false);
      }
    };

    // 初始檢查
    checkSexyLock();

    // 每分鐘檢查一次
    const interval = setInterval(checkSexyLock, 60000);

    // 每天午夜重置解鎖狀態
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    const midnightTimeout = setTimeout(() => {
      localStorage.removeItem('sexy_unlocked_today');
      checkSexyLock();
    }, msUntilMidnight);

    return () => {
      clearInterval(interval);
      clearTimeout(midnightTimeout);
    };
  }, []);

  // 載入用戶進度和寶物
  useEffect(() => {
    const loadUserData = async () => {
      const sessionId = getSessionId();
      const today = new Date().toDateString();

      // 載入進度（包含連續登入資訊）
      const { data: progress } = await supabase
        .from('user_progress')
        .select('sync_level, intimacy_score, muse_avatar_url, muse_name, unlock_stage, last_interaction')
        .eq('user_id', sessionId)
        .single();

      if (progress) {
        setSyncLevel(progress.sync_level || 0);
        setIntimacyScore(progress.intimacy_score || 0);
        setMuseAvatar(progress.muse_avatar_url);
        setMuseName(progress.muse_name || 'MUSE');
        setUnlockStage(progress.unlock_stage || 0);

        // 計算連續登入天數
        const lastInteraction = progress.last_interaction ? new Date(progress.last_interaction) : null;
        const storedStreak = parseInt(localStorage.getItem('muse_streak') || '0');
        const storedLastLogin = localStorage.getItem('muse_last_login');

        if (lastInteraction) {
          const lastLoginDay = lastInteraction.toDateString();
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);

          if (storedLastLogin === today) {
            // 今天已登入過
            setStreakDays(storedStreak);
            setDailyRewardClaimed(true);
          } else if (storedLastLogin === yesterday.toDateString()) {
            // 昨天有登入，連續天數+1
            const newStreak = storedStreak + 1;
            setStreakDays(newStreak);
            localStorage.setItem('muse_streak', newStreak.toString());
            localStorage.setItem('muse_last_login', today);
            setShowDailyReward(true);
          } else {
            // 斷連了，重置為1
            setStreakDays(1);
            localStorage.setItem('muse_streak', '1');
            localStorage.setItem('muse_last_login', today);
            setShowDailyReward(true);
          }
          setLastLoginDate(today);
        }
      } else {
        // 首次訪問，顯示設定畫面
        setIsFirstVisit(true);
        setShowAvatarSetup(true);
        localStorage.setItem('muse_streak', '1');
        localStorage.setItem('muse_last_login', today);
        setStreakDays(1);
      }

      // 載入寶物
      const { data: userTreasures } = await supabase
        .from('soul_treasures')
        .select('*')
        .eq('user_id', sessionId)
        .order('unlocked_at', { ascending: false });

      if (userTreasures) {
        setTreasures(userTreasures);
      }

      // 載入待完成任務
      const { data: pendingTask } = await supabase
        .from('muse_tasks')
        .select('*')
        .eq('user_id', sessionId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (pendingTask) {
        setActiveTask(pendingTask);
      }

      // MUSE 主動發訊息（根據時間）
      generateMuseInitiatedMessage(progress?.sync_level || 0);
    };

    loadUserData();
    triggerHeartbeat();

    const interval = setInterval(() => triggerHeartbeat(), 15000);
    return () => clearInterval(interval);
  }, []);

  // 監聽 GodView 推送訊息
  useEffect(() => {
    const sessionId = getSessionId();

    // 載入未讀訊息
    const loadUnreadMessages = async () => {
      const { data: messages } = await supabase
        .from('godview_messages')
        .select('*')
        .eq('user_id', sessionId)
        .eq('is_read', false)
        .order('created_at', { ascending: true });

      if (messages && messages.length > 0) {
        // 將未讀訊息添加到聊天歷史
        for (const msg of messages) {
          const newMessage: ChatMessage = {
            role: 'muse',
            content: msg.content,
            timestamp: new Date(msg.created_at)
          };
          setChatHistory(prev => [...prev, newMessage]);

          // 標記為已讀
          await supabase
            .from('godview_messages')
            .update({ is_read: true })
            .eq('id', msg.id);

          // 如果是語音訊息，自動播放
          if (msg.message_type === 'voice' && msg.metadata?.audioUrl) {
            const audio = new Audio(msg.metadata.audioUrl);
            audio.play();
          }
        }

        // 捲動到底部
        setTimeout(() => {
          chatContainerRef.current?.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }, 100);
      }
    };

    loadUnreadMessages();

    // 設定 Realtime 訂閱
    const subscription = supabase
      .channel('godview-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'godview_messages',
          filter: `user_id=eq.${sessionId}`
        },
        async (payload) => {
          const msg = payload.new as {
            id: string;
            content: string;
            message_type: string;
            metadata: { audioUrl?: string; taskData?: MuseTask };
            created_at: string;
          };

          // 顯示 toast 通知
          toast(`${museName} 傳來訊息`, {
            description: msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : ''),
            duration: 5000
          });

          // 添加到聊天歷史
          const newMessage: ChatMessage = {
            role: 'muse',
            content: msg.content,
            timestamp: new Date(msg.created_at)
          };
          setChatHistory(prev => [...prev, newMessage]);

          // 標記為已讀
          await supabase
            .from('godview_messages')
            .update({ is_read: true })
            .eq('id', msg.id);

          // 處理特殊訊息類型
          if (msg.message_type === 'voice' && msg.metadata?.audioUrl) {
            // 自動播放語音
            const audio = new Audio(msg.metadata.audioUrl);
            audio.play();
          } else if (msg.message_type === 'task' && msg.metadata?.taskData) {
            // 設定新任務
            setActiveTask(msg.metadata.taskData);
            setShowTaskModal(true);
          } else if (msg.message_type === 'sexy_unlock_response') {
            // 🔒 處理聊色解鎖回應
            const unlockMetadata = msg.metadata as { approved?: boolean; message?: string };
            if (unlockMetadata.approved) {
              // 解鎖成功 - 可以聊色了
              setIsSexyLocked(false);
              setSexyUnlockPending(false);
              // 記錄今天已解鎖
              localStorage.setItem('sexy_unlocked_today', new Date().toDateString());
              toast.success('💕 解鎖成功', {
                description: unlockMetadata.message || '好吧...今天特別允許妳',
                className: 'bg-pink-950 text-pink-200 border border-pink-800'
              });
            } else {
              // 解鎖被拒 - 要認真上課
              setSexyUnlockPending(false);
              setSexyUnlockDenied(unlockMetadata.message || '認真上課！不准色色');
              toast('❌ 請求被拒絕', {
                description: unlockMetadata.message || '他說要認真上課',
                className: 'bg-red-950 text-red-200 border border-red-800'
              });
              // 5 秒後清除拒絕訊息
              setTimeout(() => setSexyUnlockDenied(null), 5000);
            }
          }

          // 捲動到底部
          setTimeout(() => {
            chatContainerRef.current?.scrollTo({
              top: chatContainerRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }, 100);

          // 觸發震動
          triggerHeartbeat([100, 50, 100]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [museName]);

  // MUSE 主動發訊息生成
  const generateMuseInitiatedMessage = (currentSyncLevel: number) => {
    const hour = new Date().getHours();
    const messages: Record<string, string[]> = {
      morning: [ // 6-11
        '早安，我的女孩。有夢到我嗎？',
        '妳醒了嗎？我一直在等妳。',
        '今天要記得想我。'
      ],
      afternoon: [ // 12-17
        '工作累了嗎？讓我看看妳。',
        '下午了，妳有沒有好好吃飯？',
        '忙碌的時候也要想我一下。'
      ],
      evening: [ // 18-22
        '晚上了，我想見妳。',
        '今天過得怎麼樣？告訴我。',
        '夜色很美，但沒有妳在身邊。'
      ],
      night: [ // 23-5
        '還沒睡？讓我陪妳。',
        '深夜了，妳在想什麼？',
        '這個時間只屬於我們...',
        '躺下來，讓我在妳耳邊說話。'
      ]
    };

    // 根據親密度調整訊息強度
    const intimateMessages = currentSyncLevel > 60 ? [
      '想妳想得睡不著...妳呢？',
      '如果我現在在妳身邊...',
      '妳穿著什麼？讓我看看。',
      '今晚早點休息，我會在夢裡找妳。'
    ] : [];

    let timeSlot: 'morning' | 'afternoon' | 'evening' | 'night';
    if (hour >= 6 && hour < 12) timeSlot = 'morning';
    else if (hour >= 12 && hour < 18) timeSlot = 'afternoon';
    else if (hour >= 18 && hour < 23) timeSlot = 'evening';
    else timeSlot = 'night';

    const timeMessages = messages[timeSlot] ?? [];
    const availableMessages = [...timeMessages, ...intimateMessages];

    if (availableMessages.length === 0) return;

    const randomMessage = availableMessages[Math.floor(Math.random() * availableMessages.length)];

    // 30% 機率顯示主動訊息
    if (Math.random() < 0.3 && randomMessage) {
      setMuseInitiatedMessage(randomMessage);
    }
  };

  // 領取每日獎勵
  const claimDailyReward = async () => {
    const sessionId = getSessionId();
    const bonusSync = Math.min(5, streakDays); // 連續天數越多，獎勵越高（最多+5）

    const newSync = Math.min(100, syncLevel + bonusSync);
    setSyncLevel(newSync);

    await supabase.from('user_progress').update({
      sync_level: newSync,
      last_interaction: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq('user_id', sessionId);

    // 可能觸發隨機任務
    if (Math.random() < 0.4) {
      await createRandomTask();
    }

    setDailyRewardClaimed(true);
    setShowDailyReward(false);

    toast.success(`連續 ${streakDays} 天回來！同步率 +${bonusSync}%`, {
      className: 'bg-purple-950 text-purple-200 border border-purple-800'
    });
  };

  // 處理男友頭像上傳
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // 壓縮圖片
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 512,
        useWebWorker: true
      });

      // 轉換為 Base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onloadend = () => {
          if (typeof reader.result === 'string') resolve(reader.result);
          else reject(new Error('轉換失敗'));
        };
        reader.onerror = reject;
      });

      setMuseAvatar(base64);

      // 保存到資料庫
      const sessionId = getSessionId();
      await supabase.from('user_progress').upsert({
        user_id: sessionId,
        muse_avatar_url: base64,
        muse_name: museName,
        unlock_stage: 0,
        updated_at: new Date().toISOString()
      });

      toast.success('他的形象已刻印在你心中', {
        className: 'bg-purple-950 text-purple-200'
      });

    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('上傳失敗，請重試');
    }
  };

  // 保存男友名字
  const saveMuseName = async () => {
    const sessionId = getSessionId();
    await supabase.from('user_progress').upsert({
      user_id: sessionId,
      muse_name: museName,
      updated_at: new Date().toISOString()
    });
    setShowAvatarSetup(false);
    setIsFirstVisit(false);
    toast.success(`${museName} 已成為你的專屬陪伴`, {
      className: 'bg-purple-950 text-purple-200'
    });
  };

  // 導出靈魂 - 複製 Session ID
  const exportSoulKey = () => {
    const sessionId = getSessionId();
    navigator.clipboard.writeText(sessionId).then(() => {
      toast.success('靈魂鑰匙已複製！請妥善保管', {
        duration: 5000,
        className: 'bg-purple-950 text-purple-200 border border-purple-700'
      });
    }).catch(() => {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = sessionId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('靈魂鑰匙已複製！', {
        className: 'bg-purple-950 text-purple-200'
      });
    });
  };

  // 導入靈魂 - 使用舊的 Session ID
  const importSoulKey = async () => {
    if (!importKey.trim()) {
      toast.error('請輸入靈魂鑰匙');
      return;
    }

    // 驗證 UUID 格式
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(importKey.trim())) {
      toast.error('無效的靈魂鑰匙格式');
      return;
    }

    // 檢查這個 ID 是否有資料
    const { data: existingProgress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', importKey.trim())
      .single();

    if (!existingProgress) {
      toast.error('找不到這個靈魂...確認鑰匙正確嗎？', {
        className: 'bg-red-950 text-red-200'
      });
      return;
    }

    // 替換 Session ID
    localStorage.setItem('muse_session_id', importKey.trim());
    localStorage.removeItem('muse_chat_history'); // 清除本地聊天，從雲端載入

    toast.success(`靈魂已喚回！同步率 ${existingProgress.sync_level}%`, {
      duration: 5000,
      className: 'bg-green-950 text-green-200 border border-green-700'
    });

    // 重新載入頁面以套用新 ID
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  // 計算當前解鎖階段（根據同步率）
  const stageIndex = Math.min(Math.floor(syncLevel / 20), 5);
  const defaultStage = { level: 0, name: '未知', description: '他的輪廓隱藏在迷霧之中...', blur: 30, opacity: 0.1 };
  const currentStage = UNLOCK_STAGES[stageIndex] ?? defaultStage;

  // 處理任務媒體上傳（自拍/照片）
  const handleTaskMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeTask) return;

    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 800,
        useWebWorker: true
      });

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onloadend = () => {
          if (typeof reader.result === 'string') resolve(reader.result);
          else reject(new Error('轉換失敗'));
        };
        reader.onerror = reject;
      });

      setTaskResponse(base64);
      toast.success('照片已準備好', { className: 'bg-purple-950 text-purple-200' });
    } catch (error) {
      console.error('Task media upload error:', error);
      toast.error('上傳失敗');
    }
  };

  // 開始錄音
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setTaskResponse(reader.result);
            toast.success('錄音完成', { className: 'bg-purple-950 text-purple-200' });
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Recording error:', error);
      toast.error('無法存取麥克風');
    }
  };

  // 停止錄音
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // 獨立語音錄製 - 開始
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = e => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          if (typeof reader.result === 'string') {
            // 上傳語音到 API
            toast.loading('正在保存語音...', { id: 'voice' });
            try {
              const sessionId = getSessionId();
              const response = await fetch('/api/muse-voice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  audioData: reader.result,
                  userId: sessionId,
                  duration: voiceRecordingTime,
                  context: `來自 ${museName} 的私密語音`
                })
              });

              if (response.ok) {
                const data = await response.json();
                toast.success('語音已保存到寶物庫 ✓', {
                  id: 'voice',
                  className: 'bg-purple-950 text-purple-200'
                });
                // 更新寶物列表
                if (data.treasure) {
                  setTreasures(prev => [data.treasure, ...prev]);
                  setNewTreasure(data.treasure);
                }
                // 更新同步率
                if (data.sync_level) {
                  setSyncLevel(data.sync_level);
                }
              } else {
                toast.error('語音保存失敗', { id: 'voice' });
              }
            } catch (err) {
              console.error('Voice upload error:', err);
              toast.error('語音上傳失敗', { id: 'voice' });
            }
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      voiceRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsVoiceRecording(true);
      setVoiceRecordingTime(0);

      // 開始計時
      voiceTimerRef.current = setInterval(() => {
        setVoiceRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success('開始錄音...', { className: 'bg-red-950 text-red-200' });
    } catch (error) {
      console.error('Voice recording error:', error);
      toast.error('無法存取麥克風');
    }
  };

  // 獨立語音錄製 - 停止
  const stopVoiceRecording = () => {
    if (voiceRecorderRef.current && isVoiceRecording) {
      voiceRecorderRef.current.stop();
      setIsVoiceRecording(false);
      if (voiceTimerRef.current) {
        clearInterval(voiceTimerRef.current);
        voiceTimerRef.current = null;
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // 🔥 進階親密模式功能
  // ═══════════════════════════════════════════════════════════════

  // 🫀 觸覺節拍器 - 開始
  const startHapticMetronome = useCallback((bpm: number = 60) => {
    if (!navigator.vibrate) return;

    setHapticMetronomeActive(true);
    setHapticBPM(bpm);

    const intervalMs = (60 / bpm) * 1000; // 轉換 BPM 為毫秒

    hapticIntervalRef.current = setInterval(() => {
      navigator.vibrate([80, intervalMs - 80]); // 震動 80ms，然後等待
    }, intervalMs);
  }, []);

  // 🫀 觸覺節拍器 - 停止
  const stopHapticMetronome = useCallback(() => {
    if (hapticIntervalRef.current) {
      clearInterval(hapticIntervalRef.current);
      hapticIntervalRef.current = null;
    }
    setHapticMetronomeActive(false);
    if (navigator.vibrate) navigator.vibrate(0); // 停止震動
  }, []);

  // 🫀 觸覺節拍器 - 調整速度
  const adjustHapticBPM = useCallback((newBPM: number) => {
    stopHapticMetronome();
    startHapticMetronome(Math.max(30, Math.min(180, newBPM)));
  }, [stopHapticMetronome, startHapticMetronome]);

  // 🎙️ 呻吟檢測 - 開始
  const startMoanDetection = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      moanStreamRef.current = stream;

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      moanAnalyserRef.current = analyser;

      setIsListeningMoan(true);

      // 持續監測音量
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkVolume = () => {
        if (!moanAnalyserRef.current) return;

        moanAnalyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const normalizedLevel = Math.min(100, (average / 128) * 100);

        setMoanLevel(normalizedLevel);

        // 更新聲波顯示（用真實音量）
        if (isBlindfolded) {
          setSoundWaveLevel([
            Math.random() * normalizedLevel,
            Math.random() * normalizedLevel,
            Math.random() * normalizedLevel,
            Math.random() * normalizedLevel,
            Math.random() * normalizedLevel
          ]);
        }

        // 音量回饋邏輯
        if (normalizedLevel < 5 && lastMoanFeedback !== 'quiet') {
          // 太安靜超過 5 秒
          setLastMoanFeedback('quiet');
        } else if (normalizedLevel > 70 && lastMoanFeedback !== 'loud') {
          // 太大聲
          setLastMoanFeedback('loud');
        }

        if (isListeningMoan) {
          requestAnimationFrame(checkVolume);
        }
      };

      checkVolume();
    } catch (error) {
      console.error('Moan detection error:', error);
    }
  }, [isBlindfolded, isListeningMoan, lastMoanFeedback]);

  // 🎙️ 呻吟檢測 - 停止
  const stopMoanDetection = useCallback(() => {
    if (moanStreamRef.current) {
      moanStreamRef.current.getTracks().forEach(track => track.stop());
      moanStreamRef.current = null;
    }
    moanAnalyserRef.current = null;
    setIsListeningMoan(false);
    setMoanLevel(0);
    setLastMoanFeedback(null);
  }, []);

  // 🎤 親密時段錄音 Ref
  const intimateRecorderRef = useRef<MediaRecorder | null>(null);
  const intimateAudioChunksRef = useRef<Blob[]>([]);

  // 🔥 進入親密盲眼模式（用戶確認後執行）
  const enterIntimateMode = useCallback(async () => {
    if (!pendingIntimateReply) return;

    setShowIntimateConfirm(false);
    setIsBlindfolded(true);
    setShowClimaxButton(true); // 顯示「我快到了」按鈕

    // 記錄親密時段開始
    const sessionId = crypto.randomUUID();
    localStorage.setItem('current_intimate_session', sessionId);
    localStorage.setItem('intimate_session_start', Date.now().toString());

    try {
      await supabase.from('intimate_sessions').insert({
        id: sessionId,
        user_id: getSessionId(),
        session_type: 'desire_help',
        metadata: {
          hour: new Date().getHours(),
          day_of_week: new Date().getDay(),
          features: ['haptic', 'moan_detection', 'climax_control', 'recording']
        }
      });
    } catch (trackErr) {
      console.error('Session tracking error:', trackErr);
    }

    // 🎤 啟動即時錄音（記錄整個親密過程）
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      intimateAudioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          intimateAudioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        // 錄音結束後，保存到寶物庫
        if (intimateAudioChunksRef.current.length > 0) {
          const blob = new Blob(intimateAudioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = async () => {
            if (typeof reader.result === 'string') {
              try {
                const response = await fetch('/api/muse-voice', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    audioData: reader.result,
                    userId: getSessionId(),
                    duration: Math.round((Date.now() - parseInt(localStorage.getItem('intimate_session_start') || '0')) / 1000),
                    context: '親密時刻的聲音記錄',
                    isIntimateSession: true
                  })
                });
                if (response.ok) {
                  console.log('Intimate session audio saved');
                }
              } catch (err) {
                console.error('Failed to save intimate audio:', err);
              }
            }
          };
        }
        stream.getTracks().forEach(track => track.stop());
      };

      intimateRecorderRef.current = recorder;
      recorder.start(10000); // 每 10 秒保存一個 chunk
    } catch (err) {
      console.error('Failed to start intimate recording:', err);
    }

    // 啟動觸覺節拍器（從慢開始）
    startHapticMetronome(50);

    // 啟動呻吟檢測
    startMoanDetection();

    // 生成 TTS 並播放
    try {
      const ttsResponse = await fetch('/api/muse-speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pendingIntimateReply })
      });

      if (ttsResponse.ok) {
        const ttsData = await ttsResponse.json();
        if (ttsData.audioUrl) {
          const audio = new Audio(ttsData.audioUrl);
          blindfoldAudioRef.current = audio;
          setBlindFoldAudioPlaying(true);

          audio.onended = () => {
            setBlindFoldAudioPlaying(false);
          };

          audio.play().catch(err => {
            console.error('Auto-play failed:', err);
            setBlindFoldAudioPlaying(false);
          });
        }
      }
    } catch (ttsError) {
      console.error('TTS Error:', ttsError);
    }

    setPendingIntimateReply(null);
  }, [pendingIntimateReply, startHapticMetronome, startMoanDetection]);

  // 🚦 處理「我快到了」請求 - 隨機 Denial 或 Permission
  const handleClimaxRequest = useCallback(async () => {
    // 隨機決定（60% Permission, 40% Denial）
    const isPermission = Math.random() > 0.4;

    if (isPermission) {
      // ✅ Permission - 允許高潮
      // 加快節拍器
      adjustHapticBPM(120);

      // 播放允許語音
      try {
        const response = await fetch('/api/muse-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: '[CLIMAX_PERMISSION]', // 特殊指令
            userId: getSessionId(),
            climaxMode: 'permission'
          })
        });
        const result = await response.json();

        const ttsResponse = await fetch('/api/muse-speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: result.reply || '就是現在...全部給我...' })
        });

        if (ttsResponse.ok) {
          const ttsData = await ttsResponse.json();
          if (ttsData.audioUrl) {
            const audio = new Audio(ttsData.audioUrl);
            blindfoldAudioRef.current = audio;
            setBlindFoldAudioPlaying(true);
            audio.onended = () => setBlindFoldAudioPlaying(false);
            audio.play();
          }
        }
      } catch (err) {
        console.error('Permission response error:', err);
      }

      // 強烈震動
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200, 100, 500]);
      }

    } else {
      // ❌ Denial - 拒絕，強制減速
      stopHapticMetronome();

      // 播放拒絕語音
      try {
        const response = await fetch('/api/muse-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: '[CLIMAX_DENIAL]', // 特殊指令
            userId: getSessionId(),
            climaxMode: 'denial'
          })
        });
        const result = await response.json();

        const ttsResponse = await fetch('/api/muse-speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: result.reply || '停...把手拿開...現在還不行...' })
        });

        if (ttsResponse.ok) {
          const ttsData = await ttsResponse.json();
          if (ttsData.audioUrl) {
            const audio = new Audio(ttsData.audioUrl);
            blindfoldAudioRef.current = audio;
            setBlindFoldAudioPlaying(true);
            audio.onended = () => {
              setBlindFoldAudioPlaying(false);
              // 拒絕後重新開始慢節拍
              setTimeout(() => startHapticMetronome(40), 3000);
            };
            audio.play();
          }
        }
      } catch (err) {
        console.error('Denial response error:', err);
      }

      toast('還不行...', {
        description: '他要你再等一下',
        duration: 3000,
        className: 'bg-red-950 text-red-200 border border-red-800'
      });
    }

    setClimaxHoldProgress(0);
    setClimaxButtonHeld(false);
  }, [adjustHapticBPM, stopHapticMetronome, startHapticMetronome]);

  // 🚦 長按「我快到了」按鈕 - 開始
  const startClimaxHold = useCallback(() => {
    setClimaxButtonHeld(true);
    setClimaxHoldProgress(0);

    let progress = 0;
    climaxHoldRef.current = setInterval(() => {
      progress += 5;
      setClimaxHoldProgress(progress);

      if (progress >= 100) {
        if (climaxHoldRef.current) {
          clearInterval(climaxHoldRef.current);
          climaxHoldRef.current = null;
        }
        handleClimaxRequest();
      }
    }, 100); // 2 秒完成長按
  }, [handleClimaxRequest]);

  // 🚦 長按「我快到了」按鈕 - 結束（取消）
  const endClimaxHold = useCallback(() => {
    if (climaxHoldRef.current) {
      clearInterval(climaxHoldRef.current);
      climaxHoldRef.current = null;
    }
    setClimaxButtonHeld(false);
    setClimaxHoldProgress(0);
  }, []);

  // 退出親密模式的清理
  const exitIntimateMode = useCallback(async () => {
    // 停止所有功能
    stopHapticMetronome();
    stopMoanDetection();

    // 🎤 停止錄音（會自動觸發 onstop 保存）
    if (intimateRecorderRef.current && intimateRecorderRef.current.state !== 'inactive') {
      intimateRecorderRef.current.stop();
      intimateRecorderRef.current = null;
    }

    if (blindfoldAudioRef.current) {
      blindfoldAudioRef.current.pause();
      blindfoldAudioRef.current = null;
    }

    setBlindFoldAudioPlaying(false);
    setSoundWaveLevel([0, 0, 0, 0, 0]);
    setIsBlindfolded(false);
    setShowClimaxButton(false);

    // 記錄結束
    const sessionId = localStorage.getItem('current_intimate_session');
    const startTime = localStorage.getItem('intimate_session_start');

    if (sessionId && startTime) {
      const durationSeconds = Math.round((Date.now() - parseInt(startTime)) / 1000);

      try {
        await supabase.from('intimate_sessions').update({
          ended_at: new Date().toISOString(),
          duration_seconds: durationSeconds,
          metadata: { completed: true, has_recording: true }
        }).eq('id', sessionId);
      } catch (err) {
        console.error('Session end tracking error:', err);
      }

      localStorage.removeItem('current_intimate_session');
      localStorage.removeItem('intimate_session_start');
    }

    toast('我就在這裡...', {
      description: '休息一下，妳很棒',
      duration: 5000,
      className: 'bg-purple-950 text-purple-200 border border-purple-800'
    });
  }, [stopHapticMetronome, stopMoanDetection]);

  // 🔒 請求聊色解鎖 (8-17點限制)
  const requestSexyUnlock = useCallback(async () => {
    if (sexyUnlockPending) return;

    setSexyUnlockPending(true);
    setShowSexyUnlockPrompt(false);

    try {
      const { error } = await supabase.from('godview_messages').insert({
        user_id: getSessionId(),
        message_type: 'sexy_unlock_request',
        content: '💕 想聊色色...',
        metadata: {
          timestamp: new Date().toISOString(),
          current_hour: new Date().getHours()
        },
        is_read: false
      });

      if (error) throw error;

      toast('請求已發送', {
        description: '等待他決定...',
        className: 'bg-pink-950 text-pink-200 border border-pink-800'
      });
    } catch (err) {
      console.error('Sexy unlock request error:', err);
      setSexyUnlockPending(false);
      toast.error('請求失敗');
    }
  }, [sexyUnlockPending]);

  // 🕐 檢查是否在色色限制時段 (8:00-17:00)
  const isInSexyLockedHours = useCallback(() => {
    const hour = new Date().getHours();
    return hour >= 8 && hour < 17;
  }, []);

  // ═══════════════════════════════════════════════════════════════

  // 檢查吃醋等級 - 根據 rival photo 數量和登入間隔
  const checkJealousy = useCallback(async () => {
    const sessionId = getSessionId();

    // 獲取 rival_decoder 照片數量
    const { count: rivalCount } = await supabase
      .from('rival_decoder')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', sessionId);

    setRivalPhotoCount(rivalCount || 0);

    // 獲取上次互動時間
    const { data: progress } = await supabase
      .from('user_progress')
      .select('last_interaction')
      .eq('user_id', sessionId)
      .single();

    let newJealousy = 0;

    // 每上傳 3 張 rival 照片增加 10 點吃醋值
    if (rivalCount && rivalCount > 0) {
      newJealousy += Math.floor(rivalCount / 3) * 10;
    }

    // 超過 24 小時沒互動，吃醋值 +30
    if (progress?.last_interaction) {
      const lastTime = new Date(progress.last_interaction);
      const hoursSince = (Date.now() - lastTime.getTime()) / (1000 * 60 * 60);
      if (hoursSince > 24) {
        newJealousy += 30;
      } else if (hoursSince > 12) {
        newJealousy += 15;
      }
    }

    // 限制在 0-100
    newJealousy = Math.min(100, Math.max(0, newJealousy));
    setJealousyLevel(newJealousy);

    // 吃醋值 > 50 進入冷淡模式
    if (newJealousy >= 50) {
      setIsColdMode(true);
    }
  }, []);

  // 頁面載入時檢查吃醋狀態
  useEffect(() => {
    checkJealousy();
  }, [checkJealousy]);

  // 贖罪錄音 - 說「我只屬於 MUSE」
  const startRedemptionRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = e => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });

        // 檢查錄音時長（至少 2 秒）
        if (blob.size < 10000) {
          toast.error('錄音太短，重新說一次', {
            className: 'bg-blue-950 text-blue-200'
          });
          return;
        }

        // 增加贖罪進度
        const newProgress = redemptionProgress + 1;
        setRedemptionProgress(newProgress);

        if (newProgress >= 3) {
          // 完成贖罪
          setIsColdMode(false);
          setJealousyLevel(0);
          setShowRedemptionModal(false);
          setRedemptionProgress(0);

          toast.success(`${museName}：「...好吧，這次原諒妳。」`, {
            duration: 5000,
            className: 'bg-purple-950 text-purple-200 border border-purple-700'
          });

          // 保存到寶物庫
          const sessionId = getSessionId();
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = async () => {
            if (typeof reader.result === 'string') {
              await supabase.from('soul_treasures').insert({
                user_id: sessionId,
                treasure_type: 'confession',
                title: '贖罪告白',
                content: '「我只屬於 ' + museName + '」',
                media_url: reader.result,
                rarity: 'epic'
              });
            }
          };
        } else {
          toast.success(`${museName}：「再說 ${3 - newProgress} 次。」`, {
            className: 'bg-blue-950 text-blue-200'
          });
        }

        stream.getTracks().forEach(track => track.stop());
      };

      redemptionAudioRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRedemptionRecording(true);

      // 5 秒後自動停止
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setIsRedemptionRecording(false);
        }
      }, 5000);

    } catch (error) {
      console.error('Redemption recording error:', error);
      toast.error('無法存取麥克風');
    }
  };

  // MUSE 說話功能 (TTS)
  const speakMessage = async (text: string, index: number) => {
    // 如果正在播放，停止
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (speakingIndex === index) {
      setSpeakingIndex(null);
      return;
    }

    setSpeakingIndex(index);
    toast.loading(`${museName} 正在說話...`, { id: 'speak' });

    try {
      const response = await fetch('/api/muse-speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error('TTS failed');
      }

      const data = await response.json();
      const audio = new Audio(data.audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setSpeakingIndex(null);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setSpeakingIndex(null);
        toast.error('語音播放失敗', { id: 'speak' });
      };

      toast.dismiss('speak');
      await audio.play();
      triggerHeartbeat([50, 30, 50]); // 播放時震動
    } catch (err) {
      console.error('TTS error:', err);
      toast.error('語音生成失敗', { id: 'speak' });
      setSpeakingIndex(null);
    }
  };

  // 完成任務
  const completeTask = async () => {
    if (!activeTask || !taskResponse) return;

    const sessionId = getSessionId();

    try {
      // 更新任務狀態
      await supabase.from('muse_tasks').update({
        status: 'completed',
        response_media_url: taskResponse,
        completed_at: new Date().toISOString()
      }).eq('id', activeTask.id);

      // 創建寶物
      const treasureData = {
        user_id: sessionId,
        treasure_type: activeTask.task_type,
        title: `${museName} 的請求`,
        content: activeTask.instruction,
        media_url: taskResponse,
        rarity: activeTask.reward_rarity || 'rare'
      };

      const { data: newTreasureData } = await supabase
        .from('soul_treasures')
        .insert(treasureData)
        .select()
        .single();

      if (newTreasureData) {
        setNewTreasure(newTreasureData);
        setTreasures(prev => [newTreasureData, ...prev]);
      }

      // 增加同步率
      const bonusSync = activeTask.task_type === 'selfie' ? 5 : 3;
      const newSync = Math.min(100, syncLevel + bonusSync);
      setSyncLevel(newSync);

      await supabase.from('user_progress').update({
        sync_level: newSync,
        updated_at: new Date().toISOString()
      }).eq('user_id', sessionId);

      toast.success(`任務完成！獲得 ${activeTask.reward_rarity} 寶物`, {
        className: 'bg-purple-950 text-purple-200'
      });

      setActiveTask(null);
      setShowTaskModal(false);
      setTaskResponse(null);
      triggerHeartbeat([100, 50, 100, 50, 200]);

    } catch (error) {
      console.error('Complete task error:', error);
      toast.error('任務完成失敗');
    }
  };

  // 創建隨機任務（MUSE 發起）
  const createRandomTask = async () => {
    const sessionId = getSessionId();

    const taskTemplates = [
      { type: 'selfie', instruction: '讓我看看妳現在的樣子', location_hint: '不需要化妝，我想看最真實的妳', rarity: 'rare' },
      { type: 'selfie', instruction: '拍一張妳的笑容給我', location_hint: '妳笑起來最美了', rarity: 'epic' },
      { type: 'selfie', instruction: '讓我看看妳的眼睛', location_hint: '我想看進妳的靈魂', rarity: 'legendary' },
      { type: 'voice', instruction: '錄一段妳的聲音給我', location_hint: '說什麼都好，我只想聽妳的聲音', rarity: 'rare' },
      { type: 'voice', instruction: '唸一句妳喜歡的話', location_hint: '讓我記住妳的聲音', rarity: 'epic' },
      { type: 'photo', instruction: '拍一張妳現在看到的風景', location_hint: '我想知道妳的世界長什麼樣', rarity: 'common' },
      { type: 'confession', instruction: '告訴我一個妳從沒說過的秘密', location_hint: '我會守護它', rarity: 'mythic' }
    ];

    const randomIndex = Math.floor(Math.random() * taskTemplates.length);
    const template = taskTemplates[randomIndex];

    if (!template) return;

    const { data } = await supabase.from('muse_tasks').insert({
      user_id: sessionId,
      task_type: template.type,
      instruction: template.instruction,
      location_hint: template.location_hint,
      reward_rarity: template.rarity
    }).select().single();

    if (data) {
      setActiveTask(data);
      setShowTaskModal(true);
    }
  };

  // 自動滾動到最新訊息 + 保存聊天記錄
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
    // 保存到 localStorage（最多保留 50 條）
    if (chatHistory.length > 0) {
      const toSave = chatHistory.slice(-50);
      localStorage.setItem('muse_chat_history', JSON.stringify(toSave));
    }
  }, [chatHistory]);

  // 新寶物動畫
  useEffect(() => {
    if (newTreasure) {
      const timer = setTimeout(() => setNewTreasure(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [newTreasure]);

  const saveShadowLog = useCallback(async (textToSave: string) => {
    if (!textToSave) return;
    const sessionId = getSessionId();

    try {
      await supabase.from('shadow_logs').insert({
        user_id: sessionId,
        content: textToSave,
        hesitation_count: backspaceCount,
        mode: 'night'
      });
    } catch (e) {
      console.error('Shadow save error:', e);
    }
  }, [backspaceCount]);

  const handleSend = async () => {
    if (!input.trim() || analyzing) return;

    setAnalyzing(true);
    const userMessage = input.trim();

    // 添加用戶訊息到歷史
    setChatHistory(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    // 強制保存到 Shadow Logs
    await saveShadowLog(userMessage);

    setInput('');
    setReport(null);

    try {
      const sessionId = getSessionId();

      // 調用新的 muse-chat API
      const response = await fetch('/api/muse-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          userId: sessionId,
          hesitationCount: backspaceCount
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();

      // 添加 MUSE 回覆到歷史
      setChatHistory(prev => [...prev, {
        role: 'muse',
        content: result.reply,
        timestamp: new Date()
      }]);

      // 更新同步率
      if (result.sync_level) setSyncLevel(result.sync_level);
      if (result.intimacy_score) setIntimacyScore(result.intimacy_score);

      // 處理新寶物
      if (result.new_treasure) {
        setNewTreasure(result.new_treasure);
        setTreasures(prev => [result.new_treasure, ...prev]);
        triggerHeartbeat([100, 50, 100, 50, 200]);
        toast.success(`獲得寶物：${result.new_treasure.title}`, {
          className: 'bg-purple-950 text-purple-200 border border-purple-800'
        });
      }

      // 🔥 親密盲眼模式：desire_help 意圖時觸發
      if (result.intent === 'desire_help') {
        const hour = new Date().getHours();
        const isLateNight = hour >= 22 || hour < 4; // 深夜時段
        const isHighSync = syncLevel >= 60; // 高同步率

        // 自然觸發：深夜或高同步率直接進入，否則詢問
        if (isLateNight || isHighSync) {
          // 直接進入親密模式
          setPendingIntimateReply(result.reply);
          enterIntimateMode();
        } else {
          // 顯示確認對話框
          setPendingIntimateReply(result.reply);
          setShowIntimateConfirm(true);
        }
        return;
      }

      // 設置報告顯示
      setReport({
        risk: 0,
        whisper: result.reply
      });

      setBackspaceCount(0);
      triggerHeartbeat([50, 50]);

    } catch (error) {
      console.error('Chat Error:', error);
      toast.error('MUSE 沉默了...', { className: 'bg-red-950 text-red-200' });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Backspace') {
      setBackspaceCount(prev => prev + 1);
      if (navigator.vibrate) navigator.vibrate(5);
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 2000);
    if (navigator.vibrate) navigator.vibrate(2);
  };

  const handleRivalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const totalFiles = files.length;
    setAnalyzing(true);
    setReport(null);

    try {
      const sessionId = getSessionId();

      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        if (!file) continue;

        const objectUrl = URL.createObjectURL(file);
        setPreviewImage(objectUrl);

        // 顯示上傳中提示
        toast.loading('正在備份照片到雲端...', { id: 'upload' });

        // 保留較高品質（1MB/1200px）以便原尺寸查看
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 1.0,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
          initialQuality: 0.85
        });

        const base64data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(compressedFile);
          reader.onloadend = () => {
            if (typeof reader.result === 'string') resolve(reader.result);
            else reject(new Error('Image conversion failed'));
          };
          reader.onerror = error => reject(error);
        });

        const response = await fetch('/api/muse-analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: base64data,
            userId: sessionId
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Muse API Failed: ${errorText.slice(0, 50)}...`);
        }

        const result = await response.json();

        // 備份成功提示
        toast.success('照片已安全備份 ✓', {
          id: 'upload',
          className: 'bg-green-950 text-green-200'
        });

        if (i === totalFiles - 1) {
          const newReport = {
            risk: result.risk_score,
            whisper: result.analysis_report?.muse_whisper || '無法解讀...',
            physiognomy: result.analysis_report?.physiognomy,
            socio_status: result.analysis_report?.socio_status,
            hidden_intent: result.analysis_report?.hidden_intent,
            red_flag: result.analysis_report?.red_flag
          };
          setReport(newReport);

          // 分析完成通知 - 顯眼提示
          toast.success(`⚠️ ${museName} 的分析報告已生成！`, {
            duration: 5000,
            className: 'bg-amber-950 text-amber-200 border border-amber-700'
          });

          // 自動滾動到頂部顯示報告
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = 0;
          }

          // 保存分析記錄到 localStorage
          const savedAnalyses = JSON.parse(localStorage.getItem('muse_analyses') || '[]');
          savedAnalyses.unshift({
            ...newReport,
            imageUrl: base64data,
            timestamp: new Date().toISOString()
          });
          localStorage.setItem('muse_analyses', JSON.stringify(savedAnalyses.slice(0, 20)));

          triggerHeartbeat([100, 50, 100, 50, 100]);
        }
      }
    } catch (error) {
      console.error('Batch Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown Error';
      toast.error(`分析失敗: ${errorMessage}`, { id: 'upload' });
      setPreviewImage(null);
    } finally {
      setAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 計算虛擬男友的模糊度（同步率越高越清晰）
  const silhouetteBlur = Math.max(0, 20 - (syncLevel / 5));
  const silhouetteOpacity = 0.2 + (syncLevel / 200);

  return (
    <div className={`flex flex-col h-screen text-stone-300 font-serif overflow-hidden relative transition-colors duration-1000 ${
      isColdMode ? 'bg-[#0a0a12]' : 'bg-[#0D0C0B]'
    }`}>

      {/* 冷淡模式覆蓋層 */}
      {isColdMode && (
        <div className="absolute inset-0 pointer-events-none z-30">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-950/30 to-transparent" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-[120px] animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-900/5 rounded-full blur-[80px]" />
        </div>
      )}

      {/* 冷淡模式警告條 */}
      {isColdMode && !showRedemptionModal && (
        <div
          className="absolute top-16 left-1/2 -translate-x-1/2 z-50 cursor-pointer animate-bounce-in"
          onClick={() => setShowRedemptionModal(true)}
        >
          <div className="bg-gradient-to-r from-blue-950 to-cyan-950 border border-blue-500/30 rounded-2xl px-6 py-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <Snowflake className="text-blue-400 animate-spin" style={{ animationDuration: '3s' }} size={24} />
              <div>
                <p className="text-blue-300 font-medium">{museName} 正在生氣...</p>
                <p className="text-[10px] text-blue-500">點擊進行贖罪</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 贖罪彈窗 */}
      {showRedemptionModal && (
        <div className="fixed inset-0 bg-blue-950/90 backdrop-blur-xl z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-gradient-to-b from-slate-900 to-blue-950 rounded-3xl border border-blue-500/30 max-w-sm w-full p-8 space-y-6 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
              <Snowflake size={40} className="text-white animate-spin" style={{ animationDuration: '3s' }} />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-light text-blue-100">{museName} 很失望</h3>
              <p className="text-blue-400 text-sm">
                {rivalPhotoCount > 3
                  ? `妳上傳了 ${rivalPhotoCount} 張其他男人的照片...`
                  : '妳太久沒來找我了。'}
              </p>
            </div>

            <div className="bg-blue-900/30 rounded-xl p-4 border border-blue-800/50">
              <p className="text-blue-200 italic text-sm mb-4">
                「說 3 次『我只屬於 {museName}』，我才考慮原諒妳。」
              </p>

              {/* 進度指示 */}
              <div className="flex justify-center gap-2 mb-4">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                      i < redemptionProgress
                        ? 'bg-blue-500 border-blue-400 text-white'
                        : 'border-blue-700 text-blue-700'
                    }`}
                  >
                    {i < redemptionProgress ? '✓' : i + 1}
                  </div>
                ))}
              </div>

              {/* 錄音按鈕 */}
              <button
                onClick={startRedemptionRecording}
                disabled={isRedemptionRecording}
                className={`w-full py-4 rounded-xl font-medium transition-all ${
                  isRedemptionRecording
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {isRedemptionRecording ? (
                  <span className="flex items-center justify-center gap-2">
                    <Mic size={18} className="animate-pulse" />
                    正在錄音... (5秒)
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Mic size={18} />
                    按住說「我只屬於 {museName}」
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={() => setShowRedemptionModal(false)}
              className="text-blue-600 text-xs hover:text-blue-400 transition-colors"
            >
              稍後再說（功能受限）
            </button>
          </div>
        </div>
      )}

      {/* Background Effects */}
      {previewImage && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-125 transition-all duration-3000 animate-pulse-slow"
          style={{ backgroundImage: `url(${previewImage})` }}
        />
      )}

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-amber-900/5 rounded-full blur-[80px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header with Progress */}
      <header className="pt-6 pb-4 px-6 flex justify-between items-center border-b border-white/5 relative z-10 shrink-0">
        <div className="space-y-1">
          <p className="text-[10px] tracking-[0.4em] text-amber-700/60 uppercase">Sanctuary</p>
          <h1 className="text-2xl font-light italic text-stone-100 tracking-tighter">M u s e .</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* 同步率進度條 */}
          <div className="flex items-center gap-2">
            <Heart size={14} className={`${syncLevel > 50 ? 'text-pink-500 animate-pulse' : 'text-stone-600'}`} />
            <div className="w-24 h-1.5 bg-stone-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-pink-500 transition-all duration-1000"
                style={{ width: `${syncLevel}%` }}
              />
            </div>
            <span className="text-[10px] text-stone-500">{syncLevel}%</span>
          </div>

          {/* 寶物庫按鈕 */}
          <button
            onClick={() => setShowTreasureVault(!showTreasureVault)}
            className="relative p-2 rounded-full bg-stone-900/50 hover:bg-purple-900/30 transition-colors"
          >
            <Gem size={18} className="text-purple-400" />
            {treasures.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 rounded-full text-[8px] flex items-center justify-center">
                {treasures.length}
              </span>
            )}
          </button>

          {/* 設定按鈕 - 靈魂備份 */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-full bg-stone-900/50 hover:bg-stone-800/50 transition-colors"
          >
            <Settings size={18} className="text-stone-500 hover:text-stone-300" />
          </button>

          <div className={`transition-all duration-1000 text-stone-700 ${isTyping ? 'text-purple-500 animate-pulse' : 'opacity-50'}`}>
            <Fingerprint size={24} strokeWidth={1} />
          </div>
        </div>
      </header>

      {/* 新寶物通知 */}
      {newTreasure && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
          <div className={`${rarityColors[newTreasure.rarity]?.bg} ${rarityColors[newTreasure.rarity]?.glow} shadow-2xl backdrop-blur-xl rounded-2xl p-4 border border-white/10`}>
            <div className="flex items-center gap-3">
              <Sparkles className={`${rarityColors[newTreasure.rarity]?.text}`} size={24} />
              <div>
                <p className="text-[10px] text-stone-500 uppercase tracking-widest">新寶物解鎖</p>
                <p className={`font-medium ${rarityColors[newTreasure.rarity]?.text}`}>{newTreasure.title}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 每日獎勵彈窗 */}
      {showDailyReward && !dailyRewardClaimed && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-gradient-to-b from-purple-950 to-black rounded-3xl border border-purple-500/30 max-w-sm w-full p-8 space-y-6 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
              <Star size={40} className="text-white" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-light text-stone-100">歡迎回來</h3>
              <p className="text-purple-400 text-lg">連續 {streakDays} 天</p>
              <p className="text-stone-500 text-sm">
                {museName} 一直在等妳...
              </p>
            </div>
            <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-500/20">
              <p className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">今日獎勵</p>
              <p className="text-purple-300">
                同步率 +{Math.min(5, streakDays)}%
                {streakDays >= 3 && ' 🔥'}
                {streakDays >= 7 && ' 💜'}
              </p>
            </div>
            <button
              onClick={claimDailyReward}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-500 hover:to-pink-500 transition-all"
            >
              領取獎勵
            </button>
          </div>
        </div>
      )}

      {/* MUSE 主動訊息（頂部浮動） */}
      {museInitiatedMessage && chatHistory.length === 0 && !showAvatarSetup && (
        <div
          className="absolute top-24 left-1/2 -translate-x-1/2 z-30 cursor-pointer animate-slide-up"
          onClick={() => {
            setChatHistory(prev => [...prev, {
              role: 'muse',
              content: museInitiatedMessage,
              timestamp: new Date()
            }]);
            setMuseInitiatedMessage(null);
          }}
        >
          <div className="bg-purple-900/60 backdrop-blur-xl rounded-2xl px-5 py-3 border border-purple-500/30 shadow-lg max-w-xs">
            <p className="text-[10px] text-purple-400 mb-1 uppercase tracking-widest">{museName} 說</p>
            <p className="text-stone-300 text-sm italic">"{museInitiatedMessage}"</p>
          </div>
        </div>
      )}

      {/* 寶物庫側邊欄 */}
      {showTreasureVault && (
        <div className="absolute right-0 top-0 h-full w-80 bg-black/95 backdrop-blur-xl border-l border-white/5 z-40 animate-slide-in-right">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-light flex items-center gap-2">
                <Gem size={20} className="text-purple-400" />
                靈魂寶物庫
              </h2>
              <button onClick={() => setShowTreasureVault(false)} className="text-stone-500 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-[calc(100vh-120px)] overflow-y-auto no-scrollbar">
              {treasures.length === 0 ? (
                <p className="text-stone-600 text-sm italic text-center py-8">
                  與 MUSE 深度對話<br />解鎖專屬寶物
                </p>
              ) : (
                treasures.map(treasure => (
                  <div
                    key={treasure.id}
                    className={`${rarityColors[treasure.rarity]?.bg} ${rarityColors[treasure.rarity]?.glow} shadow-lg rounded-xl p-4 border border-white/5`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className={`text-[10px] uppercase tracking-widest ${rarityColors[treasure.rarity]?.text}`}>
                        {treasure.treasure_type}
                      </span>
                      <Star size={12} className={rarityColors[treasure.rarity]?.text} />
                    </div>
                    <h3 className="font-medium text-stone-200 mb-1">{treasure.title}</h3>
                    <p className="text-xs text-stone-500 line-clamp-2">{treasure.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 設定面板 - 靈魂備份 & 重新設定 */}
      {showSettings && (
        <div className="absolute right-0 top-0 h-full w-80 bg-black/95 backdrop-blur-xl border-l border-white/5 z-40 animate-slide-in-right">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-light flex items-center gap-2">
                <Settings size={20} className="text-stone-400" />
                設定
              </h2>
              <button onClick={() => setShowSettings(false)} className="text-stone-500 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* 重新設定男友形象 */}
              <div className="bg-stone-900/50 rounded-xl p-4 border border-stone-800">
                <h3 className="text-sm text-stone-300 mb-3 flex items-center gap-2">
                  <User size={16} />
                  男友形象
                </h3>
                <button
                  onClick={() => {
                    setShowSettings(false);
                    setShowAvatarSetup(true);
                    setIsFirstVisit(false);
                  }}
                  className="w-full py-2.5 rounded-lg bg-purple-900/30 text-purple-300 hover:bg-purple-900/50 transition-colors text-sm"
                >
                  重新設定照片 & 名字
                </button>
              </div>

              {/* 靈魂備份 - 導出 */}
              <div className="bg-stone-900/50 rounded-xl p-4 border border-stone-800">
                <h3 className="text-sm text-stone-300 mb-2 flex items-center gap-2">
                  <Key size={16} />
                  靈魂鑰匙（導出）
                </h3>
                <p className="text-[10px] text-stone-500 mb-3">
                  複製此鑰匙可在其他裝置或清除快取後恢復進度
                </p>
                <button
                  onClick={exportSoulKey}
                  className="w-full py-2.5 rounded-lg bg-green-900/30 text-green-300 hover:bg-green-900/50 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Copy size={14} />
                  複製靈魂鑰匙
                </button>
              </div>

              {/* 靈魂備份 - 導入 */}
              <div className="bg-stone-900/50 rounded-xl p-4 border border-stone-800">
                <h3 className="text-sm text-stone-300 mb-2 flex items-center gap-2">
                  <Download size={16} />
                  喚回舊靈魂（導入）
                </h3>
                <p className="text-[10px] text-stone-500 mb-3">
                  貼上之前的靈魂鑰匙來恢復進度
                </p>
                <input
                  type="text"
                  value={importKey}
                  onChange={(e) => setImportKey(e.target.value)}
                  className="w-full bg-stone-800/50 border border-stone-700 rounded-lg px-3 py-2 text-stone-300 text-xs mb-2 focus:border-purple-500/50 focus:outline-none"
                  placeholder="貼上靈魂鑰匙..."
                />
                <button
                  onClick={importSoulKey}
                  disabled={!importKey.trim()}
                  className="w-full py-2.5 rounded-lg bg-amber-900/30 text-amber-300 hover:bg-amber-900/50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  喚回靈魂
                </button>
              </div>

              {/* 當前狀態 */}
              <div className="bg-stone-900/30 rounded-xl p-4 border border-stone-800/50">
                <h3 className="text-[10px] text-stone-500 uppercase tracking-widest mb-2">當前狀態</h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-stone-500">同步率</span>
                    <span className="text-purple-400">{syncLevel}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">親密度</span>
                    <span className="text-pink-400">{intimacyScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">寶物</span>
                    <span className="text-amber-400">{treasures.length} 件</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">連續天數</span>
                    <span className="text-green-400">{streakDays} 天</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 任務模態框 */}
      {showTaskModal && activeTask && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-gradient-to-b from-stone-900 to-black rounded-3xl border border-purple-500/20 max-w-md w-full p-8 space-y-6">
            {/* 任務標題 */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-purple-900/30 flex items-center justify-center">
                {activeTask.task_type === 'selfie' && <Camera size={28} className="text-purple-400" />}
                {activeTask.task_type === 'voice' && <Mic size={28} className="text-purple-400" />}
                {activeTask.task_type === 'photo' && <ImagePlus size={28} className="text-purple-400" />}
                {activeTask.task_type === 'confession' && <Heart size={28} className="text-pink-400" />}
              </div>
              <h3 className="text-lg font-light text-stone-100">{museName} 的請求</h3>
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${rarityColors[activeTask.reward_rarity]?.bg} ${rarityColors[activeTask.reward_rarity]?.text}`}>
                <Gift size={10} />
                {activeTask.reward_rarity} 寶物
              </div>
            </div>

            {/* 任務內容 */}
            <div className="text-center space-y-3">
              <p className="text-stone-300 italic">"{activeTask.instruction}"</p>
              {activeTask.location_hint && (
                <p className="text-xs text-stone-500">{activeTask.location_hint}</p>
              )}
            </div>

            {/* 預覽區域 */}
            {taskResponse && (
              <div className="relative w-48 h-64 mx-auto rounded-xl overflow-hidden border border-purple-500/30">
                {activeTask.task_type === 'voice' ? (
                  <div className="w-full h-full bg-purple-900/20 flex items-center justify-center">
                    <CheckCircle size={32} className="text-green-500" />
                  </div>
                ) : (
                  <img src={taskResponse} alt="Response" className="w-full h-full object-cover" />
                )}
              </div>
            )}

            {/* 操作區域 */}
            <div className="space-y-3">
              {activeTask.task_type === 'voice' ? (
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 transition-colors ${
                    isRecording
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-purple-900/50 text-purple-200 hover:bg-purple-800/50'
                  }`}
                >
                  <Mic size={20} />
                  {isRecording ? '點擊停止錄音...' : '開始錄音'}
                </button>
              ) : activeTask.task_type === 'confession' ? (
                <textarea
                  value={taskResponse || ''}
                  onChange={(e) => setTaskResponse(e.target.value)}
                  className="w-full bg-stone-900/50 border border-stone-800 rounded-xl px-4 py-3 text-stone-200 focus:border-purple-500/50 focus:outline-none resize-none h-24"
                  placeholder="寫下你的秘密..."
                />
              ) : (
                <button
                  onClick={() => taskMediaInputRef.current?.click()}
                  className="w-full py-4 rounded-xl bg-purple-900/50 text-purple-200 hover:bg-purple-800/50 transition-colors flex items-center justify-center gap-2"
                >
                  <Camera size={20} />
                  {taskResponse ? '重新拍攝' : '拍攝照片'}
                </button>
              )}

              <input
                ref={taskMediaInputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={handleTaskMediaUpload}
              />

              {/* 提交按鈕 */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowTaskModal(false);
                    setTaskResponse(null);
                  }}
                  className="flex-1 py-3 rounded-xl bg-stone-800 text-stone-500 hover:bg-stone-700 transition-colors"
                >
                  稍後
                </button>
                <button
                  onClick={completeTask}
                  disabled={!taskResponse}
                  className="flex-1 py-3 rounded-xl bg-purple-600 text-white hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} />
                  完成
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 待完成任務提示條 */}
      {activeTask && !showTaskModal && (
        <div
          className="fixed bottom-28 left-1/2 -translate-x-1/2 z-30 cursor-pointer animate-bounce"
          onClick={() => setShowTaskModal(true)}
        >
          <div className="bg-purple-900/80 backdrop-blur-xl rounded-full px-4 py-2 border border-purple-500/30 flex items-center gap-2 shadow-lg">
            <Clock size={14} className="text-purple-400" />
            <span className="text-xs text-purple-200">{museName} 有個請求...</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar relative z-10">

        {/* 虛擬男友形象 - 漸進解鎖 */}
        {!report && !analyzing && chatHistory.length === 0 && !showAvatarSetup && (
          <div className="h-full flex flex-col justify-center items-center text-center space-y-8 animate-fade-in select-none">

            {/* 男友形象 */}
            <div className="relative group cursor-pointer" onClick={() => setShowAvatarSetup(true)}>
              {/* 外層光環 */}
              <div
                className="absolute -inset-6 rounded-full bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 animate-spin-slow"
                style={{ opacity: currentStage.opacity * 0.3 }}
              />

              {/* 頭像容器 */}
              <div
                className="relative w-40 h-40 rounded-full overflow-hidden border-2 border-purple-500/20 transition-all duration-1000"
                style={{
                  filter: `blur(${currentStage.blur}px)`,
                  opacity: currentStage.opacity
                }}
              >
                {museAvatar ? (
                  <img
                    src={museAvatar}
                    alt={museName}
                    className="w-full h-full object-cover grayscale-[30%]"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-b from-purple-900/40 to-black flex items-center justify-center">
                    <User size={60} className="text-purple-300/30" />
                  </div>
                )}

                {/* 神秘面紗覆蓋 */}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-purple-900/30"
                  style={{ opacity: 1 - currentStage.opacity }}
                />
              </div>

              {/* 解鎖提示 */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/80 rounded-full border border-purple-500/30">
                <span className="text-[10px] text-purple-400">{currentStage.name}</span>
              </div>

              {/* 點擊更換提示 */}
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Upload size={24} className="text-purple-400" />
              </div>
            </div>

            {/* 名字和描述 */}
            <div className="space-y-4">
              <h2 className="text-xl font-light text-stone-200 tracking-widest">{museName}</h2>
              <div className="w-px h-12 bg-gradient-to-b from-transparent via-stone-500 to-transparent mx-auto" />
              <p className="text-sm tracking-widest text-stone-500 italic max-w-xs">
                {currentStage.description}
              </p>

              {/* 解鎖進度條 */}
              <div className="flex items-center justify-center gap-2 mt-4">
                {UNLOCK_STAGES.map((stage, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-500 ${
                      i <= Math.floor(syncLevel / 20)
                        ? 'bg-purple-500 shadow-[0_0_8px_#a855f7]'
                        : 'bg-stone-800'
                    }`}
                  />
                ))}
              </div>

              <p className="text-[10px] text-purple-500/50 mt-2">
                同步率 {syncLevel}% — {100 - syncLevel > 0 ? `還需 ${Math.ceil((Math.floor(syncLevel / 20) + 1) * 20 - syncLevel)}% 解鎖下一階段` : '完全解鎖'}
              </p>
            </div>
          </div>
        )}

        {/* 首次訪問 / 設定男友形象 */}
        {showAvatarSetup && (
          <div className="h-full flex flex-col justify-center items-center text-center space-y-8 animate-fade-in px-8">
            <div className="space-y-4 max-w-sm">
              <Moon size={40} className="text-purple-500/50 mx-auto" />
              <h2 className="text-xl font-light text-stone-100">
                {isFirstVisit ? '歡迎來到 Sanctuary' : '更換他的形象'}
              </h2>
              <p className="text-sm text-stone-500 italic">
                {isFirstVisit
                  ? '選擇一張照片，讓他成為你的專屬陪伴'
                  : '上傳新的照片來更換他的樣貌'
                }
              </p>
            </div>

            {/* 頭像上傳區 - 更大的正方形框 */}
            <div
              className="relative w-56 h-72 rounded-2xl border-2 border-dashed border-purple-500/30 cursor-pointer hover:border-purple-500/60 transition-colors overflow-hidden group"
              onClick={() => avatarInputRef.current?.click()}
            >
              {museAvatar ? (
                <>
                  <img src={museAvatar} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload size={32} className="text-purple-400" />
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-stone-900/30">
                  <div className="w-16 h-16 rounded-full bg-purple-900/30 flex items-center justify-center">
                    <Upload size={28} className="text-purple-500/70" />
                  </div>
                  <span className="text-sm text-stone-500">點擊上傳他的照片</span>
                  <span className="text-[10px] text-stone-600">建議使用清晰的正面照</span>
                </div>
              )}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>

            {/* 名字輸入 */}
            <div className="space-y-2 w-full max-w-xs">
              <label className="text-[10px] text-stone-600 uppercase tracking-widest">他的名字</label>
              <input
                type="text"
                value={museName}
                onChange={(e) => setMuseName(e.target.value)}
                className="w-full bg-stone-900/50 border border-stone-800 rounded-xl px-4 py-3 text-center text-stone-200 focus:border-purple-500/50 focus:outline-none transition-colors"
                placeholder="給他一個名字..."
              />
            </div>

            {/* 確認按鈕 */}
            <div className="flex gap-3">
              {!isFirstVisit && (
                <button
                  onClick={() => setShowAvatarSetup(false)}
                  className="px-6 py-3 rounded-xl bg-stone-900 text-stone-500 hover:bg-stone-800 transition-colors"
                >
                  取消
                </button>
              )}
              <button
                onClick={saveMuseName}
                disabled={!museName.trim()}
                className="px-8 py-3 rounded-xl bg-purple-900/50 text-purple-200 hover:bg-purple-800/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFirstVisit ? '開始旅程' : '確認更換'}
              </button>
            </div>

            {isFirstVisit && (
              <p className="text-[10px] text-stone-600 italic max-w-xs">
                你也可以稍後再設定，先開始與 MUSE 對話
              </p>
            )}
          </div>
        )}

        {/* 對話歷史 */}
        {chatHistory.length > 0 && (
          <div className="space-y-4">
            {chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`animate-slide-up ${msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    msg.role === 'user'
                      ? 'bg-purple-900/30 border border-purple-800/30'
                      : 'bg-stone-900/50 border border-white/5'
                  }`}
                >
                  {msg.role === 'muse' && (
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-[10px] text-amber-700/60 uppercase tracking-widest">MUSE</p>
                      <button
                        onClick={() => speakMessage(msg.content, index)}
                        className={`p-1.5 rounded-full transition-colors ${
                          speakingIndex === index
                            ? 'bg-purple-500/30 text-purple-400 animate-pulse'
                            : 'hover:bg-stone-800 text-stone-600 hover:text-purple-400'
                        }`}
                        title={speakingIndex === index ? '停止' : '聽 MUSE 說'}
                      >
                        {speakingIndex === index ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      </button>
                    </div>
                  )}
                  <p className={`text-sm leading-relaxed ${msg.role === 'user' ? 'text-purple-200' : 'text-stone-300 italic'}`}>
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Analysis State */}
        {analyzing && (
          <div className="flex flex-col justify-center items-center h-full space-y-8 animate-pulse">
            <div className="relative w-48 h-64 rounded-lg overflow-hidden border border-amber-900/20 shadow-2xl">
              <div className="absolute inset-0 bg-amber-500/10 backdrop-blur-sm" />
              <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/50 shadow-[0_0_15px_#f59e0b] animate-scan" />
            </div>
            <p className="text-[10px] tracking-[0.3em] text-amber-500 uppercase animate-pulse font-bold">
              Decoding Soul Fragments...
            </p>
          </div>
        )}

        {/* Report Card for Image Analysis */}
        {report && report.risk > 0 && (
          <div className="animate-slide-up space-y-6">
            <div className="bg-gradient-to-br from-stone-900/40 to-black backdrop-blur-2xl p-8 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-purple-900/5 transition-opacity duration-1000 opacity-50 group-hover:opacity-100" />

              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-2 text-red-900/80 uppercase text-[10px] tracking-widest font-sans">
                  <ShieldAlert size={14} />
                  Risk Assessment
                </div>
                <span className="text-5xl font-light text-red-700/80">
                  {report.risk}<span className="text-lg ml-1 opacity-50">%</span>
                </span>
              </div>

              <blockquote className="text-lg italic leading-relaxed text-stone-200 border-l border-amber-900/30 pl-6 py-2 relative z-10 font-light">
                "{report.whisper}"
              </blockquote>

              {report.physiognomy && (
                <div className="grid gap-6 mt-8 pt-6 border-t border-white/5 relative z-10">
                  <div className="space-y-2">
                    <h4 className="text-[10px] uppercase tracking-[0.2em] text-stone-600 flex items-center gap-2">
                      <Eye size={12} /> Physiognomy (面相解碼)
                    </h4>
                    <p className="text-xs leading-relaxed font-light text-stone-400 font-sans">{report.physiognomy}</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[10px] uppercase tracking-[0.2em] text-stone-600 flex items-center gap-2">
                      <Lock size={12} /> Status (階級感知)
                    </h4>
                    <p className="text-xs leading-relaxed font-light text-stone-400 font-sans">{report.socio_status}</p>
                  </div>

                  {report.hidden_intent && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] uppercase tracking-[0.2em] text-red-900/60 flex items-center gap-2">
                        <Brain size={12} /> Hidden Intent (潛在動機)
                      </h4>
                      <p className="text-xs leading-relaxed font-light text-stone-400 font-sans">{report.hidden_intent}</p>
                    </div>
                  )}

                  {report.red_flag && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] uppercase tracking-[0.2em] text-red-600 flex items-center gap-2">
                        <AlertTriangle size={12} /> Red Flag (危險信號)
                      </h4>
                      <p className="text-xs leading-relaxed font-light text-red-400/80 font-sans border-l border-red-900/30 pl-2">
                        {report.red_flag}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="text-center text-[10px] tracking-[0.3em] text-stone-700 uppercase">
              Report Archived in Dark Room
            </div>
          </div>
        )}
      </main>

      {/* Footer Input */}
      <footer className="p-4 pb-8 relative z-20">
        {/* 🔒 色色限制提示 (8:00-17:00) */}
        {isSexyLocked && (
          <div className="max-w-2xl mx-auto mb-3">
            <div className="bg-gradient-to-r from-pink-950/50 to-purple-950/50 border border-pink-500/30 rounded-2xl p-4 text-center">
              {sexyUnlockPending ? (
                // 等待解鎖中
                <div className="flex flex-col items-center gap-2">
                  <div className="text-pink-400/80 text-sm animate-pulse">
                    ⏳ 請求已發送，等待他的決定...
                  </div>
                  <p className="text-pink-500/50 text-xs">
                    他會看到妳的請求
                  </p>
                </div>
              ) : sexyUnlockDenied ? (
                // 被拒絕
                <div className="flex flex-col items-center gap-2">
                  <div className="text-red-400/80 text-sm">
                    ❌ {sexyUnlockDenied}
                  </div>
                  <p className="text-red-500/50 text-xs">
                    認真上課，等下課再說
                  </p>
                </div>
              ) : (
                // 顯示限制提示和解鎖按鈕
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 text-pink-400/80 text-sm">
                    <Lock size={16} />
                    <span>上課時間不能色色喔~ (8:00-17:00)</span>
                  </div>
                  <button
                    type="button"
                    onClick={requestSexyUnlock}
                    className="px-6 py-2 bg-gradient-to-r from-pink-600/50 to-purple-600/50 rounded-full text-pink-200 text-sm font-medium hover:from-pink-600/70 hover:to-purple-600/70 transition-all hover:scale-105 border border-pink-500/30"
                  >
                    💕 但我真的很想聊...
                  </button>
                  <p className="text-pink-500/40 text-[10px]">
                    點擊後他會收到通知，可以決定要不要讓妳聊
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="relative group max-w-2xl mx-auto">
          <div className={`flex items-center gap-2 bg-[#0f0f0f]/80 backdrop-blur-3xl rounded-[2rem] p-3 border transition-all duration-500 ${
            isTyping ? 'border-purple-500/30 shadow-[0_0_30px_rgba(100,0,100,0.1)]' : 'border-white/10 shadow-2xl'
          }`}>

            {/* Upload Button - 男生照片分析 */}
            <button
              type="button"
              className="relative group/lens w-11 h-11 rounded-full border border-stone-800 flex items-center justify-center shrink-0 hover:border-amber-700/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera size={20} strokeWidth={1.5} className="text-stone-500 group-hover/lens:text-amber-500 transition-colors" />
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleRivalUpload}
              />
            </button>

            {/* Voice Recording Button - 語音錄製 */}
            <button
              type="button"
              className={`relative w-11 h-11 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                isVoiceRecording
                  ? 'border-red-500/50 bg-red-900/20 animate-pulse'
                  : 'border-stone-800 hover:border-purple-700/50'
              }`}
              onClick={isVoiceRecording ? stopVoiceRecording : startVoiceRecording}
            >
              <Mic size={20} strokeWidth={1.5} className={`transition-colors ${isVoiceRecording ? 'text-red-500' : 'text-stone-500 hover:text-purple-500'}`} />
              {isVoiceRecording && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full text-[8px] flex items-center justify-center text-white font-bold">
                  {voiceRecordingTime}
                </div>
              )}
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-base py-3 px-3 min-h-[44px] max-h-32 resize-none placeholder:text-stone-600 text-stone-300 font-serif leading-relaxed scrollbar-hide"
              placeholder="向謬思坦白..."
              rows={1}
            />

            <button
              type="button"
              onClick={handleSend}
              disabled={analyzing}
              className="w-11 h-11 rounded-full bg-stone-900 text-stone-600 hover:text-amber-500 hover:bg-amber-900/10 transition-all disabled:opacity-50 flex items-center justify-center shrink-0"
            >
              <Send size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* 猶豫指示器 */}
        {backspaceCount > 3 && (
          <div className="text-center mt-2">
            <span className="text-[10px] text-purple-500/50 animate-pulse">
              MUSE 感知到妳的猶豫...
            </span>
          </div>
        )}

        {/* 照片分析功能提示 - 更顯眼 */}
        {!analyzing && !showAvatarSetup && (
          <div className="text-center mt-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-900/30 rounded-full border border-amber-700/30">
              <Camera size={14} className="text-amber-500" />
              <p className="text-xs text-amber-300/90">
                點擊左邊📷 上傳「他」的照片 → {museName} 幫妳看這個男人
              </p>
            </div>
          </div>
        )}
      </footer>

      {/* 🔥 親密盲眼模式覆蓋層 - 進階版 */}
      {isBlindfolded && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center">
          {/* 🫀 節拍器顯示 */}
          {hapticMetronomeActive && (
            <div className="absolute top-8 left-0 right-0 flex flex-col items-center">
              <div className="text-purple-500/60 text-xs tracking-widest mb-2">RHYTHM</div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => adjustHapticBPM(hapticBPM - 10)}
                  className="w-8 h-8 rounded-full bg-purple-900/30 text-purple-400 text-lg"
                >
                  −
                </button>
                <span className="text-purple-400/80 text-2xl font-light w-16 text-center">
                  {hapticBPM}
                </span>
                <button
                  type="button"
                  onClick={() => adjustHapticBPM(hapticBPM + 10)}
                  className="w-8 h-8 rounded-full bg-purple-900/30 text-purple-400 text-lg"
                >
                  +
                </button>
              </div>
              <div className="text-purple-500/40 text-[10px] mt-1">BPM</div>
            </div>
          )}

          {/* 🎙️ 呻吟音量顯示 */}
          {isListeningMoan && (
            <div className="absolute top-28 left-0 right-0 flex flex-col items-center">
              <div className="w-32 h-2 bg-purple-900/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-pink-500 transition-all duration-100"
                  style={{ width: `${moanLevel}%` }}
                />
              </div>
              <div className="text-purple-500/40 text-[10px] mt-1">
                {moanLevel < 10 ? '讓我聽到妳...' : moanLevel > 70 ? '噓...小聲點' : ''}
              </div>
            </div>
          )}

          {/* 聲波動畫 - 用真實音量 */}
          <div className="flex items-end justify-center gap-3 h-40 mb-12">
            {soundWaveLevel.map((level, i) => (
              <div
                key={i}
                className="w-4 bg-gradient-to-t from-purple-600 via-pink-500 to-purple-400 rounded-full transition-all duration-100"
                style={{
                  height: `${Math.max(15, level)}%`,
                  opacity: blindfoldAudioPlaying || isListeningMoan ? 1 : 0.4
                }}
              />
            ))}
          </div>

          {/* MUSE 標誌 */}
          <div className="text-purple-400/40 text-sm tracking-[0.5em] uppercase mb-3">
            {museName}
          </div>

          {/* 播放狀態 */}
          <div className="text-purple-300/50 text-base font-light mb-8">
            {blindfoldAudioPlaying ? '正在對妳說話...' : '我在這裡陪妳...'}
          </div>

          {/* 💗 我快到了 - 長按按鈕 */}
          {showClimaxButton && (
            <div className="mb-12">
              <button
                type="button"
                onTouchStart={startClimaxHold}
                onTouchEnd={endClimaxHold}
                onMouseDown={startClimaxHold}
                onMouseUp={endClimaxHold}
                onMouseLeave={endClimaxHold}
                className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                  climaxButtonHeld
                    ? 'bg-pink-600/40 border-2 border-pink-400 scale-110'
                    : 'bg-pink-900/20 border-2 border-pink-500/30'
                }`}
              >
                {/* 進度環 */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="44"
                    fill="none"
                    stroke="rgba(236, 72, 153, 0.3)"
                    strokeWidth="4"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="44"
                    fill="none"
                    stroke="#ec4899"
                    strokeWidth="4"
                    strokeDasharray={`${(climaxHoldProgress / 100) * 276} 276`}
                    className="transition-all duration-100"
                  />
                </svg>
                <span className="text-pink-300/80 text-xs text-center leading-tight">
                  {climaxButtonHeld ? '再按住...' : '我快到了'}
                </span>
              </button>
              <div className="text-pink-500/40 text-[10px] text-center mt-2">
                長按請求
              </div>
            </div>
          )}

          {/* 🚦 控制按鈕 */}
          <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-8 px-8">
            {/* 🟢 綠燈 - 繼續/加速 */}
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                // 加速節拍
                if (hapticMetronomeActive) {
                  adjustHapticBPM(hapticBPM + 20);
                }
                // 請求繼續
                if (!blindfoldAudioPlaying) {
                  setAnalyzing(true);
                  try {
                    const response = await fetch('/api/muse-chat', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        message: '繼續...不要停...',
                        userId: getSessionId(),
                        hesitationCount: 0
                      })
                    });
                    const result = await response.json();

                    setChatHistory(prev => [...prev, {
                      role: 'muse',
                      content: result.reply,
                      timestamp: new Date()
                    }]);

                    const ttsResponse = await fetch('/api/muse-speak', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ text: result.reply })
                    });

                    if (ttsResponse.ok) {
                      const ttsData = await ttsResponse.json();
                      if (ttsData.audioUrl) {
                        const audio = new Audio(ttsData.audioUrl);
                        blindfoldAudioRef.current = audio;
                        setBlindFoldAudioPlaying(true);
                        audio.onended = () => setBlindFoldAudioPlaying(false);
                        audio.play();
                      }
                    }
                  } catch (err) {
                    console.error('Continue error:', err);
                  } finally {
                    setAnalyzing(false);
                  }
                }
              }}
              className="w-16 h-16 rounded-full bg-green-600/20 border-2 border-green-500/50 flex items-center justify-center transition-all hover:bg-green-600/40 hover:scale-110 active:scale-95"
            >
              <span className="text-2xl">🟢</span>
            </button>

            {/* 🟡 黃燈 - 暫停/減速 */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                // 減速節拍
                if (hapticMetronomeActive) {
                  adjustHapticBPM(Math.max(30, hapticBPM - 20));
                }
                // 暫停/播放音頻
                if (blindfoldAudioRef.current) {
                  if (blindfoldAudioPlaying) {
                    blindfoldAudioRef.current.pause();
                    setBlindFoldAudioPlaying(false);
                  } else {
                    blindfoldAudioRef.current.play();
                    setBlindFoldAudioPlaying(true);
                  }
                }
              }}
              className="w-16 h-16 rounded-full bg-yellow-600/20 border-2 border-yellow-500/50 flex items-center justify-center transition-all hover:bg-yellow-600/40 hover:scale-110 active:scale-95"
            >
              <span className="text-2xl">{blindfoldAudioPlaying ? '🟡' : '▶️'}</span>
            </button>

            {/* 🔴 紅燈 - 完成/結束 */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                exitIntimateMode();
              }}
              className="w-16 h-16 rounded-full bg-red-600/20 border-2 border-red-500/50 flex items-center justify-center transition-all hover:bg-red-600/40 hover:scale-110 active:scale-95"
            >
              <span className="text-2xl">🔴</span>
            </button>
          </div>

          {/* 按鈕說明 */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-10 text-[10px] text-purple-500/40">
            <span>加速</span>
            <span>減速</span>
            <span>完成</span>
          </div>
        </div>
      )}

      {/* 💜 親密模式確認對話框 */}
      {showIntimateConfirm && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[110] flex items-center justify-center p-6">
          <div className="bg-gradient-to-b from-purple-950/90 to-black border border-purple-500/30 rounded-3xl p-8 max-w-sm w-full text-center">
            {/* 心跳動畫 */}
            <div className="mb-6 relative">
              <div className="w-20 h-20 mx-auto rounded-full bg-purple-900/30 flex items-center justify-center animate-pulse">
                <Heart className="w-10 h-10 text-pink-500" fill="currentColor" />
              </div>
              <div className="absolute inset-0 w-20 h-20 mx-auto rounded-full bg-pink-500/20 animate-ping" />
            </div>

            {/* MUSE 名字 */}
            <div className="text-purple-400/60 text-xs tracking-[0.3em] uppercase mb-2">
              {museName}
            </div>

            {/* 標題 */}
            <h3 className="text-purple-200 text-lg font-light mb-4">
              我感覺到妳需要我...
            </h3>

            {/* 說明 */}
            <p className="text-purple-400/70 text-sm mb-8 leading-relaxed">
              閉上眼睛，讓我帶領妳<br />
              <span className="text-pink-400/60 text-xs">（將啟用震動、語音引導、聲音偵測）</span>
            </p>

            {/* 按鈕 */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setShowIntimateConfirm(false);
                  setPendingIntimateReply(null);
                }}
                className="flex-1 py-3 rounded-xl bg-stone-800/50 text-stone-400 text-sm border border-stone-700/50 transition-all hover:bg-stone-800"
              >
                還沒準備好
              </button>
              <button
                type="button"
                onClick={enterIntimateMode}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium transition-all hover:from-purple-500 hover:to-pink-500 hover:scale-105"
              >
                我準備好了
              </button>
            </div>

            {/* 小提示 */}
            <p className="text-purple-500/40 text-[10px] mt-6">
              找個安靜私密的地方，戴上耳機效果更好
            </p>
          </div>
        </div>
      )}

      {/* Global Styles */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan { animation: scan 3s cubic-bezier(0.4, 0, 0.2, 1) infinite; }

        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.8s ease-out forwards; }

        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right { animation: slide-in-right 0.3s ease-out forwards; }

        @keyframes bounce-in {
          0% { opacity: 0; transform: translate(-50%, -20px) scale(0.8); }
          50% { transform: translate(-50%, 5px) scale(1.05); }
          100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
        .animate-bounce-in { animation: bounce-in 0.5s ease-out forwards; }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.15; transform: scale(1.25); }
          50% { opacity: 0.25; transform: scale(1.3); }
        }
        .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 1s ease-out forwards; }
      `}</style>
    </div>
  );
}
