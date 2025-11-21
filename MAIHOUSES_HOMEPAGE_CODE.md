# MaiHouses Homepage Code (v11.5 Critical Fixes)

> **Version**: 11.5
> **Date**: 2025-11-21
> **Changes**:
> - Fixed critical streaming bug in `SmartAsk.tsx` (race condition between streaming and fallback)
> - Optimized `SmartAsk.tsx` re-rendering issues (onClick handler)
> - Fixed `LegacyPropertyGrid.tsx` iframe height responsiveness (mobile crash fix)
> - Updated `CommunityTeaser.tsx` to use unified Tailwind colors (success green)
> - Enforced strict Tailwind color system in `tailwind.config.cjs`
> - Verified `HeroAssure.tsx` uses extracted SVG component

## 1. Global Styles (`src/index.css`)

```css
/* stylelint-disable at-rule-no-unknown */
@tailwind base;
@tailwind components;
@tailwind utilities;
/* stylelint-enable at-rule-no-unknown */

:root {
  /* 新擬物風格色彩系統 - 統一使用設計稿色碼 */
  --brand: #00385a; /* Deep Blue - Unified */
  --brand-600: #00385a;
  --brand-light: #009FE8; /* Cyan from image */
  --brand-lighter: #e0f4ff;
  --brand-fg: #FFFFFF;
  
  /* 兼容舊變數 */
  --brand-primary: var(--brand);
  
  /* 背景色 */
  --bg: #f6f9ff;
  --bg-page: #f6f9ff;
  --bg-card: rgba(255, 255, 255, 0.92);
  
  /* 文字色 */
  --ink: #0a2246;
  --muted: #2d3748;
  --text-primary: var(--ink);
  --text-secondary: var(--muted);
  --text-tertiary: #8a95a5;
  
  /* 中性色 */
  --neutral-50: #f6f9ff;
  --neutral-100: #f0f5ff;
  --neutral-200: #d1e3ff;
  --neutral-800: #2d3748;
  --neutral-900: #0a2246;
  
  /* 新擬物陰影系統 */
  --shadow-neu-raised: 10px 10px 24px rgba(9,15,30,.16), -10px -10px 24px rgba(255,255,255,.9);
  --shadow-neu-inset: inset 8px 8px 16px rgba(9,15,30,.12), inset -8px -8px 16px rgba(255,255,255,.9);
  --shadow-neu-inset-subtle: inset 6px 6px 12px rgba(9,15,30,.08), inset -6px -6px 12px rgba(255,255,255,.8);
  --shadow-neu-button: 6px 6px 16px rgba(9,15,30,.18), -4px -4px 12px rgba(255,255,255,.8);
  --shadow-neu-pill: 8px 8px 18px rgba(9,15,30,.14), -8px -8px 18px rgba(255,255,255,.9);
  --shadow-neu-pill-active: inset 6px 6px 12px rgba(9,15,30,.14), inset -6px -6px 12px rgba(255,255,255,.9);
  --shadow-neu-badge: inset 4px 4px 10px rgba(9,15,30,.08), inset -4px -4px 10px rgba(255,255,255,.85);
  
  /* 漸層 */
  --gradient-button: linear-gradient(135deg, #1A5FDB 0%, #0d3399 100%);
  --gradient-ask: linear-gradient(135deg, #f0f5ff 0%, #e8f1ff 100%);
  
  /* 圓角系統 */
  --r-sm: 12px;
  --r-md: 16px;
  --r-lg: 20px;
  --r-xl: 28px;
  --r-2xl: 32px;
  --r-pill: 999px;
  
  /* 間距 */
  --sp-1: 4px;
  --sp-2: 8px;
  --sp-3: 12px;
  --sp-4: 16px;
  --sp-6: 24px;
  --sp-8: 32px;
  --sp-12: 48px;
  
  /* 字體尺寸 */
  --fs-xs: 12px;
  --fs-sm: 13px;
  --fs-md: 14px;
  --fs-base: 16px;
  --fs-lg: 18px;
  --fs-xl: 20px;
  --fs-2xl: 24px;
  --fs-3xl: 28px;

  /* MH Component Classes Variables */
  --ai-bg-from: #dbeafe; /* blue-100/200 mix */
  --ai-bg-to: #eff6ff;
}

@layer components {
  .mh-card {
    @apply rounded-[var(--r-sm)] bg-white transition-all duration-200;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
  }
  
  .mh-card:hover {
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.12);
  }

  .mh-card--hero {
    @apply rounded-[var(--r-2xl)];
    box-shadow: 0 12px 32px rgba(0, 78, 124, 0.15);
  }
  
  .mh-card--hero:hover {
    box-shadow: 0 16px 40px rgba(0, 78, 124, 0.2);
  }

  .mh-ai-card {
    @apply rounded-[var(--r-sm)] p-6 md:p-8 space-y-6;
    background: linear-gradient(135deg, var(--ai-bg-from) 0%, var(--ai-bg-to) 100%);
    box-shadow: 0 2px 8px rgba(74, 144, 226, 0.15);
    transition: box-shadow 0.2s ease, transform 0.2s ease;
  }

  .mh-ai-card:hover {
    box-shadow: 0 4px 16px rgba(74, 144, 226, 0.2);
  }

  .mh-ai-chat {
    @apply flex flex-col gap-4 max-h-[620px] min-h-[380px] overflow-y-auto rounded-[var(--r-sm)] border border-border-light bg-white p-4 shadow-inner md:max-h-[540px] md:min-h-[340px] touch-pan-y overscroll-contain;
  }

  .mh-ai-bubble-user {
    @apply text-white border-none rounded-[var(--r-sm)] px-4 py-2.5 text-sm break-words max-w-[85%] md:max-w-[75%];
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  }

  .mh-ai-bubble-assistant {
    @apply text-text-primary bg-slate-50 border border-border-light rounded-[var(--r-sm)] px-4 py-2.5 text-sm break-words max-w-[85%] md:max-w-[75%];
  }

  .mh-ai-input {
    @apply flex-1 rounded-full border-2 border-border-light bg-white px-5 py-2.5 text-[length:var(--fs-sm)] outline-none transition-all duration-150;
  }
  
  .mh-ai-input:focus-visible {
    @apply border-brand shadow-[0_0_0_1px_rgba(0,56,90,0.2)];
  }
}

@layer base {
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #EEF2F7;
    color: var(--ink);
  }
  /* ... rest of base styles ... */
}
```

## 2. Page Layout (`src/pages/Home.tsx`)

```tsx
import { useEffect, useMemo, useState } from 'react'
import Header from '../components/Header/Header'
import HeroAssure from '../features/home/sections/HeroAssure'
import SmartAsk from '../features/home/sections/SmartAsk'
import CommunityTeaser from '../features/home/sections/CommunityTeaser'
import LegacyPropertyGrid from '../features/home/sections/LegacyPropertyGrid'
import { getMeta } from '../services/api'
import { trackEvent } from '../services/analytics'
import type { AppConfig, RuntimeOverrides } from '../app/config'
import { WarmWelcomeBar } from '../components/WarmWelcomeBar'
import { cmp } from '../lib/utils'

export default function Home({ config }: { config: AppConfig & RuntimeOverrides }) {
  const [banner, setBanner] = useState<string | null>(null)

  useEffect(() => {
    getMeta().then((r) => {
      if (r.ok && r.data) {
        if (r.data.maintenance || cmp(r.data.backendVersion, config.minBackend) < 0) {
          console.warn('版本不相容或維護中')
          setBanner('版本不相容或維護中')
        }
      }
    })
  }, [config.minBackend])

  useEffect(() => {
    const onRej = (e: PromiseRejectionEvent) => {
      try {
        trackEvent('unhandled_promise_rejection', '/', e.reason?.message || String(e.reason))
      } catch {}
    }
    window.addEventListener('unhandledrejection', onRej)
    return () => window.removeEventListener('unhandledrejection', onRej)
  }, [])

  const features = config.features || {}

  return (
    <>
      <Header />
      <WarmWelcomeBar />
      {/* Blue background layer for top section */}
      <div className="absolute top-0 left-0 w-full h-80 bg-brand -z-10" />
      
      {banner && (
        <div className="mx-auto mt-4 max-w-container rounded-md bg-yellow-500 p-3 text-sm text-white">{banner}</div>
      )}
      <main className="mx-auto max-w-container space-y-6 p-4 md:space-y-8 md:p-6 relative">
        {features.heroAssure !== false && (
          <HeroAssure />
        )}
        {features.smartAsk !== false && (
          <SmartAsk />
        )}
        <CommunityTeaser />
        {features.propertyGrid !== false && (
          <LegacyPropertyGrid />
        )}
      </main>
    </>
  )
}
```

## 3. Hero Section (`src/features/home/sections/HeroAssure.tsx`)

```tsx
import React from 'react';
import { ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import MascotHouse from '../../../components/MascotHouse';
import { HERO_STEPS } from '../../../constants/data';

export default function HeroAssure() {
  return (
    <section className="mh-card mh-card--hero bg-gradient-to-br from-white to-brand-50 border border-border-light p-6 md:p-10 relative overflow-hidden group/container">
      
      {/* Header Area */}
      <div className="relative z-10 mb-10 flex flex-col items-center gap-6 md:flex-row md:gap-10">
        
        {/* Mascot: Wireframe House */}
        <div className="w-28 h-32 shrink-0 relative">
             <MascotHouse />
        </div>

        {/* Text Content */}
        <div className="text-center md:text-left flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand/20 bg-bg-soft text-brand text-xs font-bold mb-3">
            <ShieldCheck size={14} />
            <span>全程透明．安心留痕</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-black text-brand mb-3 tracking-tight">
            安心留痕保障
          </h3>
          <p className="text-text-muted font-medium text-sm md:text-base leading-relaxed max-w-2xl">
            介紹改從第一次電話聯絡開始，買賣雙方的每一通聯絡紀錄、每一句承諾與每項協議，
            都會經過雙方確認並完整留痕。<br className="hidden md:block"/>
            讓整個交易過程都有跡可循，保障雙方權益，直到圓滿交屋。
          </p>
        </div>
        
        <a href="#" className="hidden md:flex shrink-0 items-center gap-2 px-5 py-2.5 rounded-xl bg-white border-2 border-brand text-brand font-bold text-sm hover:bg-brand hover:text-white transition-all shadow-sm">
          履保規範 <ArrowRight size={16} />
        </a>
      </div>

      {/* Process Timeline */}
      <div className="relative mt-4 pl-2 md:pl-0">
        
        {/* Connecting Line (Desktop Horizontal) - Centered at top-8 (32px) to align with 48px circle center + 8px padding */}
        <div className="hidden md:block absolute top-8 left-0 w-full h-0.5 bg-border-light -z-0"></div>
        
        {/* Connecting Line (Mobile Vertical) - Centered at left-8 (32px) */}
        <div className="md:hidden absolute left-8 top-0 bottom-0 w-0.5 bg-border-light -z-0"></div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 md:gap-2">
          {HERO_STEPS.map((step, index) => (
            <div key={step.id} className="group relative flex md:flex-col items-center md:items-center gap-4 md:gap-4 p-2 rounded-xl hover:bg-bg-soft transition-colors duration-300 cursor-default">
                
                {/* Icon Circle */}
                <div className="relative z-10 flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-white border-2 border-border-light text-text-muted flex items-center justify-center group-hover:border-brand group-hover:text-brand group-hover:scale-110 transition-all duration-300 shadow-sm">
                        <step.icon size={20} />
                    </div>
                    {/* Step Number Badge */}
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                        {index + 1}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 md:text-center">
                    <h4 className="text-base font-black text-text-ink mb-1 group-hover:text-brand transition-colors">
                        {step.title}
                    </h4>
                    <p className="text-xs text-text-muted font-medium leading-relaxed">
                        {step.desc}
                    </p>
                </div>

                {/* Mobile Arrow (Visual aid) */}
                <div className="md:hidden ml-auto text-border-light group-hover:text-brand transition-colors">
                     {index < HERO_STEPS.length - 1 && <CheckCircle2 size={16} className="opacity-0 group-hover:opacity-20"/>}
                </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

## 4. Smart Ask Section (`src/features/home/sections/SmartAsk.tsx`)

```tsx
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
```

## 5. Community Teaser (`src/features/home/sections/CommunityTeaser.tsx`)

```tsx
import { COMMUNITY_REVIEWS } from '../../../constants/data'

export default function CommunityTeaser() {
  return (
    <section className="mh-card bg-white/96 backdrop-blur-md border border-border-light p-2.5">
      <div className="flex justify-between items-center gap-1.5 mb-1.5">
        <h3 className="text-lg font-extrabold m-0 text-brand tracking-wide">社區評價（聚合）</h3>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {COMMUNITY_REVIEWS.map((review) => (
          <article key={review.id} className="flex gap-2 border border-border-light rounded-[var(--r-sm)] p-1.5 bg-white relative">
            <div className="w-[34px] h-[34px] rounded-full bg-brand/10 border-2 border-brand flex items-center justify-center font-extrabold text-brand text-[17px] shrink-0">
              {review.id}
            </div>
            <div>
              <div className="font-extrabold text-sm text-text-ink">
                {review.name} <span className="text-yellow-400">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {review.tags.map(tag => (
                  <span key={tag} className="text-xs px-2 py-[3px] rounded-full bg-success/10 border border-success/40 text-success font-bold">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-brand font-medium">
                {review.content}
              </p>
            </div>
          </article>
        ))}
      </div>
      <a 
        className="mt-2 flex items-center gap-2.5 bg-gradient-to-r from-success/25 to-success/10 border border-success/40 p-3 rounded-[var(--r-sm)] font-black text-success no-underline relative lg:justify-center lg:text-center group" 
        href="/maihouses/community-wall_mvp.html" 
        aria-label="點我看更多社區評價"
      >
        <span className="text-[17px] tracking-wide lg:mx-auto max-sm:text-[15px]">👉 點我看更多社區評價</span>
        <span className="ml-auto bg-success text-white rounded-full text-sm px-3 py-2 lg:absolute lg:right-[14px] lg:top-1/2 lg:-translate-y-1/2 lg:ml-0 max-sm:text-xs max-sm:px-2.5 max-sm:py-[7px] group-hover:bg-success/90 transition-colors">
          前往社區牆
        </span>
      </a>
    </section>
  )
}
```

## 6. Legacy Property Grid (`src/features/home/sections/LegacyPropertyGrid.tsx`)

```tsx
import React from 'react'

export default function LegacyPropertyGrid() {
  const baseUrl = import.meta.env.BASE_URL || '/'
  
  return (
    <section className="mh-card p-0 overflow-hidden">
      {/* 以 iframe 方式嵌入你上傳的完整房源清單 HTML，完全不改動其內文與排版 */}
      <iframe
        title="房源清單"
        src={`${baseUrl}maihouses_list_noheader.html`}
        className="w-full border-0 h-[1200px] sm:h-[1400px] md:h-screen md:max-h-[1600px]"
        loading="lazy"
        sandbox="allow-scripts allow-same-origin allow-popups"
      />
    </section>
  )
}
```

## 7. Mascot House (`src/components/MascotHouse.tsx`)

```tsx
import React from 'react';

export default function MascotHouse() {
  return (
    <svg viewBox="0 0 200 240" className="w-full h-full drop-shadow-sm transform hover:scale-105 transition-transform duration-300 text-brand">
      {/* M-Antenna */}
      <path d="M 85 40 L 85 15 L 100 30 L 115 15 L 115 40" 
            stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

      {/* House Body & Roof */}
      <path d="M 40 80 L 100 40 L 160 80" 
            stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="55" y="80" width="90" height="100" 
            stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Eyebrows (Small) */}
      <path d="M 78 110 Q 85 105 92 110" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M 108 110 Q 115 105 122 110" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
      
      {/* Eyes (Hollow circles) */}
      <circle cx="85" cy="125" r="4" stroke="currentColor" strokeWidth="3" fill="none" />
      <circle cx="115" cy="125" r="4" stroke="currentColor" strokeWidth="3" fill="none" />

      {/* Hands (Sticking out from sides) */}
      <path d="M 55 130 L 25 110" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M 145 130 L 175 110" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" />

      {/* Legs (Walking) */}
      <path d="M 85 180 L 85 215 L 75 215" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 115 180 L 115 215 L 125 215" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
```
