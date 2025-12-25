"use client";
import { useEffect, useState } from 'react';
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
    const shadowSub = supabase.channel('shadow_updates')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'shadow_logs' }, (p: any) => {
            setLogs(prev => [p.new as ShadowLog, ...prev]);
        })
        .subscribe();
    
    // import { toast } from 'sonner'; // Removed misplaced import

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

    return () => { 
        supabase.removeChannel(shadowSub); 
        supabase.removeChannel(rivalSub); 
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-amber-500 font-mono p-12 text-[10px] uppercase overflow-hidden">
      <h1 className="text-xl mb-12 border-b border-amber-900 pb-4 flex justify-between items-end">
        <span>GOD_VIEW: REAL-TIME SOUL MONITORING</span>
        <button 
            onClick={async () => {
                toast.loading("DIAGNOSTIC CHECK...", { id: 'diag' });
                // Attempt to insert a dummy log to checking RLS
                const { error } = await supabase.from('shadow_logs').insert({
                    user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
                    content: 'DIAGNOSTIC_SIGNAL_CHECK',
                    hesitation_count: 0,
                    mode: 'GOD_VIEW_TEST'
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
      </h1>
      
      <div className="grid grid-cols-2 gap-12 h-[80vh]">
        
        {/* Shadow Logs Section */}
        <section className="space-y-6 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-amber-900">
          <h2 className="text-white border-b border-white/10 pb-2 sticky top-0 bg-[#050505] z-10">
            SHADOW_LOGS [HESITATION_TRACKING]
          </h2>
          <div className="space-y-4">
            {logs.map(log => {
                let decoded = '---';
                try {
                    decoded = log.content; // Direct raw content
                } catch (e) { decoded = '[Display Error]'; }
                
                return (
                    <div key={log.id} className="p-4 bg-amber-900/5 border border-amber-900/20 hover:bg-amber-900/10 transition-colors">
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
                        <p className="text-stone-300 text-sm mt-2 normal-case font-sans border-l-2 border-amber-900/50 pl-3">
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
          <h2 className="text-white border-b border-white/10 pb-2 sticky top-0 bg-[#050505] z-10">
            RIVAL_DECODER [THREAT_ANALYSIS]
          </h2>
          <div className="space-y-4">
            {rivals.map(r => (
                <div key={r.id} className="group p-4 border border-red-900/20 bg-red-900/5 hover:border-red-500/30 transition-all">
                    <div className="flex gap-4">
                        <div className="w-24 h-24 bg-black border border-white/10 overflow-hidden relative">
                             {/* Improved Image handling */}
                             <img src={r.image_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                             <div className="absolute bottom-0 right-0 bg-red-600 text-white px-1 text-[9px] font-bold">
                                {r.risk_score}%
                             </div>
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="flex justify-between opacity-50">
                                <span>TARGET_ID: {r.id.slice(0,8)}</span>
                                <span>{new Date(r.created_at).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-red-400 font-bold tracking-wider">
                                RISK ASSESSMENT: {r.risk_score > 80 ? 'CRITICAL' : r.risk_score > 50 ? 'MODERATE' : 'LOW'}
                            </p>
                            <p className="text-stone-400 text-xs italic border-l border-red-900/50 pl-2">
                                「{r.analysis_report?.muse_whisper}」
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-[9px] text-stone-500 pt-2 border-t border-white/5">
                                <div>PHYSIOGNOMY: {r.analysis_report?.physiognomy?.slice(0, 20)}...</div>
                                <div>SOCIO: {r.analysis_report?.socio_status?.slice(0, 20)}...</div>
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
