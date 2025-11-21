import { useState, useRef, useEffect } from 'react'
import { aiAsk } from '../../../services/api'
import { trackEvent } from '../../../services/analytics'
import type { AiMessage, PropertyCard } from '../../../types'
import { QUICK_QUESTIONS } from '../../../constants/data'

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

    const aiMsg: AiMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    }
    setMessages([...newMessages, aiMsg])

    try {
      let isStreamingComplete = false
      const res = await aiAsk(
        { messages: newMessages },
        (chunk: string) => {
          isStreamingComplete = true
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

      if (res.ok && res.data) {
        if (!isStreamingComplete && res.data.answers && res.data.answers.length > 0) {
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

        if (res.data.usage?.totalTokens) {
          setTotalTokens(prev => prev + res.data!.usage!.totalTokens)
        }
      } else {
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <section 
      className="mh-ai-card"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="size-2.5 rounded-full bg-[#4A90E2] shadow-[0_0_8px_rgba(74,144,226,0.6)]" />
          <h3
            className="truncate font-black text-slate-800 text-[clamp(18px,2.2vw,21px)]"
          >
            社區鄰居管家
          </h3>
        </div>
        <div className="w-14" aria-hidden="true" />
        <div className="flex flex-wrap items-center gap-1 md:flex-nowrap min-w-fit">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              data-text={q}
              className="cursor-pointer whitespace-nowrap rounded-full border border-border-default bg-white px-2 py-1.5 text-xs font-medium text-text-secondary transition-all duration-200 hover:border-brand hover:shadow-sm"
              onClick={(e) => setInput(e.currentTarget.dataset.text!)}
              aria-label={`快速輸入 ${q}`}
            >
              {q}
            </button>
          ))}
        </div>
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
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            <div className="text-center max-w-[340px]">
              <p className="mb-3 text-3xl">🏡</p>
              <p className="mb-3 font-semibold leading-relaxed text-[15px] text-slate-800">
                歡迎來到邁房子 ☺️
              </p>
              <p className="mx-auto text-sm leading-relaxed text-slate-500">
                買房不只看物件，更要看生活。<br/>
                這裡有真實住戶分享，我們一起慢慢看
              </p>
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-[fadeIn_0.3s_ease-out]`}>
              <div
                className={`shadow-sm min-w-0 ${
                  m.role === 'user'
                    ? 'mh-ai-bubble-user'
                    : 'mh-ai-bubble-assistant'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                {m.timestamp && (
                  <div className={`mt-1.5 text-xs ${m.role === 'user' ? 'text-white/70' : 'text-text-tertiary'}`}>
                    {new Date(m.timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            </div>
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
          onClick={send}
          disabled={loading || !input.trim()}
          className="rounded-full px-5 py-2 font-medium text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 bg-brand text-sm"
        >
          送出
        </button>
      </div>

      {!!reco.length && (
        <div className="mt-4 border-t border-border-light pt-4">
          <div className="mb-3">
            <div 
              className="text-[calc(var(--fs-base)+6px)] font-semibold md:text-[calc(var(--fs-base)+12px)] md:font-bold text-slate-500" 
            >
              🏠 智能房源推薦
            </div>
            <div className="mt-1 text-xs text-slate-400">
              依瀏覽行為與社區口碑輔助排序
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {reco.map((p) => (
              <article
                key={p.id}
                className="rounded-xl bg-white p-3 transition-all hover:-translate-y-1 hover:shadow-lg border border-border-light hover:border-[#4A90E2]"
              >
                <div
                  className="mb-2 h-28 rounded-md bg-cover bg-center"
                  style={{ backgroundImage: `url(${p.cover})` }}
                  aria-hidden="true"
                />
                <div className="mb-1 font-semibold text-text-primary text-sm">
                  {p.title}
                </div>
                <div className="mb-2 text-xs text-text-secondary">{p.communityName}</div>
                <div className="mb-2 font-bold text-brand text-base">
                  NT$ {p.price} 萬
                </div>
                <a
                  href={`#/community/${p.communityId}/wall`}
                  className="inline-block rounded-full px-3 py-1.5 text-xs font-medium text-white transition-all hover:-translate-y-0.5 bg-gradient-to-br from-[#4A90E2] to-[#5BA3F5]"
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

