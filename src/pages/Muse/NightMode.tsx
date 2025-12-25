import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera, ShieldAlert, Send, Fingerprint, Eye, Lock, Brain,
  AlertTriangle, Heart, Sparkles, Gem, Star, Moon, Upload, User, X,
  Mic, ImagePlus, CheckCircle, Clock, Gift
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

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const taskMediaInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Activate Shadow Sync
  useShadowSync(input, backspaceCount);

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
    <div className="flex flex-col h-screen bg-[#0D0C0B] text-stone-300 font-serif overflow-hidden relative transition-colors duration-1000">

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

            {/* 頭像上傳區 */}
            <div
              className="relative w-64 h-64 rounded-full border-2 border-dashed border-purple-500/30 cursor-pointer hover:border-purple-500/60 transition-colors overflow-hidden group"
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
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <Upload size={32} className="text-purple-500/50" />
                  <span className="text-xs text-stone-600">點擊上傳照片</span>
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
                    <p className="text-[10px] text-amber-700/60 mb-2 uppercase tracking-widest">MUSE</p>
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
        <div className="relative group max-w-2xl mx-auto">
          <div className={`flex items-end gap-3 bg-[#0f0f0f]/80 backdrop-blur-3xl rounded-[2rem] p-2 pr-4 border transition-all duration-500 ${
            isTyping ? 'border-purple-500/30 shadow-[0_0_30px_rgba(100,0,100,0.1)]' : 'border-white/10 shadow-2xl'
          }`}>

            {/* Upload Button - 男生照片分析 */}
            <div
              className="relative group/lens p-3 cursor-pointer shrink-0"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="absolute inset-0 bg-amber-900/10 rounded-full scale-0 group-hover/lens:scale-100 transition-transform duration-500" />
              <div className="relative w-10 h-10 rounded-full border border-stone-800 flex items-center justify-center group-hover/lens:border-amber-700/50 transition-colors">
                <Camera size={20} strokeWidth={1.5} className="text-stone-500 group-hover/lens:text-amber-500 transition-colors" />
              </div>
              <div className="absolute inset-0 rounded-full border border-purple-500/0 group-hover/lens:border-purple-500/30 group-hover/lens:animate-ping opacity-20" />
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleRivalUpload}
              />
            </div>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-base py-4 px-2 h-14 max-h-32 resize-none placeholder:text-stone-600 text-stone-300 font-serif leading-relaxed scrollbar-hide"
              placeholder="向謬思坦白..."
            />

            <button
              onClick={handleSend}
              disabled={analyzing}
              className="p-3 mb-1 rounded-full bg-stone-900 text-stone-600 hover:text-amber-500 hover:bg-amber-900/10 transition-all disabled:opacity-50"
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
