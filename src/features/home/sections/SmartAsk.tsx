import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageCircle } from 'lucide-react';
import { postLLM, setJustChatMode } from '../../../services/ai';
import MascotMaiMai from '../../../components/MascotMaiMai';
import ChatMessage from '../components/ChatMessage';
import { QUICK_TAGS_LIFESTYLE, QUICK_TAGS_EXPLORE, generateReturnGreeting, loadPainPointsFromStorage } from '../../../constants/maimai-persona';

type ChatMsg = { role: 'user' | 'assistant'; content: string; timestamp: string };

export default function SmartAsk() {
    const [messages, setMessages] = useState<ChatMsg[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [returnGreeting, setReturnGreeting] = useState<string | null>(null);
    const chatRef = useRef<HTMLDivElement>(null);

    // 根據對話輪數決定顯示哪組 Quick Tags
    const userRounds = messages.filter(m => m.role === 'user').length;
    const currentTags = userRounds >= 3 ? QUICK_TAGS_EXPLORE : QUICK_TAGS_LIFESTYLE;

    // v5.2：載入痛點記憶 + 回訪問候
    useEffect(() => {
        loadPainPointsFromStorage();
        const greeting = generateReturnGreeting();
        if (greeting) {
            setReturnGreeting(greeting);
        }
    }, []);

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages]);

    const send = async (text = input) => {
        if (!text.trim() || loading) return;

        // ============================================
        // 優化：追蹤「只是來聊聊」模式（會重設熱度）
        // ============================================
        if (text === '只是來聊聊') {
            setJustChatMode(true);
        }

        const userMsg: ChatMsg = { role: 'user', content: text.trim(), timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        const assistantMsg: ChatMsg = { role: 'assistant', content: '', timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, assistantMsg]);

        try {
            const fullResponse = await postLLM(
                [...messages, userMsg],
                (chunk) => {
                    setMessages(prev => {
                        const newMsgs = [...prev];
                        const last = newMsgs[newMsgs.length - 1];
                        if (last && last.role === 'assistant') {
                            last.content += chunk;
                        }
                        return newMsgs;
                    });
                }
            );
            
            // 熱度系統在 ai.ts 中自動追蹤，不需要額外處理
            void fullResponse; // 使用變數避免 lint 警告
        } catch (e) {
            console.error(e);
            setMessages(prev => {
                const newMsgs = [...prev];
                const last = newMsgs[newMsgs.length - 1];
                if (last) {
                    last.content = "抱歉，我這邊好像有點問題，等一下再試試？";
                }
                return newMsgs;
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="group relative bg-gradient-to-br from-white via-[#F8FAFC] to-[#00385a08] rounded-[24px] border border-brand-100 shadow-[0_8px_24px_rgba(0,56,90,0.06)] overflow-hidden hover:shadow-[0_12px_32px_rgba(0,56,90,0.1)] transition-all duration-300 isolate">

            {/* --- Background Elements --- */}
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-brand-100/30 rounded-full blur-3xl pointer-events-none mix-blend-multiply"></div>
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-700/5 rounded-full blur-3xl pointer-events-none mix-blend-multiply"></div>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#00385a08_1px,transparent_1px),linear-gradient(to_bottom,#00385a08_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0"></div>

            {/* Decorative Top Bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 relative z-20"></div>

            <div className="p-5 md:p-8 md:pt-6 relative z-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                        {/* Chat Icon */}
                        <div className="w-12 h-12 rounded-2xl bg-white/80 border border-brand-100 flex items-center justify-center text-brand-700 relative overflow-hidden shrink-0 shadow-sm backdrop-blur-sm group-hover:scale-105 transition-transform duration-300">
                            <MessageCircle size={26} strokeWidth={2} />
                        </div>

                        <div>
                            <h3 className="font-black text-brand-700 text-xl tracking-tight flex items-center gap-2">
                                社區鄰居管家
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-brand-700 to-brand-600 text-white text-[10px] font-bold tracking-wider uppercase shadow-sm">
                                    <Sparkles size={10} /> Beta
                                </span>
                            </h3>
                            <p className="text-xs text-ink-600 font-bold mt-0.5 tracking-wide">
                                聊生活、聊社區、什麼都可以聊 ☕
                            </p>
                        </div>
                    </div>

                    {/* Quick Tags - 動態切換 */}
                    <div className="flex flex-wrap items-center justify-end gap-2">
                        {currentTags.map(tag => (
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

                            {/* MaiMai Mascot */}
                            <MascotMaiMai />

                            <p className="mb-2 font-black text-brand-700 text-base">
                                {returnGreeting ? returnGreeting.split('！')[0] + '！' : '嗨～我是邁邁 👋'}
                            </p>
                            <p className="text-sm leading-relaxed text-ink-600 max-w-xs mx-auto font-medium">
                                {returnGreeting 
                                    ? returnGreeting.includes('！') ? returnGreeting.split('！').slice(1).join('！') : '最近過得怎樣？'
                                    : <>今天過得怎樣？<br />想聊什麼都可以，我在這陪你～</>
                                }
                            </p>
                        </div>
                    ) : (
                        messages.map((m, i) => (
                            <ChatMessage key={i} role={m.role} content={m.content} timestamp={m.timestamp} />
                        ))
                    )}
                    {loading && (
                        <div className="flex justify-start animate-fadeIn">
                            <div className="rounded-2xl rounded-bl-sm px-4 py-3 bg-white border border-brand-100 text-brand-600 text-sm flex items-center gap-2 shadow-sm">
                                <span className="font-bold">邁邁正在想...</span>
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-[bounce_1.4s_infinite_ease-in-out_both]"></span>
                                    <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-[bounce_1.4s_infinite_ease-in-out_both_0.2s]"></span>
                                    <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-[bounce_1.4s_infinite_ease-in-out_both_0.4s]"></span>
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
                        placeholder="說說你今天過得如何，或任何想聊的..."
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


