/**
 * 社區牆頁面 (React 版)
 * 
 * 功能：評價區、公開牆、私密牆、問答區
 * 權限：訪客/會員/住戶/房仲 四角色
 * 支援：Mock 切換器 + 真實 API
 */

import { useState, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCommunityWall } from '../../hooks/useCommunityWall';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/ui/Toast';

// ============================
// Types
// ============================
type UserRole = 'guest' | 'member' | 'resident' | 'agent';
type WallType = 'public' | 'private';

interface MockPost {
  id: number;
  author: string;
  floor?: string;
  type: 'resident' | 'agent' | 'official';
  time: string;
  title: string;
  content: string;
  likes?: number;
  views?: number;
  comments?: number;
  pinned?: boolean;
  private?: boolean;
}

interface MockReview {
  id: number;
  author: string;
  company: string;
  visits: number;
  deals: number;
  pros: string[];
  cons: string;
}

interface MockQuestion {
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

// ============================
// Mock 資料
// ============================
const MOCK_DATA = {
  communityInfo: {
    name: '惠宇上晴',
    year: 2018,
    units: 280,
    fee: 85,
    builder: '惠宇建設',
  },
  stats: {
    members: 88,
    rating: 4.2,
    interactions: 156,
    listings: 23,
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
      { id: 101, author: '管委會', type: 'official' as const, time: '3天前', title: '📢 年度消防演練通知', content: '12/15（日）上午 10:00 將進行全社區消防演練，届時警報器會響，請勿驚慌。', pinned: true },
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

// ============================
// 權限計算
// ============================
function getPermissions(role: UserRole) {
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

const GUEST_VISIBLE_COUNT = 2;

// ============================
// 子組件
// ============================

// Header
function WallHeader({ communityName }: { communityName: string }) {
  return (
    <header className="sticky top-0 z-50 bg-[rgba(246,249,255,0.95)] backdrop-blur-md border-b border-[rgba(230,237,247,0.8)] flex items-center gap-3 px-4 py-2">
      <Link
        to="/feed-consumer.html"
        className="flex items-center gap-2 text-[var(--brand)] font-bold text-sm px-2.5 py-1.5 rounded-lg hover:bg-[rgba(0,56,90,0.06)] transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        <span>我的動態</span>
      </Link>
      <div className="flex-1 text-center">
        <h1 className="text-base font-extrabold text-[var(--brand)]">{communityName}</h1>
        <p className="text-xs text-[var(--text-secondary)]">社區牆</p>
      </div>
      <div className="flex gap-2 items-center">
        <button className="icon-btn badge" data-badge="3" aria-label="通知">🔔</button>
        <button className="icon-btn" aria-label="選單">👤</button>
      </div>
    </header>
  );
}

// 貼文卡片
function PostCard({ post, permissions }: { post: MockPost; permissions: ReturnType<typeof getPermissions> }) {
  const isAgent = post.type === 'agent';
  const isOfficial = post.type === 'official';

  return (
    <div className="flex gap-3 p-3 border border-[var(--border-light)] rounded-xl bg-white hover:border-[var(--brand-light)] hover:shadow-sm transition-all">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-base flex-shrink-0 border-2 ${
        isAgent ? 'border-[var(--brand-light)] text-[var(--brand-600)] bg-gradient-to-br from-[#eef3ff] to-white' : 'border-[var(--brand)] text-[var(--brand)] bg-gradient-to-br from-[#eef3ff] to-white'
      }`}>
        {post.author.charAt(0)}
      </div>
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm text-[var(--text-primary)]">{post.author}</span>
          {isAgent && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#e0f4ff] text-[#004E7C] font-bold">認證房仲</span>}
          {isOfficial && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#f6f9ff] text-[#00385a] font-bold">官方公告</span>}
          {post.floor && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#e6edf7] text-[#00385a] font-bold">{post.floor} 住戶</span>}
          <span className="text-[11px] text-[var(--text-secondary)]">{post.time}</span>
        </div>
        <div className="text-sm leading-relaxed text-[var(--text-primary)]">
          <b>{post.title}</b><br />
          {post.content}
        </div>
        <div className="flex gap-3 text-[11px] text-[var(--text-secondary)]">
          {post.likes && <span>❤️ {post.likes}</span>}
          {post.views && <span>👁️ {post.views}</span>}
          <span>💬 {post.comments || 0}</span>
          {post.private && <span>🔒 僅社區可見</span>}
        </div>
        <div className="flex gap-2 mt-1">
          {isAgent ? (
            <button className="action-btn">📩 私訊房仲</button>
          ) : (
            <>
              <button className="action-btn">❤️ 讚</button>
              <button className="action-btn">💬 回覆</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// 評價卡片
function ReviewCard({ item }: { item: { type: 'pro' | 'con'; text: string; author: string; company: string; visits: number; deals: number } }) {
  const icon = item.type === 'pro' ? '✅' : '⚖️';
  const bgClass = item.type === 'pro' ? 'bg-gradient-to-br from-[#f6f9ff] to-[#eef3ff]' : 'bg-gradient-to-br from-[#f0f5ff] to-[#e6edf7]';

  return (
    <div className="p-3.5 border border-[var(--border-light)] rounded-xl bg-white hover:border-[rgba(0,56,90,0.15)] transition-all">
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#eef3ff] to-white border-2 border-[var(--brand)] flex items-center justify-center font-extrabold text-sm text-[var(--brand)]">
          {item.author.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="font-bold text-sm">{item.author}｜{item.company}</div>
          <div className="text-[11px] text-[var(--text-secondary)]">帶看 {item.visits} 次 · 成交 {item.deals} 戶</div>
        </div>
      </div>
      <div className={`flex items-start gap-2.5 text-sm leading-relaxed p-2 rounded-lg ${bgClass}`}>
        <span className="text-base flex-shrink-0">{icon}</span>
        <span className="text-[var(--text-primary)] flex-1">{item.text}</span>
      </div>
    </div>
  );
}

// 問答卡片
function QuestionCard({ q, permissions, onAnswer }: { q: MockQuestion; permissions: ReturnType<typeof getPermissions>; onAnswer: (id: number) => void }) {
  const hasAnswers = q.answers && q.answers.length > 0;

  return (
    <div className={`p-3.5 border rounded-xl transition-all ${
      hasAnswers 
        ? 'border-[var(--border-light)] bg-white hover:border-[rgba(0,56,90,0.15)]' 
        : 'border-[rgba(0,159,232,0.3)] bg-gradient-to-br from-[#f6f9ff] to-[#eef5ff]'
    }`}>
      <div className="font-bold text-sm text-[var(--brand)] mb-2 leading-snug">Q: {q.question}</div>
      <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)] mb-2.5">
        <span>👤 準住戶</span>
        <span>· {q.time}</span>
        {hasAnswers ? (
          <span>· {q.answersCount} 則回覆</span>
        ) : (
          <span className="text-[var(--brand-light)] font-bold">· 等待回答中</span>
        )}
      </div>

      {hasAnswers ? (
        <div className="flex flex-col gap-2 pl-3.5 border-l-[3px] border-[var(--border)]">
          {q.answers.map((a, idx) => (
            <div key={idx} className="text-sm leading-relaxed py-2">
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  a.type === 'agent' ? 'bg-[#e0f4ff] text-[#004E7C]' : a.type === 'official' ? 'bg-[#f6f9ff] text-[#00385a]' : 'bg-[#e6edf7] text-[#00385a]'
                }`}>
                  {a.type === 'agent' ? '🏢 認證房仲' : a.type === 'official' ? `📋 ${a.author}` : `🏠 ${a.author}`}
                </span>
                {a.expert && <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-[#f0f5ff] text-[#004E7C]">⭐ 專家回答</span>}
              </div>
              {a.content}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 text-center text-[var(--text-secondary)] text-sm bg-[rgba(0,56,90,0.02)] rounded-lg mt-2">
          🙋 還沒有人回答，成為第一個回答的人！
        </div>
      )}

      {permissions.canAnswer && (
        <div className="mt-2.5">
          <button 
            onClick={() => onAnswer(q.id)}
            className={`action-btn w-full justify-center ${!hasAnswers ? 'bg-[rgba(0,159,232,0.1)] border-[rgba(0,159,232,0.3)] text-[#004E7C]' : ''}`}
          >
            💬 {hasAnswers ? '我來回答' : '搶先回答'}{permissions.isAgent ? '（專家）' : ''}
          </button>
        </div>
      )}
    </div>
  );
}

// Blur 遮罩
function BlurOverlay({ 
  children, 
  hiddenCount, 
  type, 
  onLogin 
}: { 
  children: React.ReactNode; 
  hiddenCount: number; 
  type: 'reviews' | 'posts' | 'questions';
  onLogin: () => void;
}) {
  const typeText = {
    reviews: '評價',
    posts: '熱帖',
    questions: '問答',
  };

  return (
    <div className="relative">
      <div className="blur-[4px] pointer-events-none select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[rgba(255,255,255,0.85)] rounded-xl text-center p-5">
        <h4 className="text-sm font-extrabold text-[var(--brand)] mb-1">🔒 還有 {hiddenCount} 則{typeText[type]}</h4>
        <p className="text-xs text-[var(--text-secondary)] mb-2.5">✓ 查看完整{typeText[type]}　✓ 新回答通知</p>
        <button onClick={onLogin} className="bg-gradient-to-r from-[var(--brand)] to-[#005282] text-white border-none rounded-full px-6 py-2.5 text-sm font-bold cursor-pointer hover:scale-[1.02] transition-transform">
          免費註冊 / 登入
        </button>
      </div>
    </div>
  );
}

// 私密牆鎖定
function PrivateLock({ isGuest, onLogin, onVerify }: { isGuest: boolean; onLogin: () => void; onVerify: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center bg-[rgba(0,56,90,0.03)] rounded-xl">
      <div className="text-5xl mb-3 opacity-50">🔐</div>
      <h4 className="text-sm font-bold text-[var(--brand)] mb-1.5">私密牆僅限本社區住戶查看</h4>
      <p className="text-xs text-[var(--text-secondary)] mb-4">
        {isGuest ? '請先登入或註冊' : '驗證住戶身份後即可加入討論'}
      </p>
      <button
        onClick={isGuest ? onLogin : onVerify}
        className="bg-[var(--brand)] text-white border-none rounded-full px-5 py-2.5 text-xs font-bold cursor-pointer"
      >
        {isGuest ? '免費註冊 / 登入' : '我是住戶，驗證身份'}
      </button>
    </div>
  );
}

// 側邊欄
function Sidebar({ data, permissions }: { data: typeof MOCK_DATA; permissions: ReturnType<typeof getPermissions> }) {
  const topQuestions = data.questions.slice(0, 3);
  const topPosts = [...data.posts.public].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 2);

  return (
    <aside className="w-[280px] flex-shrink-0 hidden lg:flex flex-col gap-3 sticky top-[70px] self-start">
      {/* 社區資訊 */}
      <div className="sidebar-card">
        <h4 className="text-sm font-extrabold text-[var(--brand)] mb-2.5 flex items-center gap-1.5">📍 社區資訊</h4>
        <div className="text-sm">
          <div className="flex justify-between py-2 border-b border-[#f1f5f9]"><span className="text-[var(--text-secondary)]">社區名稱</span><span className="font-bold">{data.communityInfo.name}</span></div>
          <div className="flex justify-between py-2 border-b border-[#f1f5f9]"><span className="text-[var(--text-secondary)]">完工年份</span><span className="font-bold">{data.communityInfo.year} 年</span></div>
          <div className="flex justify-between py-2 border-b border-[#f1f5f9]"><span className="text-[var(--text-secondary)]">總戶數</span><span className="font-bold">{data.communityInfo.units} 戶</span></div>
          <div className="flex justify-between py-2 border-b border-[#f1f5f9]"><span className="text-[var(--text-secondary)]">管理費</span><span className="font-bold">{data.communityInfo.fee} 元/坪</span></div>
          <div className="flex justify-between py-2"><span className="text-[var(--text-secondary)]">建設公司</span><span className="font-bold">{data.communityInfo.builder}</span></div>
        </div>
      </div>

      {/* 社區數據 */}
      <div className="sidebar-card">
        <h4 className="text-sm font-extrabold text-[var(--brand)] mb-2.5 flex items-center gap-1.5">📊 社區數據</h4>
        <div className="grid grid-cols-2 gap-2 mt-2.5">
          <div className="bg-gradient-to-br from-[#f8faff] to-[#f0f5ff] rounded-lg p-3 text-center">
            <div className="text-xl font-black text-[var(--brand)]">{data.stats.members}</div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">已加入成員</div>
          </div>
          <div className="bg-gradient-to-br from-[#f8faff] to-[#f0f5ff] rounded-lg p-3 text-center">
            <div className="text-xl font-black text-[var(--brand)]">{data.stats.rating}</div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">平均評分</div>
          </div>
          <div className="bg-gradient-to-br from-[#f8faff] to-[#f0f5ff] rounded-lg p-3 text-center">
            <div className="text-xl font-black text-[var(--brand)]">{data.stats.interactions}</div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">本月互動</div>
          </div>
          <div className="bg-gradient-to-br from-[#f8faff] to-[#f0f5ff] rounded-lg p-3 text-center">
            <div className="text-xl font-black text-[var(--brand)]">{data.stats.listings}</div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">待售物件</div>
          </div>
        </div>
      </div>

      {/* 快速連結 */}
      <div className="sidebar-card">
        <h4 className="text-sm font-extrabold text-[var(--brand)] mb-2.5 flex items-center gap-1.5">🔗 快速連結</h4>
        <div className="flex flex-col gap-1">
          <a href="#listings" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[var(--text-primary)] text-sm font-semibold hover:bg-[#f0f7ff] transition-colors no-underline">🏠 查看此社區物件</a>
          <a href="#compare" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[var(--text-primary)] text-sm font-semibold hover:bg-[#f0f7ff] transition-colors no-underline">📊 與其他社區比較</a>
          <a href="#subscribe" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[var(--text-primary)] text-sm font-semibold hover:bg-[#f0f7ff] transition-colors no-underline">🔔 追蹤此社區</a>
        </div>
      </div>

      {/* 最新問答 */}
      <div className="sidebar-card">
        <h4 className="text-sm font-extrabold text-[var(--brand)] mb-2.5 flex items-center gap-1.5">❓ 最新問答</h4>
        <div className="flex flex-col gap-1">
          {topQuestions.map(q => (
            <a key={q.id} href="#qa-section" className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-[var(--text-primary)] text-sm font-semibold hover:bg-[#f0f7ff] transition-colors no-underline">
              <span className="flex-shrink-0">💬</span>
              <span className="overflow-hidden text-ellipsis whitespace-nowrap">{q.question.length > 18 ? q.question.substring(0, 18) + '...' : q.question}</span>
            </a>
          ))}
        </div>
        <a href="#qa-section" className="block text-center text-xs text-[var(--brand-light)] mt-2 no-underline">查看全部問答 →</a>
      </div>

      {/* 熱門貼文 */}
      <div className="sidebar-card">
        <h4 className="text-sm font-extrabold text-[var(--brand)] mb-2.5 flex items-center gap-1.5">🔥 熱門貼文</h4>
        <div className="flex flex-col gap-1">
          {topPosts.map(p => (
            <a key={p.id} href="#public-wall" className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-[var(--text-primary)] text-sm font-semibold hover:bg-[#f0f7ff] transition-colors no-underline">
              <span className="flex-shrink-0">❤️ {p.likes}</span>
              <span className="overflow-hidden text-ellipsis whitespace-nowrap">{p.title.length > 15 ? p.title.substring(0, 15) + '...' : p.title}</span>
            </a>
          ))}
        </div>
        <a href="#public-wall" className="block text-center text-xs text-[var(--brand-light)] mt-2 no-underline">查看全部貼文 →</a>
      </div>

      {/* 公仔卡片 */}
      <div className="sidebar-card text-center bg-gradient-to-br from-[#f0f7ff] to-[#e8f4ff]">
        <svg style={{ width: 80, height: 96, color: '#00385a', marginBottom: 8 }} viewBox="0 0 200 240">
          <path d="M 85 40 L 85 15 L 100 30 L 115 15 L 115 40" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M 40 80 L 100 40 L 160 80" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="55" y="80" width="90" height="100" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M 78 110 Q 85 105 92 110" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"/>
          <path d="M 108 110 Q 115 105 122 110" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"/>
          <circle cx="85" cy="125" r="4" stroke="currentColor" strokeWidth="3" fill="none"/>
          <circle cx="115" cy="125" r="4" stroke="currentColor" strokeWidth="3" fill="none"/>
          <path d="M 90 145 Q 100 155 110 145" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round"/>
          <path d="M 55 130 L 25 110" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round"/>
          <path className="mascot-hand" d="M 145 130 L 175 100" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round"/>
          <circle className="mascot-hand" cx="180" cy="95" r="6" stroke="currentColor" strokeWidth="3" fill="none"/>
          <path d="M 85 180 L 85 210 L 75 210" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M 115 180 L 115 210 L 125 210" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p className="text-sm font-bold text-[var(--brand)] mb-2.5">有問題？問問鄰居！</p>
        <a href="#qa-section" className="inline-block bg-[var(--brand)] text-white px-4 py-2 rounded-full text-xs font-bold no-underline">前往問答區 →</a>
      </div>
    </aside>
  );
}

// 身份切換器
function RoleSwitcher({ currentRole, onSwitch }: { currentRole: UserRole; onSwitch: (role: UserRole) => void }) {
  const [open, setOpen] = useState(false);

  const roleNames: Record<UserRole, string> = {
    guest: '訪客模式',
    member: '會員模式',
    resident: '住戶模式',
    agent: '房仲模式',
  };

  const roleIcons: Record<UserRole, string> = {
    guest: '👤',
    member: '👥',
    resident: '🏠',
    agent: '🏢',
  };

  return (
    <div className="fixed bottom-5 right-5 z-[1000]">
      <button
        onClick={() => setOpen(!open)}
        className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white border-none rounded-xl px-4 py-2.5 text-xs font-bold cursor-pointer shadow-lg flex items-center gap-1.5"
      >
        🕶️ <span>{roleNames[currentRole]}</span> ▾
      </button>
      {open && (
        <div className="absolute bottom-[50px] right-0 bg-white border border-[var(--border)] rounded-xl shadow-xl p-2 min-w-[180px]">
          {(Object.keys(roleNames) as UserRole[]).map(role => (
            <button
              key={role}
              onClick={() => { onSwitch(role); setOpen(false); }}
              className={`block w-full text-left px-3 py-2.5 border-none rounded-lg text-xs cursor-pointer ${
                currentRole === role 
                  ? 'bg-[rgba(0,56,90,0.1)] text-[var(--brand)] font-bold' 
                  : 'bg-transparent text-[var(--text-primary)] hover:bg-[#f6f9ff]'
              }`}
            >
              {roleIcons[role]} {role === 'guest' ? '訪客（未登入）' : role === 'member' ? '一般會員' : role === 'resident' ? '已驗證住戶' : '認證房仲'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================
// 主組件
// ============================
export default function Wall() {
  const { id: communityId } = useParams<{ id: string }>();
  const { showToast } = useToast();
  
  // Mock 模式：用於開發測試
  const [useMock] = useState(true);
  const [mockRole, setMockRole] = useState<UserRole>('guest');
  const [currentWall, setCurrentWall] = useState<WallType>('public');

  // 真實 API Hook（當 useMock = false 時使用）
  const { data: apiData, isLoading, error } = useCommunityWall(
    useMock ? undefined : communityId,
    { includePrivate: mockRole === 'resident' || mockRole === 'agent' }
  );

  // 根據 Mock 模式決定使用哪個資料
  const data = useMock ? MOCK_DATA : apiData;
  const permissions = getPermissions(mockRole);

  // 把評價拆成單項
  const reviewItems = useMemo(() => {
    if (!data?.reviews) return [];
    const reviews = Array.isArray(data.reviews) ? data.reviews : [];
    const items: { type: 'pro' | 'con'; text: string; author: string; company: string; visits: number; deals: number }[] = [];
    reviews.forEach((review: MockReview) => {
      review.pros.forEach(pro => {
        items.push({ type: 'pro', text: pro, author: review.author, company: review.company, visits: review.visits, deals: review.deals });
      });
      items.push({ type: 'con', text: review.cons, author: review.author, company: review.company, visits: review.visits, deals: review.deals });
    });
    return items;
  }, [data?.reviews]);

  // 問答分類 (支援 Mock 陣列和 API { items } 結構)
  const questions = useMemo(() => {
    if (!data?.questions) return [];
    return Array.isArray(data.questions) ? data.questions : [];
  }, [data?.questions]);
  
  const answeredQuestions = useMemo(() => 
    questions.filter((q: MockQuestion) => q.answers && q.answers.length > 0),
    [questions]
  );
  const unansweredQuestions = useMemo(() => 
    questions.filter((q: MockQuestion) => !q.answers || q.answers.length === 0),
    [questions]
  );

  // 取得貼文 (支援 Mock 結構)
  const publicPosts = useMemo(() => {
    if (!data?.posts?.public) return [];
    return Array.isArray(data.posts.public) ? data.posts.public : [];
  }, [data?.posts?.public]);
  
  const privatePosts = useMemo(() => {
    if (!data?.posts?.private) return [];
    return Array.isArray(data.posts.private) ? data.posts.private : [];
  }, [data?.posts?.private]);

  // 計算可見數量
  const visibleReviewCount = permissions.canSeeAllReviews ? reviewItems.length : Math.min(GUEST_VISIBLE_COUNT, reviewItems.length);
  const hiddenReviewCount = reviewItems.length - visibleReviewCount;

  const visiblePostCount = permissions.canSeeAllPosts ? publicPosts.length : Math.min(GUEST_VISIBLE_COUNT, publicPosts.length);
  const hiddenPostCount = publicPosts.length - visiblePostCount;

  const visibleQACount = permissions.isLoggedIn ? answeredQuestions.length : Math.min(GUEST_VISIBLE_COUNT, answeredQuestions.length);
  const hiddenQACount = answeredQuestions.length - visibleQACount;

  // 事件處理
  const handleLogin = useCallback(() => {
    showToast({ type: 'info', title: '功能開發中', message: '🔐 登入/註冊功能開發中' });
  }, [showToast]);

  const handleVerify = useCallback(() => {
    showToast({ type: 'info', title: '功能開發中', message: '🏠 住戶驗證功能開發中' });
  }, [showToast]);

  const handleAnswer = useCallback((questionId: number) => {
    showToast({ type: 'info', title: '功能開發中', message: `💬 回答問題 #${questionId} 功能開發中` });
  }, [showToast]);

  const handleAsk = useCallback(() => {
    showToast({ type: 'info', title: '功能開發中', message: '💬 發問功能開發中' });
  }, [showToast]);

  const handleCreatePost = useCallback((visibility: WallType) => {
    showToast({ type: 'info', title: '功能開發中', message: `✏️ 發布${visibility === 'private' ? '私密' : '公開'}貼文功能開發中` });
  }, [showToast]);

  // 切換牆
  const handleSwitchWall = useCallback((wall: WallType) => {
    if (wall === 'private' && !permissions.canAccessPrivate) {
      if (permissions.isGuest) {
        handleLogin();
      } else {
        handleVerify();
      }
      return;
    }
    setCurrentWall(wall);
  }, [permissions, handleLogin, handleVerify]);

  // Loading 狀態
  if (!useMock && isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--bg-base)] to-[var(--bg-alt)]">
        <WallHeader communityName="載入中..." />
        <div className="max-w-[960px] mx-auto p-5">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 rounded-xl"></div>
            <div className="h-32 bg-gray-200 rounded-xl"></div>
            <div className="h-32 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  // 錯誤狀態
  if (!useMock && error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--bg-base)] to-[var(--bg-alt)]">
        <WallHeader communityName="錯誤" />
        <div className="max-w-[960px] mx-auto p-5 text-center">
          <p className="text-red-500">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-[var(--brand)] text-white rounded-lg">
            重新載入
          </button>
        </div>
      </div>
    );
  }

  // 取得社區名稱
  const communityName = useMemo(() => {
    if (!data) return '社區牆';
    if ('communityInfo' in data && data.communityInfo?.name) return data.communityInfo.name;
    return '社區牆';
  }, [data]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--bg-base)] to-[var(--bg-alt)]">
      <WallHeader communityName={communityName} />

      <div className="max-w-[960px] mx-auto flex gap-5 p-2.5">
        {/* 主內容 */}
        <main className="flex-1 max-w-[600px] flex flex-col gap-3 pb-[calc(80px+env(safe-area-inset-bottom,20px))] animate-fadeInUp">
          
          {/* 評價區 */}
          <section className="bg-[rgba(255,255,255,0.98)] border border-[var(--border-light)] rounded-[18px] shadow-sm overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3.5 bg-gradient-to-r from-[rgba(0,56,90,0.08)] to-[rgba(0,82,130,0.04)] border-b border-[rgba(0,56,90,0.05)]">
              <div>
                <h2 className="text-[15px] font-extrabold text-[var(--brand)] flex items-center gap-1.5">⭐ 社區評價</h2>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">來自最真實的評價</p>
              </div>
              <span className="inline-flex items-center gap-1 bg-[rgba(0,56,90,0.08)] border border-[var(--brand-light)] text-[var(--brand)] rounded-full px-2.5 py-1 text-[10px] font-bold">
                {reviewItems.length} 則評價
              </span>
            </div>
            <div className="flex flex-col gap-2.5 p-3.5">
              {reviewItems.slice(0, visibleReviewCount).map((item, idx) => (
                <ReviewCard key={idx} item={item} />
              ))}
              {hiddenReviewCount > 0 && !permissions.canSeeAllReviews && reviewItems[visibleReviewCount] && (
                <BlurOverlay hiddenCount={hiddenReviewCount} type="reviews" onLogin={handleLogin}>
                  <ReviewCard item={reviewItems[visibleReviewCount]} />
                </BlurOverlay>
              )}
            </div>
          </section>

          {/* 社區熱帖 */}
          <section className="bg-[rgba(255,255,255,0.98)] border border-[var(--border-light)] rounded-[18px] shadow-sm overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3.5 bg-gradient-to-r from-[rgba(0,56,90,0.03)] to-[rgba(0,82,130,0.01)] border-b border-[rgba(0,56,90,0.05)]">
              <h2 className="text-[15px] font-extrabold text-[var(--brand)] flex items-center gap-1.5">🔥 社區熱帖</h2>
            </div>
            
            {/* Tabs */}
            <div className="flex gap-1.5 flex-wrap px-3.5 pb-3.5 pt-3">
              <button
                onClick={() => handleSwitchWall('public')}
                className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-all ${
                  currentWall === 'public'
                    ? 'bg-[rgba(0,56,90,0.1)] border-[var(--brand-light)] text-[var(--brand)] font-bold'
                    : 'bg-[rgba(240,244,250,0.8)] border-transparent text-[var(--text-secondary)] hover:bg-[rgba(0,56,90,0.08)] hover:text-[var(--brand)]'
                }`}
              >
                公開牆
              </button>
              <button
                onClick={() => handleSwitchWall('private')}
                className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-all ${
                  currentWall === 'private'
                    ? 'bg-[rgba(0,56,90,0.1)] border-[var(--brand-light)] text-[var(--brand)] font-bold'
                    : 'bg-[rgba(240,244,250,0.8)] border-transparent text-[var(--text-secondary)] hover:bg-[rgba(0,56,90,0.08)] hover:text-[var(--brand)]'
                } ${!permissions.canAccessPrivate ? 'opacity-60' : ''}`}
              >
                私密牆 {!permissions.canAccessPrivate && <span className="ml-1">🔒</span>}
              </button>
            </div>

            {/* 公開牆 */}
            {currentWall === 'public' && (
              <div className="flex flex-col gap-2.5 px-3.5 pb-3.5">
                {publicPosts.slice(0, visiblePostCount).map((post) => (
                  <PostCard key={post.id} post={post as MockPost} permissions={permissions} />
                ))}
                {hiddenPostCount > 0 && !permissions.canSeeAllPosts && publicPosts[visiblePostCount] && (
                  <BlurOverlay hiddenCount={hiddenPostCount} type="posts" onLogin={handleLogin}>
                    <PostCard post={publicPosts[visiblePostCount] as MockPost} permissions={permissions} />
                  </BlurOverlay>
                )}
                {permissions.canPostPublic && (
                  <div className="flex gap-3 p-5 border border-dashed border-[var(--border-light)] rounded-xl bg-[rgba(0,56,90,0.03)] justify-center">
                    <button onClick={() => handleCreatePost('public')} className="action-btn w-full justify-center">
                      ✏️ 發布貼文
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 私密牆 */}
            {currentWall === 'private' && (
              <div className="flex flex-col gap-2.5 px-3.5 pb-3.5">
                {!permissions.canAccessPrivate ? (
                  <PrivateLock isGuest={permissions.isGuest} onLogin={handleLogin} onVerify={handleVerify} />
                ) : (
                  <>
                    {privatePosts.map((post) => (
                      <PostCard key={post.id} post={post as MockPost} permissions={permissions} />
                    ))}
                    {permissions.canPostPrivate ? (
                      <div className="flex gap-3 p-5 border border-dashed border-[var(--border-light)] rounded-xl bg-[rgba(0,56,90,0.03)] justify-center">
                        <button onClick={() => handleCreatePost('private')} className="action-btn w-full justify-center">
                          ✏️ 發布私密貼文
                        </button>
                      </div>
                    ) : permissions.isAgent && (
                      <div className="text-center py-3 text-[11px] text-[var(--text-secondary)]">
                        💡 房仲可查看私密牆，但無法發文
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </section>

          {/* 問答區 */}
          <section id="qa-section" className="bg-[rgba(255,255,255,0.98)] border border-[var(--border-light)] rounded-[18px] shadow-sm overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3.5 bg-gradient-to-r from-[rgba(0,56,90,0.03)] to-[rgba(0,82,130,0.01)] border-b border-[rgba(0,56,90,0.05)]">
              <div>
                <h2 className="text-[15px] font-extrabold text-[var(--brand)] flex items-center gap-1.5">
                  🙋 準住戶問答
                  {unansweredQuestions.length > 0 && (
                    <span className="text-xs font-bold text-[#004E7C] bg-[#e0f4ff] px-2 py-0.5 rounded-full ml-1.5">
                      {unansweredQuestions.length} 題待回答
                    </span>
                  )}
                </h2>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">買房前，先問問鄰居怎麼說</p>
              </div>
            </div>
            <div className="flex flex-col gap-2.5 p-3.5">
              {/* 有回答的問題 */}
              {answeredQuestions.slice(0, visibleQACount).map((q: MockQuestion) => (
                <QuestionCard key={q.id} q={q} permissions={permissions} onAnswer={handleAnswer} />
              ))}
              
              {/* Blur 遮罩 */}
              {hiddenQACount > 0 && !permissions.isLoggedIn && answeredQuestions[visibleQACount] && (
                <BlurOverlay hiddenCount={hiddenQACount} type="questions" onLogin={handleLogin}>
                  <QuestionCard q={answeredQuestions[visibleQACount]} permissions={permissions} onAnswer={handleAnswer} />
                </BlurOverlay>
              )}

              {/* 無回答的問題 */}
              {unansweredQuestions.map((q: MockQuestion) => (
                <QuestionCard key={q.id} q={q} permissions={permissions} onAnswer={handleAnswer} />
              ))}

              {/* 發問區 */}
              <div className="p-3.5 border border-dashed border-[var(--border-light)] rounded-xl bg-[rgba(0,56,90,0.03)]">
                <div className="font-bold text-sm text-[var(--text-secondary)] mb-2">💬 你也有問題想問？</div>
                <p className="text-xs text-[var(--text-secondary)] mb-2">問題會通知該社區住戶，通常 24 小時內會有回覆</p>
                <button
                  onClick={permissions.canAskQuestion ? handleAsk : handleLogin}
                  className="action-btn w-full justify-center"
                >
                  {permissions.canAskQuestion ? '我想問問題' : '登入後發問'}
                </button>
              </div>
            </div>
          </section>
        </main>

        {/* 側邊欄 */}
        {useMock && data && <Sidebar data={data as typeof MOCK_DATA} permissions={permissions} />}
      </div>

      {/* 底部 CTA */}
      {!permissions.canAccessPrivate && (
        <div className="fixed bottom-0 left-0 right-0 bg-[rgba(255,255,255,0.95)] backdrop-blur-md border-t border-[var(--border)] px-4 py-3 flex items-center justify-center gap-3 z-50">
          <p className="text-xs text-[var(--text-secondary)]">
            {permissions.isGuest ? '🔓 登入解鎖完整評價 + 更多功能' : '🏠 驗證住戶身份，解鎖私密牆'}
          </p>
          <button
            onClick={permissions.isGuest ? handleLogin : handleVerify}
            className="bg-gradient-to-r from-[var(--brand)] to-[#005282] text-white border-none rounded-full px-5 py-2.5 text-sm font-bold cursor-pointer"
          >
            {permissions.isGuest ? '免費註冊' : '驗證住戶'}
          </button>
        </div>
      )}

      {/* Mock 身份切換器 */}
      <RoleSwitcher currentRole={mockRole} onSwitch={setMockRole} />

      {/* 全域樣式 */}
      <style>{`
        .sidebar-card {
          background: #fff;
          border: 1px solid var(--line, #e6edf7);
          border-radius: 14px;
          padding: 14px;
          box-shadow: 0 4px 14px rgba(0,51,102,.04);
        }
        .action-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 5px 10px;
          border-radius: 8px;
          background: rgba(0,56,90,.06);
          border: 1px solid rgba(0,56,90,.1);
          color: var(--brand);
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all .15s;
        }
        .action-btn:hover {
          background: rgba(0,56,90,.12);
        }
        .icon-btn {
          border: 1px solid var(--line, #e6edf7);
          border-radius: 12px;
          background: #fff;
          padding: 8px;
          font-size: 14px;
          color: #173a7c;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all .15s;
          line-height: 1;
        }
        .icon-btn:hover {
          background: #f6f9ff;
        }
        .icon-btn.badge {
          position: relative;
        }
        .icon-btn.badge::after {
          content: attr(data-badge);
          position: absolute;
          top: -6px;
          right: -6px;
          min-width: 18px;
          height: 18px;
          border-radius: 999px;
          background: #e02626;
          color: #fff;
          font-size: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #fff;
          font-weight: 700;
        }
        .mascot-hand {
          transform-origin: 85% 60%;
          animation: wave-hand 2.5s ease-in-out infinite;
        }
        @keyframes wave-hand {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-25deg); }
          40% { transform: rotate(10deg); }
          60% { transform: rotate(-20deg); }
          80% { transform: rotate(5deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
