"use client";
import { Trash2 } from 'lucide-react'; // Ensure import

// ... inside Shadow Logs map
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteLog(log.id); }}
                            className="absolute top-2 right-2 text-stone-600 hover:text-red-500 transition-colors opacity-50 hover:opacity-100"
                            title="Delete Log"
                        >
                            <Trash2 size={14} />
                        </button>

// ... inside Rival Decoder map
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteRival(r.id); }}
                        className="absolute top-2 right-2 text-stone-600 hover:text-red-500 transition-colors z-20 opacity-50 hover:opacity-100"
                        title="Delete Target"
                    >
                        <Trash2 size={14} />
                    </button>
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface ShadowLog {
  id: string;
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

export default function GodView() {
  const [logs, setLogs] = useState<ShadowLog[]>([]);
  const [rivals, setRivals] = useState<RivalDecoder[]>([]);

  useEffect(() => {
    // Initial fetch
    const fetchInitial = async () => {
        const { data: logData } = await supabase.from('shadow_logs').select('*').order('created_at', { ascending: false }).limit(20);
        if (logData) setLogs(logData);

        const { data: rivalData } = await supabase.from('rival_decoder').select('*').order('created_at', { ascending: false }).limit(20);
        if (rivalData) setRivals(rivalData as any);
    };
    fetchInitial();

    // Realtime subscriptions
    // Initial Fetch
    fetchLogs();
    fetchRivals();

    // Real-time Subscription
    const channel = supabase
      .channel('god_view_shadow')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'shadow_logs' },
        (payload) => {
          const newLog = payload.new as ShadowLog;
          setLogs((prev) => [newLog, ...prev]);
          toast('SIGNAL DETECTED', { 
            description: `ID: ${newLog.id.slice(0,4)}... | LEN: ${newLog.content.length}`,
            className: 'bg-amber-900 border-amber-500 text-amber-100' // Distinct style
          });
        }
      )
      .subscribe((status) => {
          if (status === 'SUBSCRIBED') toast.success("SHADOW_LOGS CONNECTED");
          else if (status === 'CHANNEL_ERROR') toast.error("REALTIME DISCONNECTED - RETRYING...");
      });

    const rivalSub = supabase.channel('rival_updates')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rival_decoder' }, (p: any) => {
            setRivals(prev => [p.new as any, ...prev]);
            // Progress Indicator moved HERE
            toast.success("NEW SIGNAL INTERCEPTED", { 
                description: `Target ID: ${p.new.id.slice(0,8)}`,
                className: 'bg-red-950 text-red-500 border-red-900'
            });
        })
        .subscribe();

    // BACKUP POLLING: Fetch every 5 seconds to ensure eventual consistency
    // This fixes the "hit or miss" (有一句沒一句) issue by catching missed events.
    const interval = setInterval(() => {
        fetchLogs(true); // Silent fetch
        fetchRivals(true);
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(rivalSub); 
      clearInterval(interval);
    };
  }, []);

  const handleDeleteLog = async (id: string) => {
    // Optimistic UI update
    setLogs(prev => prev.filter(l => l.id !== id));
    const { error } = await supabase.from('shadow_logs').delete().eq('id', id);
    if (error) {
        toast.error("Delete Failed: " + error.message);
        // Revert (fetch again or handle state)
    }
  };

  const handleDeleteRival = async (id: string) => {
    // Optimistic UI update
    setRivals(prev => prev.filter(r => r.id !== id));
    const { error } = await supabase.from('rival_decoder').delete().eq('id', id);
    if (error) {
        toast.error("Delete Failed: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-amber-500 font-mono p-12 text-[10px] uppercase overflow-hidden">
      <h1 className="text-xl mb-12 border-b border-amber-900 pb-4 flex justify-between items-end">
        <span>GOD_VIEW: REAL-TIME SOUL MONITORING</span>
        <div className="flex gap-4">
             <button 
                onClick={async () => {
                    toast.loading("DIAGNOSTIC CHECK...", { id: 'diag' });
                    // Attempt to insert a dummy log to checking RLS
                    const { error } = await supabase.from('shadow_logs').insert({
                        user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
                        content: 'DIAGNOSTIC_SIGNAL_CHECK',
                        hesitation_count: 0,
                        mode: 'night' // Use valid mode to pass constraint if not dropped yet
                    });
                    
                    if (error) {
                        toast.error(`DB ERROR: ${error.message} (${error.code})`, { id: 'diag' });
                        if (error.code === '23503') toast.error("FOREIGN KEY ERROR: Run the Clean SQL!", { duration: 5000 });
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
      
      <div className="grid grid-cols-2 gap-12 h-[80vh]">
        
        {/* Shadow Logs Section */}
        <section className="space-y-6 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-amber-900">
          <h2 className="text-white border-b border-white/10 pb-2 sticky top-0 bg-[#050505] z-10 flex justify-between">
            <span>SHADOW_LOGS [HESITATION_TRACKING]</span>
            <span className="text-stone-500">COUNT: {logs.length}</span>
          </h2>
          <div className="space-y-4">
            {logs.map(log => {
                let decoded = '---';
                try {
                    decoded = log.content; // Direct raw content
                } catch (e) { decoded = '[Display Error]'; }
                
                return (
                    <div key={log.id} className="p-4 bg-amber-900/5 border border-amber-900/20 hover:bg-amber-900/10 transition-colors group relative">
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteLog(log.id); }}
                            className="absolute top-2 right-2 text-stone-600 hover:text-red-500 transition-colors opacity-50 hover:opacity-100 p-1"
                            title="Delete Log"
                        >
                            <Trash2 size={14} />
                        </button>
                        <div className="flex justify-between opacity-40 mb-2">
                            <span>ID: {log.id.slice(0,8)}</span>
                            <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                        </div>
                        <div className="flex gap-4 mb-2 text-xs">
                          <span className={`${log.hesitation_count > 5 ? 'text-red-500' : 'text-amber-500'}`}>
                            UD_COUNT: {log.hesitation_count}
                          </span>
                          <span className="text-stone-500">MODE: {log.mode}</span>
                        </div>
                        <p className="text-stone-300 text-sm mt-2 normal-case font-sans border-l-2 border-amber-900/50 pl-3 whitespace-pre-wrap break-words">
                            {decoded}
                        </p>
                    </div>
                );
            })}
            {logs.length === 0 && <div className="text-stone-600 italic">WAITING FOR SIGNALS...</div>}
          </div>
        </section>

        {/* Rival Decoder Section */}
        <section className="space-y-6 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-red-900">
          <h2 className="text-white border-b border-white/10 pb-2 sticky top-0 bg-[#050505] z-10 flex justify-between">
             <span>RIVAL_DECODER [THREAT_ANALYSIS]</span>
             <span className="text-stone-500">COUNT: {rivals.length}</span>
          </h2>
          <div className="space-y-4">
            {rivals.map(r => (
                <div key={r.id} className="group p-4 border border-red-900/20 bg-red-900/5 hover:border-red-500/30 transition-all relative">
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteRival(r.id); }}
                        className="absolute top-2 right-2 text-stone-600 hover:text-red-500 transition-colors z-20 opacity-50 hover:opacity-100 p-1 bg-black/50 rounded-full"
                        title="Delete Target"
                    >
                        <Trash2 size={14} />
                    </button>
                    <div className="flex gap-4">
                        <div className="w-24 h-24 bg-black border border-white/10 overflow-hidden relative shrink-0">
                             {/* Improved Image handling */}
                             <img src={r.image_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                             <div className="absolute bottom-0 right-0 bg-red-600 text-white px-1 text-[9px] font-bold">
                                {r.risk_score}%
                             </div>
                        </div>
                        <div className="flex-1 space-y-2 min-w-0">
                            <div className="flex justify-between opacity-50 text-[9px]">
                                <span>TARGET_ID: {r.id.slice(0,8)}</span>
                                <span>{new Date(r.created_at).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-red-400 font-bold tracking-wider">
                                RISK ASSESSMENT: {r.risk_score > 80 ? 'CRITICAL' : r.risk_score > 50 ? 'MODERATE' : 'LOW'}
                            </p>
                            <p className="text-stone-400 text-xs italic border-l border-red-900/50 pl-2 line-clamp-2">
                                「{r.analysis_report?.muse_whisper}」
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-[9px] text-stone-500 pt-2 border-t border-white/5">
                                <div className="truncate">PHYSIOGNOMY: {r.analysis_report?.physiognomy}</div>
                                <div className="truncate">SOCIO: {r.analysis_report?.socio_status}</div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            {rivals.length === 0 && <div className="text-stone-600 italic">NO TARGETS DETECTED...</div>}
          </div>
        </section>
      </div>
    </div>
  );
}
