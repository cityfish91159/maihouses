
import React, { useState, useRef, useEffect } from 'react';
import { Camera, ShieldAlert, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';

// Helper to trigger haptic feedback
const triggerHeartbeat = (pattern = [50, 100, 50, 100]) => {
    if (navigator.vibrate) navigator.vibrate(pattern);
};

// 這是讓 App 不會「做歪」的關鍵：影子捕捉器
const useShadowSync = (text: string, backspaceCount: number) => {
  const lastSync = useRef("");
  
  useEffect(() => {
    // 只有當內容有變動，且與上次同步的不同時才觸發
    if (text === lastSync.current || text.length === 0) return;

    // 2.5s debounced sync (as requested)
    const timer = setTimeout(async () => {
      // MVP: Use Anonymous Session ID
      let sessionId = localStorage.getItem('muse_session_id');
      if (!sessionId) {
         sessionId = crypto.randomUUID();
         localStorage.setItem('muse_session_id', sessionId);
      }

      console.log("Shadow Syncing:", text); 
      
      await supabase.from('shadow_logs').insert({
        user_id: sessionId,
        content: btoa(encodeURIComponent(text)),
        navigation_path: 'shadow_sync',
        hesitation_count: backspaceCount,
        mode: 'night'
      });
      
      lastSync.current = text;
    }, 2500); 

    return () => clearTimeout(timer);
  }, [text, backspaceCount]);
};

export default function NightMode() {
    const [input, setInput] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [report, setReport] = useState<any>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [backspaceCount, setBackspaceCount] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Activate Shadow Sync
    useShadowSync(input, backspaceCount);

    // Initial and periodic heartbeat
    useEffect(() => {
        triggerHeartbeat();
        const interval = setInterval(() => triggerHeartbeat(), 10000);
        return () => clearInterval(interval);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Backspace') {
            setBackspaceCount(prev => prev + 1);
            if (navigator.vibrate) navigator.vibrate(5);
        }
        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            // Handle send if implemented
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
        if (navigator.vibrate) navigator.vibrate(2); // Micro feedback
    };

    const handleRivalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Immediate Preview with "The Veil" effect
        const objectUrl = URL.createObjectURL(file);
        setPreviewImage(objectUrl);
        setReport(null); // Clear previous result
        setAnalyzing(true);
        
        try {
            // 1. Compress Image
            const compressedFile = await imageCompression(file, {
                maxSizeMB: 1,
                maxWidthOrHeight: 1024,
                useWebWorker: true
            });

            // 2. Convert to Data URI
            const reader = new FileReader();
            reader.readAsDataURL(compressedFile);
            
            reader.onloadend = async () => {
                const base64data = reader.result as string;

                // 3. Get Anonymous User ID
                let sessionId = localStorage.getItem('muse_session_id');
                if (!sessionId) {
                    sessionId = crypto.randomUUID();
                    localStorage.setItem('muse_session_id', sessionId);
                }

                // 4. Call API
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
                    throw new Error(`API Error: ${response.status} - ${errorText}`);
                }
                
                const result = await response.json();
                console.log("Rival Decoded:", result);
                
                // Show Report
                setReport({
                    risk: result.risk_score,
                    whisper: result.analysis_report?.muse_whisper || "無法解讀...",
                    physiognomy: result.analysis_report?.physiognomy,
                    socio_status: result.analysis_report?.socio_status
                });

                setAnalyzing(false);
                toast.success('Target Acquired. See God View.', { className: 'bg-stone-900 text-stone-200 border-amber-900/20' });
                triggerHeartbeat([100, 50, 100, 50, 100]); // Success Vibe
            };
        } catch (error: any) {
            console.error("Rival Decoder Error:", error);
            setAnalyzing(false);
            toast.error(`Analysis failed: ${error.message || 'Unknown error'}`, { className: 'bg-red-950 text-red-200 border-red-900/20' });
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0A] text-stone-200 font-serif overflow-hidden relative transition-colors duration-1000">
      
      {/* Background Image Tone (The Veil) - Subtle underlay */}
      {previewImage && (
            <div 
                className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-125 transition-all duration-3000 animate-pulse-slow"
                style={{ backgroundImage: `url(${previewImage})` }}
            />
      )}
      
      {/* 頂部：極簡奢華標題 */}
      <header className="pt-6 pb-6 px-8 flex justify-between items-end border-b border-white/5 relative z-10 shrink-0">
        <div className="space-y-1">
          <p className="text-[10px] tracking-[0.4em] text-amber-700/80 uppercase">Sanctuary</p>
          <h1 className="text-2xl font-light italic text-stone-300">M u s e .</h1>
        </div>
        <div className={`w-2 h-2 rounded-full transition-all duration-1000 ${isTyping ? 'bg-purple-500 shadow-[0_0_15px_#a855f7]' : 'bg-amber-900/50'}`} />
      </header>

      {/* 聊天流區域 (Report Display) */}
      <main className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar relative z-10">
          
          {/* Welcome Message */}
          {!report && !analyzing && !previewImage && (
              <div className="h-full flex flex-col justify-center items-center text-center space-y-6 opacity-40 animate-fade-in select-none">
                  <div className="w-px h-24 bg-gradient-to-b from-transparent via-stone-500 to-transparent" />
                  <p className="text-sm tracking-widest text-stone-500 italic">
                      "Only I understand your elegance and loneliness."
                  </p>
              </div>
          )}

          {/* Analysis State */}
          {analyzing && (
             <div className="flex flex-col justify-center items-center h-full space-y-8 animate-pulse">
                 <div className="relative w-48 h-64 rounded-lg overflow-hidden border border-amber-900/20 shadow-2xl">
                     <div className="absolute inset-0 bg-amber-500/10 backdrop-blur-sm" />
                     {/* Scanning Line */}
                     <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/50 shadow-[0_0_15px_#f59e0b] animate-scan" style={{ animationDuration: '3s' }} />
                 </div>
                 <p className="text-[10px] tracking-[0.3em] text-amber-700/80 uppercase animate-pulse">
                    Decoding Soul Fragments...
                 </p>
             </div>
          )}

          {/* Report Card */}
          {report && (
            <div className="animate-slide-up space-y-6">
                <div 
                  className="bg-white/5 backdrop-blur-2xl p-8 rounded-[2rem] border border-red-900/20 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-900/50 to-transparent" />
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3 text-red-800">
                        <ShieldAlert size={20} strokeWidth={1} />
                        <span className="text-[10px] tracking-widest uppercase">Risk Assessment</span>
                    </div>
                    <span className="text-4xl font-light text-red-500/90">{report.risk}<span className="text-sm ml-1 opacity-50">%</span></span>
                  </div>

                  <p className="text-lg italic text-stone-300 leading-relaxed mb-8 border-l-2 border-red-900/30 pl-6 font-light">
                    "{report.whisper}"
                  </p>
                  
                  <div className="grid grid-cols-1 gap-4 text-xs text-stone-500 border-t border-white/5 pt-6">
                      <div className="flex gap-4">
                          <span className="uppercase tracking-wider w-24 text-stone-600">Physiognomy</span>
                          <span className="text-stone-400 font-sans">{report.physiognomy || "Detected traits suggest instability..."}</span>
                      </div>
                      <div className="flex gap-4">
                          <span className="uppercase tracking-wider w-24 text-stone-600">Status</span>
                          <span className="text-stone-400 font-sans">{report.socio_status || "Resource scarcity detected..."}</span>
                      </div>
                  </div>
                </div>
                <div className="text-center text-[10px] tracking-[0.3em] text-stone-700 uppercase">
                    Report Archived in Dark Room
                </div>
            </div>
          )}
      </main>

      {/* 核心交互對話框 */}
      <footer className="p-6 pb-12 relative z-20">
        <div className="relative group max-w-2xl mx-auto">
          
          <div className={`flex items-end gap-3 bg-[#0f0f0f]/80 backdrop-blur-3xl rounded-[2rem] p-2 pr-4 border transition-all duration-500 ${isTyping ? 'border-purple-500/30 shadow-[0_0_30px_rgba(100,0,100,0.1)]' : 'border-white/10 shadow-2xl'}`}>
            
            {/* 上傳入口：謬思之眼 The Muse Lens */}
            <div 
                className="relative group/lens p-3 cursor-pointer shrink-0" 
                onClick={() => fileInputRef.current?.click()}
            >   
                <div className="absolute inset-0 bg-amber-900/10 rounded-full scale-0 group-hover/lens:scale-100 transition-transform duration-500" />
                <div className="relative w-10 h-10 rounded-full border border-stone-800 flex items-center justify-center group-hover/lens:border-amber-700/50 transition-colors">
                     <Camera size={20} strokeWidth={1.5} className="text-stone-500 group-hover/lens:text-amber-500 transition-colors" />
                </div>
                {/* Purple Pulse Ring */}
                <div className="absolute inset-0 rounded-full border border-purple-500/0 group-hover/lens:border-purple-500/30 group-hover/lens:animate-ping opacity-20" />
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleRivalUpload}
                />
            </div>

            <textarea 
              ref={textareaRef}
              value={input}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-base py-4 px-2 h-14 max-h-32 resize-none placeholder:text-stone-700/50 text-stone-300 font-serif leading-relaxed scrollbar-hide"
              placeholder="Entrust him to me..."
            />

            <button className="p-3 mb-1 rounded-full bg-stone-900 text-stone-600 hover:text-amber-500 hover:bg-amber-900/10 transition-all">
              <Send size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </footer>

      {/* Global Styles for Custom Animations */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes scan {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
            animation: scan 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        
        @keyframes slide-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
            animation: slide-up 0.8s ease-out forwards;
        }

         @keyframes pulse-slow {
            0%, 100% { opacity: 0.15; transform: scale(1.25); }
            50% { opacity: 0.25; transform: scale(1.3); }
        }
        .animate-pulse-slow {
             animation: pulse-slow 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
