import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageCircle, Heart } from 'lucide-react';
import { postLLM, setJustChatMode } from '../../../services/ai';
import MascotInteractive from '../../../components/MascotInteractive';
import ChatMessage from '../components/ChatMessage';
import { safeLocalStorage } from '../../../lib/safeStorage';
import { logger } from '../../../lib/logger';
import {
    QUICK_TAGS_LIFESTYLE,
    QUICK_TAGS_EXPLORE,
    generateReturnGreeting,
    loadPainPointsFromStorage,
    getIntimacyLevel,
    saveIntimacyToStorage
} from '../../../constants/maimai-persona';

type ChatMsg = { role: 'user' | 'assistant'; content: string; timestamp: string };

export default function SmartAsk() {
    const [messages, setMessages] = useState<ChatMsg[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [returnGreeting, setReturnGreeting] = useState<string | null>(null);
    const [intimacy, setIntimacy] = useState(getIntimacyLevel());
    const [status, setStatus] = useState<'idle' | 'thinking' | 'success' | 'error'>('idle');
    const chatRef = useRef<HTMLDivElement>(null);

    // 根據對話輪數決定顯示哪組 Quick Tags
    const userRounds = messages.filter(m => m.role === 'user').length;
    const currentTags = userRounds >= 3 ? QUICK_TAGS_EXPLORE : QUICK_TAGS_LIFESTYLE;

    // ============================================
    // v6.0 刀1：每日主動關心 + 回訪問候
    // ============================================
    useEffect(() => {
        loadPainPointsFromStorage();

        const lastChat = safeLocalStorage.getItem('mai-last-chat');
        const today = new Date().toDateString();

        // 今天還沒聊過 → 主動打招呼
        if (!lastChat || lastChat !== today) {
            const greeting = generateReturnGreeting();
            if (greeting) {
                setReturnGreeting(greeting);
            }

            // 延遲顯示主動關心訊息
            const timer = setTimeout(() => {
                const welcomeMsg = greeting || '嗨～今天過得怎麼樣呀？有沒有什麼想跟我分享的？☀️';
                setMessages([{
                    role: 'assistant',
                    content: welcomeMsg,
                    timestamp: new Date().toISOString()
                }]);
                safeLocalStorage.setItem('mai-last-chat', today);
            }, 1500);

            return () => clearTimeout(timer);
        }
    }, []);

    // ============================================
    // v6.0 刀6：晚安物語（22:00-22:30）
    // ============================================
    useEffect(() => {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();

        // 晚上 10:00 - 10:30 之間
        if (hour === 22 && minute < 30) {
            const todayGoodnight = safeLocalStorage.getItem('mai-goodnight-' + now.toDateString());
            if (!todayGoodnight && messages.length > 0) {
                const timer = setTimeout(() => {
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: '晚安啦～今天也辛苦了，要好好休息喔 💤\n對了...夢裡如果看到喜歡的房子，記得明天告訴我，我幫你找找看有沒有類似的～',
                        timestamp: new Date().toISOString()
                    }]);
                    safeLocalStorage.setItem('mai-goodnight-' + now.toDateString(), '1');
                }, 5000);

                return () => clearTimeout(timer);
            }
        }
    }, [messages.length]);

    // ============================================
    // v6.0 刀2：更新親密度顯示
    // ============================================
    useEffect(() => {
        setIntimacy(getIntimacyLevel());
    }, [messages.length]);

    // 離開頁面時保存親密度
    useEffect(() => {
        const handleBeforeUnload = () => {
            saveIntimacyToStorage();
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
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
        setStatus('thinking');

        const assistantMsg: ChatMsg = { role: 'assistant', content: '', timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, assistantMsg]);

        try {
            const fullResponse = await postLLM(
                [...messages, userMsg],
                (chunk) => {
                    setMessages(prev => {
                        const newMsgs = [...prev];
                        const last = newMsgs.at(-1);
                        if (last && last.role === 'assistant') {
                            last.content += chunk;
                        }
                        return newMsgs;
                    });
                }
            );

            // 熱度系統在 ai.ts 中自動追蹤，不需要額外處理
            void fullResponse; // 使用變數避免 lint 警告
            setStatus('success');
        } catch (e) {
            logger.error('[SmartAsk] Chat error', { error: e });
            setMessages(prev => {
                const newMsgs = [...prev];
                const last = newMsgs.at(-1);
                if (last) {
                    last.content = "抱歉，我這邊好像有點問題，等一下再試試？";
                }
                return newMsgs;
            });
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    // 成功/錯誤狀態維持短暫提示後回到 idle
    useEffect(() => {
        if (status === 'success') {
            const timer = setTimeout(() => setStatus('idle'), 2000);
            return () => clearTimeout(timer);
        }
        if (status === 'error') {
            const timer = setTimeout(() => setStatus('idle'), 2500);
            return () => clearTimeout(timer);
        }
    }, [status]);

    return (
        <section className="to-brand-700/[0.03] group relative isolate overflow-hidden rounded-[24px] border border-brand-100 bg-gradient-to-br from-white via-[#F8FAFC] shadow-brand-lg transition-all duration-300 hover:shadow-brand-xl">

            {/* --- Background Elements --- */}
            <div className="bg-brand-100/30 pointer-events-none absolute -right-24 -top-24 size-80 rounded-full mix-blend-multiply blur-3xl"></div>
            <div className="bg-brand-700/5 pointer-events-none absolute -bottom-24 -left-24 size-96 rounded-full mix-blend-multiply blur-3xl"></div>
            <div 
              className="pointer-events-none absolute inset-0 z-0 [background-size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"
              style={{
                backgroundImage: `linear-gradient(to right, rgba(var(--brand-primary-rgb), 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(var(--brand-primary-rgb), 0.03) 1px, transparent 1px)`
              }}
            ></div>

            {/* Decorative Top Bar */}
            <div className="relative z-20 h-1.5 w-full bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500"></div>

            <div className="relative z-10 p-5 md:p-8 md:pt-6">
                {/* Header Section */}
                <div className="mb-3 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div className="flex items-center gap-3">
                        {/* Chat Icon */}
                        <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-brand-100 bg-white/80 text-brand-700 shadow-sm backdrop-blur-sm transition-transform duration-300 group-hover:scale-105">
                            <MessageCircle size={26} strokeWidth={2} />
                        </div>

                        <div>
                            <h3 className="flex items-center gap-2 text-xl font-black tracking-tight text-brand-700">
                                MaiMai 小閨蜜
                                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brand-700 to-brand-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                                    <Sparkles size={10} /> v6.0
                                </span>
                            </h3>
                            <div className="mt-0.5 flex items-center gap-2">
                                <p className="text-xs font-bold tracking-wide text-ink-600">
                                    聊生活、聊房子、什麼都可以聊 ☕
                                </p>
                                {/* 親密度顯示 */}
                                <span className="inline-flex items-center gap-1 rounded-full border border-pink-200 bg-pink-50 px-2 py-0.5 text-[10px] font-bold text-pink-600">
                                    <Heart size={10} fill="currentColor" /> {intimacy.label} {intimacy.emoji}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Tags - 動態切換 */}
                    <div className="flex flex-wrap items-center justify-end gap-2">
                        {currentTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => send(tag)}
                                className="rounded-full border border-brand-100 bg-white px-3.5 py-1.5 text-xs font-bold text-brand-700 shadow-sm backdrop-blur-sm transition-all hover:border-brand-700 hover:bg-brand-700 hover:text-white hover:shadow-md active:scale-95"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chat Display Area */}
                <div
                    ref={chatRef}
                    className="border-brand-100/60 mb-4 flex h-[380px] flex-col gap-4 overflow-y-auto scroll-smooth rounded-2xl border bg-white/50 p-5 shadow-inner backdrop-blur-md"
                    role="log"
                    aria-live="polite"
                >
                    <div className="flex shrink-0 justify-center pt-16">
                        <MascotInteractive
                            size="lg"
                            messages={messages.map(m => m.content)}
                            isLoading={loading || !!input.trim()}
                            isSuccess={status === 'success'}
                            hasError={status === 'error'}
                        />
                    </div>

                    {messages.length === 0 ? (
                        <div className="flex flex-1 flex-col items-center justify-center p-4 text-center opacity-80">
                            <p className="mb-2 text-base font-black text-brand-700">
                                {returnGreeting ? returnGreeting.split('！')[0] + '！' : '嗨～我是邁邁 👋'}
                            </p>
                            <p className="mx-auto max-w-xs text-sm font-medium leading-relaxed text-ink-600">
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
                        <div className="flex animate-fadeIn justify-start">
                            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-brand-100 bg-white px-4 py-3 text-sm text-brand-600 shadow-sm">
                                <span className="font-bold">邁邁正在想...</span>
                                <div className="flex gap-1">
                                    <span className="size-1.5 animate-[bounce_1.4s_infinite_ease-in-out_both] rounded-full bg-brand-500"></span>
                                    <span className="size-1.5 animate-[bounce_1.4s_infinite_ease-in-out_both_0.2s] rounded-full bg-brand-500"></span>
                                    <span className="size-1.5 animate-[bounce_1.4s_infinite_ease-in-out_both_0.4s] rounded-full bg-brand-500"></span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="group/input relative">
                    <input
                        type="text"
                        className="focus:ring-brand-50/50 w-full rounded-xl border-2 border-brand-100 bg-white/80 py-4 pl-5 pr-14 text-[15px] font-bold text-ink-900 shadow-sm backdrop-blur-sm transition-all placeholder:text-ink-400/80 hover:border-brand-300 focus:border-brand-500 focus:outline-none focus:ring-4"
                        placeholder="說說你今天過得如何，或任何想聊的..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                        disabled={loading}
                    />
                    <button
                        onClick={() => send()}
                        disabled={loading || !input.trim()}
                        className="absolute inset-y-2 right-2 flex aspect-square items-center justify-center rounded-lg bg-brand-700 text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-lg active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:transform-none"
                    >
                        <Send size={20} strokeWidth={2.5} className="-ml-0.5 translate-y-px" />
                    </button>
                </div>
            </div>
        </section>
    );
}


