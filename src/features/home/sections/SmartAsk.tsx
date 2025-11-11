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

    // 先建立一個空的 AI 訊息，用於串流更新（失敗時改為錯誤文字）
    const aiMsg: AiMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    }
    // 立即加上一個空的 assistant，供串流填充
    setMessages([...newMessages, aiMsg])

    try {
      // 呼叫 API，支援串流回傳
      const res = await aiAsk(
        { messages: newMessages },
        (chunk: string) => {
          // 串流逐段更新最後一則訊息
          setMessages(prev => {
            const updated = [...prev]
            const lastMsg = updated[updated.length - 1]
            if (lastMsg) {
              const newMsg: AiMessage = {
                role: lastMsg.role || 'assistant',
                content: (lastMsg.content || '') + chunk
              }
              if (lastMsg.timestamp) newMsg.timestamp = lastMsg.timestamp
              updated[updated.length - 1] = newMsg
            }
            return updated
          })
        }
      )

      console.log('🟡 API 回應:', res)
      
      if (res.ok && res.data) {
        console.log('🟡 res.data.answers:', res.data.answers)
        
        // 更新最後一則訊息的內容（非串流模式時需要）
        if (res.data.answers && res.data.answers.length > 0) {
          console.log('🟡 更新 AI 訊息內容:', res.data.answers[0])
          setMessages(prev => {
            const updated = [...prev]
            if (updated.length > 0) {
              const last = updated[updated.length - 1]
              updated[updated.length - 1] = {
                ...last,
                role: 'assistant',
                content: res.data!.answers[0] || ''
              }
            }
            return updated
          })
        }
        
        const r = res.data.recommends || []
        setReco(r)
        if (r[0]?.communityId) localStorage.setItem('recoCommunity', r[0].communityId)

        // 累積 tokens 使用（開發模式）
        if (res.data.usage?.totalTokens) {
          setTotalTokens(prev => prev + res.data!.usage!.totalTokens)
        }
      } else {
        // 若呼叫失敗，將最後一則（assistant）填入錯誤提示，避免空白氣泡
        setMessages(prev => {
          const updated = [...prev]
          if (updated.length > 0) {
            const last = updated[updated.length - 1]
            updated[updated.length - 1] = {
              ...last,
              role: 'assistant',
              content:
                '抱歉，AI 服務目前暫時不可用，請稍後再試。您也可以先描述需求讓我為您推薦房源格局與區域喔。'
            }
          }
          return updated
        })
      }
    } catch (e) {
      // 例外同樣填入錯誤訊息
      setMessages(prev => {
        const updated = [...prev]
        if (updated.length > 0) {
          const last = updated[updated.length - 1]
          updated[updated.length - 1] = {
            ...last,
            role: 'assistant',
            content:
              '抱歉，AI 服務連線失敗（可能未設定金鑰）。請稍後再試，或通知我們協助處理。'
          }
        }
        return updated
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <section 
      className="gradient-ask ai-card space-y-6 rounded-[32px] p-6 shadow-lg transition-shadow hover:shadow-xl md:p-8"
      style={{ background: 'linear-gradient(135deg, #D8E9FF 0%, #EAF4FF 100%)' }}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="size-2.5 rounded-full bg-[var(--brand)]" style={{ animation: 'pulse-subtle 2s ease-in-out infinite' }} />
          <h3
            className="truncate font-bold text-[var(--text-primary)]"
            style={{ fontSize: 'clamp(19px, 2.4vw, 22px)', fontWeight: 900 }}
          >
            AI 找房助理
          </h3>
        </div>
  <div style={{ width: '3.5rem' }} aria-hidden="true" />
        <div className="flex flex-wrap items-center gap-1 md:flex-nowrap" style={{ minWidth: 'fit-content' }}>
          {QUICK.map((q) => (
            <button
              key={q}
              className="cursor-pointer whitespace-nowrap rounded-[var(--r-pill)] border border-[var(--border-default)] bg-white px-2 py-[0.35rem] text-xs font-medium text-[var(--text-secondary)] transition-all duration-200 hover:border-[var(--brand)] hover:shadow-sm"
              onClick={() => setInput(q)}
              aria-label={`快速輸入 ${q}`}
            >
              {q}
            </button>
          ))}
        </div>
        <div className="ml-auto min-w-[150px] text-right text-xs font-medium text-[var(--text-secondary)]">
          {import.meta.env.DEV && totalTokens > 0 ? `${totalTokens} tokens` : '多輪對話・智能推薦'}
        </div>
      </div>

      <div
        ref={chatRef}
        role="log"
        aria-live="polite"
  className="max-h-[620px] min-h-[380px] space-y-3 overflow-y-auto rounded-[var(--r-lg)] border border-[var(--border-default)] bg-white p-4 shadow-inner md:max-h-[540px] md:min-h-[340px]"
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[var(--text-tertiary)]" style={{ fontSize: 'var(--fs-sm)' }}>
            <div className="text-center">
              <p className="mb-2 text-2xl">💬</p>
              <p className="mb-2 font-medium text-[var(--text-primary)]">您好！我是邁房子 AI 助理</p>
              <p className="mx-auto max-w-[280px] text-xs leading-relaxed">
                <span className="font-semibold text-[var(--brand)]">邁鄰居</span>：買房前先查社區口碑<br/>
                <span className="font-semibold text-[var(--brand)]">邁房子</span>：安心陪跑全程留痕
              </p>
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-[fadeIn_0.3s_ease-out]`}>
              <div
                className={`max-w-[85%] rounded-[var(--r-lg)] px-4 py-2.5 shadow-sm md:max-w-[75%] ${
                  m.role === 'user'
                    ? 'user-bubble text-white'
                    : 'bg-[var(--neutral-100)] text-[var(--text-primary)]'
                }`}
                style={{
                  fontSize: 'var(--fs-sm)',
                  // 若變數不存在提供後備漸層，避免白字配白底看起來空白
                  background:
                    m.role === 'user'
                      ? 'var(--gradient-button, linear-gradient(135deg, #1749D7 0%, #1E90FF 100%))'
                      : undefined
                }}
              >
                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                {m.timestamp && (
                  <div className={`mt-1.5 text-xs ${m.role === 'user' ? 'text-white/70' : 'text-[var(--text-tertiary)]'}`}>
                    {new Date(m.timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-[var(--r-lg)] bg-[var(--neutral-100)] px-4 py-2.5 text-[var(--text-primary)]" style={{ fontSize: 'var(--fs-sm)' }}>
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
          className="flex-1 rounded-full border-2 border-gray-300 px-5 transition-colors focus:border-blue-500 focus:outline-none"
          style={{ fontSize: 'var(--fs-sm)', paddingTop: '0.625rem', paddingBottom: '0.625rem' }}
          placeholder="輸入需求（例:西屯區 2房 預算1500萬）"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          aria-label="輸入詢問"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="rounded-full px-5 py-2 font-medium text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, #1749D7 0%, #1E90FF 100%)',
            fontSize: 'var(--fs-sm)'
          }}
        >
          送出
        </button>
      </div>

      {!!reco.length && (
        <div className="mt-4 border-t border-[var(--border-default)] pt-4">
          <div className="mb-3 font-semibold text-[var(--text-secondary)]" style={{ fontSize: 'var(--fs-base)' }}>
            🎯 為您推薦
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {reco.map((p) => (
              <article
                key={p.id}
                className="rounded-[var(--r-lg)] border-2 border-[var(--border-default)] bg-white p-3 transition-all hover:-translate-y-1 hover:border-[var(--brand)] hover:shadow-[var(--shadow-hover)]"
              >
                <div
                  className="mb-2 h-28 rounded-[var(--r-md)] bg-cover bg-center"
                  style={{ backgroundImage: `url(${p.cover})` }}
                  aria-hidden="true"
                />
                <div className="mb-1 font-semibold text-[var(--text-primary)]" style={{ fontSize: 'var(--fs-sm)' }}>
                  {p.title}
                </div>
                <div className="mb-2 text-xs text-[var(--text-secondary)]">{p.communityName}</div>
                <div className="mb-2 font-bold text-[var(--brand)]" style={{ fontSize: 'var(--fs-base)' }}>
                  NT$ {p.price} 萬
                </div>
                <a
                  href={`#/community/${p.communityId}/wall`}
                  className="inline-block rounded-[var(--r-pill)] bg-[var(--neutral-800)] px-3 py-1.5 text-xs font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[var(--neutral-900)]"
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
