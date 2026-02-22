/**
 * Community Explore Page
 *
 * 社區探索著陸頁 — visitor 和無歸屬會員的社區瀏覽入口
 * #8d 社區探索頁
 */
import { useState, useCallback, useMemo, useDeferredValue } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';

import { GlobalHeader } from '../../components/layout/GlobalHeader';
import { MaiMaiBase } from '../../components/MaiMai/MaiMaiBase';
import { MaiMaiSpeech } from '../../components/MaiMai/MaiMaiSpeech';

import { usePageMode } from '../../hooks/usePageMode';
import { useMaiMaiA11yProps } from '../../hooks/useMaiMaiA11yProps';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { navigateToAuth, getCurrentPath } from '../../lib/authUtils';
import { ROUTES, RouteUtils } from '../../constants/routes';

import { useCommunityList, type CommunityListItem } from './hooks/useCommunityList';
import { useExploreMood } from './hooks/useExploreMood';
import { CommunityCard } from './components/CommunityCard';
import { CommunityQuickFilters } from './components/CommunityQuickFilters';
import { CommunityResultsBar } from './components/CommunityResultsBar';

// ─── 常數 ────────────────────────────────────────────────────────────────────

const HIGH_REVIEW_THRESHOLD = 10;
const HIGH_ACTIVITY_THRESHOLD = 20;
const TRANSIT_KEYWORDS = ['捷運', '車站', '站'] as const;
const SCHOOL_KEYWORDS = ['學區', '國小', '國中'] as const;

type ExploreFilterKey = 'all' | 'highReview' | 'highActivity' | 'nearTransit' | 'schoolZone';

type ExploreSortKey = 'recommended' | 'reviewDesc' | 'postDesc' | 'nameAsc';

interface ExploreFilterOption {
  key: ExploreFilterKey;
  label: string;
  predicate: (community: CommunityListItem) => boolean;
}

interface ExploreSortOption {
  key: ExploreSortKey;
  label: string;
}

function includesKeyword(content: string, keywords: readonly string[]): boolean {
  return keywords.some((keyword) => content.includes(keyword));
}

function matchByKeywords(community: CommunityListItem, keywords: readonly string[]): boolean {
  const content = `${community.name} ${community.address ?? ''}`;
  return includesKeyword(content, keywords);
}

function compareByName(a: CommunityListItem, b: CommunityListItem): number {
  return a.name.localeCompare(b.name, 'zh-Hant-TW', {
    sensitivity: 'base',
  });
}

function getRecommendationScore(community: CommunityListItem): number {
  return community.review_count * 2 + community.post_count;
}

function getSortComparator(sortBy: ExploreSortKey) {
  switch (sortBy) {
    case 'reviewDesc':
      return (a: CommunityListItem, b: CommunityListItem) => {
        const diff = b.review_count - a.review_count;
        return diff !== 0 ? diff : compareByName(a, b);
      };
    case 'postDesc':
      return (a: CommunityListItem, b: CommunityListItem) => {
        const diff = b.post_count - a.post_count;
        return diff !== 0 ? diff : compareByName(a, b);
      };
    case 'nameAsc':
      return compareByName;
    case 'recommended':
    default:
      return (a: CommunityListItem, b: CommunityListItem) => {
        const diff = getRecommendationScore(b) - getRecommendationScore(a);
        return diff !== 0 ? diff : compareByName(a, b);
      };
  }
}

const DEFAULT_FILTER_OPTION: ExploreFilterOption = {
  key: 'all',
  label: '全部',
  predicate: () => true,
};

const EXPLORE_FILTER_OPTIONS: readonly ExploreFilterOption[] = [
  DEFAULT_FILTER_OPTION,
  {
    key: 'highReview',
    label: '評價高',
    predicate: (community) => community.review_count >= HIGH_REVIEW_THRESHOLD,
  },
  {
    key: 'highActivity',
    label: '討論熱',
    predicate: (community) => community.post_count >= HIGH_ACTIVITY_THRESHOLD,
  },
  {
    key: 'nearTransit',
    label: '捷運生活',
    predicate: (community) => matchByKeywords(community, TRANSIT_KEYWORDS),
  },
  {
    key: 'schoolZone',
    label: '學區關注',
    predicate: (community) => matchByKeywords(community, SCHOOL_KEYWORDS),
  },
];

const EXPLORE_SORT_OPTIONS: readonly ExploreSortOption[] = [
  { key: 'recommended', label: '推薦' },
  { key: 'reviewDesc', label: '評價數' },
  { key: 'postDesc', label: '貼文數' },
  { key: 'nameAsc', label: '名稱 A-Z' },
];

function isExploreFilterKey(value: string): value is ExploreFilterKey {
  return EXPLORE_FILTER_OPTIONS.some((option) => option.key === value);
}

function isExploreSortKey(value: string): value is ExploreSortKey {
  return EXPLORE_SORT_OPTIONS.some((option) => option.key === value);
}

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
        className="focus-visible:ring-brand-400 rounded-full bg-brand-700 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
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

  return (
    <section className="mx-auto mt-10 max-w-[1120px] px-4 pb-16">
      <div className="flex flex-col items-center gap-4 rounded-[24px] bg-brand-700 p-8 text-center text-white sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="text-lg font-bold">免費加入，追蹤社區最新評價</p>
          <p className="mt-1 text-sm text-white/70">加入後可訂閱社區動態、留言互動</p>
        </div>
        <button
          type="button"
          onClick={navigateToSignup}
          className="min-h-[44px] shrink-0 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-700"
        >
          免費註冊
        </button>
      </div>
    </section>
  );
}

// ─── 已登入會員引導 ─────────────────────────────────────────────────────────

function LiveMemberGuidanceSection() {
  return (
    <section className="mx-auto mt-10 max-w-[1120px] px-4 pb-16">
      <div className="flex flex-col items-center gap-3 rounded-[24px] border border-brand-100 bg-brand-50 p-8 text-center">
        <MapPin size={24} className="text-brand-700" aria-hidden="true" />
        <p className="text-lg font-bold text-brand-700">尋找你的社區</p>
        <p className="text-brand-700/60 text-sm">
          點選上方的社區卡片，即可瀏覽該社區的評價、貼文與問答
        </p>
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
  const [activeFilter, setActiveFilter] = useState<ExploreFilterKey>('all');
  const [sortBy, setSortBy] = useState<ExploreSortKey>('recommended');
  const deferredQuery = useDeferredValue(query);

  const activeFilterOption = useMemo(
    () =>
      EXPLORE_FILTER_OPTIONS.find((option) => option.key === activeFilter) ?? DEFAULT_FILTER_OPTION,
    [activeFilter]
  );

  // 以 deferred query + filter + sort 組成單一路徑，避免輸入時同步大量重算
  const filtered = useMemo(() => {
    if (!communities) return [];
    const q = deferredQuery.trim().toLowerCase();
    const filteredByQuickFilter = communities.filter((community) =>
      activeFilterOption.predicate(community)
    );

    const filteredBySearch = q
      ? filteredByQuickFilter.filter(
          (community) =>
            community.name.toLowerCase().includes(q) ||
            (community.address?.toLowerCase().includes(q) ?? false)
        )
      : filteredByQuickFilter;

    return [...filteredBySearch].sort(getSortComparator(sortBy));
  }, [communities, deferredQuery, activeFilterOption, sortBy]);

  // MaiMai mood / speech（由 useExploreMood 統一管理）
  const {
    effectiveMood,
    effectiveSpeech,
    handleSearchFocus,
    handleSearchMoodUpdate,
    handleCardHover,
    handleCardLeave,
    handleMaiMaiClick,
  } = useExploreMood(query, filtered.length);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setQuery(val);
      handleSearchMoodUpdate(val);
    },
    [handleSearchMoodUpdate]
  );

  const handleFilterChange = useCallback((nextFilter: string) => {
    if (!isExploreFilterKey(nextFilter)) return;
    setActiveFilter(nextFilter);
  }, []);

  const handleSortChange = useCallback((nextSortBy: string) => {
    if (!isExploreSortKey(nextSortBy)) return;
    setSortBy(nextSortBy);
  }, []);

  const handleCardClick = useCallback(
    (communityId: string) => {
      void navigate(RouteUtils.toNavigatePath(ROUTES.COMMUNITY_WALL(communityId)));
    },
    [navigate]
  );

  return (
    <>
      <GlobalHeader mode="community" />

      <main className="min-h-screen bg-[var(--bg-page)]">
        {/* ── Hero 區 ── */}
        <section className="border-brand-100/50 border-b bg-brand-50 pb-10 pt-8">
          <div className="mx-auto flex max-w-[1120px] flex-col items-center gap-4 px-4 text-center">
            {/* MaiMai */}
            <div className="relative z-overlay">
              <button
                type="button"
                onClick={handleMaiMaiClick}
                className="focus-visible:ring-brand-400 relative block cursor-pointer transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-50 active:scale-95"
                aria-label="點擊邁邁"
              >
                <MaiMaiBase mood={effectiveMood} size={isMobile ? 'sm' : 'md'} {...a11yProps} />
              </button>
              <MaiMaiSpeech messages={effectiveSpeech} />
            </div>

            {/* 標題 */}
            <h1 className="text-2xl font-bold text-brand-700 md:text-3xl">探索社區評價</h1>
            <p className="text-brand-700/60 text-sm md:text-base">
              找到你關心的社區，看看鄰居怎麼說
            </p>

            {/* 搜尋框 */}
            <div role="search" className="flex w-full max-w-xl items-center rounded-full border border-brand-100 bg-white shadow-sm transition-all focus-within:border-brand-300 focus-within:ring-4 focus-within:ring-brand-50">
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

            {!isLoading && !isError && (communities?.length ?? 0) > 0 && (
              <CommunityQuickFilters
                options={EXPLORE_FILTER_OPTIONS}
                activeKey={activeFilter}
                onChange={handleFilterChange}
              />
            )}
          </div>
        </section>

        {/* ── 卡片 Grid ── */}
        <section className="mx-auto max-w-[1120px] px-4 py-8">
          {!isLoading && !isError && (
            <CommunityResultsBar
              total={filtered.length}
              activeFilterLabel={activeFilterOption.label}
              sortBy={sortBy}
              sortOptions={EXPLORE_SORT_OPTIONS}
              onSortChange={handleSortChange}
            />
          )}

          {isLoading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          )}

          {isError && <ErrorState onRetry={refetch} />}

          {!isLoading && !isError && filtered.length === 0 && (
            <EmptyState
              hasQuery={query.trim().length > 0 || activeFilter !== 'all'}
              a11yProps={a11yProps}
            />
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

        {/* ── 底部 CTA / 引導 ── */}
        {mode === 'visitor' && <BottomCTASection />}
        {mode === 'live' && <LiveMemberGuidanceSection />}
      </main>
    </>
  );
}
