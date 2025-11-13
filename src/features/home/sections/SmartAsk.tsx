import { useState, useRef, useEffect } from 'react'
import { aiAsk } from '../../../services/api'
import { trackEvent } from '../../../services/uag'
import type { AiMessage, PropertyCard, AiAction } from '../../../types'
import { parseAiAction, stripJsonFromContent } from '../../../lib/aiParser'

const QUICK = [
  { text: '剛搬來台北', emoji: '🎒', color: '#FF6B6B' },
  { text: '想了解這個社區', emoji: '🏘️', color: '#4ECDC4' },
  { text: '有養寵物', emoji: '🐕', color: '#FFB84D' },
  { text: '在意管理品質', emoji: '⭐', color: '#A8E6CF' }
]

// ActionRenderer 組件：根據不同的 action 類型渲染對應 UI
function ActionRenderer({ action }: { action: AiAction }) {
  const [copied, setCopied] = useState<string | null>(null)

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleNavigate = (url: string) => {
    window.location.hash = url
  }

  const handleScrollTo = (targetId: string) => {
    const element = document.getElementById(targetId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (action.type === 'community_post_refine') {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-lg">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-lg">📝</span>
          <h4 className="font-bold text-gray-800">貼文草稿建議</h4>
        </div>

        <div className="space-y-4">
          {action.data.options.map((opt, idx) => (
            <div key={idx} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">
                  {opt.style === 'normal' ? '✨ 誠懇版' : '🧘 冷靜版'}
                </span>
                <button
                  onClick={() => handleCopy(`${opt.title}\n\n${opt.body}`, `post-${idx}`)}
                  className="rounded-full bg-blue-500 px-3 py-1 text-xs font-medium text-white transition hover:bg-blue-600 active:scale-95"
                >
                  {copied === `post-${idx}` ? '✓ 已複製' : '複製'}
                </button>
              </div>
              <div className="mb-1 font-semibold text-gray-800">{opt.title}</div>
              <div className="text-sm leading-relaxed text-gray-600">{opt.body}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (action.type === 'navigate_listings') {
    const { target, params } = action.data
    const paramStr = new URLSearchParams(params).toString()
    const url = `/listings?${paramStr}`

    return (
      <div className="mx-auto w-full max-w-md rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4 shadow-lg">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-lg">🏠</span>
          <h4 className="font-bold text-gray-800">
            {target === 'community' ? '社區物件整理' : '區域物件整理'}
          </h4>
        </div>
        <p className="mb-3 text-sm text-gray-600">
          {target === 'community'
            ? `幫您整理好「${params.community}」的物件了`
            : `幫您整理好「${params.area}」的物件了`}
        </p>
        <button
          onClick={() => handleNavigate(url)}
          className="w-full rounded-full bg-green-500 py-2 font-medium text-white transition hover:bg-green-600 active:scale-95"
        >
          去看看 →
        </button>
      </div>
    )
  }

  if (action.type === 'scroll_to') {
    const targetName = action.data.target === 'community-wall' ? '社區牆' : action.data.target
    return (
      <div className="mx-auto w-full max-w-md rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-4 shadow-lg">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-lg">📍</span>
          <h4 className="font-bold text-gray-800">帶您過去</h4>
        </div>
        <button
          onClick={() => handleScrollTo(action.data.target)}
          className="w-full rounded-full bg-purple-500 py-2 font-medium text-white transition hover:bg-purple-600 active:scale-95"
        >
          前往{targetName} ↓
        </button>
      </div>
    )
  }

  if (action.type === 'invite_text') {
    return (
      <div className="mx-auto w-full max-w-md rounded-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-4 shadow-lg">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-lg">💌</span>
          <h4 className="font-bold text-gray-800">幫您寫好了</h4>
        </div>
        <div className="mb-3 rounded-lg bg-white p-3 text-sm leading-relaxed text-gray-700 shadow-inner">
          {action.data.text}
        </div>
        <button
          onClick={() => handleCopy(action.data.text, 'invite')}
          className="w-full rounded-full bg-orange-500 py-2 font-medium text-white transition hover:bg-orange-600 active:scale-95"
        >
          {copied === 'invite' ? '✓ 已複製' : '複製使用'}
        </button>
      </div>
    )
  }

  return null
}

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
          const fullContent = res.data.answers[0] || ''

          // 解析是否包含特殊操作指令
          const action = parseAiAction(fullContent)
          const displayContent = action ? stripJsonFromContent(fullContent) : fullContent

          setMessages(prev => {
            const updated = [...prev]
            if (updated.length > 0) {
              const last = updated[updated.length - 1]
              updated[updated.length - 1] = {
                ...last,
                role: 'assistant',
                content: displayContent,
                ...(action && { action })
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
          <div className="size-2.5 rounded-full" style={{ background: '#4A90E2', animation: 'pulse-subtle 2s ease-in-out infinite' }} />
          <h3
            className="truncate font-bold"
            style={{ fontSize: 'clamp(18px, 2.2vw, 21px)', fontWeight: 900, color: '#2C3E50' }}
          >
            社區鄰居管家
          </h3>
        </div>
  <div className="w-full md:w-auto">
        <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:gap-1.5">
          {QUICK.map((q) => (
            <button
              key={q.text}
              className="group relative cursor-pointer overflow-hidden rounded-xl border-2 bg-white px-3 py-2.5 text-xs font-semibold shadow-sm transition-all duration-300 active:scale-95 md:whitespace-nowrap md:rounded-full md:py-1.5"
              style={{
                borderColor: q.color + '40',
                color: q.color
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = q.color
                e.currentTarget.style.boxShadow = `0 4px 12px ${q.color}30`
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = q.color + '40'
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'
                e.currentTarget.style.transform = 'none'
              }}
              onClick={() => setInput(q.text)}
              aria-label={`快速輸入 ${q.text}`}
            >
              <span className="mr-1.5 text-base">{q.emoji}</span>
              <span className="text-[11px] leading-tight md:text-xs">{q.text}</span>
            </button>
          ))}
        </div>
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
            <div className="text-center" style={{ maxWidth: '380px' }}>
              <p className="mb-4 animate-bounce text-4xl">🏡</p>
              <p className="mb-3 font-bold leading-relaxed" style={{ fontSize: '16px', color: '#2C3E50' }}>
                歡迎來到邁房子 ☺️
              </p>
              <p className="mx-auto mb-4 text-sm leading-relaxed" style={{ color: '#5A6C7D' }}>
                買房不只看物件，更要看生活<br/>
                這裡有真實住戶分享，我們一起慢慢看
              </p>
              <div className="mx-auto mt-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-3" style={{ maxWidth: '340px' }}>
                <p className="text-xs leading-relaxed" style={{ color: '#667085' }}>
                  💬 隨時聊聊您的需求與困擾<br/>
                  <span className="text-[11px]" style={{ color: '#98A2B3' }}>不只是房子，更關心您的生活</span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className="flex flex-col gap-3 animate-[fadeIn_0.3s_ease-out]">
              <div className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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
              {m.action && <ActionRenderer action={m.action} />}
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-[12px] px-4 py-2.5" style={{ fontSize: 'var(--fs-sm)', background: '#F8FAFC', border: '1px solid #E5EDF5', color: '#5A6C7D' }}>
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
