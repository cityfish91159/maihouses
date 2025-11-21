import React, { useState, useRef, useEffect } from 'react';
import { useSmartAsk } from '../hooks/useSmartAsk';
import { ChatBubble } from '../components/ChatBubble';
import { SuggestionChips } from '../components/SuggestionChips';
import { EmptyState } from '../components/EmptyState';
import { RecommendationCard } from '../components/RecommendationCard';
import { HomeCard } from '../components/HomeCard';

export default function SmartAsk() {
  const { messages, reco, loading, totalTokens, sendMessage } = useSmartAsk();
  const [input, setInput] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionSelect = (text: string) => {
    setInput(text);
  };

  return (
    <HomeCard variant="ai">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="size-2.5 rounded-full bg-brand shadow-[0_0_8px_rgba(74,144,226,0.6)]" />
          <h3 className="truncate font-black text-slate-800 text-[clamp(18px,2.2vw,21px)]">
            社區鄰居管家
          </h3>
        </div>
        <div className="w-14" aria-hidden="true" />
        
        <SuggestionChips onSelect={handleSuggestionSelect} />
        
        <div className="ml-auto min-w-[150px] text-right text-xs font-medium text-text-secondary">
          {import.meta.env.DEV && totalTokens > 0 ? `${totalTokens} tokens` : '多輪對話・智能推薦'}
        </div>
      </div>

      <div
        ref={chatRef}
        role="log"
        aria-live="polite"
        className="mh-ai-chat"
      >
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          messages.map((m, i) => (
            <ChatBubble key={i} message={m} />
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-xl px-4 py-2.5 text-sm bg-slate-50 border border-border-light text-slate-500">
              <div className="flex items-center gap-2">
                <span>正在思考</span>
                <div className="flex gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce"></span>
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce delay-100"></span>
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce delay-200"></span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          id="smart-ask-input"
          name="smart-ask-query"
          type="text"
          className="mh-ai-input"
          placeholder="輸入需求（例:西屯區 2房 預算1500萬）"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          aria-label="輸入詢問"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="rounded-full px-5 py-2 font-medium text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 bg-brand text-sm"
        >
          送出
        </button>
      </div>

      {!!reco.length && (
        <div className="mt-4 border-t border-border-light pt-4">
          <div className="mb-3">
            <div className="text-[calc(var(--fs-base)+6px)] font-semibold md:text-[calc(var(--fs-base)+12px)] md:font-bold text-slate-500">
              🏠 智能房源推薦
            </div>
            <div className="mt-1 text-xs text-slate-400">
              依瀏覽行為與社區口碑輔助排序
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {reco.map((p) => (
              <RecommendationCard key={p.id} property={p} />
            ))}
          </div>
        </div>
      )}
    </HomeCard>
  );
}

