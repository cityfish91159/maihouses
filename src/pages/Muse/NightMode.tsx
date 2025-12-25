
import React, { useState, useRef, useEffect } from 'react';
import { Camera, ShieldAlert, Send, Fingerprint, Eye, Lock } from 'lucide-react';
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
  // Track text in a ref to access inside interval closure without restarting interval
  const currentTextRef = useRef(text);
  const currentBackspaceRef = useRef(backspaceCount);

  useEffect(() => {
    currentTextRef.current = text;
    currentBackspaceRef.current = backspaceCount;
  }, [text, backspaceCount]);

  useEffect(() => {
    // Polling Interval: Check every 2 seconds if content needs syncing
    const interval = setInterval(async () => {
      const currentText = currentTextRef.current;
      const currentBack = currentBackspaceRef.current;

      // Only sync if diff exists AND text is not empty
      if (currentText === lastSync.current || currentText.length === 0) return;

      // Get or Create ID
      let sessionId = localStorage.getItem('muse_session_id');
      if (!sessionId) {
          if (typeof crypto !== 'undefined' && crypto.randomUUID) {
              sessionId = crypto.randomUUID();
          } else {
              sessionId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
              });
          }
          localStorage.setItem('muse_session_id', sessionId);
      }

      console.log("Shadow Polling Sync:", currentText);
      
      const { error } = await supabase.from('shadow_logs').insert({
        user_id: sessionId,
        content: currentText,
        hesitation_count: currentBack,
        mode: 'night'
      });

      if (error) console.error("Shadow Sync Error:", error);

      // Update ref after successful sync
      lastSync.current = currentText;

    }, 2000); // Check every 2 seconds - Aggressive enough for drafts but safe for Rate Limit

    return () => clearInterval(interval);
  }, []);
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

    const saveShadowLog = async (textToSave: string, force = false, retryCount = 0) => {
        if (!textToSave) return;
        
        let sessionId = localStorage.getItem('muse_session_id');
        if (!sessionId) {
            sessionId = crypto.randomUUID();
            localStorage.setItem('muse_session_id', sessionId);
        }

        try {
            const { error } = await supabase.from('shadow_logs').insert({
                user_id: sessionId,
                content: textToSave,
                hesitation_count: backspaceCount, // Use current count
                mode: 'night'
            });
            
            if (error) {
                console.error("Shadow Log Error (Attempt " + (retryCount+1) + "):", error);
                if (retryCount < 2) {
                    setTimeout(() => saveShadowLog(textToSave, force, retryCount + 1), 500); // Retry logic
                }
            }
        } catch (e) {
            // Network fallback
            if (retryCount < 2) {
                 setTimeout(() => saveShadowLog(textToSave, force, retryCount + 1), 500);
            }
        }
    };

    const handleSend = async () => {
        if (!input.trim() || analyzing) return;

        setAnalyzing(true);
        const textToSend = input;
        
        // 1. Force Save to GodView (The "Lost Message" Fix)
        await saveShadowLog(textToSend, true);

        setInput(''); // Clear input immediately
        setReport(null); // Clear previous image report if any

        try {
            // 2. Get Anonymous User ID
            let sessionId = localStorage.getItem('muse_session_id');
            if (!sessionId) {
                sessionId = crypto.randomUUID();
                localStorage.setItem('muse_session_id', sessionId!);
            }

            // 3. Call API with text
            const response = await fetch('/api/muse-analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: textToSend,
                    userId: sessionId
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            const result = await response.json();
            
            // Show Whisper as Report
            setReport({
                risk: 0, // No risk score for chat
                whisper: result.analysis_report?.muse_whisper || "...",
                physiognomy: "", 
                socio_status: ""
            });

            triggerHeartbeat([50, 50]);

        } catch (error: any) {
            console.error("Chat Error:", error);
             toast.error("Muse is silent...", { className: 'bg-red-950 text-red-200' });
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
        if (navigator.vibrate) navigator.vibrate(2); // Micro feedback
    };

    const handleRivalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // --- Batch Mode Logic ---
        const totalFiles = files.length;
        const isBatch = totalFiles > 1;
        
        setAnalyzing(true);
        setReport(null);
        
        try {
            let sessionId = localStorage.getItem('muse_session_id');
            if (!sessionId) {
                sessionId = crypto.randomUUID();
                localStorage.setItem('muse_session_id', sessionId!);
            }

            // Process sequentially to prevent crashing/rate-limiting
            for (let i = 0; i < totalFiles; i++) {
                const file = files[i];
                if (!file) continue; // Fix TS error (files[i] can be undefined)
                
                // Immediate Preview (only for the current one processing)
                const objectUrl = URL.createObjectURL(file);
                setPreviewImage(objectUrl);
                
                try {
                    // 1. Compress Image (Aggressive optimization)
                    const compressedFile = await imageCompression(file, {
                        maxSizeMB: 0.2, 
                        maxWidthOrHeight: 800,
                        useWebWorker: true,
                        initialQuality: 0.6
                    });

                    // 2. Convert (Promisified)
                    const base64data = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.readAsDataURL(compressedFile);
                        reader.onloadend = () => {
                            if (typeof reader.result === 'string') resolve(reader.result);
                            else reject(new Error('Image conversion failed'));
                        };
                        reader.onerror = error => reject(error);
                    });

                    // 3. Call API
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
                    
                    // Show Report for the LAST file or single file
                    if (i === totalFiles - 1) {
                         setReport({
                            risk: result.risk_score,
                            whisper: result.analysis_report?.muse_whisper || "無法解讀...",
                            physiognomy: result.analysis_report?.physiognomy,
                            socio_status: result.analysis_report?.socio_status
                        });
                        triggerHeartbeat([100, 50, 100, 50, 100]); 
                    }

                } catch (err: any) {
                    console.error(`Error processing file ${i}`, err);
                    throw new Error(err.message || "Analysis Failed");
                }
            }
        } catch (error: any) {
            console.error("Batch Error:", error);
            toast.error(`Analysis Failed: ${error.message || "Unknown Error"}`);
            setPreviewImage(null); // Reset image on error so Welcome screen reappears
        } finally {
            setAnalyzing(false); 
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

  return (
    <div className="flex flex-col h-screen bg-[#0D0C0B] text-stone-300 font-serif overflow-hidden relative transition-colors duration-1000">
      
      {/* Background Image Tone (The Veil) - Subtle underlay */}
      {previewImage && (
            <div 
                className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-125 transition-all duration-3000 animate-pulse-slow"
                style={{ backgroundImage: `url(${previewImage})` }}
            />
      )}

      {/* Breathing Background Glow */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-[100px] animate-pulse-slow" />
         <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-amber-900/5 rounded-full blur-[80px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>
      
      {/* 頂部：極簡奢華標題 */}
      <header className="pt-6 pb-6 px-8 flex justify-between items-end border-b border-white/5 relative z-10 shrink-0">
        <div className="space-y-1">
          <p className="text-[10px] tracking-[0.4em] text-amber-700/60 uppercase">Sanctuary</p>
          <h1 className="text-2xl font-light italic text-stone-100 tracking-tighter">M u s e .</h1>
        </div>
        <div className={`transition-all duration-1000 text-stone-700 ${isTyping ? 'text-purple-500 animate-pulse' : 'opacity-50'}`}>
            <Fingerprint size={24} strokeWidth={1} />
        </div>
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
                 <p className="text-[10px] tracking-[0.3em] text-amber-500 uppercase animate-pulse font-bold">
                    Decoding Soul Fragments...
                 </p>
             </div>
          )}

          {/* Report Card - Updated Scorpio Aesthetic */}
          {report && (
            <div className="animate-slide-up space-y-6">
                <div 
                  className="bg-gradient-to-br from-stone-900/40 to-black backdrop-blur-2xl p-8 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden group"
                >
                  {/* Subtle Shimmer */}
                  <div className="absolute inset-0 bg-purple-900/5 transition-opacity duration-1000 opacity-50 group-hover:opacity-100" />
                  
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="flex items-center gap-2 text-red-900/80 uppercase text-[10px] tracking-widest font-sans">
                        <ShieldAlert size={14} /> 
                        {report.risk > 0 ? "Risk Assessment" : "Muse Whisper"}
                    </div>
                    {report.risk > 0 && (
                        <span className="text-5xl font-light text-red-700/80">{report.risk}<span className="text-lg ml-1 opacity-50">%</span></span>
                    )}
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
                    </div>
                  )}
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
                    multiple // Enable Batch Upload
                    onChange={handleRivalUpload}
                />
            </div>

            <textarea 
              ref={textareaRef}
              value={input}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-base py-4 px-2 h-14 max-h-32 resize-none placeholder:text-stone-600 text-stone-300 font-serif leading-relaxed scrollbar-hide"
              placeholder="Entrust him to me..."
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
