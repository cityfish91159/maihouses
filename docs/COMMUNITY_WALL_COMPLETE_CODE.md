# 社區牆完整程式碼

> 匯出時間: 2025/12/03
> 用途: 給人類開發者參考

---

## 1. Wall.tsx (主頁面)

```tsx
/**
 * Community Wall Page
 * 
 * 社區牆主頁面
 * 重構版 - 統一資料來源、組件化、React Query、a11y 優化
 */

import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';

// Components
import {
  Topbar,
  ReviewsSection,
  PostsSection,
  QASection,
  Sidebar,
  RoleSwitcher,
  MockToggle,
  BottomCTA,
} from './components';

// Types
import type { Role, WallTab } from './types';
import { getPermissions } from './types';

// Hooks - 統一資料來源
import { useCommunityWallData } from '../../hooks/useCommunityWallData';

// ============ Main Component ============
export default function Wall() {
  const { id } = useParams<{ id: string }>();
  const [role, setRole] = useState<Role>('guest');
  const [currentTab, setCurrentTab] = useState<WallTab>('public');

  // 統一資料來源 Hook
  const { 
    data,
    useMock,
    setUseMock,
    isLoading,
    error,
    toggleLike,
    createPost,
  } = useCommunityWallData(id, {
    includePrivate: getPermissions(role).canAccessPrivate,
  });

  const perm = getPermissions(role);
  
  // Tab 切換
  const handleTabChange = useCallback((tab: WallTab) => {
    if (tab === 'private' && !perm.canAccessPrivate) {
      return;
    }
    setCurrentTab(tab);
  }, [perm.canAccessPrivate]);

  // 如果身份變更導致無法存取私密牆，切回公開牆
  useEffect(() => {
    if (currentTab === 'private' && !perm.canAccessPrivate) {
      setCurrentTab('public');
    }
  }, [currentTab, perm.canAccessPrivate]);

  // 按讚處理
  const handleLike = useCallback((postId: number | string) => {
    toggleLike(postId);
  }, [toggleLike]);

  // 發文處理
  const handleCreatePost = useCallback((content: string, visibility: 'public' | 'private' = 'public') => {
    createPost(content, visibility);
  }, [createPost]);

  // Loading 狀態（僅 API 模式）
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-bg-base to-bg-soft">
        <div className="text-center">
          <div className="mb-2 text-2xl">🏠</div>
          <div className="text-sm text-ink-600">載入中...</div>
        </div>
      </div>
    );
  }

  // Error 狀態（僅 API 模式）
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-bg-base to-bg-soft">
        <div className="text-center">
          <div className="mb-2 text-2xl">😢</div>
          <div className="mb-2 text-sm text-ink-600">載入失敗</div>
          <button 
            onClick={() => setUseMock(true)}
            className="rounded-lg bg-brand px-4 py-2 text-sm text-white"
          >
            切換 Mock 模式
          </button>
        </div>
      </div>
    );
  }

  // 從統一資料來源取得資料
  const { communityInfo, posts, reviews, questions } = data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--bg-base)] to-[var(--bg-alt)]">
      <Topbar communityName={communityInfo.name} />
      
      <div className="mx-auto flex max-w-[960px] gap-5 p-2.5 pb-[calc(80px+env(safe-area-inset-bottom,20px))] lg:p-2.5">
        {/* 主內容區 */}
        <main className="flex max-w-[600px] flex-1 animate-[fadeInUp_0.5s_ease-out] flex-col gap-3">
          <ReviewsSection role={role} reviews={reviews} />
          <PostsSection 
            role={role} 
            currentTab={currentTab} 
            onTabChange={handleTabChange}
            publicPosts={posts.public}
            privatePosts={posts.private}
            onLike={handleLike}
            onCreatePost={handleCreatePost}
          />
          <QASection role={role} questions={questions} />
        </main>

        {/* 側邊欄 - 使用同一個資料來源 */}
        <Sidebar 
          info={communityInfo} 
          questions={questions}
          posts={posts.public}
        />
      </div>

      {/* 底部 CTA */}
      <BottomCTA role={role} />

      {/* 開發工具：僅開發環境顯示 */}
      {import.meta.env.DEV && (
        <>
          <MockToggle useMock={useMock} onToggle={() => setUseMock(!useMock)} />
          <RoleSwitcher role={role} onRoleChange={setRole} />
        </>
      )}

      {/* 動畫 keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-25deg); }
          40% { transform: rotate(10deg); }
          60% { transform: rotate(-20deg); }
          80% { transform: rotate(5deg); }
        }
      `}</style>
    </div>
  );
}
```

---

## 2. types.ts (型別定義)

```typescript
/**
 * Community Wall Types
 * 
 * 社區牆共用型別定義
 */

// ============ Role Types ============
export type Role = 'guest' | 'member' | 'resident' | 'agent';
export type WallTab = 'public' | 'private';

// ============ Data Types ============
export interface Post {
  id: number | string;
  author: string;
  floor?: string;
  type: 'resident' | 'agent' | 'official';
  time: string;
  title: string;
  content: string;
  likes?: number;
  views?: number;
  comments: number;
  pinned?: boolean;
  private?: boolean;
}

export interface Review {
  id: number | string;
  author: string;
  company: string;
  visits: number;
  deals: number;
  pros: string[];
  cons: string | string[];  // 支援 string 或 array
}

export interface Question {
  id: number | string;
  question: string;
  time: string;
  answersCount: number;
  answers: {
    author: string;
    type: 'resident' | 'agent' | 'official';
    content: string;
    expert?: boolean;
  }[];
}

export interface CommunityInfo {
  name: string;
  year: number;
  units: number;
  managementFee: number;
  builder: string;
  members: number;
  avgRating: number;
  monthlyInteractions: number;
  forSale: number;
}

export interface MockData {
  communityInfo: CommunityInfo;
  posts: {
    public: Post[];
    private: Post[];
  };
  reviews: Review[];
  questions: Question[];
}

// ============ Permission Types ============
export interface Permissions {
  isGuest: boolean;
  isMember: boolean;
  isResident: boolean;
  isAgent: boolean;
  isLoggedIn: boolean;
  canSeeAllReviews: boolean;
  canSeeAllPosts: boolean;
  canAccessPrivate: boolean;
  canPostPublic: boolean;
  canPostPrivate: boolean;
  canAskQuestion: boolean;
  canAnswer: boolean;
  showExpertBadge: boolean;
}

// ============ Permission Helper ============
export function getPermissions(role: Role): Permissions {
  const isGuest = role === 'guest';
  const isMember = role === 'member';
  const isResident = role === 'resident';
  const isAgent = role === 'agent';

  return {
    isGuest,
    isMember,
    isResident,
    isAgent,
    isLoggedIn: !isGuest,
    canSeeAllReviews: !isGuest,
    canSeeAllPosts: !isGuest,
    canAccessPrivate: isResident || isAgent,
    canPostPublic: isResident || isAgent,
    canPostPrivate: isResident,
    canAskQuestion: !isGuest,
    canAnswer: isResident || isAgent,
    showExpertBadge: isAgent,
  };
}

// ============ Constants ============
export const GUEST_VISIBLE_COUNT = 2;
```

---

## 3. mockData.ts (Mock資料)

```typescript
/**
 * Community Wall Mock Data
 * 
 * Mock 資料 - 開發與測試用
 */

import type { MockData } from './types';

export const MOCK_DATA: MockData = {
  communityInfo: {
    name: '惠宇上晴',
    year: 2018,
    units: 280,
    managementFee: 85,
    builder: '惠宇建設',
    members: 88,
    avgRating: 4.2,
    monthlyInteractions: 156,
    forSale: 23,
  },
  posts: {
    public: [
      { id: 1, author: '陳小姐', floor: '12F', type: 'resident' as const, time: '2小時前', title: '有人要團購掃地機嗎？🤖', content: '這款 iRobot 打折，滿 5 台有團購價～', likes: 31, comments: 14 },
      { id: 2, author: '游杰倫', type: 'agent' as const, time: '昨天', title: '🏡 惠宇上晴 12F｜雙陽台視野戶', content: '客廳光線很好，上週屋主剛降價 50 萬，有興趣可私訊。', views: 89, comments: 5 },
      { id: 3, author: '李先生', floor: '8F', type: 'resident' as const, time: '3天前', title: '停車位交流 🚗', content: '我有 B2-128 想與 B1 交換，方便接送小孩', likes: 12, comments: 8 },
      { id: 4, author: '王太太', floor: '5F', type: 'resident' as const, time: '1週前', title: '推薦水電師傅', content: '上次找的師傅很專業，價格公道，需要的鄰居私訊我', likes: 25, comments: 6 },
      { id: 5, author: '林經理', type: 'agent' as const, time: '1週前', title: '🏡 惠宇上晴 8F｜三房車位', content: '屋況極新，前屋主自住保養好', views: 156, comments: 12 },
    ],
    private: [
      { id: 101, author: '管委會', type: 'official' as const, time: '3天前', title: '📢 年度消防演練通知', content: '12/15（日）上午 10:00 將進行全社區消防演練，届時警報器會響，請勿驚慌。', pinned: true, comments: 0 },
      { id: 102, author: '15F 住戶', type: 'resident' as const, time: '1週前', title: '管理費調漲討論', content: '想問大家覺得管理費調漲合理嗎？從 2,800 調到 3,200，漲幅有點大...', comments: 28, private: true },
      { id: 103, author: '3F 住戶', type: 'resident' as const, time: '2週前', title: '頂樓漏水問題', content: '最近下雨頂樓好像有漏水，管委會有要處理嗎？', comments: 15, private: true },
    ],
  },
  reviews: [
    { id: 1, author: '游杰倫', company: '21世紀', visits: 12, deals: 3, pros: ['公設維護得乾淨，假日草皮有人整理', '反映停車動線，管委會一週內就公告改善'], cons: '面向大馬路低樓層車聲明顯，喜靜者選中高樓層' },
    { id: 2, author: '林美玲', company: '信義房屋', visits: 8, deals: 2, pros: ['頂樓排水設計不錯，颱風天也沒有積水問題', '中庭花園維護用心，住戶反應都很正面'], cons: '垃圾車時間稍晚，家裡偶爾會有下水道味' },
    { id: 3, author: '陳志明', company: '永慶房屋', visits: 6, deals: 1, pros: ['管理員服務態度很好，代收包裹很方便', '社區有健身房，設備維護不錯'], cons: '電梯尖峰時段要等比較久' },
    { id: 4, author: '黃小華', company: '住商不動產', visits: 10, deals: 2, pros: ['學區不錯，走路到國小只要5分鐘', '附近生活機能完善'], cons: '部分戶型採光稍弱' },
    { id: 5, author: '張大明', company: '台灣房屋', visits: 5, deals: 1, pros: ['建商口碑好，用料實在', '公設比合理，實坪數划算'], cons: '車道坡度較陡，新手要小心' },
  ],
  questions: [
    { id: 1, question: '請問社區停車位好停嗎？會不會常客滿？', time: '2天前', answersCount: 2, answers: [
      { author: '12F 住戶', type: 'resident' as const, content: 'B2 比較容易有位，B1 要碰運氣。' },
      { author: '游杰倫', type: 'agent' as const, content: '這社區車位配比是 1:1.2，算充裕的。', expert: true },
    ]},
    { id: 2, question: '晚上會不會很吵？我看物件時是白天', time: '5天前', answersCount: 2, answers: [
      { author: '3F 住戶', type: 'resident' as const, content: '面大馬路那側確實有車聲，但習慣就好。內側安靜很多。' },
      { author: '10F 住戶', type: 'resident' as const, content: '我住內側，晚上很安靜，睡眠品質不錯。' },
    ]},
    { id: 3, question: '管理費多少？有包含哪些服務？', time: '1週前', answersCount: 1, answers: [
      { author: '管委會', type: 'official' as const, content: '目前每坪 85 元，含 24 小時保全、公設維護、垃圾代收。' },
    ]},
    { id: 4, question: '社區有健身房嗎？設備新不新？', time: '3天前', answersCount: 0, answers: [] },
  ],
};
```

---

## 4. components/Topbar.tsx

```tsx
/**
 * Topbar Component
 * 
 * 頂部導航列
 */

interface TopbarProps {
  communityName: string;
}

export function Topbar({ communityName }: TopbarProps) {
  return (
    <header className="sticky top-0 z-50 flex items-center gap-2.5 border-b border-[rgba(230,237,247,0.8)] bg-[rgba(246,249,255,0.95)] px-4 py-2 backdrop-blur-[12px]">
      <a 
        href="/maihouses/" 
        className="flex items-center gap-2 rounded-[10px] px-2.5 py-1.5 text-sm font-bold text-[var(--primary)] no-underline transition-colors hover:bg-[rgba(0,56,90,0.06)]"
        aria-label="回到首頁"
      >
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        <span>回首頁</span>
      </a>
      <div className="flex-1 text-center">
        <h1 className="m-0 text-base font-extrabold text-[var(--primary-dark)]">{communityName}</h1>
        <p className="m-0 text-[11px] text-[var(--text-secondary)]">社區牆</p>
      </div>
      <div className="flex items-center gap-2">
        <button 
          className="relative inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-white px-2 py-2 text-sm text-[#173a7c] transition-all hover:bg-[#f6f9ff]"
          aria-label="通知，2 則未讀"
        >
          🔔
          <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-[#e02626] text-[11px] font-bold text-white" aria-hidden="true">2</span>
        </button>
        <button 
          className="flex items-center gap-1 rounded-[14px] border border-[var(--line)] bg-white px-2.5 py-1.5 text-[13px] font-bold text-[#173a7c]"
          aria-label="我的帳號"
        >
          👤 我的
        </button>
      </div>
    </header>
  );
}
```

---

## 5. components/ReviewsSection.tsx

```tsx
/**
 * ReviewsSection Component
 * 
 * 社區評價區塊
 * 重構：使用 LockedOverlay + Tailwind brand 色系
 */

import { useMemo } from 'react';
import type { Role, Review } from '../types';
import { getPermissions, GUEST_VISIBLE_COUNT } from '../types';
import { LockedOverlay } from './LockedOverlay';

interface ReviewCardProps {
  item: { 
    text: string; 
    author: string; 
    company: string; 
    visits: number; 
    deals: number;
  };
  type: 'pro' | 'con';
}

function ReviewCard({ item, type }: ReviewCardProps) {
  const icon = type === 'pro' ? '✅' : '⚖️';
  const bgClass = type === 'pro' 
    ? 'bg-gradient-to-br from-brand-50 to-brand-100/50' 
    : 'bg-gradient-to-br from-brand-100/30 to-brand-100';
  
  return (
    <div className="rounded-[14px] border border-border-light bg-white p-3.5 transition-all hover:border-brand/15 hover:shadow-[0_2px_8px_rgba(0,56,90,0.04)]">
      <div className="mb-2.5 flex items-center gap-2.5">
        <div 
          className="flex h-[38px] w-[38px] items-center justify-center rounded-full border-2 border-brand bg-gradient-to-br from-brand-100/50 to-white text-sm font-extrabold text-brand" 
          aria-hidden="true"
        >
          {item.author.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-bold text-ink-900">{item.author}｜{item.company}</div>
          <div className="text-[11px] text-ink-600">帶看 {item.visits} 次 · 成交 {item.deals} 戶</div>
        </div>
      </div>
      <div className={`flex items-start gap-2.5 rounded-[10px] p-2 text-[13px] leading-relaxed ${bgClass}`}>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center text-base" aria-hidden="true">{icon}</span>
        <span className="flex-1 text-ink-900">{item.text}</span>
      </div>
    </div>
  );
}

interface ReviewsSectionProps {
  role: Role;
  reviews: Review[];
}

export function ReviewsSection({ role, reviews }: ReviewsSectionProps) {
  const perm = getPermissions(role);

  // 拆成單項
  const allItems = useMemo(() => {
    const items: { type: 'pro' | 'con'; text: string; author: string; company: string; visits: number; deals: number }[] = [];
    reviews.forEach(review => {
      review.pros.forEach(pro => {
        items.push({ type: 'pro', text: pro, author: review.author, company: review.company, visits: review.visits, deals: review.deals });
      });
      // cons 可能是 string 或 array
      const consArray = Array.isArray(review.cons) ? review.cons : [review.cons];
      consArray.forEach(con => {
        if (con) {
          items.push({ type: 'con', text: con, author: review.author, company: review.company, visits: review.visits, deals: review.deals });
        }
      });
    });
    return items;
  }, [reviews]);

  const totalCount = allItems.length;
  const visibleCount = perm.canSeeAllReviews ? totalCount : Math.min(GUEST_VISIBLE_COUNT, totalCount);
  const hiddenCount = Math.max(0, totalCount - visibleCount);

  return (
    <section className="overflow-hidden rounded-[18px] border border-border-light bg-white/98 shadow-[0_2px_12px_rgba(0,51,102,0.04)]" aria-labelledby="reviews-heading">
      <div className="flex items-center justify-between border-b border-brand/5 bg-gradient-to-br from-brand/8 to-brand-600/4 px-4 py-3.5">
        <div>
          <h2 id="reviews-heading" className="flex items-center gap-1.5 text-[15px] font-extrabold text-brand-700">⭐ 社區評價</h2>
          <p className="mt-0.5 text-[11px] text-ink-600">來自最真實的評價</p>
        </div>
        <span className="flex items-center gap-1 rounded-full border border-brand-600 bg-brand/8 px-2.5 py-1 text-[10px] font-bold text-brand">
          {totalCount} 則評價
        </span>
      </div>
      <div className="flex flex-col gap-2.5 p-3.5">
        {allItems.slice(0, visibleCount).map((item, idx) => (
          <ReviewCard key={idx} item={item} type={item.type} />
        ))}
        
        {/* 使用 LockedOverlay 組件 */}
        <LockedOverlay
          visible={hiddenCount > 0 && !!allItems[visibleCount]}
          hiddenCount={hiddenCount}
          countLabel="則評價"
          benefits={['查看全部評價', '新回答通知']}
        >
          {allItems[visibleCount] && (
            <ReviewCard item={allItems[visibleCount]} type={allItems[visibleCount].type} />
          )}
        </LockedOverlay>
      </div>
    </section>
  );
}
```

---

## 6. components/PostsSection.tsx

```tsx
/**
 * PostsSection Component
 * 
 * 社區貼文區塊（公開牆/私密牆）
 * 重構：使用 LockedOverlay + Tailwind brand 色系
 */

import type { Role, Post, WallTab } from '../types';
import { getPermissions, GUEST_VISIBLE_COUNT } from '../types';
import { LockedOverlay } from './LockedOverlay';

interface PostCardProps {
  post: Post;
  onLike?: ((postId: number | string) => void) | undefined;
}

function PostCard({ post, onLike }: PostCardProps) {
  const isAgent = post.type === 'agent';
  const isOfficial = post.type === 'official';

  const badge = isAgent 
    ? <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[9px] font-bold text-brand-600">認證房仲</span>
    : isOfficial 
      ? <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[9px] font-bold text-brand">官方公告</span>
      : post.floor 
        ? <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[9px] font-bold text-brand">{post.floor} 住戶</span>
        : null;

  // 修復：likes=0 時也應顯示（不再被當成 falsy）
  const stats = post.likes !== undefined 
    ? <span className="flex items-center gap-1">❤️ {post.likes}</span>
    : post.views !== undefined
      ? <span className="flex items-center gap-1">👁️ {post.views}</span>
      : null;

  return (
    <article className="flex gap-2.5 rounded-[14px] border border-border-light bg-white p-3 transition-all hover:border-brand-600 hover:shadow-[0_2px_8px_rgba(0,56,90,0.06)]">
      <div 
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-gradient-to-br from-brand-100/50 to-white text-base font-extrabold ${isAgent ? 'border-brand-light text-brand-600' : 'border-brand text-brand'}`}
        aria-hidden="true"
      >
        {post.author.charAt(0)}
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-bold text-ink-900">{post.author}</span>
          {badge}
          <span className="text-[11px] text-ink-600">{post.time}</span>
        </div>
        <div className="text-[13px] leading-relaxed text-ink-900">
          <b>{post.title}</b><br/>
          {post.content}
        </div>
        <div className="flex gap-3 text-[11px] text-ink-600">
          {stats}
          <span className="flex items-center gap-1">💬 {post.comments}</span>
          {post.private && <span className="flex items-center gap-1">🔒 僅社區可見</span>}
        </div>
        <div className="mt-1 flex gap-2">
          {isAgent ? (
            <button 
              className="flex items-center gap-1 rounded-lg border border-brand/10 bg-brand/6 px-2.5 py-1.5 text-[11px] font-semibold text-brand transition-all hover:bg-brand/12"
              aria-label="私訊房仲"
            >
              📩 私訊房仲
            </button>
          ) : (
            <>
              <button 
                className="flex items-center gap-1 rounded-lg border border-brand/10 bg-brand/6 px-2.5 py-1.5 text-[11px] font-semibold text-brand transition-all hover:bg-brand/12"
                onClick={() => onLike?.(post.id)}
                aria-label="按讚這則貼文"
              >
                ❤️ 讚
              </button>
              <button 
                className="flex items-center gap-1 rounded-lg border border-brand/10 bg-brand/6 px-2.5 py-1.5 text-[11px] font-semibold text-brand transition-all hover:bg-brand/12"
                aria-label="回覆這則貼文"
              >
                💬 回覆
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

interface PostsSectionProps {
  role: Role;
  currentTab: WallTab;
  onTabChange: (tab: WallTab) => void;
  publicPosts: Post[];
  privatePosts: Post[];
  onLike?: (postId: number | string) => void;
  onCreatePost?: (content: string, visibility: 'public' | 'private') => void;
}

export function PostsSection({ 
  role, 
  currentTab, 
  onTabChange, 
  publicPosts, 
  privatePosts,
  onLike,
  onCreatePost,
}: PostsSectionProps) {
  const perm = getPermissions(role);

  const visiblePublic = perm.canSeeAllPosts ? publicPosts : publicPosts.slice(0, GUEST_VISIBLE_COUNT);
  const hiddenPublicCount = publicPosts.length - visiblePublic.length;

  const handlePrivateClick = () => {
    if (!perm.canAccessPrivate) {
      alert(perm.isGuest ? '🔐 登入/註冊\n\n請先登入或註冊' : '🏠 住戶驗證\n\n請上傳水電帳單或管理費收據');
      return;
    }
    onTabChange('private');
  };

  return (
    <section id="public-wall" className="scroll-mt-20 overflow-hidden rounded-[18px] border border-border-light bg-white/98 shadow-[0_2px_12px_rgba(0,51,102,0.04)]" aria-labelledby="posts-heading">
      <div className="flex items-center justify-between border-b border-brand/5 bg-gradient-to-br from-brand/3 to-brand-600/1 px-4 py-3.5">
        <h2 id="posts-heading" className="flex items-center gap-1.5 text-[15px] font-extrabold text-brand-700">🔥 社區熱帖</h2>
      </div>
      
      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 px-3.5 pb-3.5 pt-2" role="tablist">
        <button 
          role="tab"
          aria-selected={currentTab === 'public'}
          onClick={() => onTabChange('public')}
          className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${currentTab === 'public' ? 'border-brand-600 bg-brand/10 font-bold text-brand' : 'border-transparent bg-brand-100/80 text-ink-600 hover:bg-brand/8 hover:text-brand'}`}
        >
          公開牆
        </button>
        <button 
          role="tab"
          aria-selected={currentTab === 'private'}
          onClick={handlePrivateClick}
          className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${currentTab === 'private' ? 'border-brand-600 bg-brand/10 font-bold text-brand' : 'border-transparent bg-brand-100/80 text-ink-600 hover:bg-brand/8 hover:text-brand'} ${!perm.canAccessPrivate ? 'opacity-60' : ''}`}
        >
          私密牆 {!perm.canAccessPrivate && '🔒'}
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2.5 px-3.5 pb-3.5" role="tabpanel">
        {currentTab === 'public' ? (
          <>
            {visiblePublic.map(post => (
              <PostCard key={post.id} post={post} onLike={onLike} />
            ))}
            
            {/* 使用 LockedOverlay 組件 */}
            <LockedOverlay
              visible={hiddenPublicCount > 0 && !!publicPosts[GUEST_VISIBLE_COUNT]}
              hiddenCount={hiddenPublicCount}
              countLabel="則熱帖"
              benefits={['查看完整動態', '新回答通知']}
            >
              {publicPosts[GUEST_VISIBLE_COUNT] && (
                <PostCard post={publicPosts[GUEST_VISIBLE_COUNT]} />
              )}
            </LockedOverlay>
            
            {perm.canPostPublic && (
              <div className="flex justify-center rounded-[14px] border border-dashed border-border-light bg-brand/3 p-5">
                <button 
                  onClick={() => {
                    const content = prompt('輸入貼文內容：');
                    if (content) onCreatePost?.(content, 'public');
                  }}
                  className="flex w-full items-center justify-center gap-1 rounded-lg border border-brand/10 bg-brand/6 px-2.5 py-1.5 text-[11px] font-semibold text-brand hover:bg-brand/12"
                >
                  ✏️ 發布貼文
                </button>
              </div>
            )}
          </>
        ) : perm.canAccessPrivate ? (
          <>
            {privatePosts.map(post => (
              <PostCard key={post.id} post={post} onLike={onLike} />
            ))}
            {perm.canPostPrivate ? (
              <div className="flex justify-center rounded-[14px] border border-dashed border-border-light bg-brand/3 p-5">
                <button 
                  onClick={() => {
                    const content = prompt('輸入私密貼文內容：');
                    if (content) onCreatePost?.(content, 'private');
                  }}
                  className="flex w-full items-center justify-center gap-1 rounded-lg border border-brand/10 bg-brand/6 px-2.5 py-1.5 text-[11px] font-semibold text-brand hover:bg-brand/12"
                >
                  ✏️ 發布私密貼文
                </button>
              </div>
            ) : (
              <p className="py-3 text-center text-[11px] text-ink-600">💡 房仲可查看私密牆，但無法發文</p>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-[14px] bg-brand/3 px-5 py-10 text-center">
            <div className="mb-3 text-5xl opacity-50" aria-hidden="true">🔐</div>
            <h4 className="mb-1.5 text-sm font-bold text-brand-700">私密牆僅限本社區住戶查看</h4>
            <p className="mb-4 text-xs text-ink-600">{perm.isGuest ? '請先登入或註冊' : '驗證住戶身份後即可加入討論'}</p>
            <button className="rounded-full bg-brand px-5 py-2.5 text-xs font-bold text-white">
              {perm.isGuest ? '免費註冊 / 登入' : '我是住戶，驗證身份'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
```
## 7. components/QASection.tsx

```tsx
/**
 * QASection Component
 * 
 * 準住戶問答區塊
 * 重構：使用 LockedOverlay + Tailwind brand 色系
 */

import type { Role, Question, Permissions } from '../types';
import { getPermissions, GUEST_VISIBLE_COUNT } from '../types';
import { LockedOverlay } from './LockedOverlay';

interface QACardProps {
  q: Question;
  perm: Permissions;
  isUnanswered?: boolean;
}

function QACard({ q, perm, isUnanswered = false }: QACardProps) {
  return (
    <article className={`rounded-[14px] border p-3.5 transition-all hover:border-brand/15 ${isUnanswered ? 'border-brand-light/30 bg-gradient-to-br from-brand-50 to-brand-100/30' : 'border-border-light bg-white'}`}>
      <div className="mb-2 text-sm font-bold leading-snug text-brand-700">Q: {q.question}</div>
      <div className="mb-2.5 flex flex-wrap items-center gap-2 text-[11px] text-ink-600">
        <span>👤 準住戶</span>
        <span>· {q.time}</span>
        {isUnanswered ? (
          <span className="font-bold text-brand-light">· 等待回答中</span>
        ) : (
          <span>· {q.answersCount} 則回覆</span>
        )}
      </div>
      
      {isUnanswered ? (
        <div className="mt-2 rounded-[10px] bg-brand/2 p-4 text-center text-[13px] text-ink-600">
          🙋 還沒有人回答，成為第一個回答的人！
        </div>
      ) : (
        <div className="flex flex-col gap-2 border-l-[3px] border-border-light pl-3.5">
          {q.answers.map((a, idx) => (
            <div key={idx} className="py-2 text-[13px] leading-relaxed">
              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${a.type === 'agent' ? 'bg-brand-100 text-brand-600' : a.type === 'official' ? 'bg-brand-50 text-brand' : 'bg-brand-100 text-brand'}`}>
                  {a.type === 'agent' ? '🏢 認證房仲' : a.type === 'official' ? `📋 ${a.author}` : `🏠 ${a.author}`}
                </span>
                {a.expert && <span className="rounded bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-600">⭐ 專家回答</span>}
              </div>
              {a.content}
            </div>
          ))}
        </div>
      )}

      {perm.canAnswer && (
        <div className="mt-2.5">
          <button 
            className={`flex w-full items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-all ${isUnanswered ? 'border-brand-light/30 bg-brand-light/10 text-brand-600' : 'border-brand/10 bg-brand/6 text-brand'} hover:bg-brand/12`}
            aria-label={isUnanswered ? '搶先回答這個問題' : '回答這個問題'}
          >
            💬 {isUnanswered ? '搶先回答' : '我來回答'}{perm.isAgent ? '（專家）' : ''}
          </button>
        </div>
      )}
    </article>
  );
}

interface QASectionProps {
  role: Role;
  questions: Question[];
}

export function QASection({ role, questions }: QASectionProps) {
  const perm = getPermissions(role);

  const answeredQuestions = questions.filter(q => q.answers.length > 0);
  const unansweredQuestions = questions.filter(q => q.answers.length === 0);

  const visibleCount = perm.isLoggedIn ? answeredQuestions.length : Math.min(GUEST_VISIBLE_COUNT, answeredQuestions.length);
  const hiddenCount = Math.max(0, answeredQuestions.length - visibleCount);

  return (
    <section className="scroll-mt-20 overflow-hidden rounded-[18px] border border-border-light bg-white/98 shadow-[0_2px_12px_rgba(0,51,102,0.04)]" aria-labelledby="qa-heading" id="qa-section">
      <div className="flex items-center justify-between border-b border-brand/5 bg-gradient-to-br from-brand/3 to-brand-600/1 px-4 py-3.5">
        <div>
          <h2 id="qa-heading" className="flex items-center gap-1.5 text-[15px] font-extrabold text-brand-700">
            🙋 準住戶問答
            {unansweredQuestions.length > 0 && (
              <span className="ml-1.5 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-600">
                {unansweredQuestions.length} 題待回答
              </span>
            )}
          </h2>
          <p className="mt-0.5 text-[11px] text-ink-600">買房前，先問問鄰居怎麼說</p>
        </div>
      </div>
      <div className="flex flex-col gap-2.5 p-3.5">
        {/* 有回答的問題 */}
        {answeredQuestions.slice(0, visibleCount).map(q => (
          <QACard key={q.id} q={q} perm={perm} />
        ))}

        {/* 使用 LockedOverlay 組件 */}
        <LockedOverlay
          visible={hiddenCount > 0 && !!answeredQuestions[visibleCount]}
          hiddenCount={hiddenCount}
          countLabel="則問答"
          benefits={['查看完整問答', '新回答通知']}
        >
          {answeredQuestions[visibleCount] && (
            <QACard q={answeredQuestions[visibleCount]} perm={perm} />
          )}
        </LockedOverlay>

        {/* 無回答的問題 */}
        {unansweredQuestions.map(q => (
          <QACard key={q.id} q={q} perm={perm} isUnanswered />
        ))}

        {/* 發問區塊 */}
        <div className="rounded-[14px] border border-dashed border-border-light bg-brand/3 p-3.5">
          <div className="mb-2 text-sm font-bold text-ink-600">💬 你也有問題想問？</div>
          <p className="mb-2 text-xs text-ink-600">問題會通知該社區住戶，通常 24 小時內會有回覆</p>
          <button className="flex w-full items-center justify-center gap-1 rounded-lg border border-brand/10 bg-brand/6 px-2.5 py-1.5 text-[11px] font-semibold text-brand">
            {perm.canAskQuestion ? '我想問問題' : '登入後發問'}
          </button>
        </div>
      </div>
    </section>
  );
}
```

---

## 8. components/Sidebar.tsx

```tsx
/**
 * Sidebar Component
 * 
 * 側邊欄（社區資訊、數據、快速連結、問答、熱門貼文、公仔）
 */

import type { CommunityInfo, Question, Post } from '../types';

interface SidebarProps {
  info: CommunityInfo;
  questions: Question[];
  posts: Post[];
}

export function Sidebar({ info, questions, posts }: SidebarProps) {
  const displayQuestions = questions.slice(0, 3);
  const hotPosts = [...posts].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 2);

  return (
    <aside className="hidden w-[280px] shrink-0 flex-col gap-3 self-start lg:sticky lg:top-[70px] lg:flex">
      {/* 社區資訊 */}
      <div className="rounded-[14px] border border-[var(--line)] bg-white p-3.5 shadow-[0_4px_14px_rgba(0,51,102,0.04)]">
        <h4 className="mb-2.5 flex items-center gap-1.5 text-sm font-extrabold text-[var(--brand)]">📍 社區資訊</h4>
        {[
          ['社區名稱', info.name],
          ['完工年份', `${info.year} 年`],
          ['總戶數', `${info.units} 戶`],
          ['管理費', `${info.managementFee} 元/坪`],
          ['建設公司', info.builder],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between border-b border-[#f1f5f9] py-2 text-[13px] last:border-b-0">
            <span className="text-[var(--text-secondary)]">{label}</span>
            <span className="font-bold text-[var(--text-primary)]">{value}</span>
          </div>
        ))}
      </div>

      {/* 社區數據 */}
      <div className="rounded-[14px] border border-[var(--line)] bg-white p-3.5 shadow-[0_4px_14px_rgba(0,51,102,0.04)]">
        <h4 className="mb-2.5 flex items-center gap-1.5 text-sm font-extrabold text-[var(--brand)]">📊 社區數據</h4>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          {[
            [info.members, '已加入成員'],
            [info.avgRating, '平均評分'],
            [info.monthlyInteractions, '本月互動'],
            [info.forSale, '待售物件'],
          ].map(([num, lbl]) => (
            <div key={lbl as string} className="rounded-[10px] bg-gradient-to-br from-[#f8faff] to-[#f0f5ff] p-3 text-center">
              <div className="text-xl font-black text-[var(--brand)]">{num}</div>
              <div className="mt-0.5 text-[11px] text-[var(--text-secondary)]">{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 快速連結 */}
      <nav className="rounded-[14px] border border-[var(--line)] bg-white p-3.5 shadow-[0_4px_14px_rgba(0,51,102,0.04)]" aria-label="快速連結">
        <h4 className="mb-2.5 flex items-center gap-1.5 text-sm font-extrabold text-[var(--brand)]">🔗 快速連結</h4>
        <div className="flex flex-col gap-1">
          {['🏠 查看此社區物件', '📊 與其他社區比較', '🔔 追蹤此社區'].map(link => (
            <a key={link} href="#" className="flex items-center gap-2 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold text-[var(--text-primary)] no-underline transition-all hover:bg-[#f0f7ff]">
              {link}
            </a>
          ))}
        </div>
      </nav>

      {/* 最新問答 */}
      <div className="rounded-[14px] border border-[var(--line)] bg-white p-3.5 shadow-[0_4px_14px_rgba(0,51,102,0.04)]">
        <h4 className="mb-2.5 flex items-center gap-1.5 text-sm font-extrabold text-[var(--brand)]">❓ 最新問答</h4>
        <div className="flex flex-col gap-1">
          {displayQuestions.map(q => (
            <a key={q.id} href="#qa-section" className="flex items-start gap-2 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold text-[var(--text-primary)] no-underline transition-all hover:bg-[#f0f7ff]">
              <span className="shrink-0" aria-hidden="true">💬</span>
              <span className="overflow-hidden text-ellipsis whitespace-nowrap">{q.question.length > 18 ? q.question.substring(0, 18) + '...' : q.question}</span>
            </a>
          ))}
        </div>
        <a href="#qa-section" className="mt-2 block text-center text-xs text-[var(--brand-light)] no-underline">查看全部問答 →</a>
      </div>

      {/* 熱門貼文 */}
      <div className="rounded-[14px] border border-[var(--line)] bg-white p-3.5 shadow-[0_4px_14px_rgba(0,51,102,0.04)]">
        <h4 className="mb-2.5 flex items-center gap-1.5 text-sm font-extrabold text-[var(--brand)]">🔥 熱門貼文</h4>
        <div className="flex flex-col gap-1">
          {hotPosts.map(p => (
            <a key={p.id} href="#public-wall" className="flex items-start gap-2 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold text-[var(--text-primary)] no-underline transition-all hover:bg-[#f0f7ff]">
              <span className="shrink-0" aria-hidden="true">❤️ {p.likes}</span>
              <span className="overflow-hidden text-ellipsis whitespace-nowrap">{p.title.length > 15 ? p.title.substring(0, 15) + '...' : p.title}</span>
            </a>
          ))}
        </div>
        <a href="#public-wall" className="mt-2 block text-center text-xs text-[var(--brand-light)] no-underline">查看全部貼文 →</a>
      </div>

      {/* 公仔卡片 */}
      <div className="rounded-[14px] border border-[var(--line)] bg-gradient-to-br from-[#f0f7ff] to-[#e8f4ff] p-3.5 text-center shadow-[0_4px_14px_rgba(0,51,102,0.04)]">
        <svg className="mx-auto mb-2 h-24 w-20 text-[#00385a]" viewBox="0 0 200 240" aria-hidden="true">
          <path d="M 85 40 L 85 15 L 100 30 L 115 15 L 115 40" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M 40 80 L 100 40 L 160 80" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="55" y="80" width="90" height="100" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M 78 110 Q 85 105 92 110" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"/>
          <path d="M 108 110 Q 115 105 122 110" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"/>
          <circle cx="85" cy="125" r="4" stroke="currentColor" strokeWidth="3" fill="none"/>
          <circle cx="115" cy="125" r="4" stroke="currentColor" strokeWidth="3" fill="none"/>
          <path d="M 90 145 Q 100 155 110 145" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round"/>
          <path d="M 55 130 L 25 110" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round"/>
          <path className="origin-[85%_60%] animate-[wave_2.5s_ease-in-out_infinite]" d="M 145 130 L 175 100" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round"/>
          <circle className="origin-[85%_60%] animate-[wave_2.5s_ease-in-out_infinite]" cx="180" cy="95" r="6" stroke="currentColor" strokeWidth="3" fill="none"/>
          <path d="M 85 180 L 85 210 L 75 210" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M 115 180 L 115 210 L 125 210" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p className="mb-2.5 text-[13px] font-bold text-[var(--brand)]">有問題？問問鄰居！</p>
        <a href="#qa-section" className="inline-block rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-bold text-white no-underline">前往問答區 →</a>
      </div>
    </aside>
  );
}
```

---

## 9. components/BottomCTA.tsx

```tsx
/**
 * BottomCTA Component
 * 
 * 底部 CTA 區塊
 */

import type { Role } from '../types';
import { getPermissions } from '../types';

interface BottomCTAProps {
  role: Role;
}

export function BottomCTA({ role }: BottomCTAProps) {
  const perm = getPermissions(role);

  // 住戶和房仲不顯示 CTA
  if (perm.canAccessPrivate) return null;

  // 根據身份決定顯示內容
  const isGuest = perm.isGuest;
  const isMember = perm.isMember;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-3 border-t border-[var(--border)] bg-[rgba(255,255,255,0.95)] px-4 py-3 backdrop-blur-[12px]">
      <p className="text-xs text-[var(--text-secondary)]">
        {isMember ? '🏠 驗證住戶身份，解鎖私密牆' : '🔓 登入解鎖完整評價 + 更多功能'}
      </p>
      <button className="rounded-full bg-gradient-to-br from-[var(--primary)] to-[#005282] px-5 py-2.5 text-[13px] font-bold text-white">
        {isMember ? '驗證住戶' : '免費註冊'}
      </button>
    </div>
  );
}
```

---

## 10. components/LockedOverlay.tsx

```tsx
/**
 * LockedOverlay Component
 * 
 * 通用的模糊遮罩 + 鎖定 CTA 組件
 * 用於評價區、貼文區、問答區的權限控制
 */

import type { ReactNode } from 'react';

interface LockedOverlayProps {
  /** 被遮蓋的內容 */
  children: ReactNode;
  /** 遮蓋數量提示（例如「還有 5 則評價」） */
  hiddenCount: number;
  /** 遮蓋標題（例如「則評價」「則熱帖」「則問答」） */
  countLabel: string;
  /** 遮蓋副標題（例如「查看全部評價」） */
  benefits?: string[];
  /** CTA 按鈕文字 */
  ctaText?: string;
  /** CTA 按鈕點擊事件 */
  onCtaClick?: () => void;
  /** 是否顯示（用於控制是否渲染） */
  visible?: boolean;
}

export function LockedOverlay({
  children,
  hiddenCount,
  countLabel,
  benefits = ['查看完整內容', '新回答通知'],
  ctaText = '免費註冊 / 登入',
  onCtaClick,
  visible = true,
}: LockedOverlayProps) {
  if (!visible || hiddenCount <= 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* 模糊的背景內容 */}
      <div className="pointer-events-none select-none blur-[4px]" aria-hidden="true">
        {children}
      </div>
      
      {/* 遮罩層 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[14px] bg-white/85 p-5 text-center">
        <h4 className="mb-1 text-sm font-extrabold text-brand-700">
          🔒 還有 {hiddenCount} {countLabel}
        </h4>
        <p className="mb-2.5 text-xs text-ink-600">
          {benefits.map((b, i) => (
            <span key={i}>
              {i > 0 && '　'}✓ {b}
            </span>
          ))}
        </p>
        <button 
          onClick={onCtaClick}
          className="rounded-full bg-gradient-to-br from-brand to-brand-600 px-6 py-2.5 text-[13px] font-bold text-white transition-transform hover:scale-[1.02]"
        >
          {ctaText}
        </button>
      </div>
    </div>
  );
}
```

---

## 11. components/RoleSwitcher.tsx

```tsx
/**
 * RoleSwitcher Component
 * 
 * 身份切換器（Mock 測試用）
 */

import { useState } from 'react';
import type { Role } from '../types';

interface RoleSwitcherProps {
  role: Role;
  onRoleChange: (role: Role) => void;
}

const roleNames: Record<Role, string> = {
  guest: '訪客模式',
  member: '會員模式',
  resident: '住戶模式',
  agent: '房仲模式',
};

const roleLabels: Record<Role, string> = {
  guest: '👤 訪客（未登入）',
  member: '👥 一般會員',
  resident: '🏠 已驗證住戶',
  agent: '🏢 認證房仲',
};

export function RoleSwitcher({ role, onRoleChange }: RoleSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-[1000]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] px-4 py-2.5 text-xs font-bold text-white shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`目前身份：${roleNames[role]}，點擊切換`}
      >
        🕶️ <span>{roleNames[role]}</span> ▾
      </button>
      {isOpen && (
        <div 
          className="absolute bottom-[50px] right-0 min-w-[180px] rounded-xl border border-[var(--border)] bg-white p-2 shadow-[0_8px_30px_rgba(0,0,0,0.15)]"
          role="listbox"
          aria-label="選擇身份"
        >
          {(Object.keys(roleLabels) as Role[]).map(r => (
            <button
              key={r}
              role="option"
              aria-selected={role === r}
              onClick={() => { onRoleChange(r); setIsOpen(false); }}
              className={`block w-full rounded-lg px-3 py-2.5 text-left text-xs ${role === r ? 'bg-[rgba(0,56,90,0.1)] font-bold text-[var(--primary)]' : 'text-[var(--text-primary)] hover:bg-[#f6f9ff]'}`}
            >
              {roleLabels[r]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 12. components/MockToggle.tsx

```tsx
/**
 * MockToggle Component
 * 
 * Mock 資料切換按鈕
 */

interface MockToggleProps {
  useMock: boolean;
  onToggle: () => void;
}

export function MockToggle({ useMock, onToggle }: MockToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="fixed bottom-5 left-5 z-[1000] flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] px-4 py-2.5 text-xs font-bold text-white shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
      aria-label={useMock ? '切換到 API 資料' : '切換到 Mock 資料'}
    >
      {useMock ? '🧪 Mock 資料' : '🌐 API 資料'}
    </button>
  );
}
```

---

## 13. hooks/useCommunityWallData.ts (統一資料Hook)

```typescript
/**
 * useCommunityWallData
 * 
 * 統一社區牆資料來源 Hook
 * - Mock 模式：使用本地假資料
 * - API 模式：使用真實 API 資料（自動轉換格式）
 * - 統一資料格式：不管來源是 Mock 還是 API，輸出格式一致
 */

import { useState, useCallback, useMemo } from 'react';
import { useCommunityWall } from './useCommunityWallQuery';
import type { 
  CommunityWallData, 
  CommunityPost, 
  CommunityQuestion, 
  CommunityReview 
} from '../services/communityService';

// ============ 統一輸出型別 ============
export interface Post {
  id: number | string;
  author: string;
  floor?: string;
  type: 'resident' | 'agent' | 'official';
  time: string;
  title: string;
  content: string;
  likes?: number;
  views?: number;
  comments: number;
  pinned?: boolean;
  private?: boolean;
}

export interface Review {
  id: number | string;
  author: string;
  company: string;
  visits: number;
  deals: number;
  pros: string[];
  cons: string | string[];
}

export interface Question {
  id: number | string;
  question: string;
  time: string;
  answersCount: number;
  answers: {
    author: string;
    type: 'resident' | 'agent' | 'official';
    content: string;
    expert?: boolean;
  }[];
}

export interface CommunityInfo {
  name: string;
  year: number;
  units: number;
  managementFee: number;
  builder: string;
  members: number;
  avgRating: number;
  monthlyInteractions: number;
  forSale: number;
}

export interface UnifiedWallData {
  communityInfo: CommunityInfo;
  posts: {
    public: Post[];
    private: Post[];
  };
  reviews: Review[];
  questions: Question[];
}

// ============ Mock 資料 ============
const MOCK_DATA: UnifiedWallData = {
  communityInfo: {
    name: '惠宇上晴',
    year: 2018,
    units: 280,
    managementFee: 85,
    builder: '惠宇建設',
    members: 88,
    avgRating: 4.2,
    monthlyInteractions: 156,
    forSale: 23,
  },
  posts: {
    public: [
      { id: 1, author: '陳小姐', floor: '12F', type: 'resident', time: '2小時前', title: '有人要團購掃地機嗎？🤖', content: '這款 iRobot 打折，滿 5 台有團購價～', likes: 31, comments: 14 },
      { id: 2, author: '游杰倫', type: 'agent', time: '昨天', title: '🏡 惠宇上晴 12F｜雙陽台視野戶', content: '客廳光線很好，上週屋主剛降價 50 萬，有興趣可私訊。', views: 89, comments: 5 },
      { id: 3, author: '李先生', floor: '8F', type: 'resident', time: '3天前', title: '停車位交流 🚗', content: '我有 B2-128 想與 B1 交換，方便接送小孩', likes: 12, comments: 8 },
      { id: 4, author: '王太太', floor: '5F', type: 'resident', time: '1週前', title: '推薦水電師傅', content: '上次找的師傅很專業，價格公道，需要的鄰居私訊我', likes: 25, comments: 6 },
      { id: 5, author: '林經理', type: 'agent', time: '1週前', title: '🏡 惠宇上晴 8F｜三房車位', content: '屋況極新，前屋主自住保養好', views: 156, comments: 12 },
    ],
    private: [
      { id: 101, author: '管委會', type: 'official', time: '3天前', title: '📢 年度消防演練通知', content: '12/15（日）上午 10:00 將進行全社區消防演練，届時警報器會響，請勿驚慌。', pinned: true, comments: 0 },
      { id: 102, author: '15F 住戶', type: 'resident', time: '1週前', title: '管理費調漲討論', content: '想問大家覺得管理費調漲合理嗎？從 2,800 調到 3,200，漲幅有點大...', comments: 28, private: true },
      { id: 103, author: '3F 住戶', type: 'resident', time: '2週前', title: '頂樓漏水問題', content: '最近下雨頂樓好像有漏水，管委會有要處理嗎？', comments: 15, private: true },
    ],
  },
  reviews: [
    { id: 1, author: '游杰倫', company: '21世紀', visits: 12, deals: 3, pros: ['公設維護得乾淨，假日草皮有人整理', '反映停車動線，管委會一週內就公告改善'], cons: '面向大馬路低樓層車聲明顯，喜靜者選中高樓層' },
    { id: 2, author: '林美玲', company: '信義房屋', visits: 8, deals: 2, pros: ['頂樓排水設計不錯，颱風天也沒有積水問題', '中庭花園維護用心，住戶反應都很正面'], cons: '垃圾車時間稍晚，家裡偶爾會有下水道味' },
    { id: 3, author: '陳志明', company: '永慶房屋', visits: 6, deals: 1, pros: ['管理員服務態度很好，代收包裹很方便', '社區有健身房，設備維護不錯'], cons: '電梯尖峰時段要等比較久' },
    { id: 4, author: '黃小華', company: '住商不動產', visits: 10, deals: 2, pros: ['學區不錯，走路到國小只要5分鐘', '附近生活機能完善'], cons: '部分戶型採光稍弱' },
    { id: 5, author: '張大明', company: '台灣房屋', visits: 5, deals: 1, pros: ['建商口碑好，用料實在', '公設比合理，實坪數划算'], cons: '車道坡度較陡，新手要小心' },
  ],
  questions: [
    { id: 1, question: '請問社區停車位好停嗎？會不會常客滿？', time: '2天前', answersCount: 2, answers: [
      { author: '12F 住戶', type: 'resident', content: 'B2 比較容易有位，B1 要碰運氣。' },
      { author: '游杰倫', type: 'agent', content: '這社區車位配比是 1:1.2，算充裕的。', expert: true },
    ]},
    { id: 2, question: '晚上會不會很吵？我看物件時是白天', time: '5天前', answersCount: 2, answers: [
      { author: '3F 住戶', type: 'resident', content: '面大馬路那側確實有車聲，但習慣就好。內側安靜很多。' },
      { author: '10F 住戶', type: 'resident', content: '我住內側，晚上很安靜，睡眠品質不錯。' },
    ]},
    { id: 3, question: '管理費多少？有包含哪些服務？', time: '1週前', answersCount: 1, answers: [
      { author: '管委會', type: 'official', content: '目前每坪 85 元，含 24 小時保全、公設維護、垃圾代收。' },
    ]},
    { id: 4, question: '社區有健身房嗎？設備新不新？', time: '3天前', answersCount: 0, answers: [] },
  ],
};

// ============ API 資料轉換函數 ============

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMins < 60) return `${diffMins}分鐘前`;
  if (diffHours < 24) return `${diffHours}小時前`;
  if (diffDays < 7) return `${diffDays}天前`;
  if (diffWeeks < 4) return `${diffWeeks}週前`;
  return date.toLocaleDateString('zh-TW');
}

function convertApiPost(post: CommunityPost): Post {
  // 建立基本物件，API 來源沒有 floor 資訊
  return {
    id: post.id,
    author: post.author?.name || '匿名',
    type: (post.author?.role as 'resident' | 'agent') || 'resident',
    time: formatTimeAgo(post.created_at),
    title: post.content.substring(0, 20) + (post.content.length > 20 ? '...' : ''),
    content: post.content,
    likes: post.likes_count,
    comments: 0, // API 沒有這個欄位
    pinned: false,
    private: post.visibility === 'private',
  };
}

function convertApiReview(review: CommunityReview): Review {
  return {
    id: review.id,
    author: '匿名房仲', // API 需要 join author 資料
    company: '房仲公司',
    visits: 0,
    deals: 0,
    pros: review.content.pros || [],
    cons: review.content.cons || '',
  };
}

function convertApiQuestion(question: CommunityQuestion): Question {
  return {
    id: question.id,
    question: question.question,
    time: formatTimeAgo(question.created_at),
    answersCount: question.answers.length,
    answers: question.answers.map(a => ({
      author: '匿名',
      type: 'resident' as const,
      content: a.content,
      expert: a.is_expert,
    })),
  };
}

function convertApiData(apiData: CommunityWallData): Omit<UnifiedWallData, 'communityInfo'> {
  // 轉換私密貼文
  const convertedPrivate = apiData.posts.private.map(convertApiPost);
  // 排序：pinned 優先（目前 API 沒有 pinned，但轉換後的 Post 有）
  const sortedPrivate = [...convertedPrivate].sort((a, b) => 
    (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)
  );

  return {
    posts: {
      public: apiData.posts.public.map(convertApiPost),
      private: sortedPrivate, // 已經轉換過的 Post[]
    },
    reviews: apiData.reviews.items.map(convertApiReview),
    questions: apiData.questions.items.map(convertApiQuestion),
  };
}

// ============ Hook 選項 ============
export interface UseCommunityWallDataOptions {
  /** 是否包含私密貼文（需登入） */
  includePrivate?: boolean;
}

export interface UseCommunityWallDataReturn {
  /** 統一格式資料 */
  data: UnifiedWallData;
  /** 是否使用 Mock */
  useMock: boolean;
  /** 切換 Mock/API */
  setUseMock: (v: boolean) => void;
  /** 是否載入中 */
  isLoading: boolean;
  /** 錯誤訊息 */
  error: Error | null;
  /** 按讚 */
  toggleLike: (postId: string | number) => Promise<void>;
  /** 發文 */
  createPost: (content: string, visibility?: 'public' | 'private') => Promise<void>;
  /** 發問 */
  askQuestion: (question: string) => Promise<void>;
  /** 回答 */
  answerQuestion: (questionId: string, content: string) => Promise<void>;
}

// ============ Main Hook ============
export function useCommunityWallData(
  communityId: string | undefined,
  options: UseCommunityWallDataOptions = {}
): UseCommunityWallDataReturn {
  const { includePrivate = false } = options;
  const [useMock, setUseMock] = useState(true);

  // API Hook（只在非 Mock 模式且有 communityId 時啟用）
  const {
    data: apiData,
    isLoading: apiLoading,
    error: apiError,
    toggleLike: apiToggleLike,
    createPost: apiCreatePost,
    askQuestion: apiAskQuestion,
    answerQuestion: apiAnswerQuestion,
  } = useCommunityWall(communityId, {
    includePrivate,
    enabled: !useMock && !!communityId,
  });

  // 統一資料：Mock 或轉換後的 API 資料
  const data = useMemo<UnifiedWallData>(() => {
    if (useMock) {
      // Mock 模式：私密牆排序 pinned 優先
      return {
        ...MOCK_DATA,
        posts: {
          ...MOCK_DATA.posts,
          private: [...MOCK_DATA.posts.private].sort((a, b) => 
            (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)
          ),
        },
      };
    }

    if (!apiData) {
      // API 模式但還沒資料：回傳空資料 + 預設 communityInfo
      return {
        communityInfo: {
          name: '載入中...',
          year: 0,
          units: 0,
          managementFee: 0,
          builder: '',
          members: 0,
          avgRating: 0,
          monthlyInteractions: 0,
          forSale: 0,
        },
        posts: { public: [], private: [] },
        reviews: [],
        questions: [],
      };
    }

    // API 模式：轉換資料格式
    const converted = convertApiData(apiData);
    return {
      // TODO: API 需要回傳 communityInfo，目前用 fallback
      communityInfo: MOCK_DATA.communityInfo,
      ...converted,
    };
  }, [useMock, apiData]);

  // 封裝操作函數
  const toggleLike = useCallback(async (postId: string | number) => {
    if (useMock) {
      console.log('[Mock] toggleLike:', postId);
      return;
    }
    await apiToggleLike(String(postId));
  }, [useMock, apiToggleLike]);

  const createPost = useCallback(async (content: string, visibility: 'public' | 'private' = 'public') => {
    if (useMock) {
      console.log('[Mock] createPost:', content, visibility);
      return;
    }
    await apiCreatePost(content, visibility);
  }, [useMock, apiCreatePost]);

  const askQuestion = useCallback(async (question: string) => {
    if (useMock) {
      console.log('[Mock] askQuestion:', question);
      return;
    }
    await apiAskQuestion(question);
  }, [useMock, apiAskQuestion]);

  const answerQuestion = useCallback(async (questionId: string, content: string) => {
    if (useMock) {
      console.log('[Mock] answerQuestion:', questionId, content);
      return;
    }
    await apiAnswerQuestion(questionId, content);
  }, [useMock, apiAnswerQuestion]);

  return {
    data,
    useMock,
    setUseMock,
    isLoading: !useMock && apiLoading,
    error: useMock ? null : apiError,
    toggleLike,
    createPost,
    askQuestion,
    answerQuestion,
  };
}

export default useCommunityWallData;
```
## 14. hooks/useCommunityWallQuery.ts (React Query Hook)

```typescript
/**
 * useCommunityWall (React Query 版)
 * 
 * 社區牆資料獲取 Hook
 * 使用 @tanstack/react-query 實現 SWR 策略
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { 
  getCommunityWall, 
  toggleLike as apiToggleLike,
  createPost as apiCreatePost,
  askQuestion as apiAskQuestion,
  answerQuestion as apiAnswerQuestion,
  clearCommunityCache,
  type CommunityWallData,
  type CommunityPost,
} from '../services/communityService';

// Query Keys
export const communityWallKeys = {
  all: ['communityWall'] as const,
  wall: (communityId: string) => [...communityWallKeys.all, 'wall', communityId] as const,
  posts: (communityId: string, visibility: 'public' | 'private') => 
    [...communityWallKeys.all, 'posts', communityId, visibility] as const,
};

export interface UseCommunityWallOptions {
  /** 是否包含私密貼文（需登入） */
  includePrivate?: boolean;
  /** 資料過期時間（毫秒），預設 5 分鐘 */
  staleTime?: number;
  /** 是否在視窗聚焦時刷新 */
  refetchOnWindowFocus?: boolean;
  /** 是否啟用 */
  enabled?: boolean;
}

export interface UseCommunityWallReturn {
  /** 社區牆資料 */
  data: CommunityWallData | undefined;
  /** 是否載入中 */
  isLoading: boolean;
  /** 是否正在取得資料 */
  isFetching: boolean;
  /** 錯誤訊息 */
  error: Error | null;
  /** 手動刷新 */
  refresh: () => Promise<void>;
  /** 按讚/取消按讚（樂觀更新） */
  toggleLike: (postId: string) => Promise<void>;
  /** 發布貼文 */
  createPost: (content: string, visibility?: 'public' | 'private') => Promise<void>;
  /** 發問 */
  askQuestion: (question: string) => Promise<void>;
  /** 回答問題 */
  answerQuestion: (questionId: string, content: string) => Promise<void>;
  /** 是否有樂觀更新中的操作 */
  isOptimisticUpdating: boolean;
}

export function useCommunityWall(
  communityId: string | undefined,
  options: UseCommunityWallOptions = {}
): UseCommunityWallReturn {
  const { 
    includePrivate = false,
    staleTime = 5 * 60 * 1000, // 5 分鐘
    refetchOnWindowFocus = true,
    enabled = true,
  } = options;

  const queryClient = useQueryClient();
  const [isOptimisticUpdating, setIsOptimisticUpdating] = useState(false);

  // 主要查詢
  const { 
    data, 
    isLoading, 
    isFetching, 
    error, 
    refetch 
  } = useQuery({
    queryKey: communityWallKeys.wall(communityId || ''),
    queryFn: () => getCommunityWall(communityId!, { includePrivate }),
    enabled: enabled && !!communityId,
    staleTime,
    refetchOnWindowFocus,
    retry: 2,
  });

  // 手動刷新
  const refresh = useCallback(async () => {
    if (communityId) {
      clearCommunityCache(communityId);
      await refetch();
    }
  }, [communityId, refetch]);

  // 按讚 Mutation（樂觀更新）
  const likeMutation = useMutation({
    mutationFn: apiToggleLike,
    onMutate: async (postId: string) => {
      setIsOptimisticUpdating(true);
      
      // 取消任何正在進行的查詢
      await queryClient.cancelQueries({ 
        queryKey: communityWallKeys.wall(communityId || '') 
      });

      // 保存舊資料用於回滾
      const previousData = queryClient.getQueryData<CommunityWallData>(
        communityWallKeys.wall(communityId || '')
      );

      // 樂觀更新
      if (previousData) {
        const updatePosts = (posts: CommunityPost[]): CommunityPost[] => 
          posts.map(post => {
            if (post.id !== postId) return post;
            const isLiked = post.liked_by.includes('current-user');
            return {
              ...post,
              likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1,
              liked_by: isLiked 
                ? post.liked_by.filter(id => id !== 'current-user')
                : [...post.liked_by, 'current-user'],
            };
          });

        queryClient.setQueryData<CommunityWallData>(
          communityWallKeys.wall(communityId || ''),
          {
            ...previousData,
            posts: {
              ...previousData.posts,
              public: updatePosts(previousData.posts.public),
              private: updatePosts(previousData.posts.private),
            },
          }
        );
      }

      return { previousData };
    },
    onError: (_err, _postId, context) => {
      // 失敗時回滾
      if (context?.previousData) {
        queryClient.setQueryData(
          communityWallKeys.wall(communityId || ''),
          context.previousData
        );
      }
    },
    onSettled: () => {
      setIsOptimisticUpdating(false);
      // 重新驗證資料
      queryClient.invalidateQueries({ 
        queryKey: communityWallKeys.wall(communityId || '') 
      });
    },
  });

  // 發文 Mutation
  const createPostMutation = useMutation({
    mutationFn: ({ content, visibility }: { content: string; visibility: 'public' | 'private' }) =>
      apiCreatePost(communityId!, content, visibility),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: communityWallKeys.wall(communityId || '') 
      });
    },
  });

  // 發問 Mutation
  const askQuestionMutation = useMutation({
    mutationFn: (question: string) => apiAskQuestion(communityId!, question),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: communityWallKeys.wall(communityId || '') 
      });
    },
  });

  // 回答 Mutation
  const answerQuestionMutation = useMutation({
    mutationFn: ({ questionId, content }: { questionId: string; content: string }) =>
      apiAnswerQuestion(questionId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: communityWallKeys.wall(communityId || '') 
      });
    },
  });

  // 封裝操作函數
  const toggleLike = useCallback(async (postId: string) => {
    await likeMutation.mutateAsync(postId);
  }, [likeMutation]);

  const createPost = useCallback(async (content: string, visibility: 'public' | 'private' = 'public') => {
    if (!communityId) throw new Error('缺少社區 ID');
    await createPostMutation.mutateAsync({ content, visibility });
  }, [communityId, createPostMutation]);

  const askQuestion = useCallback(async (question: string) => {
    if (!communityId) throw new Error('缺少社區 ID');
    await askQuestionMutation.mutateAsync(question);
  }, [communityId, askQuestionMutation]);

  const answerQuestion = useCallback(async (questionId: string, content: string) => {
    await answerQuestionMutation.mutateAsync({ questionId, content });
  }, [answerQuestionMutation]);

  return {
    data,
    isLoading,
    isFetching,
    error: error as Error | null,
    refresh,
    toggleLike,
    createPost,
    askQuestion,
    answerQuestion,
    isOptimisticUpdating,
  };
}

export default useCommunityWall;
```

---

## 15. services/communityService.ts (API服務)

```typescript
/**
 * Community Wall Service
 * 
 * 社區牆 API 封裝 - 統一處理所有社區牆相關請求
 * 包含快取策略與錯誤處理
 */

import { supabase } from '../lib/supabase';

// API 基礎路徑
const API_BASE = '/api/community';

// 快取時間（毫秒）
const CACHE_TTL = {
  posts: 5 * 60 * 1000,     // 5 分鐘
  reviews: 10 * 60 * 1000,  // 10 分鐘
  questions: 5 * 60 * 1000, // 5 分鐘
};

// 簡易記憶體快取
const cache = new Map<string, { data: unknown; timestamp: number }>();

function getCachedData<T>(key: string, ttl: number): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data as T;
  }
  cache.delete(key);
  return null;
}

function setCachedData(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// Types
export interface CommunityPost {
  id: string;
  community_id: string;
  author_id: string;
  content: string;
  visibility: 'public' | 'private';
  likes_count: number;
  liked_by: string[];
  created_at: string;
  author?: {
    name: string;
    avatar_url?: string;
    role?: 'resident' | 'agent' | 'member';
  };
}

export interface CommunityReview {
  id: string;
  community_id: string;
  author_id: string;
  content: {
    pros: string[];
    cons: string;
    property_title?: string;
  };
  created_at: string;
}

export interface CommunityQuestion {
  id: string;
  community_id: string;
  author_id: string;
  question: string;
  answers: {
    id: string;
    author_id: string;
    content: string;
    is_expert: boolean;
    created_at: string;
  }[];
  created_at: string;
}

export interface CommunityWallData {
  posts: {
    public: CommunityPost[];
    private: CommunityPost[];
    publicTotal: number;
    privateTotal: number;
  };
  reviews: {
    items: CommunityReview[];
    total: number;
  };
  questions: {
    items: CommunityQuestion[];
    total: number;
  };
}

// 取得 auth token
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

// 通用 fetch 包裝
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '請求失敗' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * 取得社區牆完整資料
 */
export async function getCommunityWall(
  communityId: string,
  options: { 
    forceRefresh?: boolean;
    includePrivate?: boolean;
  } = {}
): Promise<CommunityWallData> {
  const cacheKey = `wall:${communityId}:${options.includePrivate}`;
  
  if (!options.forceRefresh) {
    const cached = getCachedData<CommunityWallData>(cacheKey, CACHE_TTL.posts);
    if (cached) return cached;
  }

  const data = await fetchAPI<CommunityWallData>(
    `/wall?communityId=${communityId}&type=all`
  );
  
  setCachedData(cacheKey, data);
  return data;
}

/**
 * 取得公開貼文
 */
export async function getPublicPosts(
  communityId: string,
  options: { page?: number; limit?: number } = {}
): Promise<{ items: CommunityPost[]; total: number }> {
  const { page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;
  
  return fetchAPI(`/wall?communityId=${communityId}&type=posts&visibility=public&offset=${offset}&limit=${limit}`);
}

/**
 * 取得私密貼文（需登入）
 */
export async function getPrivatePosts(
  communityId: string,
  options: { page?: number; limit?: number } = {}
): Promise<{ items: CommunityPost[]; total: number }> {
  const { page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;
  
  return fetchAPI(`/wall?communityId=${communityId}&type=posts&visibility=private&offset=${offset}&limit=${limit}`);
}

/**
 * 取得評價（來自 properties 的兩好一公道）
 */
export async function getReviews(
  communityId: string
): Promise<{ items: CommunityReview[]; total: number }> {
  const cacheKey = `reviews:${communityId}`;
  const cached = getCachedData<{ items: CommunityReview[]; total: number }>(cacheKey, CACHE_TTL.reviews);
  if (cached) return cached;

  const data = await fetchAPI<{ items: CommunityReview[]; total: number }>(
    `/wall?communityId=${communityId}&type=reviews`
  );
  
  setCachedData(cacheKey, data);
  return data;
}

/**
 * 取得問答
 */
export async function getQuestions(
  communityId: string
): Promise<{ items: CommunityQuestion[]; total: number }> {
  const cacheKey = `questions:${communityId}`;
  const cached = getCachedData<{ items: CommunityQuestion[]; total: number }>(cacheKey, CACHE_TTL.questions);
  if (cached) return cached;

  const data = await fetchAPI<{ items: CommunityQuestion[]; total: number }>(
    `/wall?communityId=${communityId}&type=questions`
  );
  
  setCachedData(cacheKey, data);
  return data;
}

/**
 * 發布貼文
 */
export async function createPost(
  communityId: string,
  content: string,
  visibility: 'public' | 'private' = 'public'
): Promise<CommunityPost> {
  // 清除快取
  cache.delete(`wall:${communityId}:false`);
  cache.delete(`wall:${communityId}:true`);

  return fetchAPI('/post', {
    method: 'POST',
    body: JSON.stringify({ communityId, content, visibility }),
  });
}

/**
 * 按讚/取消按讚
 */
export async function toggleLike(
  postId: string
): Promise<{ liked: boolean; likes_count: number }> {
  return fetchAPI('/like', {
    method: 'POST',
    body: JSON.stringify({ postId }),
  });
}

/**
 * 提問
 */
export async function askQuestion(
  communityId: string,
  question: string
): Promise<CommunityQuestion> {
  // 清除快取
  cache.delete(`questions:${communityId}`);

  return fetchAPI('/question', {
    method: 'POST',
    body: JSON.stringify({ communityId, question }),
  });
}

/**
 * 回答問題
 */
export async function answerQuestion(
  questionId: string,
  content: string
): Promise<{ id: string; content: string }> {
  return fetchAPI('/question', {
    method: 'PUT',
    body: JSON.stringify({ questionId, content }),
  });
}

/**
 * 清除快取（例如發文後強制刷新）
 */
export function clearCommunityCache(communityId?: string): void {
  if (communityId) {
    // 清除特定社區的快取
    for (const key of cache.keys()) {
      if (key.includes(communityId)) {
        cache.delete(key);
      }
    }
  } else {
    // 清除所有快取
    cache.clear();
  }
}

export default {
  getCommunityWall,
  getPublicPosts,
  getPrivatePosts,
  getReviews,
  getQuestions,
  createPost,
  toggleLike,
  askQuestion,
  answerQuestion,
  clearCommunityCache,
};
```

---

## 權限矩陣

| 功能 | 訪客 | 會員 | 住戶 | 房仲 |
|------|------|------|------|------|
| 評價 | 2則+blur | 全部 | 全部 | 全部 |
| 公開牆 | 2則+blur | 全部 | +發文 | +發物件 |
| 私密牆 | ❌鎖 | ❌鎖 | ✅+發文 | ✅唯讀 |
| 問答 | 看1答 | 可問 | 可答 | 專家答 |

---

## 商業邏輯說明

1. **四角色權限**：guest(訪客)、member(會員)、resident(住戶)、agent(房仲)
2. **blur遮罩**：訪客只能看2則內容，其餘模糊+CTA引導註冊
3. **私密牆**：只有住戶和房仲可進入，房仲只能看不能發
4. **問答專家標章**：房仲回答會顯示「專家回答」標籤
5. **樂觀更新**：按讚操作即時更新UI，失敗自動回滾
