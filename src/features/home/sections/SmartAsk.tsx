import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot } from 'lucide-react';

// --- Real API Service ---
const generateTextStream = async (messages: any[], onChunk: (chunk: string) => void) => {
    try {
        const response = await fetch('/api/openai-proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                messages: messages.map(m => ({ role: m.role, content: m.content })),
                stream: true,
                model: 'gpt-3.5-turbo'
            })
        });

        if (!response.ok) throw new Error('API Error');
        if (!response.body) throw new Error('No response body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith('data:')) continue;
                
                const data = trimmed.slice(5).trim();
                if (data === '[DONE]') return;
                
                try {
                    const json = JSON.parse(data);
                    const content = json.choices?.[0]?.delta?.content || '';
                    if (content) onChunk(content);
                } catch (e) { }
            }
        }
    } catch (e) {
        console.error(e);
        onChunk("\n(連線錯誤，請檢查網路或 API 設定)");
        throw e;
    }
};

// --- SmartAsk Component ---
const QUICK_TAGS = ['3房以內', '30坪以下', '近捷運', '新成屋'];

export default function SmartAsk() {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const chatRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages]);

    const send = async (text = input) => {
        if (!text.trim() || loading) return;

        const userMsg = { role: 'user', content: text.trim(), timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        // Placeholder for streaming response
        setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date().toISOString() }]);

        try {
            await generateTextStream([...messages, userMsg], (chunk) => {
                setMessages(prev => {
                const newMsgs = [...prev];
                const last = newMsgs[newMsgs.length - 1];
                if (last.role === 'assistant') {
                    last.content += chunk;
                }
                return newMsgs;
                });
            });
        } catch (e) {
            setMessages(prev => {
                const newMsgs = [...prev];
                const last = newMsgs[newMsgs.length - 1];
                last.content = "抱歉，AI 服務目前暫時不可用，請稍後再試。";
                return newMsgs;
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="group relative bg-gradient-to-br from-white via-[#F8FAFC] to-[#F0F6FF] rounded-[24px] border border-brand-100 shadow-[0_8px_24px_rgba(0,56,90,0.06)] overflow-hidden hover:shadow-[0_12px_32px_rgba(0,56,90,0.1)] transition-all duration-300 isolate">
        
        {/* --- Background Elements --- */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-brand-100/30 rounded-full blur-3xl pointer-events-none mix-blend-multiply"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#E0F2FE]/50 rounded-full blur-3xl pointer-events-none mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00385a08_1px,transparent_1px),linear-gradient(to_bottom,#00385a08_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0"></div>

        {/* Decorative Top Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 relative z-20"></div>

        <div className="p-5 md:p-8 md:pt-6 relative z-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
                {/* Robot Icon (Header) */}
                <div className="w-12 h-12 rounded-2xl bg-white/80 border border-brand-100 flex items-center justify-center text-brand-700 relative overflow-hidden shrink-0 shadow-sm backdrop-blur-sm group-hover:scale-105 transition-transform duration-300">
                    <Bot size={28} strokeWidth={2} />
                </div>
                
                <div>
                <h3 className="font-black text-brand-700 text-xl tracking-tight flex items-center gap-2">
                    社區鄰居管家
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-brand-700 to-brand-600 text-white text-[10px] font-bold tracking-wider uppercase shadow-sm">
                    <Sparkles size={10} /> AI Beta
                    </span>
                </h3>
                <p className="text-xs text-ink-600 font-bold mt-0.5 tracking-wide">
                    全天候待命 · 分析房價 · 區域諮詢
                </p>
                </div>
            </div>

            {/* Quick Tags */}
            <div className="flex flex-wrap items-center justify-end gap-2">
                {QUICK_TAGS.map(tag => (
                <button 
                    key={tag}
                    onClick={() => send(tag)}
                    className="px-3.5 py-1.5 rounded-full bg-white border border-brand-100 text-brand-700 text-xs font-bold hover:bg-brand-700 hover:text-white hover:border-brand-700 transition-all active:scale-95 shadow-sm hover:shadow-md backdrop-blur-sm"
                >
                    {tag}
                </button>
                ))}
            </div>
            </div>

            {/* Chat Display Area */}
            <div
            ref={chatRef}
            className="h-[380px] overflow-y-auto rounded-2xl bg-white/50 border border-brand-100/60 p-5 shadow-inner mb-4 flex flex-col gap-4 scroll-smooth backdrop-blur-md"
            role="log" 
            aria-live="polite"
            >
            {messages.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center text-center p-4 opacity-80">
                    
                    {/* MaiMai Mascot (Center Empty State) */}
                    <div className="w-36 h-36 mb-6 text-brand-200 -mt-8 relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-brand-100/50 rounded-full blur-2xl -z-10"></div>
                        <svg viewBox="0 0 200 240" className="w-full h-full drop-shadow-sm animate-float">
                        {/* M-Antenna */}
                        <path d="M 85 40 L 85 15 L 100 30 L 115 15 L 115 40" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        
                        {/* House Body & Roof */}
                        <path d="M 40 80 L 100 40 L 160 80" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        <rect x="55" y="80" width="90" height="100" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        
                        {/* Eyebrows */}
                        <path d="M 78 110 Q 85 105 92 110" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                        <path d="M 108 110 Q 115 105 122 110" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                        
                        {/* Eyes - Hollow */}
                        <circle cx="85" cy="125" r="4" stroke="currentColor" strokeWidth="3" fill="none" />
                        <circle cx="115" cy="125" r="4" stroke="currentColor" strokeWidth="3" fill="none" />
                        
                        {/* Hands */}
                        <path d="M 55 130 L 25 110" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" />
                        <path d="M 145 130 L 175 110" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" />

                        {/* Legs */}
                        <path d="M 85 180 L 85 215 L 75 215" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M 115 180 L 115 215 L 125 215" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>

                    <p className="mb-2 font-black text-brand-700 text-base">
                    歡迎來到邁房子！我是邁邁 🤖
                    </p>
                    <p className="text-sm leading-relaxed text-ink-600 max-w-xs mx-auto font-medium">
                    買房不只看物件，更要看生活。<br/>
                    告訴我您的預算或想住的區域，讓我幫您分析！
                    </p>
                </div>
            ) : (
                messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                    <div
                    className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-[15px] font-medium leading-relaxed shadow-sm ${
                        m.role === 'user'
                        ? 'bg-brand-700 text-white rounded-br-sm'
                        : 'bg-white text-ink-900 border border-brand-100 rounded-bl-sm'
                    }`}
                    >
                    <div className="whitespace-pre-wrap">{m.content}</div>
                    {m.timestamp && (
                        <div className={`mt-1.5 text-[11px] font-bold ${m.role === 'user' ? 'text-brand-300' : 'text-brand-600/60'} text-right`}>
                            {new Date(m.timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    )}
                    </div>
                </div>
                ))
            )}
            {loading && (
                <div className="flex justify-start animate-fadeIn">
                    <div className="rounded-2xl rounded-bl-sm px-4 py-3 bg-white border border-brand-100 text-brand-600 text-sm flex items-center gap-2 shadow-sm">
                        <span className="font-bold">邁邁正在思考</span>
                        <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-[bounce_1.4s_infinite_in-out_both]"></span>
                            <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-[bounce_1.4s_infinite_in-out_both_0.2s]"></span>
                            <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-[bounce_1.4s_infinite_in-out_both_0.4s]"></span>
                        </div>
                    </div>
                </div>
            )}
            </div>

            {/* Input Area */}
            <div className="relative group/input">
            <input
                type="text"
                className="w-full pl-5 pr-14 py-4 rounded-xl border-2 border-brand-100 bg-white/80 text-ink-900 font-bold text-[15px] placeholder:text-ink-400/80 transition-all focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50/50 hover:border-brand-300 shadow-sm backdrop-blur-sm"
                placeholder="輸入需求，例如：新北板橋 2000萬內 3房..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                disabled={loading}
            />
            <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="absolute right-2 top-2 bottom-2 aspect-square rounded-lg bg-brand-700 text-white flex items-center justify-center shadow-md transition-all hover:bg-brand-600 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:transform-none disabled:shadow-none"
            >
                <Send size={20} strokeWidth={2.5} className="-ml-0.5 translate-y-[1px]" />
            </button>
            </div>
        </div>
        </section>
    );
}

