/**
 * Community Explore Page
 *
 * 社區探索著陸頁 — visitor 和無歸屬會員的社區瀏覽入口
 * #8d 社區探索頁
 */
import { useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

import { GlobalHeader } from '../../components/layout/GlobalHeader';
import { MaiMaiBase } from '../../components/MaiMai/MaiMaiBase';
import { MaiMaiSpeech } from '../../components/MaiMai/MaiMaiSpeech';
import type { MaiMaiMood } from '../../components/MaiMai/types';

import { usePageMode } from '../../hooks/usePageMode';
import { useMaiMaiA11yProps } from '../../hooks/useMaiMaiA11yProps';
import { navigateToAuth, getCurrentPath } from '../../lib/authUtils';
import { ROUTES, RouteUtils } from '../../constants/routes';

import { useCommunityList } from './hooks/useCommunityList';
import { CommunityCard } from './components/CommunityCard';

// ─── 常數 ────────────────────────────────────────────────────────────────────

const CLICK_EASTER_EGG_COUNT = 5;

const MOOD_SPEECH: Record<MaiMaiMood, string> = {
  wave: '嗨！想找哪個社區的鄰居評價？',
  thinking: '輸入社區名或地址試試看…',
  excited: '找到了嗎？',
  confused: '沒找到耶…換個關鍵字？',
  happy: '',          // 動態設定（帶數量）
  celebrate: '你找到我的彩蛋了！',
  idle: '',
  peek: '',
  shy: '',
  sleep: '',
  header: '',
};

// ─── 骨架屏 ──────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-[18px] border border-[var(--border)] bg-[var(--border)] h-[140px]" />
  );
}

// ─── 空狀態 ──────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  hasQuery: boolean;
  a11yProps: { animated: boolean; showEffects: boolean };
}

function EmptyState({ hasQuery, a11yProps }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-16">
      <MaiMaiBase mood="confused" size="sm" {...a11yProps} />
      <p className="text-sm text-brand-700/60">
        {hasQuery ? '沒找到符合的社區，換個關鍵字？' : '目前暫無社區資料'}
      </p>
    </div>
  );
}

// ─── 錯誤狀態 ─────────────────────────────────────────────────────────────────

interface ErrorStateProps {
  onRetry: () => void;
}

function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <p className="text-sm text-red-600">載入失敗，請稍後再試</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full bg-brand-700 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-600"
      >
        重試
      </button>
    </div>
  );
}

// ─── 底部 visitor CTA ─────────────────────────────────────────────────────────

function BottomCTASection() {
  const handleRegister = useCallback(() => {
    navigateToAuth('signup', getCurrentPath());
  }, []);

  return (
    <section className="mx-auto mt-10 max-w-[1120px] px-4 pb-16">
      <div className="flex flex-col items-center gap-4 rounded-[24px] bg-brand-700 p-8 text-center text-white sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="text-lg font-bold">免費加入，追蹤社區最新評價</p>
          <p className="mt-1 text-sm text-white/70">加入後可訂閱社區動態、留言互動</p>
        </div>
        <button
          type="button"
          onClick={handleRegister}
          className="shrink-0 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-brand-700 transition-colors hover:bg-brand-50"
        >
          免費註冊
        </button>
      </div>
    </section>
  );
}

// ─── 主頁面 ───────────────────────────────────────────────────────────────────

export default function Explore() {
  const mode = usePageMode();
  const navigate = useNavigate();
  const a11yProps = useMaiMaiA11yProps();

  const { data: communities, isLoading, isError, refetch } = useCommunityList();

  const [query, setQuery] = useState('');
  const [mood, setMood] = useState<MaiMaiMood>('wave');
  const [speechMessages, setSpeechMessages] = useState<string[]>([
    MOOD_SPEECH.wave,
  ]);
  const clickCountRef = useRef(0);

  // 前端即時過濾
  const filtered = useMemo(() => {
    if (!communities) return [];
    const q = query.trim().toLowerCase();
    if (!q) return communities;
    return communities.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.address?.toLowerCase().includes(q) ?? false)
    );
  }, [communities, query]);

  // 更新 mood + speech
  const pushMood = useCallback((newMood: MaiMaiMood, text: string) => {
    setMood(newMood);
    if (text) {
      setSpeechMessages((prev) => [...prev.slice(-2), text]);
    }
  }, []);

  const handleSearchFocus = useCallback(() => {
    pushMood('thinking', MOOD_SPEECH.thinking);
  }, [pushMood]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setQuery(val);
      if (!val.trim()) {
        pushMood('wave', MOOD_SPEECH.wave);
      } else {
        pushMood('excited', MOOD_SPEECH.excited);
      }
    },
    [pushMood]
  );

  const handleCardHover = useCallback(() => {
    pushMood('excited', '這個社區評價不錯喔！');
  }, [pushMood]);

  const handleCardLeave = useCallback(() => {
    // 回到搜尋中或初始
    if (query.trim()) {
      pushMood('excited', MOOD_SPEECH.excited);
    } else {
      pushMood('wave', MOOD_SPEECH.wave);
    }
  }, [pushMood, query]);

  const handleMaiMaiClick = useCallback(() => {
    clickCountRef.current += 1;
    if (clickCountRef.current >= CLICK_EASTER_EGG_COUNT) {
      clickCountRef.current = 0;
      pushMood('celebrate', MOOD_SPEECH.celebrate);
    }
  }, [pushMood]);

  const handleCardClick = useCallback(
    (communityId: string) => {
      void navigate(RouteUtils.toNavigatePath(ROUTES.COMMUNITY_WALL(communityId)));
    },
    [navigate]
  );

  // 結果數更新 mood
  const resultsMood: MaiMaiMood | null = useMemo(() => {
    if (!query.trim()) return null;
    return filtered.length === 0 ? 'confused' : 'happy';
  }, [query, filtered.length]);

  // 同步結果 mood（只在有搜尋時）
  useMemo(() => {
    if (resultsMood === 'confused') {
      pushMood('confused', MOOD_SPEECH.confused);
    } else if (resultsMood === 'happy') {
      pushMood('happy', `有 ${filtered.length} 個社區！`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultsMood, filtered.length]);

  return (
    <>
      <GlobalHeader mode="community" />

      <main className="min-h-screen bg-[var(--bg-page)]">
        {/* ── Hero 區 ── */}
        <section className="border-b border-brand-100/50 bg-brand-50 pb-10 pt-8">
          <div className="mx-auto flex max-w-[1120px] flex-col items-center gap-4 px-4 text-center">
            {/* MaiMai */}
            <div className="relative">
              <button
                type="button"
                onClick={handleMaiMaiClick}
                className="relative block cursor-pointer transition-transform hover:scale-105 active:scale-95"
                aria-label="點擊邁邁"
              >
                <MaiMaiBase
                  mood={mood}
                  size="md"
                  {...a11yProps}
                  className="size-24 md:size-32"
                />
              </button>
              <MaiMaiSpeech messages={speechMessages} />
            </div>

            {/* 標題 */}
            <h1 className="text-2xl font-bold text-brand-700 md:text-3xl">
              探索社區評價
            </h1>
            <p className="text-sm text-brand-700/60 md:text-base">
              找到你關心的社區，看看鄰居怎麼說
            </p>

            {/* 搜尋框 */}
            <div className="flex w-full max-w-xl items-center rounded-full border border-brand-100 bg-white shadow-sm transition-all focus-within:border-brand-300 focus-within:ring-4 focus-within:ring-brand-50">
              <span className="pl-5 text-gray-400">
                <Search size={18} strokeWidth={2.5} />
              </span>
              <input
                type="text"
                value={query}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                placeholder="輸入社區名稱或地址…"
                className="w-full bg-transparent py-3 pl-3 pr-5 text-sm font-medium text-gray-700 outline-none placeholder:text-gray-400"
                aria-label="搜尋社區"
              />
            </div>
          </div>
        </section>

        {/* ── 卡片 Grid ── */}
        <section className="mx-auto max-w-[1120px] px-4 py-8">
          {isLoading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          )}

          {isError && <ErrorState onRetry={refetch} />}

          {!isLoading && !isError && filtered.length === 0 && (
            <EmptyState hasQuery={query.trim().length > 0} a11yProps={a11yProps} />
          )}

          {!isLoading && !isError && filtered.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((community) => (
                <CommunityCard
                  key={community.id}
                  community={community}
                  onClick={() => handleCardClick(community.id)}
                  onMouseEnter={handleCardHover}
                  onMouseLeave={handleCardLeave}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── 底部 CTA（僅 visitor）── */}
        {mode === 'visitor' && <BottomCTASection />}
      </main>
    </>
  );
}
