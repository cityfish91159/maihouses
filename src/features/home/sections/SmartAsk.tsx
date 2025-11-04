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
    
    const res = await aiAsk({ messages: newMessages })
    
    if (res.ok && res.data) {
      const aiMsg: AiMessage = {
        role: 'assistant',
        content: res.data.answers.join('\n'),
        timestamp: new Date().toISOString()
      }
      setMessages([...newMessages, aiMsg])
      
      const r = res.data.recommends || []
      setReco(r)
      if (r[0]?.communityId) localStorage.setItem('recoCommunity', r[0].communityId)
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
    <section className="bg-[var(--bg-card-hero)] rounded-[var(--r-lg)] shadow-[var(--shadow-card)] p-4 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-[var(--brand)]" />
        <h3 className="font-semibold text-[var(--fs-lg)] text-[var(--text-primary)]">AI 找房助理</h3>
        <span className="text-xs text-[var(--text-tertiary)]">多輪對話・智能推薦</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button
            key={q}
            className="px-3 py-1 rounded-[var(--r-pill)] bg-white border border-[var(--border-default)] text-[var(--fs-sm)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors"
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
        className="bg-white rounded-[var(--r-md)] p-3 min-h-[200px] max-h-[400px] overflow-y-auto space-y-3 border border-[var(--border-default)]"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[var(--text-tertiary)] text-[var(--fs-sm)]">
            <div className="text-center">
              <p className="mb-2">💬 您好！我是邁房子 AI 助理</p>
              <p className="text-xs">請告訴我您的找房需求，我會為您推薦合適的物件</p>
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] px-4 py-2 rounded-[var(--r-md)] text-[var(--fs-sm)] ${
                  m.role === 'user'
                    ? 'bg-[var(--brand)] text-white'
                    : 'bg-[var(--neutral-100)] text-[var(--text-primary)]'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>
                {m.timestamp && (
                  <div className={`text-xs mt-1 ${m.role === 'user' ? 'text-white/70' : 'text-[var(--text-tertiary)]'}`}>
                    {new Date(m.timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] px-4 py-2 rounded-[var(--r-md)] bg-[var(--neutral-100)] text-[var(--text-primary)] text-[var(--fs-sm)]">
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
          className="flex-1 border border-[var(--border-default)] rounded-[var(--r-md)] px-3 py-2 text-[var(--fs-sm)] focus:outline-none focus:border-[var(--brand)] transition-colors"
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
          className="px-4 py-2 rounded-[var(--r-pill)] bg-[var(--brand)] text-[var(--brand-fg)] text-[var(--fs-sm)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          送出
        </button>
      </div>

      {!!reco.length && (
        <div className="mt-4 pt-4 border-t border-[var(--border-default)]">
          <div className="text-[var(--fs-sm)] text-[var(--text-secondary)] mb-3 font-medium">🎯 為您推薦</div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {reco.map((p) => (
              <article
                key={p.id}
                className="border border-[var(--border-default)] rounded-[var(--r-md)] p-3 bg-white hover:shadow-[var(--shadow-hover)] transition-shadow"
              >
                <div
                  className="h-24 mb-2 rounded-[var(--r-sm)] bg-cover bg-center"
                  style={{ backgroundImage: `url(${p.cover})` }}
                  aria-hidden="true"
                />
                <div className="font-medium text-[var(--fs-sm)] text-[var(--text-primary)]">{p.title}</div>
                <div className="text-xs text-[var(--text-secondary)] mb-1">{p.communityName}</div>
                <div className="text-[var(--fs-sm)] mb-2 text-[var(--brand)] font-semibold">NT$ {p.price} 萬</div>
                <a
                  href={`#/community/${p.communityId}/wall`}
                  className="inline-block px-3 py-1 rounded-[var(--r-pill)] bg-[var(--neutral-800)] text-white text-xs hover:bg-[var(--neutral-900)] transition-colors"
                  aria-label="前往社區牆"
                >
                  看社區牆
                </a>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
