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
}

interface RivalDecoder {
  id: string;
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

  // 📨 直接發訊息面板狀態
  const [directMessage, setDirectMessage] = useState('');
  const [directSending, setDirectSending] = useState(false);
  const [detectedUserId, setDetectedUserId] = useState<string | null>(null);
  const [manualUserId, setManualUserId] = useState('');

  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Initial fetch
    const fetchInitial = async () => {
      const { data: logData } = await supabase.from('shadow_logs').select('*').order('created_at', { ascending: false }).limit(50);
      if (logData) setLogs(logData);

      const { data: rivalData } = await supabase.from('rival_decoder').select('*').order('created_at', { ascending: false }).limit(20);
      if (rivalData) setRivals(rivalData as RivalDecoder[]);

      const { data: progressData } = await supabase.from('user_progress').select('*').order('sync_level', { ascending: false });
      if (progressData) setUserProgress(progressData);

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

      {/* 📨 直接發訊息面板 - 隨時可用 */}
      <div className="mb-6 p-4 bg-purple-950/30 border border-purple-500/30 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <MessageCircle className="text-purple-400" size={20} />
            <h3 className="text-purple-400 text-sm uppercase tracking-wider">
              直接推送訊息給資欣
            </h3>
          </div>
          {/* 顯示目標用戶 ID */}
          <div className="text-[10px] text-stone-500">
            {detectedUserId ? (
              <span className="text-green-400">
                目標: {detectedUserId.slice(0, 12)}...
              </span>
            ) : (
              <span className="text-red-400">⚠️ 未檢測到用戶</span>
            )}
          </div>
        </div>

        {/* 手動輸入 Session ID */}
        <div className="mb-3">
          <input
            type="text"
            value={manualUserId}
            onChange={(e) => setManualUserId(e.target.value)}
            className="w-full bg-stone-900/50 border border-stone-800 rounded-lg px-3 py-2 text-stone-300 text-xs font-mono focus:border-purple-500/50 focus:outline-none"
            placeholder="手動輸入 Session ID（可選，留空則使用自動檢測的 ID）"
          />
        </div>

        <div className="flex gap-3">
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
            placeholder="以 MUSE 身份發送訊息給資欣..."
            rows={2}
          />
          <button
            onClick={sendDirectMessage}
            disabled={directSending || !directMessage.trim() || (!detectedUserId && !manualUserId.trim())}
            className="px-6 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={16} />
            推送
          </button>
        </div>
        <p className="text-[9px] text-stone-600 mt-2">
          訊息會即時推送到 NightMode。如果沒收到，請檢查 NightMode 頁面的 console 是否有訂閱成功訊息。
        </p>
      </div>

      {/* 用戶進度概覽 */}
      <div className="mb-8 grid grid-cols-5 gap-4">
        {userProgress.slice(0, 5).map(user => (
          <div
            key={user.user_id}
            className="bg-purple-900/10 border border-purple-500/20 p-4 rounded-lg cursor-pointer hover:border-purple-500/50 transition-colors"
            onClick={() => openTakeover(user.user_id)}
          >
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
            </div>
            <button className="mt-2 w-full py-1 bg-purple-900/30 text-purple-400 rounded text-[9px] hover:bg-purple-900/50 flex items-center justify-center gap-1">
              <MessageCircle size={10} />
              TAKEOVER
            </button>
          </div>
        ))}
      </div>

      {/* 💕 聊色請求面板 - 只在有請求時顯示 */}
      {sexyUnlockRequests.length > 0 && (
        <div className="mb-6 p-4 bg-pink-950/30 border border-pink-500/30 rounded-xl animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="text-pink-400" size={20} fill="currentColor" />
            <h3 className="text-pink-400 text-sm uppercase tracking-wider">
              💕 想聊色色 ({sexyUnlockRequests.length})
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {sexyUnlockRequests.map(req => (
              <div key={req.id} className="bg-pink-900/20 border border-pink-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-pink-300 text-xs">
                    資欣老師
                  </span>
                  <span className="text-pink-500/60 text-[10px]">
                    {req.metadata?.current_hour}:00
                  </span>
                </div>
                <p className="text-stone-400 text-[10px] mb-3">
                  {new Date(req.created_at).toLocaleTimeString()}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => approveSexyUnlock(req)}
                    className="flex-1 py-2 bg-pink-900/30 text-pink-400 rounded-lg text-xs hover:bg-pink-900/50 transition-colors flex items-center justify-center gap-1"
                  >
                    <Check size={14} />
                    允許
                  </button>
                  <button
                    onClick={() => denySexyUnlock(req)}
                    className="flex-1 py-2 bg-red-900/30 text-red-400 rounded-lg text-xs hover:bg-red-900/50 transition-colors flex items-center justify-center gap-1"
                  >
                    <XCircle size={14} />
                    不行
                  </button>
                </div>
              </div>
            ))}
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
            {logs.map(log => (
              <div key={log.id} className="p-3 bg-amber-900/5 border border-amber-900/20 hover:bg-amber-900/10 transition-colors group relative">
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
                </div>
                <p className="text-stone-300 text-xs normal-case font-sans border-l-2 border-amber-900/50 pl-2 line-clamp-3">
                  {log.content}
                </p>
                <button
                  onClick={() => openTakeover(log.user_id)}
                  className="mt-2 text-[8px] text-purple-500 hover:text-purple-400"
                >
                  [TAKEOVER]
                </button>
              </div>
            ))}
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
