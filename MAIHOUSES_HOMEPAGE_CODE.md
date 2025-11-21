# MaiHouses Homepage Complete Code

This document consolidates the complete source code for the MaiHouses homepage, including the main layout, header, feature sections, and the embedded property list.

## 1. Main Page Layout

### `src/pages/Home.tsx`
The main entry point for the homepage route. It assembles the header, welcome bar, and feature sections.

```tsx
import { useEffect, useMemo, useState } from 'react'
import Header from '../components/Header/Header'
import HeroAssure from '../features/home/sections/HeroAssure'
import SmartAsk from '../features/home/sections/SmartAsk'
import CommunityTeaser from '../features/home/sections/CommunityTeaser'
// import PropertyGrid from '../features/home/sections/PropertyGrid'
import { getMeta } from '../services/api'
import { trackEvent } from '../services/uag'
import type { AppConfig, RuntimeOverrides } from '../app/config'
import { WarmWelcomeBar } from '../components/WarmWelcomeBar'

const cmp = (a: string, b: string) => {
  const pa = a.split('.').map((n) => +n || 0)
  const pb = b.split('.').map((n) => +n || 0)
  for (let i = 0; i < 3; i++) {
    const paVal = pa[i] ?? 0
    const pbVal = pb[i] ?? 0
    if (paVal < pbVal) return -1
    if (paVal > pbVal) return 1
  }
  return 0
}

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

  const q = useMemo(() => config.q, [config.q])
  const baseUrl = (import.meta as any).env?.BASE_URL || '/'
  const features = config.features || {}

  return (
    <>
      <Header />
      <WarmWelcomeBar />
      {/* Blue background layer for top section */}
      <div className="absolute top-0 left-0 w-full h-[320px] bg-[var(--brand)] -z-10" />
      
      {banner && (
        <div className="mx-auto mt-4 max-w-container rounded-[var(--r-md)] bg-[var(--warning)] p-3 text-[var(--fs-sm)] text-white">{banner}</div>
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
          <section className="rounded-lg bg-white p-0 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] overflow-hidden">
            {/* 以 iframe 方式嵌入你上傳的完整房源清單 HTML，完全不改動其內文與排版 */}
            <iframe
              title="房源清單"
              src={`${baseUrl}maihouses_list_noheader.html`}
              style={{ width: '100%', border: 0, minHeight: '1400px' }}
              loading="lazy"
            />
          </section>
        )}
      </main>
    </>
  )
}
```

## 2. Components

### 2.1 Header (`src/components/Header/Header.tsx`)
The top navigation bar with search, quick actions, and marquee.

```tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Header.css'

type QuickAction = {
  label: string
  href: string
  iconPath: string
  primary?: boolean
}

type FilterPill =
  | {
      id: string
      label: string
      icon: string
      type: 'link'
      href: string
    }
  | {
      id: string
      label: string
      icon: string
      type: 'modal'
      modal: { title: string; body: string }
    }

const marqueeSegments: Array<{ type: 'text' | 'highlight'; value: string }> = [
  { type: 'text', value: '買房這麼大的事，先到 ' },
  { type: 'highlight', value: '邁鄰居' },
  { type: 'text', value: ' 為未來的家查口碑、找評價，最放心！' },
]

const quickActions: QuickAction[] = [
  {
    label: '房地產表列',
    href: '/maihouses/property.html',
    iconPath: 'M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z',
  },
  {
    label: '登入',
    href: '/auth.html?mode=login',
    iconPath:
      'M10 17l5-5-5-5v3H3v4h7v3zm9-12h-8v2h8v10h-8v2h8a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z',
  },
  {
    label: '註冊',
    href: '/auth.html?mode=signup',
    iconPath: 'M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm-9 9a9 9 0 0 1 18 0z',
    primary: true,
  },
]

const filterPills: FilterPill[] = [
  {
    id: 'community',
    label: '社區評價',
    icon: '●',
    type: 'link',
    href: '/maihouses/community-wall_mvp.html',
  },
  {
    id: 'agent',
    label: '房仲專區',
    icon: '●',
    type: 'modal',
    modal: { title: '房仲專區', body: '專業房仲服務與物件推薦' },
  },
  {
    id: 'neighbor',
    label: '邁鄰居',
    icon: '●',
    type: 'modal',
    modal: { title: '邁鄰居', body: '認識您的鄰居，建立社區連結' },
  },
]

export default function Header() {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalContent, setModalContent] = useState({ title: '', body: '' })

  const openModal = (title: string, body: string) => {
    setModalContent({ title, body })
    setModalOpen(true)
  }

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <div className="brand">
            <div className="mark" />
            <span className="brand-name">邁房子</span>
            <span className="brand-slogan">讓家，不只是地址</span>
          </div>
          <div className="auth">
            <nav className="mh-nav-right" aria-label="主要動作">
              {quickActions.map((action) => {
                const isStatic = action.href.includes('.html')
                const className = `mh-pill${action.primary ? ' mh-pill--primary' : ''}`
                const content = (
                  <>
                    <svg className="mh-icon" viewBox="0 0 24 24" aria-hidden="true">
                      <path d={action.iconPath} />
                    </svg>
                    <span className="mh-label">{action.label}</span>
                  </>
                )

                if (isStatic) {
                  return (
                    <a key={action.label} className={className} href={action.href}>
                      {content}
                    </a>
                  )
                }

                return (
                  <Link key={action.label} className={className} to={action.href}>
                    {content}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Panel 卡片 - 包含跑馬燈、搜索框、膠囊按鈕 */}
      <div className="panel">
        <div className="marquee-container" aria-live="polite">
          {marqueeSegments.map((segment, index) =>
            segment.type === 'highlight' ? (
              <b className="brand-highlight" key={segment.value + index}>
                {segment.value}
              </b>
            ) : (
              <span key={segment.value + index}>{segment.value}</span>
            )
          )}
        </div>

        <div className="search-container">
          {/* 主搜索框 */}
          <div className="search-box-modern">
            <label htmlFor="search-input" className="sr-only">
              搜尋框
            </label>
            <input
              type="text"
              id="search-input"
              name="search-query"
              className="search-input"
              placeholder="輸入社區名稱、地址或捷運站..."
              aria-label="搜尋框"
              onKeyDown={(e) => e.key === 'Enter' && console.log('Search triggered')}
            />
            <button className="search-btn-primary" onClick={() => console.log('Search triggered')}>
              搜索
            </button>
          </div>

          {/* 快速篩選膠囊按鈕 */}
          <div className="filter-pills">
            {filterPills.map((pill) => {
              if (pill.type === 'link') {
                return (
                  <a key={pill.id} href={pill.href} className="pill" style={{ textDecoration: 'none' }}>
                    <span className="pill-icon" aria-hidden="true">
                      {pill.icon}
                    </span>
                    {pill.label}
                  </a>
                )
              }

              return (
                <button
                  key={pill.id}
                  className="pill"
                  type="button"
                  onClick={() => openModal(pill.modal.title, pill.modal.body)}
                >
                  <span className="pill-icon" aria-hidden="true">
                    {pill.icon}
                  </span>
                  {pill.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalContent.title}</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>{modalContent.body}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

### 2.2 Warm Welcome Bar (`src/components/WarmWelcomeBar.tsx`)
A personalized greeting bar based on user mood and history.

```tsx
import React, { useEffect, useMemo, useState } from "react";
import { getMilestoneHint, getWarmTags, ensureFirstSeen, isWarmbarDismissedToday, dismissWarmbarToday, loadProfile } from "../stores/profileStore";
import { Events, track } from "../analytics/track";

const barStyle: React.CSSProperties = {
  width: "100%",
  background: "#F5F8FF",
  color: "#0a2246",
  fontSize: 14,
  lineHeight: "34px",
  height: 34,
  textAlign: "center",
  letterSpacing: "0.3px",
  borderBottom: "1px solid #E6ECFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
};
const linkBtn: React.CSSProperties = {
  padding: "2px 10px",
  borderRadius: 999,
  border: "1px solid #1749D7",
  background: "#1749D7",
  color: "#fff",
  cursor: "pointer",
  lineHeight: "24px",
  height: 26,
};
const ghostBtn: React.CSSProperties = {
  padding: "2px 10px",
  borderRadius: 999,
  border: "1px solid #C9D5FF",
  background: "#fff",
  color: "#1749D7",
  cursor: "pointer",
  lineHeight: "24px",
  height: 26,
};

export const WarmWelcomeBar: React.FC = () => {
  const [shouldShow, setShouldShow] = useState(false);
  const profile = loadProfile();
  const tags = useMemo(() => getWarmTags(3), []);
  const milestone = useMemo(() => getMilestoneHint(profile.milestones), [profile.milestones]);

  useEffect(() => {
    const { isFirstVisit } = ensureFirstSeen();
    const hasContent = (tags && tags.length > 0) || !!milestone || !!profile.lastMood;
    const ok = !isFirstVisit && !isWarmbarDismissedToday() && hasContent;
    setShouldShow(ok);
    if (ok) track(Events.WarmbarView, { tags, milestone: !!milestone, lastMood: profile.lastMood });
  }, [tags, milestone, profile.lastMood]);

  if (!shouldShow) return null;

  const greetByMood = (m?: string) => {
    if (m === "stress") return "最近辛苦了";
    if (m === "rest") return "慢慢來就好";
    return "好久不見";
  };

  const tagText = tags && tags.length > 0 ? `上次你提到「${tags.join("・")}」` : null;
  const leftText = milestone ? milestone : (tagText ? `${greetByMood(profile.lastMood)}，${tagText}` : `${greetByMood(profile.lastMood)}，這幾天過得怎麼樣`);

  const onContinue = () => {
    track(Events.WarmbarContinue, { tags, milestone: !!milestone });
    const seed = milestone
      ? "最近有點紀念日的感覺，想輕鬆聊聊。"
      : (tags && tags.length > 0 ? `還記得我們聊過 ${tags.join("、")}，你有新想法嗎？` : "想跟你聊聊近況～");
    window.dispatchEvent(new CustomEvent("mai:chat:start", { detail: { text: seed } }));
  };
  const onDismissToday = () => {
    dismissWarmbarToday();
    setShouldShow(false);
    track(Events.WarmbarDismiss, {});
  };

  return (
    <div style={barStyle} role="status" aria-live="polite">
      <span>{leftText}</span>
      <button style={linkBtn} onClick={onContinue}>接著聊</button>
      <button style={ghostBtn} onClick={onDismissToday}>今天不再顯示</button>
    </div>
  );
};
```

## 3. Feature Sections

### 3.1 Hero Assure (`src/features/home/sections/HeroAssure.tsx`)
Displays the transaction safety assurance steps.

```tsx
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './HeroAssure.css'

type StepStatus = 'done' | 'active' | 'upcoming'

type AssureStep = {
  title: string
  subtitle: string
  status: StepStatus
}

const progressValue = 62

const assureSteps: AssureStep[] = [
  { title: '已看屋', subtitle: '完成現場帶看與基本紀錄', status: 'done' },
  { title: '已出價', subtitle: '要約與條件已留痕', status: 'done' },
  { title: '雙向簽署', subtitle: '平台簽署，雙方可回溯查驗', status: 'active' },
  { title: '身分驗證', subtitle: 'KYC 驗證與黑名單檢核', status: 'upcoming' },
  { title: '金流通知', subtitle: '代收代付與異常監控', status: 'upcoming' },
  { title: '交屋驗屋', subtitle: '交付清單與驗屋紀錄', status: 'upcoming' },
]

const assureChips = ['流程即時更新', '可疑變更自動警示']

export default function HeroAssure() {
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={cardRef}
      className="hero-assure-card assure-card"
      aria-label="安心保證流程"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
      }}
    >
      <header className="head">
        <div className="ttl">
          <div className="shield">🔒</div>
          <div>
            <h3 className="title">安心保證流程</h3>
            <div className="subtitle">每一步都有紀錄與保障</div>
          </div>
        </div>
        <div className="pct">
          <div className="pct-chip" aria-label={`Progress: ${progressValue}%`}>
            <b>{progressValue}</b>
            <span>%</span>
          </div>
          <div className="pct-bar" aria-hidden="true">
            <i style={{ width: `${progressValue}%` }}></i>
          </div>
        </div>
      </header>

      <div className="body">
        <div className="steps">
          {assureSteps.map((step, index) => (
            <div
              className={`step${step.status !== 'upcoming' ? ` ${step.status}` : ''}`}
              key={`${step.title}-${step.status}`}
            >
              <div className="dot-wrap">
                <div className="dot"></div>
                {index < assureSteps.length - 1 && <div className="line"></div>}
              </div>
              <div className="cap">
                <div className="t">{step.title}</div>
                <div className="s">{step.subtitle}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="info" style={{ border: '1px dashed #00385a' }}>
          <div className="lock">✔</div>
          <div>
            <b style={{ color: '#00385a' }}>你的權益：</b>
            完成<b>身分驗證</b>並開啟<b>金流通知</b>；所有簽署與溝通都在平台留痕，可回溯可查證。
            <div className="chips">
              {assureChips.map((chip) => (
                <span 
                  className="chip" 
                  key={chip}
                  style={{ 
                    border: '1.5px solid #00385a',
                    color: '#00385a',
                    backgroundColor: 'rgba(0, 56, 90, 0.08)'
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="foot">
        <span className="hint">了解每一步保護了什麼</span>
        <Link to="/assure" className="btn" aria-label="Read more about the protection details">
          詳讀保障內容
        </Link>
      </footer>
    </section>
  )
}
```

### 3.2 Smart Ask (`src/features/home/sections/SmartAsk.tsx`)
The AI chat interface for property inquiries.

```tsx
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
      style={{ background: 'linear-gradient(135deg, #CCE0FF 0%, #E0EEFF 100%)' }}
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
                      ? 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)'
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
          id="smart-ask-input"
          name="smart-ask-query"
          type="text"
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
            background: 'var(--brand)',
            fontSize: 'var(--fs-sm)'
          }}
        >
          送出
        </button>
      </div>

      {!!reco.length && (
        <div className="mt-4 border-t pt-4" style={{ borderColor: '#E5EDF5' }}>
          <div className="mb-3">
            <div 
              className="text-[calc(var(--fs-base)+6px)] font-semibold md:text-[calc(var(--fs-base)+12px)] md:font-bold" 
              style={{ color: '#5A6C7D' }}
            >
              🏠 智能房源推薦
            </div>
            <div className="mt-1 text-xs" style={{ color: '#8A95A5' }}>
              依瀏覽行為與社區口碑輔助排序
            </div>
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
```

### 3.3 Community Teaser (`src/features/home/sections/CommunityTeaser.tsx`)
A section showing aggregated community reviews.

```tsx
export default function CommunityTeaser() {
	return (
		<section className="reviews-agg">
			<style>{`
				.reviews-agg{background:rgba(255,255,255,.96);backdrop-filter:blur(8px);border:1px solid #e8f0f8;border-radius:18px;padding:10px}
				.reviews-agg .header{display:flex;justify-content:space-between;align-items:center;gap:6px;margin-bottom:6px}
				.reviews-agg .title{font-size:18px;font-weight:800;margin:0;color:#00385a;letter-spacing:.3px}
				.reviews-agg .grid{display:grid;grid-template-columns:1fr;gap:8px}
				@media(min-width:560px){.reviews-agg .grid{grid-template-columns:1fr 1fr}}
				.reviews-agg .review{display:flex;gap:8px;border:1px solid #e8f0f8;border-radius:13px;padding:7px;background:#fff;position:relative}
				.reviews-agg .av2{width:34px;height:34px;border-radius:50%;background:rgba(0,56,90,.08);border:2px solid #00385a;display:flex;align-items:center;justify-content:center;font-weight:800;color:#00385a;font-size:17px;flex-shrink:0}
				.reviews-agg .name{font-weight:800;font-size:14.5px;color:#0a1f3f}
				.reviews-agg .tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:3px}
				.reviews-agg .tag{font-size:12px;padding:3px 8px;border-radius:999px;background:rgba(52,199,89,.12);border:1px solid rgba(52,199,89,.40);color:#0f6a23;font-weight:700}
				.reviews-agg p{margin:4px 0 0;font-size:14.5px;line-height:1.48;color:#00385a;font-weight:500}
				.reviews-agg .cta{margin-top:8px;display:flex;align-items:center;gap:10px;background:linear-gradient(90deg,rgba(52,199,89,.25),rgba(52,199,89,.12));border:1px solid rgba(52,199,89,.40);padding:12px 14px;border-radius:14px;font-weight:900;color:#0e3d1c;text-decoration:none;position:relative}
				.reviews-agg .cta .text{font-size:17px;letter-spacing:.3px}
				.reviews-agg .cta .pill{margin-left:auto;background:#0f6a23;color:#fff;border-radius:999px;font-size:14px;padding:8px 12px}
				/* 桌機：文字置中，膠囊固定最右側 */
				@media(min-width:900px){.reviews-agg .cta{justify-content:center}.reviews-agg .cta .text{margin:0 auto}.reviews-agg .cta .pill{position:absolute;right:14px;top:50%;transform:translateY(-50%);margin-left:0}}
				/* 桌機版置中：移除 margin-left:auto 改為水平置中；保留原本順序 */
				@media(min-width:900px){.reviews-agg .cta{text-align:center}}
				/* 手機版縮小字體 2px */
				@media(max-width:560px){.reviews-agg .cta .text{font-size:15px}.reviews-agg .cta .pill{font-size:12px;padding:7px 10px}}
			`}</style>

			<div className="header"><h3 className="title">社區評價（聚合）</h3></div>
			<div className="grid">
				<article className="review"><div className="av2">J</div><div><div className="name">J***｜景安和院 住戶 <span className="rating"><span className="star">★★★★★</span></span></div><div className="tags"><span className="tag">#物業/管理</span></div><p>公設維護得乾淨，假日草皮有人整理。之前反映停車動線，管委會一週內就公告改善。</p></div></article>
				<article className="review"><div className="av2">W</div><div><div className="name">W***｜松濤苑 住戶 <span className="rating"><span className="star">★★★★☆</span></span></div><div className="tags"><span className="tag">#噪音</span></div><p>住起來整體舒服，但臨路面向在上下班尖峰車聲明顯，喜靜者建議考慮中高樓層。</p></div></article>
				<article className="review"><div className="av2">L</div><div><div className="name">L***｜遠揚柏悅 住戶 <span className="rating"><span className="star">★★★★☆</span></span></div><div className="tags"><span className="tag">#漏水/壁癌</span></div><p>頂樓排水設計不錯，颱風天沒有積水。不過垃圾車時間稍晚，偶爾有下水道味。</p></div></article>
				<article className="review"><div className="av2">A</div><div><div className="name">A***｜華固名邸 住戶 <span className="rating"><span className="star">★★★★★</span></span></div><div className="tags"><span className="tag">#物業/管理</span></div><p>管理員很負責，包裹收發與公告都有效率；電梯偶爾故障但維修速度快。</p></div></article>
				<article className="review"><div className="av2">H</div><div><div className="name">H***｜寶輝花園廣場 住戶 <span className="rating"><span className="star">★★★☆☆</span></span></div><div className="tags"><span className="tag">#停車/車位</span></div><p>地下室車位轉彎半徑偏小，新手要多注意；平日夜間社區整體很安靜。</p></div></article>
				<article className="review"><div className="av2">K</div><div><div className="name">K***｜潤泰峰匯 住戶 <span className="rating"><span className="star">★★★★☆</span></span></div><div className="tags"><span className="tag">#採光/日照</span></div><p>採光好、通風佳，夏天不會太悶熱；但西曬戶下午還是會稍微熱一些。</p></div></article>
			</div>
			<a className="cta" href="/maihouses/community-wall_mvp.html" aria-label="點我看更多社區評價"><span className="text">👉 點我看更多社區評價</span><span className="pill">前往社區牆</span></a>
		</section>
	)
}
```

## 4. Embedded Property List

### `public/maihouses_list_noheader.html`
The HTML file embedded via iframe to display the property grid.

```html
<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>房源表列</title>
  <meta name="color-scheme" content="light">
  <style>
    :root{
      --brand-700:#00385a;
      --brand-600:#00385a;
      --brand-500:#004E7C;
      --brand-300:#7EA5FF;
      --brand-50:#F6F9FF;
      --ink-900:#0A2246;
      --ink-700:#2A2F3A;
      --ink-600:#6C7B91;
      --line:#E6EDF7;
      --accent-rose:#E88282;
      --accent-peach:#FFD9C7;
      --bg:#F5F7FC;
      --card:#fff;
    }
    *{box-sizing:border-box}
    html,body{height:100%}
    body{
      margin:0;background:linear-gradient(180deg, #F8FAFF 0%, #F5F7FC 100%);
      color:var(--ink-900);
      font-family: system-ui,-apple-system,"PingFang TC","Noto Sans TC","Microsoft JhengHei",Segoe UI,Roboto,Helvetica,Arial,sans-serif;
      -webkit-font-smoothing:antialiased;
      -moz-osx-font-smoothing:grayscale;
    }
    .container{max-width:1120px;margin:0 auto;padding:16px}

    /* Grid */
    .grid{display:grid;grid-template-columns:1fr;gap:18px}
    @media (min-width:720px){ .grid{grid-template-columns:1fr 1fr} }
    @media (min-width:1024px){ .grid{grid-template-columns:1fr 1fr 1fr} }

    /* House Card */
    .house-card{
      background:var(--card);
      border:1px solid var(--line);
      border-radius:16px;
      overflow:hidden;
      position:relative;
      transition: box-shadow .18s ease, transform .08s ease, border-color .2s ease;
      box-shadow: 0 0 0 rgba(0,0,0,0);
      isolation:isolate;
    }
    .house-card::after{
      content:"";
      position:absolute; inset:0; pointer-events:none;
      background: radial-gradient(60% 60% at 80% -10%, rgba(23,73,215,0.12), transparent 60%);
      opacity:.8;
    }
    .house-card:hover{
      box-shadow:0 10px 26px rgba(13,39,94,0.12);
      transform:translateY(-2px);
      border-color: rgba(23,73,215,0.22);
    }
    .house-cover{aspect-ratio:4/3;background:#e9ecf5;display:block;position:relative;overflow:hidden}
    .house-cover img{width:100%;height:100%;object-fit:cover;display:block;transform:scale(1.0);transition: transform .6s cubic-bezier(.2,.65,.2,1)}
    .house-card:hover .house-cover img{transform:scale(1.04)}
    .badge{
      position:absolute;left:10px;top:10px;
      background:rgba(0,0,0,0.76);color:#fff;font-size:12px;font-weight:800;
      padding:4px 8px;border-radius:999px;letter-spacing:.2px;
      box-shadow:0 4px 10px rgba(0,0,0,.18);
    }

  .house-body{padding:12px 12px 14px}
  /* 房源卡標題：對齊社區評價主標題尺寸（16px / 800） */
    .title{font-weight:800;font-size:16px;line-height:1.35;margin:2px 0 8px;letter-spacing:.3px;color:var(--ink-900)}
    @media(min-width:1024px){
      .title{font-size:21px}
    }
    /* 智能房源推薦：標題（品牌藍，僅此區塊樣式） */
    .mh-reco-title{display:flex;align-items:center;gap:10px;margin:18px 0 12px}
    .mh-reco-title__pill{
      display:inline-flex;align-items:center;gap:8px;
      padding:6px 12px;border:1px solid #E6EDF7;border-radius:999px;
      background:linear-gradient(180deg,#FFFFFF,#F6F9FF);
      color:#00385a;font-weight:900;font-size:14px;letter-spacing:.2px;
    }
    .mh-reco-title__icon{
      width:18px;height:18px;border-radius:6px;display:grid;place-items:center;
      background:linear-gradient(180deg,#00385a,#004E7C);color:#fff;font-size:12px;font-weight:900;
      box-shadow:0 2px 6px rgba(0, 56, 90,.18)
    }
    .mh-reco-title__text{line-height:1;font-size:16px}
    .mh-reco-title__sub{margin-left:6px;font-size:14px;color:#6C7B91;font-weight:700}
    @media (min-width:768px){
      .mh-reco-title__text{font-size:18px;font-weight:bold}
    }
    .mh-reco-title__underline{
      height:6px;border-radius:999px;flex:1;
      background:linear-gradient(90deg,#00385a,#004E7C,#7EA5FF);
      background-size:200% 100%;opacity:.25;margin-left:10px;
      animation:mhRecoBar 6s linear infinite;
    }
    @keyframes mhRecoBar{0%{background-position:0% 0}100%{background-position:200% 0}}
    .meta{display:flex;flex-wrap:wrap;gap:8px;align-items:center;color:var(--ink-600);font-size:13px;margin-bottom:6px}
    .pill{
      padding:2px 10px;border-radius:999px;
      background:var(--brand-50);
      border:1px solid var(--line);font-weight:800;color:#2a2f3a;
      transition: transform .12s ease, box-shadow .12s ease, background .2s ease;
    }
    .house-card:hover .pill{ transform: translateY(-1px); box-shadow:0 4px 10px rgba(0, 56, 90,.10) }

    .price{font-size:19px;font-weight:900;color:#111;margin:8px 0 4px;letter-spacing:.2px}
    .loc{font-size:13px;color:var(--ink-600)}

    /* Reviews */
    .reviews-mini{
      margin-top:10px;padding:10px 12px;border:1px solid var(--line);
      border-radius:12px;background:linear-gradient(180deg, var(--brand-50), #ffffff);
    }
    .reviews-mini__title{
      display:flex;align-items:center;gap:8px;
      font-size:13px;font-weight:900;margin-bottom:8px;color:rgba(0,0,0,.86);
    }
    .reviews-mini__title::before{
      content:"★";font-size:12px;line-height:1;
      color:var(--brand-600);
      filter: drop-shadow(0 1px 0 rgba(0, 56, 90,.12));
    }
    .reviews-mini__item{display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-top:1px dashed rgba(0,0,0,.08)}
    .reviews-mini__item:first-of-type{border-top:none}
    .reviews-mini__avatar{
      width:30px;height:30px;border-radius:50%;
      display:grid;place-items:center;font-size:12px;font-weight:900;
      background:linear-gradient(180deg,#F2F5F8,#E1E6EB);color:var(--brand-600);flex:0 0 auto;
      box-shadow: inset 0 0 0 1px rgba(0, 56, 90,.15);
    }
    .reviews-mini__content{flex:1 1 auto}
    .reviews-mini__head{display:flex;align-items:center;gap:6px;margin-bottom:2px;font-size:12px;color:rgba(0,0,0,.62)}
    .reviews-mini__name{font-weight:900;color:rgba(0,0,0,.86)}
    .reviews-mini__dot{width:4px;height:4px;border-radius:50%;background:rgba(0,0,0,.18);display:inline-block}
    .reviews-mini__tag{padding:2px 8px;border-radius:999px;background:rgba(0, 56, 90,.10);color:var(--brand-700);font-weight:900}
    .reviews-mini__text{font-size:13px;line-height:1.6;color:rgba(0,0,0,.86)}

    .reviews-mini__more{
      margin-top:10px;width:100%;padding:10px 12px;border-radius:12px;
      border:1px solid rgba(0, 56, 90,.28);
      background:linear-gradient(180deg,#ffffff, #F5F7FA);
      cursor:pointer;font-size:13px;font-weight:900;color:var(--brand-600);
      transition: background .15s ease, transform .06s ease, box-shadow .18s ease;
    }
    .reviews-mini__more:hover{background:linear-gradient(180deg,#fff, #E8F0FF);box-shadow:0 6px 14px rgba(0, 56, 90,.18)}
    .reviews-mini__more:active{transform:translateY(1px)}

  </style>
</head>
<body>
  <div class="container">
    <!-- 貼在房源清單上方 -->
    <div class="mh-reco-title" aria-label="智能房源推薦">
      <div class="mh-reco-title__pill">
        <span class="mh-reco-title__icon">★</span>
        <span class="mh-reco-title__text">〔智能房源推薦〕</span>
        <span class="mh-reco-title__sub">依瀏覽行為與社區口碑輔助排序</span>
      </div>
      <div class="mh-reco-title__underline" aria-hidden="true"></div>
    </div>
    <main id="listings">
      <section class="grid" aria-label="房源清單">

        <!-- 1 -->
        <article class="house-card">
          <a class="house-cover" href="#">
            <img src="https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=1600&auto=format&fit=crop" alt="物件封面">
            <span class="badge">捷運 5 分鐘</span>
          </a>
          <div class="house-body">
            <div class="title">新板特區｜三房含車位，採光面中庭</div>
            <div class="meta">
              <span class="pill">34.2 坪</span>
              <span class="pill">3 房 2 廳</span>
              <span class="pill">高樓層</span>
            </div>
            <div class="price">NT$ 1,288 萬</div>
            <div class="loc">新北市板橋區 · 中山路一段</div>
            <div class="reviews-mini">
              <div class="reviews-mini__title">住戶真實留言</div>
              <div class="reviews-mini__item">
                <div class="reviews-mini__avatar">A</div>
                <div class="reviews-mini__content">
                  <div class="reviews-mini__head">
                    <span class="reviews-mini__name">王小姐 · 3年住戶</span>
                    <span class="reviews-mini__dot"></span>
                    <span class="reviews-mini__tag">管理到位</span>
                  </div>
                  <div class="reviews-mini__text">管委反應快，公設打理乾淨，晚上也安靜好睡。</div>
                </div>
              </div>
              <div class="reviews-mini__item">
                <div class="reviews-mini__avatar">B</div>
                <div class="reviews-mini__content">
                  <div class="reviews-mini__head">
                    <span class="reviews-mini__name">林先生 · 屋主</span>
                    <span class="reviews-mini__dot"></span>
                    <span class="reviews-mini__tag">車位好停</span>
                  </div>
                  <div class="reviews-mini__text">坡道寬、指示清楚，下班回家不太需要繞圈找位。</div>
                </div>
              </div>
              <button class="reviews-mini__more" type="button">註冊後看更多評價</button>
            </div>
          </div>
        </article>

        <!-- 2 -->
        <article class="house-card">
          <a class="house-cover" href="#">
            <img src="https://images.unsplash.com/photo-1575517111478-7f6afd0973db?q=80&w=1600&auto=format&fit=crop" alt="物件封面">
            <span class="badge">社區中庭</span>
          </a>
          <div class="house-body">
            <div class="title">松山民生社區｜邊間大兩房，採光佳</div>
            <div class="meta">
              <span class="pill">28.6 坪</span>
              <span class="pill">2 房 2 廳</span>
              <span class="pill">可寵物</span>
            </div>
            <div class="price">NT$ 1,052 萬</div>
            <div class="loc">台北市松山區 · 民生東路五段</div>
            <div class="reviews-mini">
              <div class="reviews-mini__title">住戶真實留言</div>
              <div class="reviews-mini__item">
                <div class="reviews-mini__avatar">C</div>
                <div class="reviews-mini__content">
                  <div class="reviews-mini__head">
                    <span class="reviews-mini__name">陳太太 · 5年住戶</span>
                    <span class="reviews-mini__dot"></span>
                    <span class="reviews-mini__tag">鄰里友善</span>
                  </div>
                  <div class="reviews-mini__text">警衛熱心、包裹代收確實，社區群組很活躍。</div>
                </div>
              </div>
              <div class="reviews-mini__item">
                <div class="reviews-mini__avatar">D</div>
                <div class="reviews-mini__content">
                  <div class="reviews-mini__head">
                    <span class="reviews-mini__name">賴先生 · 上班族</span>
                    <span class="reviews-mini__dot"></span>
                    <span class="reviews-mini__tag">生活便利</span>
                  </div>
                  <div class="reviews-mini__text">走路 3 分鐘有超市與市場，下班買菜很方便。</div>
                </div>
              </div>
              <button class="reviews-mini__more" type="button">註冊後看更多評價</button>
            </div>
          </div>
        </article>

        <!-- 3 -->
        <article class="house-card">
          <a class="house-cover" href="#">
            <img src="https://images.unsplash.com/photo-1515263487990-61b07816b324?q=80&w=1600&auto=format&fit=crop" alt="物件封面">
            <span class="badge">學區宅</span>
          </a>
          <div class="house-body">
            <div class="title">新店七張｜電梯二房，附機車位</div>
            <div class="meta">
              <span class="pill">22.1 坪</span>
              <span class="pill">2 房 1 廳</span>
              <span class="pill">低公設比</span>
            </div>
            <div class="price">NT$ 838 萬</div>
            <div class="loc">新北市新店區 · 北新路二段</div>
            <div class="reviews-mini">
              <div class="reviews-mini__title">住戶真實留言</div>
              <div class="reviews-mini__item">
                <div class="reviews-mini__avatar">E</div>
                <div class="reviews-mini__content">
                  <div class="reviews-mini__head">
                    <span class="reviews-mini__name">張小姐 · 上班族</span>
                    <span class="reviews-mini__dot"></span>
                    <span class="reviews-mini__tag">通勤方便</span>
                  </div>
                  <div class="reviews-mini__text">步行到捷運七張站約 6 分鐘，雨天也有騎樓遮蔽。</div>
                </div>
              </div>
              <div class="reviews-mini__item">
                <div class="reviews-mini__avatar">F</div>
                <div class="reviews-mini__content">
                  <div class="reviews-mini__head">
                    <span class="reviews-mini__name">李先生 · 家長</span>
                    <span class="reviews-mini__dot"></span>
                    <span class="reviews-mini__tag">學區完整</span>
                  </div>
                  <div class="reviews-mini__text">附近幼兒園到國中選擇多，放學接送動線順。</div>
                </div>
              </div>
              <button class="reviews-mini__more" type="button">註冊後看更多評價</button>
            </div>
          </div>
        </article>

        <!-- 4 -->
        <article class="house-card">
          <a class="house-cover" href="#">
            <img src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1600&auto=format&fit=crop" alt="物件封面">
            <span class="badge">河岸景觀</span>
          </a>
          <div class="house-body">
            <div class="title">大直美堤｜景觀三房，沁涼通風</div>
            <div class="meta">
              <span class="pill">36.8 坪</span>
              <span class="pill">3 房 2 廳</span>
              <span class="pill">邊間</span>
            </div>
            <div class="price">NT$ 1,560 萬</div>
            <div class="loc">台北市中山區 · 敦化北路</div>
            <div class="reviews-mini">
              <div class="reviews-mini__title">住戶真實留言</div>
              <div class="reviews-mini__item">
                <div class="reviews-mini__avatar">G</div>
                <div class="reviews-mini__content">
                  <div class="reviews-mini__head">
                    <span class="reviews-mini__name">蘇先生 · 住戶</span>
                    <span class="reviews-mini__dot"></span>
                    <span class="reviews-mini__tag">景觀佳</span>
                  </div>
                  <div class="reviews-mini__text">客廳看河景很放鬆，夏天自然風就很涼。</div>
                </div>
              </div>
              <div class="reviews-mini__item">
                <div class="reviews-mini__avatar">H</div>
                <div class="reviews-mini__content">
                  <div class="reviews-mini__head">
                    <span class="reviews-mini__name">高小姐 · 通勤族</span>
                    <span class="reviews-mini__dot"></span>
                    <span class="reviews-mini__tag">交通便利</span>
                  </div>
                  <div class="reviews-mini__text">離公車站 2 分鐘，轉乘捷運時間可控。</div>
                </div>
              </div>
              <button class="reviews-mini__more" type="button">註冊後看更多評價</button>
            </div>
          </div>
        </article>

        <!-- 5 -->
        <article class="house-card">
          <a class="house-cover" href="#">
            <img src="https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1600&auto=format&fit=crop" alt="物件封面">
            <span class="badge">社區花園</span>
          </a>
          <div class="house-body">
            <div class="title">內湖東湖｜雙面採光，小家庭首選</div>
            <div class="meta">
              <span class="pill">27.4 坪</span>
              <span class="pill">2 房 2 廳</span>
              <span class="pill">含機車位</span>
            </div>
            <div class="price">NT$ 968 萬</div>
            <div class="loc">台北市內湖區 · 康寧路三段</div>
            <div class="reviews-mini">
              <div class="reviews-mini__title">住戶真實留言</div>
              <div class="reviews-mini__item">
                <div class="reviews-mini__avatar">I</div>
                <div class="reviews-mini__content">
                  <div class="reviews-mini__head">
                    <span class="reviews-mini__name">許太太 · 家長</span>
                    <span class="reviews-mini__dot"></span>
                    <span class="reviews-mini__tag">公園多</span>
                  </div>
                  <div class="reviews-mini__text">社區旁邊就有親子公園，假日散步很方便。</div>
                </div>
              </div>
              <div class="reviews-mini__item">
                <div class="reviews-mini__avatar">J</div>
                <div class="reviews-mini__content">
                  <div class="reviews-mini__head">
                    <span class="reviews-mini__name">黃先生 · 工程師</span>
                    <span class="reviews-mini__dot"></span>
                    <span class="reviews-mini__tag">環境安靜</span>
                  </div>
                  <div class="reviews-mini__text">臨巷內，夜間車流少，對面鄰居素質也不錯。</div>
                </div>
              </div>
              <button class="reviews-mini__more" type="button">註冊後看更多評價</button>
            </div>
          </div>
        </article>

        <!-- 6 -->
        <article class="house-card">
          <a class="house-cover" href="#">
            <img src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1600&auto=format&fit=crop" alt="物件封面">
            <span class="badge">捷運生活圈</span>
          </a>
          <div class="house-body">
            <div class="title">中和橋和站｜採光兩房，低管理費</div>
            <div class="meta">
              <span class="pill">24.9 坪</span>
              <span class="pill">2 房 1 廳</span>
              <span class="pill">社區新</span>
            </div>
            <div class="price">NT$ 898 萬</div>
            <div class="loc">新北市中和區 · 中和路</div>
            <div class="reviews-mini">
              <div class="reviews-mini__title">住戶真實留言</div>
              <div class="reviews-mini__item">
                <div class="reviews-mini__avatar">K</div>
                <div class="reviews-mini__content">
                  <div class="reviews-mini__head">
                    <span class="reviews-mini__name">簡小姐 · 新婚</span>
                    <span class="reviews-mini__dot"></span>
                    <span class="reviews-mini__tag">費用透明</span>
                  </div>
                  <div class="reviews-mini__text">管委會公告清楚，管理費與車位費用都公開透明。</div>
                </div>
              </div>
              <div class="reviews-mini__item">
                <div class="reviews-mini__avatar">L</div>
                <div class="reviews-mini__content">
                  <div class="reviews-mini__head">
                    <span class="reviews-mini__name">羅先生 · 通勤族</span>
                    <span class="reviews-mini__dot"></span>
                    <span class="reviews-mini__tag">通勤穩定</span>
                  </div>
                  <div class="reviews-mini__text">尖峰等車可控，公車轉乘動線順，延誤較少。</div>
                </div>
              </div>
              <button class="reviews-mini__more" type="button">註冊後看更多評價</button>
            </div>
          </div>
        </article>

      </section>
    </main>
  </div>
</body>
</html>
```
