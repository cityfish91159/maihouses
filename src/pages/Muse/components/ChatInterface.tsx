/**
 * 💬 ChatInterface Component
 * 純聊天介面組件 - 訊息列表、輸入框、發送按鈕
 */

import { Send, Volume2, VolumeX } from 'lucide-react';
import type { ChatMessage, Report } from '../types';

export interface ChatInterfaceProps {
  // State 相關
  chatHistory: ChatMessage[];
  input: string;
  analyzing: boolean;
  isTyping: boolean;
  backspaceCount: number;
  speakingIndex: number | null;
  report: Report | null;

  // 配置相關
  museName: string;
  naughtyMode: boolean;

  // 回調函數
  onInputChange: (value: string) => void;
  onSendMessage: () => Promise<void>;
  onSpeakMessage: (content: string, index: number) => Promise<void>;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;

  // Refs
  chatContainerRef: React.RefObject<HTMLDivElement>;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

/**
 * 純聊天介面組件
 * 所有邏輯由父組件管理，這個組件只負責渲染
 */
export function ChatInterface(props: ChatInterfaceProps) {
  const {
    chatHistory,
    input,
    analyzing,
    isTyping,
    backspaceCount,
    speakingIndex,
    report,
    museName,
    onInputChange,
    onSendMessage,
    onSpeakMessage,
    onKeyDown,
    chatContainerRef,
    textareaRef
  } = props;

  return (
    <div className="relative flex flex-col h-full">
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 聊天訊息列表 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <main
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-6 scrollbar-hide"
      >
        {chatHistory.length > 0 && (
          <div className="space-y-4">
            {chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`animate-slide-up ${
                  msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    msg.role === 'user'
                      ? 'bg-purple-900/30 border border-purple-800/30'
                      : 'bg-stone-900/50 border border-white/5'
                  }`}
                >
                  {/* MUSE 訊息頭部（名稱 + 語音按鈕） */}
                  {msg.role === 'muse' && (
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-[10px] text-amber-700/60 uppercase tracking-widest">
                        {museName || 'MUSE'}
                      </p>
                      <button
                        onClick={() => onSpeakMessage(msg.content, index)}
                        className={`p-1.5 rounded-full transition-colors ${
                          speakingIndex === index
                            ? 'bg-purple-500/30 text-purple-400 animate-pulse'
                            : 'hover:bg-stone-800 text-stone-600 hover:text-purple-400'
                        }`}
                        title={speakingIndex === index ? '停止' : '聽 MUSE 說'}
                      >
                        {speakingIndex === index ? (
                          <VolumeX size={14} />
                        ) : (
                          <Volume2 size={14} />
                        )}
                      </button>
                    </div>
                  )}

                  {/* 訊息內容 */}
                  <p
                    className={`text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'text-purple-200'
                        : 'text-stone-300 italic'
                    }`}
                  >
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 分析中狀態 */}
        {analyzing && (
          <div className="flex justify-center py-8">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-ping" />
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-ping delay-75" />
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping delay-150" />
              </div>
              <p className="text-xs text-stone-500 tracking-widest uppercase">
                Decoding Soul Fragments...
              </p>
            </div>
          </div>
        )}

        {/* 報告卡片 */}
        {report && report.risk > 0 && (
          <div className="bg-gradient-to-br from-red-950/30 to-amber-950/30 border border-red-900/30 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider">
                ⚠️ Risk Assessment
              </h3>
              <div className="px-3 py-1 bg-red-900/40 rounded-full border border-red-800/50">
                <p className="text-xs font-mono text-red-300">
                  RISK: {report.risk}/10
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-stone-400">
              {report.whisper && (
                <p className="leading-relaxed italic">"{report.whisper}"</p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 輸入框與發送按鈕 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <footer className="px-4 md:px-6 pb-4 md:pb-6">
        {/* 輸入框容器 */}
        <div
          className={`relative z-30 flex items-center gap-2 bg-[#0f0f0f]/80 backdrop-blur-3xl rounded-full p-2 md:p-3 border transition-all duration-500 ${
            isTyping
              ? 'border-purple-500/30 shadow-[0_0_30px_rgba(100,0,100,0.1)]'
              : 'border-white/10 shadow-2xl'
          }`}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-sm md:text-base py-2 md:py-3 px-3 md:px-4 min-h-[36px] md:min-h-[44px] max-h-32 resize-none placeholder:text-stone-600 text-stone-300 font-serif leading-relaxed scrollbar-hide"
            placeholder="向謬思坦白..."
            rows={1}
          />
          <button
            type="button"
            onClick={onSendMessage}
            disabled={analyzing}
            className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-purple-600/80 to-pink-600/80 text-white hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 flex items-center justify-center shrink-0 touch-manipulation active:scale-95 shadow-lg"
          >
            <Send size={18} strokeWidth={2} />
          </button>
        </div>

        {/* 猶豫指示器 */}
        {backspaceCount > 3 && (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-amber-700/60">
            <div className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-pulse" />
            <p className="tracking-wider uppercase">
              MUSE 感知到妳的猶豫...
            </p>
            <div className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-pulse delay-75" />
          </div>
        )}
      </footer>
    </div>
  );
}
