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
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { navigateToAuth, getCurrentPath } from '../../lib/authUtils';
import { ROUTES, RouteUtils } from '../../constants/routes';

import { useCommunityList } from './hooks/useCommunityList';
import { CommunityCard } from './components/CommunityCard';

// ─── 常數 ────────────────────────────────────────────────────────────────────

const CLICK_EASTER_EGG_COUNT = 5;
const COMMUNITY_COUNT_SPEECH_PREFIX = '\u6709 ';
const COMMUNITY_COUNT_SPEECH_SUFFIX = ' \u500b\u793e\u5340\uff01';

function buildCommunityCountSpeech(count: number): string {
  return `${COMMUNITY_COUNT_SPEECH_PREFIX}${count}${COMMUNITY_COUNT_SPEECH_SUFFIX}`;
}

// 只宣告此頁面實際使用的 mood，避免 idle/peek/shy/sleep/header 空字串造成誤解
const MOOD_SPEECH: Partial<Record<MaiMaiMood, string>> = {
  wave: '嗨！想找哪個社區的鄰居評價？',
  thinking: '輸入社區名或地址試試看…',
  excited: '找到了嗎？',
  confused: '沒找到耶…換個關鍵字？',
  celebrate: '你找到我的彩蛋了！',
  // happy：動態設定（帶數量），不在此預設
};

// ─── 骨架屏 ──────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="h-[140px] animate-pulse rounded-[18px] border border-[var(--border)] bg-[var(--border)]" />
  );
}

// ─── 空狀態 ──────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  hasQuery: boolean;
  a11yProps: ReturnType<typeof useMaiMaiA11yProps>;
}

function EmptyState({ hasQuery, a11yProps }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-16">
      <MaiMaiBase mood="confused" size="sm" {...a11yProps} />
      <p className="text-brand-700/60 text-sm">
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
  const navigateToSignup = useCallback(() => {
    navigateToAuth('signup', getCurrentPath());
  }, []);

  const handleRegister = useCallback(() => {
    navigateToSignup();
  }, [navigateToSignup]);

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
          className="min-h-[44px] shrink-0 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-700"
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
  const isMobile = useMediaQuery('(max-width: 767px)');

  const { data: communities, isLoading, isError, refetch } = useCommunityList();

  const [query, setQuery] = useState('');
  // mood：無搜尋詞時的基礎心情（hover/focus/彩蛋驅動）
  const [mood, setMood] = useState<MaiMaiMood>('wave');
  const [speechMessages, setSpeechMessages] = useState<string[]>([
    MOOD_SPEECH.wave ?? '',
  ]);
  const clickCountRef = useRef(0);
  const queryRef = useRef('');

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

  // 更新基礎 mood + speech（只在無搜尋詞時有效，有搜尋詞時由 effectiveMood 覆蓋）
  const pushMood = useCallback((newMood: MaiMaiMood, text: string) => {
    setMood(newMood);
    if (text) {
      setSpeechMessages((prev) => [...prev.slice(-2), text]);
    }
  }, []);

  const handleSearchFocus = useCallback(() => {
    pushMood('thinking', MOOD_SPEECH.thinking ?? '');
  }, [pushMood]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      queryRef.current = val;
      setQuery(val);
      if (!val.trim()) {
        pushMood('wave', MOOD_SPEECH.wave ?? '');
      } else {
        pushMood('excited', MOOD_SPEECH.excited ?? '');
      }
    },
    [pushMood]
  );

  const handleCardHover = useCallback(() => {
    pushMood('excited', MOOD_SPEECH.excited ?? '');
  }, [pushMood]);

  const handleCardLeave = useCallback(() => {
    // 讀 ref 取最新 query，避免依賴 query state 造成卡片全量 re-render
    if (queryRef.current.trim()) {
      pushMood('excited', MOOD_SPEECH.excited ?? '');
    } else {
      pushMood('wave', MOOD_SPEECH.wave ?? '');
    }
  }, [pushMood]);

  const handleMaiMaiClick = useCallback(() => {
    clickCountRef.current += 1;
    if (clickCountRef.current >= CLICK_EASTER_EGG_COUNT) {
      clickCountRef.current = 0;
      pushMood('celebrate', MOOD_SPEECH.celebrate ?? '');
    }
  }, [pushMood]);

  const handleCardClick = useCallback(
    (communityId: string) => {
      void navigate(RouteUtils.toNavigatePath(ROUTES.COMMUNITY_WALL(communityId)));
    },
    [navigate]
  );

  // 有搜尋詞時：搜尋結果決定 mood/speech；無搜尋詞時：回歸基礎 mood/speech
  const effectiveMood: MaiMaiMood = useMemo(() => {
    if (!query.trim()) return mood;
    return filtered.length === 0 ? 'confused' : 'happy';
  }, [query, filtered.length, mood]);

  const effectiveSpeech: string[] = useMemo(() => {
    if (!query.trim()) return speechMessages;
    if (filtered.length === 0) return [...speechMessages.slice(-2), MOOD_SPEECH.confused ?? ''];
    return [...speechMessages.slice(-2), buildCommunityCountSpeech(filtered.length)];
  }, [query, filtered.length, speechMessages]);

  return (
    <>
      <GlobalHeader mode="community" />

      <main className="min-h-screen bg-[var(--bg-page)]">
        {/* ── Hero 區 ── */}
        <section className="border-brand-100/50 border-b bg-brand-50 pb-10 pt-8">
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
                  mood={effectiveMood}
                  size={isMobile ? 'sm' : 'md'}
                  {...a11yProps}
                />
              </button>
              <MaiMaiSpeech messages={effectiveSpeech} />
            </div>

            {/* 標題 */}
            <h1 className="text-2xl font-bold text-brand-700 md:text-3xl">
              探索社區評價
            </h1>
            <p className="text-brand-700/60 text-sm md:text-base">
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
