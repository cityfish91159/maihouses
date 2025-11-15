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
      className="gradient-ask ai-card space-y-6 rounded-[12px] p-6 shadow-[0_2px_8px_rgba(74,144,226,0.15)] transition-shadow hover:shadow-[0_4px_16px_rgba(74,144,226,0.2)] md:p-8"
      style={{ background: 'linear-gradient(135deg, #EBF4FF 0%, #F8FBFF 100%)' }}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="ai-avatar-glow size-2.5 rounded-full" style={{ background: '#4A90E2' }} />
          <h3
            className="truncate font-bold"
            style={{ fontSize: 'clamp(18px, 2.2vw, 21px)', fontWeight: 900, color: '#2C3E50' }}
          >
            社區鄰居管家
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
  className="max-h-[620px] min-h-[380px] overflow-y-auto rounded-[12px] border border-[#E5EDF5] bg-white p-4 shadow-inner md:max-h-[540px] md:min-h-[340px]"
        style={{ 
          gap: '16px', 
          display: 'flex', 
          flexDirection: 'column',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          touchAction: 'pan-y'
        }}
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center" style={{ fontSize: 'var(--fs-sm)', color: '#5A6C7D' }}>
            <div className="text-center" style={{ maxWidth: '340px' }}>
              <p className="mb-3 text-3xl">🏡</p>
              <p className="mb-3 font-semibold leading-relaxed" style={{ fontSize: '15px', color: '#2C3E50' }}>
                歡迎來到邁房子 ☺️
              </p>
              <p className="mx-auto text-sm leading-relaxed" style={{ color: '#5A6C7D' }}>
                買房不只看物件，更要看生活。<br/>
                這裡有真實住戶分享，我們一起慢慢看
              </p>
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-[fadeIn_0.3s_ease-out]`}>
              <div
                className={`max-w-[85%] rounded-[12px] px-4 py-2.5 shadow-sm md:max-w-[75%] ${
                  m.role === 'user'
                    ? 'text-white'
                    : 'text-[var(--text-primary)]'
                }`}
                style={{
                  fontSize: 'var(--fs-sm)',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  minWidth: 0,
                  background:
                    m.role === 'user'
                      ? 'linear-gradient(135deg, #4A90E2 0%, #5BA3F5 100%)'
                      : '#F8FAFC',
                  border: m.role === 'user' ? 'none' : '1px solid #E5EDF5'
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
            <div className="max-w-[80%] rounded-[12px] px-4 py-2.5" style={{ fontSize: 'var(--fs-sm)', background: '#F8FAFC', border: '1px solid #E5EDF5', color: '#5A6C7D' }}>
              <div className="flex items-center gap-2">
                <span>正在思考</span>
                <div className="flex gap-1">
                  <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-[#5A6C7D]"></span>
                  <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-[#5A6C7D]"></span>
                  <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-[#5A6C7D]"></span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-full px-5 transition-colors focus:outline-none"
          style={{ 
            fontSize: 'var(--fs-sm)', 
            paddingTop: '0.625rem', 
            paddingBottom: '0.625rem',
            border: '2px solid #E5EDF5',
            background: '#FFFFFF'
          }}
          onFocus={(e) => e.target.style.borderColor = '#4A90E2'}
          onBlur={(e) => e.target.style.borderColor = '#E5EDF5'}
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
            background: 'linear-gradient(135deg, #4A90E2 0%, #5BA3F5 100%)',
            fontSize: 'var(--fs-sm)'
          }}
        >
          送出
        </button>
      </div>

      {!!reco.length && (
        <div className="mt-4 border-t pt-4" style={{ borderColor: '#E5EDF5' }}>
          <div className="mb-3 font-semibold" style={{ fontSize: 'var(--fs-base)', color: '#5A6C7D' }}>
            🏠 為您推薦
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {reco.map((p) => (
              <article
                key={p.id}
                className="rounded-[12px] bg-white p-3 transition-all hover:-translate-y-1 hover:shadow-lg"
                style={{ border: '1px solid #E5EDF5' }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#4A90E2'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5EDF5'}
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
                  className="inline-block rounded-full px-3 py-1.5 text-xs font-medium text-white transition-all hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg, #4A90E2 0%, #5BA3F5 100%)' }}
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
