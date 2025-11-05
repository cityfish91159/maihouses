import { useState, useRef, useEffect } from 'react'
import { aiAsk } from '../../../services/api'
import { trackEvent } from '../../../services/uag'
import type { AiMessage, PropertyCard } from '../../../types'

const QUICK = ['3房以內', '30坪以下', '近捷運', '新成屋']

export default function SmartAsk() {
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [input, setInput] = useState('')
  const [reco, setReco] = useState<PropertyCard[]>([])
  const [loading, setLoading] = useState(false)
  const [totalTokens, setTotalTokens] = useState(0)
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
    
    const userMsg: AiMessage = { role: 'user', content: input.trim(), timestamp: new Date().toISOString() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    
    trackEvent('ai_message_sent', '/')
    
    // 先建立一個空的 AI 訊息，用於串流更新
    const aiMsg: AiMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    }
    setMessages([...newMessages, aiMsg])
    
    // 呼叫 API，支援串流回傳
    const res = await aiAsk(
      { messages: newMessages },
      (chunk: string) => {
        // 每收到一段文字就更新最後一則訊息
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: updated[updated.length - 1].content + chunk
          }
          return updated
        })
      }
    )
    
    if (res.ok && res.data) {
      const r = res.data.recommends || []
      setReco(r)
      if (r[0]?.communityId) localStorage.setItem('recoCommunity', r[0].communityId)
      
      // 累積 tokens 使用（開發模式）
      if (res.data.usage?.totalTokens) {
        setTotalTokens(prev => prev + res.data!.usage!.totalTokens)
      }
    }
    
    setLoading(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <section 
      className="rounded-[28px] shadow-[10px_10px_24px_rgba(9,15,30,.16),_-10px_-10px_24px_rgba(255,255,255,.9)] p-4 md:p-6 space-y-4 transition-shadow hover:shadow-[var(--shadow-hover)]"
      style={{ background: 'var(--gradient-ask)' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2.5 h-2.5 rounded-full bg-[var(--brand)]" style={{ animation: 'pulse-subtle 2s ease-in-out infinite' }} />
        <h3 className="font-bold text-[var(--text-primary)]" style={{ fontSize: 'var(--fs-xl)' }}>
          AI 找房助理
        </h3>
        <span className="text-xs text-[var(--text-tertiary)] ml-auto">
          {import.meta.env.DEV && totalTokens > 0 ? `${totalTokens} tokens` : '多輪對話・智能推薦'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 md:gap-2">
        {QUICK.map((q, i) => (
          <button
            key={q}
            className="px-2 py-1 md:px-3 md:py-1.5 rounded-[var(--r-pill)] bg-white border border-[var(--border-default)] font-medium transition-all hover:border-[var(--brand)] hover:text-[var(--brand)] hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 text-xs md:text-sm whitespace-nowrap"
            onClick={() => setInput(q)}
            aria-label={`快速輸入 ${q}`}
          >
            {q}
          </button>
        ))}
      </div>

      <div
        ref={chatRef}
        role="log"
        aria-live="polite"
        className="bg-white rounded-[var(--r-lg)] p-4 min-h-[280px] md:min-h-[240px] max-h-[450px] md:max-h-[400px] overflow-y-auto space-y-3 border border-[var(--border-default)] shadow-inner"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[var(--text-tertiary)]" style={{ fontSize: 'var(--fs-sm)' }}>
            <div className="text-center">
              <p className="mb-2 text-2xl">💬</p>
              <p className="font-medium mb-2 text-[var(--text-primary)]">您好！我是邁房子 AI 助理</p>
              <p className="text-xs leading-relaxed max-w-[280px] mx-auto">
                <span className="font-semibold text-[var(--brand)]">邁鄰居</span>：買房前先查社區口碑<br/>
                <span className="font-semibold text-[var(--brand)]">邁房子</span>：安心陪跑全程留痕
              </p>
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-[fadeIn_0.3s_ease-out]`}>
              <div
                className={`max-w-[85%] md:max-w-[75%] px-4 py-2.5 rounded-[var(--r-lg)] shadow-sm ${
                  m.role === 'user'
                    ? 'text-white'
                    : 'bg-[var(--neutral-100)] text-[var(--text-primary)]'
                }`}
                style={{
                  fontSize: 'var(--fs-sm)',
                  background: m.role === 'user' ? 'var(--gradient-button)' : undefined
                }}
              >
                <div className="whitespace-pre-wrap leading-relaxed">
                  {m.content.length > 100 ? `${m.content.slice(0, 100)}...` : m.content}
                </div>
                {m.timestamp && (
                  <div className={`text-xs mt-1.5 ${m.role === 'user' ? 'text-white/70' : 'text-[var(--text-tertiary)]'}`}>
                    {new Date(m.timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] px-4 py-2.5 rounded-[var(--r-lg)] bg-[var(--neutral-100)] text-[var(--text-primary)]" style={{ fontSize: 'var(--fs-sm)' }}>
              <div className="flex items-center gap-1">
                <span>正在思考</span>
                <span className="animate-pulse">...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 border-2 border-[var(--border-default)] rounded-[var(--r-lg)] px-4 py-2.5 focus:outline-none focus:border-[var(--brand)] transition-colors"
          style={{ fontSize: 'var(--fs-sm)' }}
          placeholder="輸入需求（例：西屯區 2房 預算1500萬）"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          aria-label="輸入詢問"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="px-5 py-2.5 rounded-[var(--r-pill)] text-white font-medium shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          style={{ 
            background: 'var(--gradient-button)',
            fontSize: 'var(--fs-sm)'
          }}
        >
          送出
        </button>
      </div>

      {!!reco.length && (
        <div className="mt-4 pt-4 border-t border-[var(--border-default)]">
          <div className="text-[var(--text-secondary)] mb-3 font-semibold" style={{ fontSize: 'var(--fs-base)' }}>
            🎯 為您推薦
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {reco.map((p) => (
              <article
                key={p.id}
                className="border-2 border-[var(--border-default)] rounded-[var(--r-lg)] p-3 bg-white transition-all hover:border-[var(--brand)] hover:shadow-[var(--shadow-hover)] hover:-translate-y-1"
              >
                <div
                  className="h-28 mb-2 rounded-[var(--r-md)] bg-cover bg-center"
                  style={{ backgroundImage: `url(${p.cover})` }}
                  aria-hidden="true"
                />
                <div className="font-semibold text-[var(--text-primary)] mb-1" style={{ fontSize: 'var(--fs-sm)' }}>
                  {p.title}
                </div>
                <div className="text-xs text-[var(--text-secondary)] mb-2">{p.communityName}</div>
                <div className="text-[var(--brand)] font-bold mb-2" style={{ fontSize: 'var(--fs-base)' }}>
                  NT$ {p.price} 萬
                </div>
                <a
                  href={`#/community/${p.communityId}/wall`}
                  className="inline-block px-3 py-1.5 rounded-[var(--r-pill)] bg-[var(--neutral-800)] text-white text-xs font-medium hover:bg-[var(--neutral-900)] transition-all hover:-translate-y-0.5"
                  aria-label="前往社區牆"
                >
                  看社區牆 →
                </a>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
