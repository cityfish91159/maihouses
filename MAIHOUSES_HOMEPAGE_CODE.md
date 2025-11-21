# MaiHouses Homepage Code (v11.6 Refactor & Optimization)

> **Version**: 11.6
> **Date**: 2025-11-21
> **Changes**:
> - **Architecture**: Split monolithic sections into smaller, reusable components (Container/Presentational pattern).
> - **Components**: Created `HomeCard`, `ReviewCard`, `HeroStep`, `ChatBubble`, `SuggestionChips`, `RecommendationCard`.
> - **Logic**: Extracted `SmartAsk` logic into `useSmartAsk` hook.
> - **Styling**: Standardized styles using Tailwind CSS and `HomeCard` wrapper; removed legacy CSS files.
> - **Performance**: Implemented `React.memo` for list items to prevent unnecessary re-renders.
> - **Cleanup**: Removed `LegacyPropertyGrid` and replaced with refactored `PropertyGrid`.

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
  
  /* 功能色 */
  --success: #34c759;
  --warning: #ff9b4a;
  --error: #ff3b30;
  
  /* 邊框與陰影 */
  --border-light: #e6edf7;
  --border-default: #d1e3ff;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-hover: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  
  /* 圓角 */
  --r-sm: 12px;
  --r-md: 16px;
  --r-lg: 24px;
  --r-pill: 9999px;
}

body {
  background-color: var(--bg-page);
  color: var(--text-primary);
  font-family: system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* Utility Classes */
.max-w-container {
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}
```

## 2. Main Page (`src/pages/Home.tsx`)

```tsx
import { useEffect, useMemo, useState } from 'react'
import Header from '../components/Header/Header'
import HeroAssure from '../features/home/sections/HeroAssure'
import SmartAsk from '../features/home/sections/SmartAsk'
import CommunityTeaser from '../features/home/sections/CommunityTeaser'
import PropertyGrid from '../features/home/sections/PropertyGrid'
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
      <div className="absolute top-0 left-0 w-full h-[420px] bg-gradient-to-b from-brand to-brand-light -z-10" />
      
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
          <PropertyGrid />
        )}
      </main>
    </>
  )
}
```

## 3. Sections

### 3.1 Hero Assure (`src/features/home/sections/HeroAssure.tsx`)

```tsx
import React from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import MascotHouse from '../../../components/MascotHouse';
import { HERO_STEPS } from '../../../constants/data';
import { HomeCard } from '../components/HomeCard';
import { HeroStep } from '../components/HeroStep';

export default function HeroAssure() {
  return (
    <HomeCard variant="hero" className="relative overflow-hidden group/container">
      
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
            <HeroStep 
              key={step.id} 
              {...step} 
              index={index} 
              isLast={index === HERO_STEPS.length - 1} 
            />
          ))}
        </div>
      </div>
    </HomeCard>
  );
}
```

### 3.2 Smart Ask (`src/features/home/sections/SmartAsk.tsx`)

```tsx
import React, { useState, useRef, useEffect } from 'react';
import { useSmartAsk } from '../hooks/useSmartAsk';
import { ChatBubble } from '../components/ChatBubble';
import { SuggestionChips } from '../components/SuggestionChips';
import { EmptyState } from '../components/EmptyState';
import { RecommendationCard } from '../components/RecommendationCard';
import { HomeCard } from '../components/HomeCard';

export default function SmartAsk() {
  const { messages, reco, loading, totalTokens, sendMessage } = useSmartAsk();
  const [input, setInput] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionSelect = (text: string) => {
    setInput(text);
  };

  return (
    <HomeCard variant="ai">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="size-2.5 rounded-full bg-brand shadow-[0_0_8px_rgba(74,144,226,0.6)]" />
          <h3 className="truncate font-black text-slate-800 text-[clamp(18px,2.2vw,21px)]">
            社區鄰居管家
          </h3>
        </div>
        <div className="w-14" aria-hidden="true" />
        
        <SuggestionChips onSelect={handleSuggestionSelect} />
        
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
          <EmptyState />
        ) : (
          messages.map((m, i) => (
            <ChatBubble key={i} message={m} />
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
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="rounded-full px-5 py-2 font-medium text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 bg-brand text-sm"
        >
          送出
        </button>
      </div>

      {!!reco.length && (
        <div className="mt-4 border-t border-border-light pt-4">
          <div className="mb-3">
            <div className="text-[calc(var(--fs-base)+6px)] font-semibold md:text-[calc(var(--fs-base)+12px)] md:font-bold text-slate-500">
              🏠 智能房源推薦
            </div>
            <div className="mt-1 text-xs text-slate-400">
              依瀏覽行為與社區口碑輔助排序
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {reco.map((p) => (
              <RecommendationCard key={p.id} property={p} />
            ))}
          </div>
        </div>
      )}
    </HomeCard>
  );
}
```

### 3.3 Community Teaser (`src/features/home/sections/CommunityTeaser.tsx`)

```tsx
import { COMMUNITY_REVIEWS } from '../../../constants/data'
import { HomeCard } from '../components/HomeCard'
import { ReviewCard } from '../components/ReviewCard'

export default function CommunityTeaser() {
  return (
    <HomeCard className="bg-white/96 backdrop-blur-md p-2.5">
      <div className="flex justify-between items-center gap-1.5 mb-3 px-1">
        <h3 className="text-lg font-extrabold m-0 text-brand tracking-wide">社區評價（聚合）</h3>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {COMMUNITY_REVIEWS.map((review) => (
          <ReviewCard key={review.id} {...review} />
        ))}
      </div>
      <a 
        className="mt-3 flex items-center gap-2.5 bg-gradient-to-r from-success/25 to-success/10 border border-success/40 p-3 rounded-[var(--r-sm)] font-black text-success no-underline relative lg:justify-center lg:text-center group hover:shadow-md transition-all duration-200" 
        href="/maihouses/community-wall_mvp.html" 
        aria-label="點我看更多社區評價"
      >
        <span className="text-[17px] tracking-wide lg:mx-auto max-sm:text-[15px]">👉 點我看更多社區評價</span>
        <span className="ml-auto bg-success text-white rounded-full text-sm px-3 py-2 lg:absolute lg:right-[14px] lg:top-1/2 lg:-translate-y-1/2 lg:ml-0 max-sm:text-xs max-sm:px-2.5 max-sm:py-[7px] group-hover:bg-success/90 transition-colors shadow-sm">
          前往社區牆
        </span>
      </a>
    </HomeCard>
  )
}
```

### 3.4 Property Grid (`src/features/home/sections/PropertyGrid.tsx`)

```tsx
import React, { useEffect, useState } from 'react';
import { getProperties } from '../../../services/api';
import { trackEvent } from '../../../services/analytics';
import type { PropertyCard } from '../../../types';
import { HomeCard } from '../components/HomeCard';
import { RecommendationCard } from '../components/RecommendationCard';

export default function PropertyGrid({ q }: { q?: string }) {
  const [items, setItems] = useState<PropertyCard[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 8;
  const maxPage = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    setPage(1);
  }, [q]);

  useEffect(() => {
    getProperties(page, pageSize, q).then((res) => {
      if (res.ok && res.data) {
        setItems(res.data.items);
        setTotal(res.data.total);
      } else {
        setItems([]);
        setTotal(0);
      }
    });
  }, [page, q]);

  const memberCTA = (id: string) => {
    trackEvent('card_member_cta', '/', id);
    location.hash = '#/auth/register';
  };

  return (
    <HomeCard>
      <h3 className="mb-2 font-black text-text-primary text-[clamp(19px,2.4vw,22px)] mt-0">
        精選房源
      </h3>

      {items.length === 0 ? (
        <div className="py-16 text-center text-text-secondary text-base">
          {q ? (
            <>
              找不到含「<span className="font-semibold text-brand">{q}</span>」的物件
            </>
          ) : (
            '暫無物件，稍後再試'
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <RecommendationCard key={item.id} property={item} />
          ))}
        </div>
      )}
      
      {/* Pagination Controls */}
      {maxPage > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded border border-border-light disabled:opacity-50 hover:bg-bg-soft transition-colors"
          >
            上一頁
          </button>
          <span className="px-3 py-1 text-text-secondary">
            {page} / {maxPage}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
            disabled={page === maxPage}
            className="px-3 py-1 rounded border border-border-light disabled:opacity-50 hover:bg-bg-soft transition-colors"
          >
            下一頁
          </button>
        </div>
      )}
    </HomeCard>
  );
}
```

## 4. Components (`src/features/home/components/`)

### 4.1 HomeCard (`src/features/home/components/HomeCard.tsx`)

```tsx
import React from 'react';
import { cn } from '../../../lib/utils';

interface HomeCardProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'default' | 'hero' | 'ai';
  children: React.ReactNode;
}

export const HomeCard = React.forwardRef<HTMLElement, HomeCardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const baseStyles = "transition-all duration-200 bg-white border border-border-light";
    
    const variants = {
      default: "mh-card p-4 md:p-6",
      hero: "mh-card mh-card--hero p-6 md:p-10 bg-gradient-to-br from-white to-brand-50",
      ai: "mh-ai-card"
    };

    return (
      <section
        ref={ref}
        className={cn(baseStyles, variants[variant], className)}
        {...props}
      >
        {children}
      </section>
    );
  }
);

HomeCard.displayName = 'HomeCard';
```

### 4.2 ReviewCard (`src/features/home/components/ReviewCard.tsx`)

```tsx
import React from 'react';

interface ReviewProps {
  id: string;
  name: string;
  rating: number;
  tags: string[];
  content: string;
}

export const ReviewCard = React.memo(({ id, name, rating, tags, content }: ReviewProps) => {
  return (
    <article className="flex gap-2 border border-border-light rounded-[var(--r-sm)] p-3 bg-white relative hover:shadow-md transition-shadow duration-200">
      <div className="w-[34px] h-[34px] rounded-full bg-brand/10 border-2 border-brand flex items-center justify-center font-extrabold text-brand text-[17px] shrink-0">
        {id}
      </div>
      <div>
        <div className="font-extrabold text-sm text-text-ink flex items-center gap-1">
          {name} 
          <span className="text-yellow-400 text-xs" aria-label={`${rating} stars`}>
            {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
          </span>
        </div>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {tags.map(tag => (
            <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-success/10 border border-success/40 text-success font-bold">
              {tag}
            </span>
          ))}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-brand font-medium">
          {content}
        </p>
      </div>
    </article>
  );
});

ReviewCard.displayName = 'ReviewCard';
```

### 4.3 HeroStep (`src/features/home/components/HeroStep.tsx`)

```tsx
import React from 'react';
import { CheckCircle2, LucideIcon } from 'lucide-react';

interface HeroStepProps {
  id: string;
  index: number;
  title: string;
  desc: string;
  icon: LucideIcon;
  isLast: boolean;
}

export const HeroStep = React.memo(({ index, title, desc, icon: Icon, isLast }: HeroStepProps) => {
  return (
    <div className="group relative flex md:flex-col items-center md:items-center gap-4 md:gap-4 p-2 rounded-xl hover:bg-bg-soft transition-colors duration-300 cursor-default">
      {/* Icon Circle */}
      <div className="relative z-10 flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-white border-2 border-border-light text-text-muted flex items-center justify-center group-hover:border-brand group-hover:text-brand group-hover:scale-110 transition-all duration-300 shadow-sm">
          <Icon size={20} />
        </div>
        {/* Step Number Badge */}
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
          {index + 1}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 md:text-center">
        <h4 className="text-base font-black text-text-ink mb-1 group-hover:text-brand transition-colors">
          {title}
        </h4>
        <p className="text-xs text-text-muted font-medium leading-relaxed">
          {desc}
        </p>
      </div>

      {/* Mobile Arrow (Visual aid) */}
      <div className="md:hidden ml-auto text-border-light group-hover:text-brand transition-colors">
        {!isLast && <CheckCircle2 size={16} className="opacity-0 group-hover:opacity-20"/>}
      </div>
    </div>
  );
});

HeroStep.displayName = 'HeroStep';
```

### 4.4 ChatBubble (`src/features/home/components/ChatBubble.tsx`)

```tsx
import React, { memo } from 'react';
import { cn } from '../../../lib/utils';
import type { AiMessage } from '../../../types';

interface ChatBubbleProps {
  message: AiMessage;
}

export const ChatBubble = memo(({ message }: ChatBubbleProps) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={cn("flex animate-[fadeIn_0.3s_ease-out]", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "shadow-sm min-w-0 max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 text-[15px]",
          isUser 
            ? "bg-brand text-white rounded-tr-sm" 
            : "bg-white border border-border-light text-text-primary rounded-tl-sm"
        )}
      >
        <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
        {message.timestamp && (
          <div className={cn("mt-1.5 text-xs", isUser ? "text-white/70" : "text-text-tertiary")}>
            {new Date(message.timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
});

ChatBubble.displayName = 'ChatBubble';
```

### 4.5 SuggestionChips (`src/features/home/components/SuggestionChips.tsx`)

```tsx
import React, { memo } from 'react';
import { QUICK_QUESTIONS } from '../../../constants/data';

interface SuggestionChipsProps {
  onSelect: (text: string) => void;
}

export const SuggestionChips = memo(({ onSelect }: SuggestionChipsProps) => {
  return (
    <div className="flex flex-wrap items-center gap-1 md:flex-nowrap min-w-fit">
      {QUICK_QUESTIONS.map((q) => (
        <button
          key={q}
          data-text={q}
          className="cursor-pointer whitespace-nowrap rounded-full border border-border-default bg-white px-2 py-1.5 text-xs font-medium text-text-secondary transition-all duration-200 hover:border-brand hover:shadow-sm"
          onClick={() => onSelect(q)}
          aria-label={`快速輸入 ${q}`}
        >
          {q}
        </button>
      ))}
    </div>
  );
});

SuggestionChips.displayName = 'SuggestionChips';
```

### 4.6 RecommendationCard (`src/features/home/components/RecommendationCard.tsx`)

```tsx
import React, { memo } from 'react';
import type { PropertyCard } from '../../../types';

interface RecommendationCardProps {
  property: PropertyCard;
}

export const RecommendationCard = memo(({ property }: RecommendationCardProps) => {
  return (
    <article
      className="rounded-xl bg-white p-3 transition-all hover:-translate-y-1 hover:shadow-lg border border-border-light hover:border-brand"
    >
      <div
        className="mb-2 h-28 rounded-md bg-cover bg-center"
        style={{ backgroundImage: `url(${property.cover})` }}
        aria-hidden="true"
      />
      <div className="mb-1 font-semibold text-text-primary text-sm line-clamp-1">
        {property.title}
      </div>
      <div className="mb-2 text-xs text-text-secondary">{property.communityName}</div>
      <div className="mb-2 font-bold text-brand text-base">
        NT$ {property.price} 萬
      </div>
      <a
        href={`#/community/${property.communityId}/wall`}
        className="inline-block rounded-full px-3 py-1.5 text-xs font-medium text-white transition-all hover:-translate-y-0.5 bg-gradient-to-br from-brand to-brand-light"
        aria-label="前往社區牆"
      >
        看社區牆 →
      </a>
    </article>
  );
});

RecommendationCard.displayName = 'RecommendationCard';
```

### 4.7 EmptyState (`src/features/home/components/EmptyState.tsx`)

```tsx
import React, { memo } from 'react';

export const EmptyState = memo(() => {
  return (
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
  );
});

EmptyState.displayName = 'EmptyState';
```

## 5. Hooks (`src/features/home/hooks/`)

### 5.1 useSmartAsk (`src/features/home/hooks/useSmartAsk.ts`)

```typescript
import { useState, useCallback } from 'react';
import { aiAsk } from '../../../services/api';
import { trackEvent } from '../../../services/analytics';
import type { AiMessage, PropertyCard } from '../../../types';

export function useSmartAsk() {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [reco, setReco] = useState<PropertyCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalTokens, setTotalTokens] = useState(0);

  const sendMessage = useCallback(async (input: string) => {
    if (!input.trim() || loading) return;

    const userMsg: AiMessage = { 
      role: 'user', 
      content: input.trim(), 
      timestamp: new Date().toISOString() 
    };
    
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    trackEvent('ai_message_sent', '/');

    // Add placeholder for AI response
    const aiMsg: AiMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, aiMsg]);

    try {
      let isStreamingComplete = false;
      const res = await aiAsk(
        { messages: newMessages },
        (chunk: string) => {
          isStreamingComplete = true;
          setMessages(prev => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg) {
              const newMsg: AiMessage = {
                role: lastMsg.role || 'assistant',
                content: (lastMsg.content || '') + chunk
              };
              if (lastMsg.timestamp) {
                newMsg.timestamp = lastMsg.timestamp;
              }
              updated[updated.length - 1] = newMsg;
            }
            return updated;
          });
        }
      );

      if (res.ok && res.data) {
        // If not streaming or streaming failed but we got a final answer
        if (!isStreamingComplete && res.data.answers && res.data.answers.length > 0) {
          setMessages(prev => {
            const updated = [...prev];
            if (updated.length > 0) {
              const last = updated[updated.length - 1];
              updated[updated.length - 1] = {
                ...last,
                role: 'assistant',
                content: res.data!.answers[0] || ''
              };
            }
            return updated;
          });
        }
        
        const r = res.data.recommends || [];
        setReco(r);
        if (r[0]?.communityId) localStorage.setItem('recoCommunity', r[0].communityId);

        if (res.data.usage?.totalTokens) {
          setTotalTokens(prev => prev + res.data!.usage!.totalTokens);
        }
      } else {
        // Error handling for API failure
        setMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            const last = updated[updated.length - 1];
            updated[updated.length - 1] = {
              ...last,
              role: 'assistant',
              content: '抱歉，AI 服務目前暫時不可用，請稍後再試。您也可以先描述需求讓我為您推薦房源格局與區域喔。'
            };
          }
          return updated;
        });
      }
    } catch (e) {
      // Network or other error
      setMessages(prev => {
        const updated = [...prev];
        if (updated.length > 1) {
           // Remove the empty assistant message if it failed immediately? 
           // Or just update it with error message. Updating is safer.
           const last = updated[updated.length - 1];
           updated[updated.length - 1] = {
             ...last,
             role: 'assistant',
             content: '抱歉，AI 服務連線失敗（可能未設定金鑰）。請稍後再試，或通知我們協助處理。'
           };
        }
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }, [messages, loading]);

  return {
    messages,
    reco,
    loading,
    totalTokens,
    sendMessage
  };
}
```
