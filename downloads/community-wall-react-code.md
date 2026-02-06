# 社區牆 React 版完整代碼

> 生成時間：$(date '+%Y-%m-%d %H:%M')
> 測試網址：https://maihouses.vercel.app/maihouses/community/test-uuid/wall

---

## 1. Wall.tsx（主組件）

\`\`\`tsx
import { useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useCommunityWall } from '../../hooks/useCommunityWall';

// ============ Types ============
type Role = 'guest' | 'member' | 'resident' | 'agent';
type WallTab = 'public' | 'private';

interface Post {
id: number;
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

interface Review {
id: number;
author: string;
company: string;
visits: number;
deals: number;
pros: string[];
cons: string;
}

interface Question {
id: number;
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

// ============ Mock Data ============
const MOCK_DATA = {
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

const GUEST_VISIBLE_COUNT = 2;

// ============ Permission Helper ============
function getPermissions(role: Role) {
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

// ============ Sub Components ============

// 頂部導航
function Topbar({ communityName }: { communityName: string }) {
return (

<header className="sticky top-0 z-50 flex items-center gap-2.5 border-b border-[rgba(230,237,247,0.8)] bg-[rgba(246,249,255,0.95)] px-4 py-2 backdrop-blur-[12px]">
<a 
        href="/maihouses/" 
        className="flex items-center gap-2 rounded-[10px] px-2.5 py-1.5 text-sm font-bold text-[var(--primary)] no-underline transition-colors hover:bg-[rgba(0,56,90,0.06)]"
      >
<svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
<path d="M19 12H5M12 19l-7-7 7-7"/>
</svg>
<span>回首頁</span>
</a>
<div className="flex-1 text-center">
<h1 className="m-0 text-base font-extrabold text-[var(--primary-dark)]">{communityName}</h1>
<p className="m-0 text-[11px] text-[var(--text-secondary)]">社區牆</p>
</div>
<div className="flex items-center gap-2">
<button className="relative inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-white px-2 py-2 text-sm text-[#173a7c] transition-all hover:bg-[#f6f9ff]">
🔔
<span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-[#e02626] text-[11px] font-bold text-white">2</span>
</button>
<button className="flex items-center gap-1 rounded-[14px] border border-[var(--line)] bg-white px-2.5 py-1.5 text-[13px] font-bold text-[#173a7c]">
👤 我的
</button>
</div>
</header>
);
}

// 評價卡片
function ReviewCard({ item, type }: { item: { text: string; author: string; company: string; visits: number; deals: number }; type: 'pro' | 'con' }) {
const icon = type === 'pro' ? '✅' : '⚖️';
const bgClass = type === 'pro' ? 'bg-gradient-to-br from-[#f6f9ff] to-[#eef3ff]' : 'bg-gradient-to-br from-[#f0f5ff] to-[#e6edf7]';

return (

<div className="rounded-[14px] border border-[var(--border-light)] bg-white p-3.5 transition-all hover:border-[rgba(0,56,90,0.15)] hover:shadow-[0_2px_8px_rgba(0,56,90,0.04)]">
<div className="mb-2.5 flex items-center gap-2.5">
<div className="flex h-[38px] w-[38px] items-center justify-center rounded-full border-2 border-[var(--primary)] bg-gradient-to-br from-[#eef3ff] to-white text-sm font-extrabold text-[var(--primary)]">
{item.author.charAt(0)}
</div>
<div className="flex-1">
<div className="text-[13px] font-bold">{item.author}｜{item.company}</div>
<div className="text-[11px] text-[var(--text-secondary)]">帶看 {item.visits} 次 · 成交 {item.deals} 戶</div>
</div>
</div>
<div className={`flex items-start gap-2.5 rounded-[10px] p-2 text-[13px] leading-relaxed ${bgClass}`}>
<span className="flex h-6 w-6 shrink-0 items-center justify-center text-base">{icon}</span>
<span className="flex-1 text-[var(--text-primary)]">{item.text}</span>
</div>
</div>
);
}

// 評價區
function ReviewsSection({ role }: { role: Role }) {
const perm = getPermissions(role);
const reviews = MOCK_DATA.reviews;

// 拆成單項
const allItems = useMemo(() => {
const items: { type: 'pro' | 'con'; text: string; author: string; company: string; visits: number; deals: number }[] = [];
reviews.forEach(review => {
review.pros.forEach(pro => {
items.push({ type: 'pro', text: pro, author: review.author, company: review.company, visits: review.visits, deals: review.deals });
});
items.push({ type: 'con', text: review.cons, author: review.author, company: review.company, visits: review.visits, deals: review.deals });
});
return items;
}, [reviews]);

const totalCount = allItems.length;
const visibleCount = perm.canSeeAllReviews ? totalCount : GUEST_VISIBLE_COUNT;
const hiddenCount = totalCount - visibleCount;

return (

<section className="overflow-hidden rounded-[18px] border border-[var(--border-light)] bg-[rgba(255,255,255,0.98)] shadow-[0_2px_12px_rgba(0,51,102,0.04)]">
<div className="flex items-center justify-between border-b border-[rgba(0,56,90,0.05)] bg-gradient-to-br from-[rgba(0,56,90,0.08)] to-[rgba(0,82,130,0.04)] px-4 py-3.5">
<div>
<h2 className="flex items-center gap-1.5 text-[15px] font-extrabold text-[var(--primary-dark)]">⭐ 社區評價</h2>
<p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">來自最真實的評價</p>
</div>
<span className="flex items-center gap-1 rounded-full border border-[var(--primary-light)] bg-[rgba(0,56,90,0.08)] px-2.5 py-1 text-[10px] font-bold text-[var(--primary)]">
{totalCount} 則評價
</span>
</div>
<div className="flex flex-col gap-2.5 p-3.5">
{allItems.slice(0, visibleCount).map((item, idx) => (
<ReviewCard key={idx} item={item} type={item.type} />
))}

        {hiddenCount > 0 && allItems[visibleCount] && (
          <div className="relative">
            <div className="pointer-events-none select-none blur-[4px]">
              <ReviewCard item={allItems[visibleCount]} type={allItems[visibleCount].type} />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[14px] bg-[rgba(255,255,255,0.85)] p-5 text-center">
              <h4 className="mb-1 text-sm font-extrabold text-[var(--primary-dark)]">🔒 還有 {hiddenCount} 則評價</h4>
              <p className="mb-2.5 text-xs text-[var(--text-secondary)]">✓ 查看全部評價　✓ 新回答通知</p>
              <button className="rounded-full bg-gradient-to-br from-[var(--primary)] to-[#005282] px-6 py-2.5 text-[13px] font-bold text-white transition-transform hover:scale-[1.02]">
                免費註冊 / 登入
              </button>
            </div>
          </div>
        )}
      </div>
    </section>

);
}

// 貼文卡片
function PostCard({ post, perm }: { post: Post; perm: ReturnType<typeof getPermissions> }) {
const isAgent = post.type === 'agent';
const isOfficial = post.type === 'official';

const badge = isAgent
? <span className="rounded bg-[#e0f4ff] px-1.5 py-0.5 text-[9px] font-bold text-[#004E7C]">認證房仲</span>
: isOfficial
? <span className="rounded bg-[#f6f9ff] px-1.5 py-0.5 text-[9px] font-bold text-[#00385a]">官方公告</span>
: post.floor
? <span className="rounded bg-[#e6edf7] px-1.5 py-0.5 text-[9px] font-bold text-[#00385a]">{post.floor} 住戶</span>
: null;

const stats = post.likes
? <span className="flex items-center gap-1">❤️ {post.likes}</span>
: post.views
? <span className="flex items-center gap-1">👁️ {post.views}</span>
: null;

return (

<div className="flex gap-2.5 rounded-[14px] border border-[var(--border-light)] bg-white p-3 transition-all hover:border-[var(--primary-light)] hover:shadow-[0_2px_8px_rgba(0,56,90,0.06)]">
<div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-gradient-to-br from-[#eef3ff] to-white text-base font-extrabold ${isAgent ? 'border-[var(--brand-light)] text-[var(--brand-600)]' : 'border-[var(--primary)] text-[var(--primary)]'}`}>
{post.author.charAt(0)}
</div>
<div className="flex flex-1 flex-col gap-1.5">
<div className="flex flex-wrap items-center gap-2">
<span className="text-[13px] font-bold text-[var(--text-primary)]">{post.author}</span>
{badge}
<span className="text-[11px] text-[var(--text-secondary)]">{post.time}</span>
</div>
<div className="text-[13px] leading-relaxed text-[var(--text-primary)]">
<b>{post.title}</b><br/>
{post.content}
</div>
<div className="flex gap-3 text-[11px] text-[var(--text-secondary)]">
{stats}
<span className="flex items-center gap-1">💬 {post.comments}</span>
{post.private && <span className="flex items-center gap-1">🔒 僅社區可見</span>}
</div>
<div className="mt-1 flex gap-2">
{isAgent ? (
<button className="flex items-center gap-1 rounded-lg border border-[rgba(0,56,90,0.1)] bg-[rgba(0,56,90,0.06)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--primary)] transition-all hover:bg-[rgba(0,56,90,0.12)]">
📩 私訊房仲
</button>
) : (
<>
<button className="flex items-center gap-1 rounded-lg border border-[rgba(0,56,90,0.1)] bg-[rgba(0,56,90,0.06)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--primary)] transition-all hover:bg-[rgba(0,56,90,0.12)]">❤️ 讚</button>
<button className="flex items-center gap-1 rounded-lg border border-[rgba(0,56,90,0.1)] bg-[rgba(0,56,90,0.06)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--primary)] transition-all hover:bg-[rgba(0,56,90,0.12)]">💬 回覆</button>
</>
)}
</div>
</div>
</div>
);
}

// 貼文區
function PostsSection({ role, currentTab, onTabChange }: { role: Role; currentTab: WallTab; onTabChange: (tab: WallTab) => void }) {
const perm = getPermissions(role);
const publicPosts = MOCK_DATA.posts.public;
const privatePosts = MOCK_DATA.posts.private;

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

<section className="overflow-hidden rounded-[18px] border border-[var(--border-light)] bg-[rgba(255,255,255,0.98)] shadow-[0_2px_12px_rgba(0,51,102,0.04)]">
<div className="flex items-center justify-between border-b border-[rgba(0,56,90,0.05)] bg-gradient-to-br from-[rgba(0,56,90,0.03)] to-[rgba(0,82,130,0.01)] px-4 py-3.5">
<h2 className="flex items-center gap-1.5 text-[15px] font-extrabold text-[var(--primary-dark)]">🔥 社區熱帖</h2>
</div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 px-3.5 pb-3.5 pt-2">
        <button
          onClick={() => onTabChange('public')}
          className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${currentTab === 'public' ? 'border-[var(--primary-light)] bg-[rgba(0,56,90,0.1)] font-bold text-[var(--primary)]' : 'border-transparent bg-[rgba(240,244,250,0.8)] text-[var(--text-secondary)] hover:bg-[rgba(0,56,90,0.08)] hover:text-[var(--primary)]'}`}
        >
          公開牆
        </button>
        <button
          onClick={handlePrivateClick}
          className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${currentTab === 'private' ? 'border-[var(--primary-light)] bg-[rgba(0,56,90,0.1)] font-bold text-[var(--primary)]' : 'border-transparent bg-[rgba(240,244,250,0.8)] text-[var(--text-secondary)] hover:bg-[rgba(0,56,90,0.08)] hover:text-[var(--primary)]'} ${!perm.canAccessPrivate ? 'opacity-60' : ''}`}
        >
          私密牆 {!perm.canAccessPrivate && '🔒'}
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2.5 px-3.5 pb-3.5">
        {currentTab === 'public' ? (
          <>
            {visiblePublic.map(post => (
              <PostCard key={post.id} post={post} perm={perm} />
            ))}
            {hiddenPublicCount > 0 && publicPosts[GUEST_VISIBLE_COUNT] && (
              <div className="relative">
                <div className="pointer-events-none select-none blur-[4px]">
                  <PostCard post={publicPosts[GUEST_VISIBLE_COUNT]} perm={perm} />
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[14px] bg-[rgba(255,255,255,0.85)] p-5 text-center">
                  <h4 className="mb-1 text-sm font-extrabold text-[var(--primary-dark)]">🔒 還有 {hiddenPublicCount} 則熱帖</h4>
                  <p className="mb-2.5 text-xs text-[var(--text-secondary)]">✓ 查看完整動態　✓ 新回答通知</p>
                  <button className="rounded-full bg-gradient-to-br from-[var(--primary)] to-[#005282] px-6 py-2.5 text-[13px] font-bold text-white transition-transform hover:scale-[1.02]">
                    免費註冊 / 登入
                  </button>
                </div>
              </div>
            )}
            {perm.canPostPublic && (
              <div className="flex justify-center rounded-[14px] border border-dashed border-[var(--border-light)] bg-[rgba(0,56,90,0.03)] p-5">
                <button className="flex w-full items-center justify-center gap-1 rounded-lg border border-[rgba(0,56,90,0.1)] bg-[rgba(0,56,90,0.06)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--primary)]">
                  ✏️ 發布貼文
                </button>
              </div>
            )}
          </>
        ) : perm.canAccessPrivate ? (
          <>
            {privatePosts.map(post => (
              <PostCard key={post.id} post={post} perm={perm} />
            ))}
            {perm.canPostPrivate ? (
              <div className="flex justify-center rounded-[14px] border border-dashed border-[var(--border-light)] bg-[rgba(0,56,90,0.03)] p-5">
                <button className="flex w-full items-center justify-center gap-1 rounded-lg border border-[rgba(0,56,90,0.1)] bg-[rgba(0,56,90,0.06)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--primary)]">
                  ✏️ 發布私密貼文
                </button>
              </div>
            ) : (
              <p className="py-3 text-center text-[11px] text-[var(--text-secondary)]">💡 房仲可查看私密牆，但無法發文</p>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-[14px] bg-[rgba(0,56,90,0.03)] px-5 py-10 text-center">
            <div className="mb-3 text-5xl opacity-50">🔐</div>
            <h4 className="mb-1.5 text-sm font-bold text-[var(--primary-dark)]">私密牆僅限本社區住戶查看</h4>
            <p className="mb-4 text-xs text-[var(--text-secondary)]">{perm.isGuest ? '請先登入或註冊' : '驗證住戶身份後即可加入討論'}</p>
            <button className="rounded-full bg-[var(--primary)] px-5 py-2.5 text-xs font-bold text-white">
              {perm.isGuest ? '免費註冊 / 登入' : '我是住戶，驗證身份'}
            </button>
          </div>
        )}
      </div>
    </section>

);
}

// 問答卡片
function QACard({ q, perm, isUnanswered = false }: { q: Question; perm: ReturnType<typeof getPermissions>; isUnanswered?: boolean }) {
return (

<div className={`rounded-[14px] border p-3.5 transition-all hover:border-[rgba(0,56,90,0.15)] ${isUnanswered ? 'border-[rgba(0,159,232,0.3)] bg-gradient-to-br from-[#f6f9ff] to-[#eef5ff]' : 'border-[var(--border-light)] bg-white'}`}>
<div className="mb-2 text-sm font-bold leading-snug text-[var(--primary-dark)]">Q: {q.question}</div>
<div className="mb-2.5 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-secondary)]">
<span>👤 準住戶</span>
<span>· {q.time}</span>
{isUnanswered ? (
<span className="font-bold text-[var(--brand-light)]">· 等待回答中</span>
) : (
<span>· {q.answersCount} 則回覆</span>
)}
</div>

      {isUnanswered ? (
        <div className="mt-2 rounded-[10px] bg-[rgba(0,56,90,0.02)] p-4 text-center text-[13px] text-[var(--text-secondary)]">
          🙋 還沒有人回答，成為第一個回答的人！
        </div>
      ) : (
        <div className="flex flex-col gap-2 border-l-[3px] border-[var(--border)] pl-3.5">
          {q.answers.map((a, idx) => (
            <div key={idx} className="py-2 text-[13px] leading-relaxed">
              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${a.type === 'agent' ? 'bg-[#e0f4ff] text-[#004E7C]' : a.type === 'official' ? 'bg-[#f6f9ff] text-[#00385a]' : 'bg-[#e6edf7] text-[#00385a]'}`}>
                  {a.type === 'agent' ? '🏢 認證房仲' : a.type === 'official' ? `📋 ${a.author}` : `🏠 ${a.author}`}
                </span>
                {a.expert && <span className="rounded bg-[#f0f5ff] px-2 py-0.5 text-[10px] font-bold text-[#004E7C]">⭐ 專家回答</span>}
              </div>
              {a.content}
            </div>
          ))}
        </div>
      )}

      {perm.canAnswer && (
        <div className="mt-2.5">
          <button className={`flex w-full items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-all ${isUnanswered ? 'border-[rgba(0,159,232,0.3)] bg-[rgba(0,159,232,0.1)] text-[#004E7C]' : 'border-[rgba(0,56,90,0.1)] bg-[rgba(0,56,90,0.06)] text-[var(--primary)]'} hover:bg-[rgba(0,56,90,0.12)]`}>
            💬 {isUnanswered ? '搶先回答' : '我來回答'}{perm.isAgent ? '（專家）' : ''}
          </button>
        </div>
      )}
    </div>

);
}

// 問答區
function QASection({ role }: { role: Role }) {
const perm = getPermissions(role);
const questions = MOCK_DATA.questions;

const answeredQuestions = questions.filter(q => q.answers.length > 0);
const unansweredQuestions = questions.filter(q => q.answers.length === 0);

const visibleCount = perm.isLoggedIn ? answeredQuestions.length : Math.min(GUEST_VISIBLE_COUNT, answeredQuestions.length);
const hiddenCount = answeredQuestions.length - visibleCount;

return (

<section className="overflow-hidden rounded-[18px] border border-[var(--border-light)] bg-[rgba(255,255,255,0.98)] shadow-[0_2px_12px_rgba(0,51,102,0.04)]">
<div className="flex items-center justify-between border-b border-[rgba(0,56,90,0.05)] bg-gradient-to-br from-[rgba(0,56,90,0.03)] to-[rgba(0,82,130,0.01)] px-4 py-3.5">
<div>
<h2 className="flex items-center gap-1.5 text-[15px] font-extrabold text-[var(--primary-dark)]">
🙋 準住戶問答
{unansweredQuestions.length > 0 && (
<span className="ml-1.5 rounded-full bg-[#e0f4ff] px-2 py-0.5 text-xs font-bold text-[#004E7C]">
{unansweredQuestions.length} 題待回答
</span>
)}
</h2>
<p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">買房前，先問問鄰居怎麼說</p>
</div>
</div>
<div className="flex flex-col gap-2.5 p-3.5">
{/_ 有回答的問題 _/}
{answeredQuestions.slice(0, visibleCount).map(q => (
<QACard key={q.id} q={q} perm={perm} />
))}

        {/* Blur 遮罩 */}
        {hiddenCount > 0 && answeredQuestions[visibleCount] && (
          <div className="relative">
            <div className="pointer-events-none select-none blur-[4px]">
              <QACard q={answeredQuestions[visibleCount]} perm={perm} />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[14px] bg-[rgba(255,255,255,0.85)] p-5 text-center">
              <h4 className="mb-1 text-sm font-extrabold text-[var(--primary-dark)]">🔒 還有 {hiddenCount} 則問答</h4>
              <p className="mb-2.5 text-xs text-[var(--text-secondary)]">✓ 查看完整問答　✓ 新回答通知</p>
              <button className="rounded-full bg-gradient-to-br from-[var(--primary)] to-[#005282] px-6 py-2.5 text-[13px] font-bold text-white transition-transform hover:scale-[1.02]">
                免費註冊 / 登入
              </button>
            </div>
          </div>
        )}

        {/* 無回答的問題 */}
        {unansweredQuestions.map(q => (
          <QACard key={q.id} q={q} perm={perm} isUnanswered />
        ))}

        {/* 發問區塊 */}
        <div className="rounded-[14px] border border-dashed border-[var(--border-light)] bg-[rgba(0,56,90,0.03)] p-3.5">
          <div className="mb-2 text-sm font-bold text-[var(--text-secondary)]">💬 你也有問題想問？</div>
          <p className="mb-2 text-xs text-[var(--text-secondary)]">問題會通知該社區住戶，通常 24 小時內會有回覆</p>
          <button className="flex w-full items-center justify-center gap-1 rounded-lg border border-[rgba(0,56,90,0.1)] bg-[rgba(0,56,90,0.06)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--primary)]">
            {perm.canAskQuestion ? '我想問問題' : '登入後發問'}
          </button>
        </div>
      </div>
    </section>

);
}

// 側邊欄
function Sidebar({ info }: { info: typeof MOCK_DATA.communityInfo }) {
const questions = MOCK_DATA.questions.slice(0, 3);
const hotPosts = [...MOCK_DATA.posts.public].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 2);

return (

<aside className="hidden w-[280px] shrink-0 flex-col gap-3 self-start lg:sticky lg:top-[70px] lg:flex">
{/_ 社區資訊 _/}
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
      <div className="rounded-[14px] border border-[var(--line)] bg-white p-3.5 shadow-[0_4px_14px_rgba(0,51,102,0.04)]">
        <h4 className="mb-2.5 flex items-center gap-1.5 text-sm font-extrabold text-[var(--brand)]">🔗 快速連結</h4>
        <div className="flex flex-col gap-1">
          {['🏠 查看此社區物件', '📊 與其他社區比較', '🔔 追蹤此社區'].map(link => (
            <a key={link} href="#" className="flex items-center gap-2 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold text-[var(--text-primary)] no-underline transition-all hover:bg-[#f0f7ff]">
              {link}
            </a>
          ))}
        </div>
      </div>

      {/* 最新問答 */}
      <div className="rounded-[14px] border border-[var(--line)] bg-white p-3.5 shadow-[0_4px_14px_rgba(0,51,102,0.04)]">
        <h4 className="mb-2.5 flex items-center gap-1.5 text-sm font-extrabold text-[var(--brand)]">❓ 最新問答</h4>
        <div className="flex flex-col gap-1">
          {questions.map(q => (
            <a key={q.id} href="#qa-section" className="flex items-start gap-2 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold text-[var(--text-primary)] no-underline transition-all hover:bg-[#f0f7ff]">
              <span className="shrink-0">💬</span>
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
              <span className="shrink-0">❤️ {p.likes}</span>
              <span className="overflow-hidden text-ellipsis whitespace-nowrap">{p.title.length > 15 ? p.title.substring(0, 15) + '...' : p.title}</span>
            </a>
          ))}
        </div>
        <a href="#public-wall" className="mt-2 block text-center text-xs text-[var(--brand-light)] no-underline">查看全部貼文 →</a>
      </div>

      {/* 公仔卡片 */}
      <div className="rounded-[14px] border border-[var(--line)] bg-gradient-to-br from-[#f0f7ff] to-[#e8f4ff] p-3.5 text-center shadow-[0_4px_14px_rgba(0,51,102,0.04)]">
        <svg className="mx-auto mb-2 h-24 w-20 text-[#00385a]" viewBox="0 0 200 240">
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

// 身份切換器（Mock 用）
function RoleSwitcher({ role, onRoleChange }: { role: Role; onRoleChange: (role: Role) => void }) {
const [isOpen, setIsOpen] = useState(false);

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

return (

<div className="fixed bottom-5 right-5 z-[1000]">
<button
onClick={() => setIsOpen(!isOpen)}
className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] px-4 py-2.5 text-xs font-bold text-white shadow-[0_4px_20px_rgba(0,0,0,0.3)]" >
🕶️ <span>{roleNames[role]}</span> ▾
</button>
{isOpen && (
<div className="absolute bottom-[50px] right-0 min-w-[180px] rounded-xl border border-[var(--border)] bg-white p-2 shadow-[0_8px_30px_rgba(0,0,0,0.15)]">
{(Object.keys(roleLabels) as Role[]).map(r => (
<button
key={r}
onClick={() => { onRoleChange(r); setIsOpen(false); }}
className={`block w-full rounded-lg px-3 py-2.5 text-left text-xs ${role === r ? 'bg-[rgba(0,56,90,0.1)] font-bold text-[var(--primary)]' : 'text-[var(--text-primary)] hover:bg-[#f6f9ff]'}`} >
{roleLabels[r]}
</button>
))}
</div>
)}
</div>
);
}

// Mock 切換按鈕
function MockToggle({ useMock, onToggle }: { useMock: boolean; onToggle: () => void }) {
return (
<button
      onClick={onToggle}
      className="fixed bottom-5 left-5 z-[1000] flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] px-4 py-2.5 text-xs font-bold text-white shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
    >
{useMock ? '🧪 Mock 資料' : '🌐 API 資料'}
</button>
);
}

// 底部 CTA
function BottomCTA({ role }: { role: Role }) {
const perm = getPermissions(role);

if (perm.canAccessPrivate) return null;

return (

<div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-3 border-t border-[var(--border)] bg-[rgba(255,255,255,0.95)] px-4 py-3 backdrop-blur-[12px]">
<p className="text-xs text-[var(--text-secondary)]">
{perm.isMember ? '🏠 驗證住戶身份，解鎖私密牆' : '🔓 登入解鎖完整評價 + 更多功能'}
</p>
<button className="rounded-full bg-gradient-to-br from-[var(--primary)] to-[#005282] px-5 py-2.5 text-[13px] font-bold text-white">
{perm.isMember ? '驗證住戶' : '免費註冊'}
</button>
</div>
);
}

// ============ Main Component ============
export default function Wall() {
const { id } = useParams<{ id: string }>();
const [role, setRole] = useState<Role>('guest');
const [currentTab, setCurrentTab] = useState<WallTab>('public');
const [useMock, setUseMock] = useState(true);

// 真實 API（目前未使用，useMock=true 時用 MOCK_DATA）
const { data: apiData, isLoading, error } = useCommunityWall(useMock ? undefined : id);

// 當切換到私密牆但沒權限時，自動切回公開牆
const perm = getPermissions(role);
const handleTabChange = useCallback((tab: WallTab) => {
if (tab === 'private' && !perm.canAccessPrivate) {
return;
}
setCurrentTab(tab);
}, [perm.canAccessPrivate]);

// 如果身份變更導致無法存取私密牆，切回公開牆
if (currentTab === 'private' && !perm.canAccessPrivate) {
setCurrentTab('public');
}

const communityName = useMock ? MOCK_DATA.communityInfo.name : (apiData?.posts?.public?.[0]?.community_id || '社區牆');

return (

<div className="min-h-screen bg-gradient-to-b from-[var(--bg-base)] to-[var(--bg-alt)]">
<Topbar communityName={communityName} />

      <div className="mx-auto flex max-w-[960px] gap-5 p-2.5 pb-[calc(80px+env(safe-area-inset-bottom,20px))] lg:p-2.5">
        {/* 主內容區 */}
        <main className="flex max-w-[600px] flex-1 animate-[fadeInUp_0.5s_ease-out] flex-col gap-3">
          <ReviewsSection role={role} />
          <PostsSection role={role} currentTab={currentTab} onTabChange={handleTabChange} />
          <QASection role={role} />
        </main>

        {/* 側邊欄 */}
        <Sidebar info={MOCK_DATA.communityInfo} />
      </div>

      {/* 底部 CTA */}
      <BottomCTA role={role} />

      {/* Mock 切換按鈕 */}
      <MockToggle useMock={useMock} onToggle={() => setUseMock(!useMock)} />

      {/* 身份切換器 */}
      <RoleSwitcher role={role} onRoleChange={setRole} />

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

````

---

## 2. useCommunityWall.ts（Hook）

```typescript
/**
 * useCommunityWall
 *
 * 社區牆資料獲取 Hook
 * 提供 SWR 風格的資料獲取與快取
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getCommunityWall,
  getPublicPosts,
  getPrivatePosts,
  toggleLike as apiToggleLike,
  createPost as apiCreatePost,
  CommunityWallData,
  CommunityPost,
  clearCommunityCache,
} from '../services/communityService';

export interface UseCommunityWallOptions {
  /** 是否包含私密貼文（需登入） */
  includePrivate?: boolean;
  /** 資料刷新間隔（毫秒），0 表示不自動刷新 */
  refreshInterval?: number;
  /** 是否在視窗聚焦時刷新 */
  refreshOnFocus?: boolean;
}

export interface UseCommunityWallReturn {
  /** 社區牆資料 */
  data: CommunityWallData | null;
  /** 是否載入中 */
  isLoading: boolean;
  /** 錯誤訊息 */
  error: string | null;
  /** 手動刷新 */
  refresh: () => Promise<void>;
  /** 按讚/取消按讚 */
  toggleLike: (postId: string) => Promise<void>;
  /** 發布貼文 */
  createPost: (content: string, visibility?: 'public' | 'private') => Promise<void>;
  /** 樂觀更新後的貼文列表（即時反映 UI） */
  optimisticPosts: CommunityPost[];
}

export function useCommunityWall(
  communityId: string | undefined,
  options: UseCommunityWallOptions = {}
): UseCommunityWallReturn {
  const {
    includePrivate = false,
    refreshInterval = 0,
    refreshOnFocus = true,
  } = options;

  const [data, setData] = useState<CommunityWallData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [optimisticPosts, setOptimisticPosts] = useState<CommunityPost[]>([]);

  const mountedRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 獲取資料
  const fetchData = useCallback(async (force = false) => {
    if (!communityId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const wallData = await getCommunityWall(communityId, {
        forceRefresh: force,
        includePrivate,
      });

      if (mountedRef.current) {
        setData(wallData);
        // 初始化樂觀更新列表
        setOptimisticPosts([
          ...wallData.posts.public,
          ...(includePrivate ? wallData.posts.private : []),
        ]);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err.message || '載入社區牆失敗');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [communityId, includePrivate]);

  // 手動刷新
  const refresh = useCallback(async () => {
    clearCommunityCache(communityId);
    await fetchData(true);
  }, [communityId, fetchData]);

  // 按讚（樂觀更新）
  const toggleLike = useCallback(async (postId: string) => {
    // 樂觀更新 UI
    setOptimisticPosts(prev =>
      prev.map(post => {
        if (post.id !== postId) return post;
        const isLiked = post.liked_by.includes('current-user'); // 暫時用假 ID
        return {
          ...post,
          likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1,
          liked_by: isLiked
            ? post.liked_by.filter(id => id !== 'current-user')
            : [...post.liked_by, 'current-user'],
        };
      })
    );

    try {
      await apiToggleLike(postId);
      // 成功後不需要做什麼，樂觀更新已經處理了
    } catch (err) {
      // 失敗時回滾
      await refresh();
    }
  }, [refresh]);

  // 發布貼文
  const createPost = useCallback(async (
    content: string,
    visibility: 'public' | 'private' = 'public'
  ) => {
    if (!communityId) throw new Error('缺少社區 ID');

    await apiCreatePost(communityId, content, visibility);
    await refresh();
  }, [communityId, refresh]);

  // 初次載入
  useEffect(() => {
    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  // 自動刷新
  useEffect(() => {
    if (refreshInterval > 0 && communityId) {
      intervalRef.current = setInterval(() => {
        fetchData(true);
      }, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refreshInterval, communityId, fetchData]);

  // 視窗聚焦時刷新
  useEffect(() => {
    if (!refreshOnFocus) return;

    const handleFocus = () => {
      fetchData(true);
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshOnFocus, fetchData]);

  return {
    data,
    isLoading,
    error,
    refresh,
    toggleLike,
    createPost,
    optimisticPosts,
  };
}

/**
 * 分頁載入貼文 Hook
 */
export function useCommunityPosts(
  communityId: string | undefined,
  visibility: 'public' | 'private' = 'public',
  options: { pageSize?: number } = {}
) {
  const { pageSize = 20 } = options;

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    if (!communityId || isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const fetcher = visibility === 'public' ? getPublicPosts : getPrivatePosts;
      const { items, total } = await fetcher(communityId, { page, limit: pageSize });

      setPosts(prev => [...prev, ...items]);
      setPage(prev => prev + 1);
      setHasMore(posts.length + items.length < total);
    } catch (err: any) {
      setError(err.message || '載入失敗');
    } finally {
      setIsLoading(false);
    }
  }, [communityId, visibility, page, pageSize, isLoading, hasMore, posts.length]);

  const reset = useCallback(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, []);

  // 初次載入
  useEffect(() => {
    if (communityId) {
      loadMore();
    }
  }, [communityId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    posts,
    isLoading,
    error,
    hasMore,
    loadMore,
    reset,
  };
}

export default useCommunityWall;
````

---

## 3. communityService.ts（API Service）

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
  posts: 5 * 60 * 1000, // 5 分鐘
  reviews: 10 * 60 * 1000, // 10 分鐘
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
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

// 通用 fetch 包裝
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
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

  const data = await fetchAPI<CommunityWallData>(`/wall?communityId=${communityId}&type=all`);

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

  return fetchAPI(
    `/wall?communityId=${communityId}&type=posts&visibility=public&offset=${offset}&limit=${limit}`
  );
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

  return fetchAPI(
    `/wall?communityId=${communityId}&type=posts&visibility=private&offset=${offset}&limit=${limit}`
  );
}

/**
 * 取得評價（來自 properties 的兩好一公道）
 */
export async function getReviews(
  communityId: string
): Promise<{ items: CommunityReview[]; total: number }> {
  const cacheKey = `reviews:${communityId}`;
  const cached = getCachedData<{ items: CommunityReview[]; total: number }>(
    cacheKey,
    CACHE_TTL.reviews
  );
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
  const cached = getCachedData<{ items: CommunityQuestion[]; total: number }>(
    cacheKey,
    CACHE_TTL.questions
  );
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
export async function toggleLike(postId: string): Promise<{ liked: boolean; likes_count: number }> {
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

## 4. CSS 變數（加到 index.css）

```css
/* src/index.css (重構版) */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* === 統一色票系統 (以 Tailwind Config 為準) === */
    --brand: #00385a;        /* 深藍 */
    --brand-light: #009FE8;  /* 亮藍 */
    --brand-600: #004E7C;
    --primary: #00385a;
    --primary-dark: #002a44;
    --primary-light: #005282;
    --text-primary: #0a2246;
    --text-secondary: #526070;
    --text-tertiary: #8a95a5;
    --text-muted: #6C7B91;
    --bg-page: #EEF2F7;
    --bg-base: #f6f9ff;
    --bg-alt: #eef3ff;
    --bg-elevated: #ffffff;
    --success: #0f6a23;
    --border: #E6EDF7;
    --border-light: #e8f0f8;
    --line: #e6edf7;

    /* === 常用參數 === */
    --r-sm: 12px;
    --r-md: 16px;
```
