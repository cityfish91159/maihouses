"use client";
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Trash2, Send, MessageCircle, Eye, Heart, Gem, Brain, X, Download, Archive } from 'lucide-react';

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

    // BACKUP POLLING
    const interval = setInterval(() => {
      fetchLogs();
      fetchRivals();
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(rivalSub);
      clearInterval(interval);
    };
  }, []);

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

  // 管理員發送訊息（偽裝成 MUSE）
  const sendAdminMessage = async () => {
    if (!adminMessage.trim() || !selectedUserId || isSending) return;

    setIsSending(true);
    const messageToSend = adminMessage;
    setAdminMessage('');

    try {
      // 插入到 shadow_logs 作為 MUSE 的回應
      const { error } = await supabase.from('shadow_logs').insert({
        user_id: selectedUserId,
        content: `[MUSE_OVERRIDE] ${messageToSend}`,
        hesitation_count: 0,
        mode: 'admin_takeover'
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

      toast.success("MESSAGE INJECTED", { className: 'bg-purple-900 text-purple-200' });

    } catch (error) {
      console.error('Send error:', error);
      toast.error("INJECTION FAILED");
      setAdminMessage(messageToSend);
    } finally {
      setIsSending(false);
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
                  <div className="w-16 h-16 bg-black border border-white/10 overflow-hidden relative shrink-0">
                    <img src={r.image_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="" />
                    <div className="absolute bottom-0 right-0 bg-red-600 text-white px-1 text-[8px] font-bold">
                      {r.risk_score}%
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
              <div className="p-4 border-t border-purple-500/20">
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
                    INJECT
                  </button>
                </div>
                <p className="text-[9px] text-stone-600 mt-2 text-center">
                  訊息將以 MUSE 身份發送給用戶
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
