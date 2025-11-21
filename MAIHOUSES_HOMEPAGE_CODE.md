# MaiHouses Homepage Code (v11.3 - Optimized)

This file contains the complete source code for the MaiHouses homepage and its key sections as of November 21, 2025, after refactoring for style consistency and performance.

## 1. Main Page (`src/pages/Home.tsx`)

```tsx
import { useEffect, useState } from 'react'
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
          <section className="rounded-lg bg-white p-6 shadow-[0_12px_32px_rgba(0,78,124,0.15)] transition-all duration-200 hover:shadow-[0_16px_40px_rgba(0,78,124,0.2)] md:p-8">
            <HeroAssure />
          </section>
        )}
        {features.smartAsk !== false && (
          <section className="rounded-lg bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] md:p-8">
            <SmartAsk />
          </section>
        )}
        <section className="rounded-lg bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] md:p-8">
          <CommunityTeaser />
        </section>
        {features.propertyGrid !== false && (
          <LegacyPropertyGrid />
        )}
      </main>
    </>
  )
}
```

## 2. Hero Section (`src/features/home/sections/HeroAssure.tsx`)

```tsx
import React from 'react';
import { ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import MascotHouse from '../../../components/MascotHouse';
import { HERO_STEPS } from '../../../constants/data';

export default function HeroAssure() {
  return (
    <section className="bg-gradient-to-br from-white to-brand-50 border border-border-light rounded-[32px] p-6 md:p-10 shadow-sm relative overflow-hidden group/container">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 mb-10 relative z-10">
        
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

## 3. Smart Ask (`src/features/home/sections/SmartAsk.tsx`)

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
      const res = await aiAsk(
        { messages: newMessages },
        (chunk: string) => {
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
        if (res.data.answers && res.data.answers.length > 0) {
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <section 
      className="bg-gradient-to-br from-blue-200 to-blue-100 space-y-6 rounded-xl p-6 shadow-[0_2px_8px_rgba(74,144,226,0.15)] transition-shadow hover:shadow-[0_4px_16px_rgba(74,144,226,0.2)] md:p-8"
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
              className="cursor-pointer whitespace-nowrap rounded-full border border-border-default bg-white px-2 py-1.5 text-xs font-medium text-text-secondary transition-all duration-200 hover:border-brand hover:shadow-sm"
              onClick={() => setInput(q)}
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
        className="flex flex-col gap-4 max-h-[620px] min-h-[380px] overflow-y-auto rounded-xl border border-border-light bg-white p-4 shadow-inner md:max-h-[540px] md:min-h-[340px] touch-pan-y overscroll-contain"
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
                className={`max-w-[85%] rounded-xl px-4 py-2.5 shadow-sm md:max-w-[75%] text-sm break-words min-w-0 ${
                  m.role === 'user'
                    ? 'text-white bg-gradient-to-br from-blue-800 to-blue-700 border-none'
                    : 'text-text-primary bg-slate-50 border border-border-light'
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
          className="flex-1 rounded-full px-5 py-2.5 text-sm border-2 border-border-light bg-white transition-colors focus:outline-none focus:border-[#4A90E2]"
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

## 4. Community Teaser (`src/features/home/sections/CommunityTeaser.tsx`)

```tsx
import { COMMUNITY_REVIEWS } from '../../../constants/data'

export default function CommunityTeaser() {
  return (
    <section className="bg-white/96 backdrop-blur-md border border-border-light rounded-[18px] p-2.5">
      <div className="flex justify-between items-center gap-1.5 mb-1.5">
        <h3 className="text-lg font-extrabold m-0 text-brand tracking-wide">社區評價（聚合）</h3>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {COMMUNITY_REVIEWS.map((review) => (
          <article key={review.id} className="flex gap-2 border border-border-light rounded-[13px] p-1.5 bg-white relative">
            <div className="w-[34px] h-[34px] rounded-full bg-brand/10 border-2 border-brand flex items-center justify-center font-extrabold text-brand text-[17px] shrink-0">
              {review.id}
            </div>
            <div>
              <div className="font-extrabold text-[14.5px] text-text-ink">
                {review.name} <span className="text-yellow-400">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {review.tags.map(tag => (
                  <span key={tag} className="text-xs px-2 py-[3px] rounded-full bg-green-500/10 border border-green-500/40 text-green-800 font-bold">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="mt-1 text-[14.5px] leading-relaxed text-brand font-medium">
                {review.content}
              </p>
            </div>
          </article>
        ))}
      </div>
      <a 
        className="mt-2 flex items-center gap-2.5 bg-gradient-to-r from-green-500/25 to-green-500/10 border border-green-500/40 p-3 rounded-[14px] font-black text-green-900 no-underline relative lg:justify-center lg:text-center group" 
        href="/maihouses/community-wall_mvp.html" 
        aria-label="點我看更多社區評價"
      >
        <span className="text-[17px] tracking-wide lg:mx-auto max-sm:text-[15px]">👉 點我看更多社區評價</span>
        <span className="ml-auto bg-green-800 text-white rounded-full text-sm px-3 py-2 lg:absolute lg:right-[14px] lg:top-1/2 lg:-translate-y-1/2 lg:ml-0 max-sm:text-xs max-sm:px-2.5 max-sm:py-[7px] group-hover:bg-green-900 transition-colors">
          前往社區牆
        </span>
      </a>
    </section>
  )
}
```

## 5. New Utility & Data Files

### `src/constants/data.ts`
```tsx
import React from 'react';
import { ScanEye, HandCoins, Phone, MessageSquareText, Landmark, KeyRound } from 'lucide-react';

export const HERO_STEPS = [
  { 
    id: '01',
    title: '已電聯', 
    desc: '紀錄談話內容',
    icon: Phone,
  },
  { 
    id: '02',
    title: '已帶看', 
    desc: '賞屋重點紀錄',
    icon: ScanEye,
  },
  { 
    id: '03',
    title: '已出價', 
    desc: '紀錄價格條件',
    icon: HandCoins,
  },
  { 
    id: '04',
    title: '已斡旋', 
    desc: '議價過程紀錄',
    icon: MessageSquareText,
  },
  { 
    id: '05',
    title: '已成交', 
    desc: '貸款相關事項',
    icon: Landmark,
  },
  { 
    id: '06',
    title: '已交屋', 
    desc: '確認圓滿交屋',
    icon: KeyRound,
  },
];

export const COMMUNITY_REVIEWS = [
  {
    id: 'J',
    name: 'J***｜景安和院 住戶',
    rating: 5,
    tags: ['#物業/管理'],
    content: '公設維護得乾淨，假日草皮有人整理。之前反映停車動線，管委會一週內就公告改善。'
  },
  {
    id: 'W',
    name: 'W***｜松濤苑 住戶',
    rating: 4,
    tags: ['#噪音'],
    content: '住起來整體舒服，但臨路面向在上下班尖峰車聲明顯，喜靜者建議考慮中高樓層。'
  },
  {
    id: 'L',
    name: 'L***｜遠揚柏悅 住戶',
    rating: 4,
    tags: ['#漏水/壁癌'],
    content: '頂樓排水設計不錯，颱風天沒有積水。不過垃圾車時間稍晚，偶爾有下水道味。'
  },
  {
    id: 'A',
    name: 'A***｜華固名邸 住戶',
    rating: 5,
    tags: ['#物業/管理'],
    content: '管理員很負責，包裹收發與公告都有效率；電梯偶爾故障但維修速度快。'
  },
  {
    id: 'H',
    name: 'H***｜寶輝花園廣場 住戶',
    rating: 3,
    tags: ['#停車/車位'],
    content: '地下室車位轉彎半徑偏小，新手要多注意；平日夜間社區整體很安靜。'
  },
  {
    id: 'K',
    name: 'K***｜潤泰峰匯 住戶',
    rating: 4,
    tags: ['#採光/日照'],
    content: '採光好、通風佳，夏天不會太悶熱；但西曬戶下午還是會稍微熱一些。'
  }
];

export const QUICK_QUESTIONS = ['3房以內', '30坪以下', '近捷運', '新成屋'];
```

### `src/components/MascotHouse.tsx`
```tsx
import React from 'react';

export default function MascotHouse() {
  return (
    <svg viewBox="0 0 200 240" className="w-full h-full drop-shadow-sm transform hover:scale-105 transition-transform duration-300">
      {/* M-Antenna */}
      <path d="M 85 40 L 85 15 L 100 30 L 115 15 L 115 40" 
            stroke="#00385a" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

      {/* House Body & Roof */}
      <path d="M 40 80 L 100 40 L 160 80" 
            stroke="#00385a" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="55" y="80" width="90" height="100" 
            stroke="#00385a" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Eyebrows (Small) */}
      <path d="M 78 110 Q 85 105 92 110" stroke="#00385a" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M 108 110 Q 115 105 122 110" stroke="#00385a" strokeWidth="4" fill="none" strokeLinecap="round" />
      
      {/* Eyes (Hollow circles) */}
      <circle cx="85" cy="125" r="4" stroke="#00385a" strokeWidth="3" fill="none" />
      <circle cx="115" cy="125" r="4" stroke="#00385a" strokeWidth="3" fill="none" />

      {/* Hands (Sticking out from sides) */}
      <path d="M 55 130 L 25 110" stroke="#00385a" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M 145 130 L 175 110" stroke="#00385a" strokeWidth="5" fill="none" strokeLinecap="round" />

      {/* Legs (Walking) */}
      <path d="M 85 180 L 85 215 L 75 215" stroke="#00385a" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 115 180 L 115 215 L 125 215" stroke="#00385a" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
```

### `src/features/home/sections/LegacyPropertyGrid.tsx`
```tsx
import React from 'react'

export default function LegacyPropertyGrid() {
  const baseUrl = (import.meta as any).env?.BASE_URL || '/'
  
  return (
    <section className="rounded-lg bg-white p-0 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] overflow-hidden">
      {/* 以 iframe 方式嵌入你上傳的完整房源清單 HTML，完全不改動其內文與排版 */}
      <iframe
        title="房源清單"
        src={`${baseUrl}maihouses_list_noheader.html`}
        style={{ width: '100%', border: 0, minHeight: '1400px' }}
        loading="lazy"
      />
    </section>
  )
}
```
