import React, { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { PerformanceStats, TodoItem } from '../../types/agent';
import type { ConversationListItem } from '../../types/messaging.types';
import { STRINGS } from '../../constants/strings';
import { ROUTES } from '../../constants/routes';
import { AgentConversationList } from './AgentConversationList';

// 問題 #15 修復：使用常數替代硬編碼
const DEFAULT_COMMUNITY_ID = STRINGS.FEED.DEFAULT_COMMUNITY_ID;

interface AgentSidebarProps {
  stats: PerformanceStats;
  todos: TodoItem[];
  hotPosts?: {
    id: string | number;
    title: string;
    communityName: string;
    likes: number;
  }[];
  /** MSG-5 FIX 5: 客戶對話列表 */
  conversations?: ConversationListItem[];
  className?: string;
}

// 子組件優化：TodoItem
const TodoItemComponent = memo(function TodoItemComponent({ todo }: { todo: TodoItem }) {
  const emoji = todo.type === 'contact' ? '📞' : '🔔';
  return (
    <div className="flex gap-1.5 align-baseline text-[13px] leading-tight text-slate-500">
      <span className="shrink-0">{emoji}</span>
      <span>{todo.content}</span>
    </div>
  );
});

// 子組件優化：HotPostItem
interface HotPostItemProps {
  post: {
    id: string | number;
    title: string;
    communityName: string;
    likes: number;
  };
}

const HotPostItem = memo(function HotPostItem({ post }: HotPostItemProps) {
  return (
    <li className="text-[13px] leading-tight">
      <Link
        to={`/post/${post.id}`}
        className="mb-0.5 line-clamp-2 block font-medium text-[var(--mh-color-0b214a)] no-underline hover:text-[var(--mh-color-005282)]"
      >
        {post.title}
      </Link>
      <span className="flex items-center gap-1 text-[11px] text-[var(--mh-color-94a3b8)]">
        {post.communityName} · 👍 {post.likes}
      </span>
    </li>
  );
});

export const AgentSidebar: React.FC<AgentSidebarProps> = memo(function AgentSidebar({
  stats,
  todos,
  hotPosts = [],
  conversations = [],
  className = '',
}) {
  // 使用 useMemo 快取 Todo 列表渲染
  const todoItems = useMemo(
    () => todos.map((todo) => <TodoItemComponent key={todo.id} todo={todo} />),
    [todos]
  );

  // 使用 useMemo 快取 Hot Posts 列表渲染
  const hotPostItems = useMemo(
    () => hotPosts.map((post) => <HotPostItem key={post.id} post={post} />),
    [hotPosts]
  );

  return (
    <aside
      className={`sticky top-[70px] hidden w-[280px] shrink-0 flex-col gap-3 self-start md:flex ${className}`}
    >
      {/* MSG-5 FIX 5: 客戶對話列表（優先顯示） */}
      <AgentConversationList conversations={conversations} />

      {/* Navigation Card */}
      <div className="rounded-[14px] border border-brand-100 bg-white p-[14px] shadow-card">
        <h4 className="m-0 mb-2.5 text-[14px] font-bold text-brand-700">
          {STRINGS.AGENT.SIDEBAR.NAV_TITLE}
        </h4>
        <div className="flex flex-col gap-1.5">
          <Link
            to={ROUTES.UAG}
            className="flex items-center gap-2 rounded-[10px] bg-gradient-to-br from-brand-700 to-brand-500 p-2.5 text-[13px] font-semibold text-white no-underline"
          >
            {STRINGS.AGENT.SIDEBAR.LINK_UAG}
          </Link>
          <Link
            to={`${ROUTES.UAG}#stats`}
            className="flex items-center gap-2 rounded-[10px] p-2.5 text-[13px] font-semibold text-[var(--mh-color-0b214a)] no-underline transition-colors hover:bg-[var(--mh-color-f0f7ff)]"
          >
            {STRINGS.AGENT.SIDEBAR.LINK_STATS}
          </Link>
          <Link
            to={ROUTES.ASSURE}
            className="flex items-center gap-2 rounded-[10px] p-2.5 text-[13px] font-semibold text-[var(--mh-color-0b214a)] no-underline transition-colors hover:bg-[var(--mh-color-f0f7ff)]"
          >
            {STRINGS.AGENT.SIDEBAR.LINK_TRUST}
          </Link>
          <Link
            to={`/community/${DEFAULT_COMMUNITY_ID}/wall`}
            className="relative flex items-center gap-2 rounded-[10px] p-2.5 text-[13px] font-semibold text-[var(--mh-color-0b214a)] no-underline transition-colors hover:bg-[var(--mh-color-f0f7ff)]"
          >
            {STRINGS.AGENT.SIDEBAR.LINK_WALL}
            {/* Notification Badge Example */}
            <span className="absolute right-2 top-3 size-2 rounded-full bg-red-500"></span>
          </Link>
        </div>
      </div>

      {/* Performance Card */}
      <div className="rounded-[14px] border border-brand-100 bg-white p-[14px] shadow-card">
        <h4 className="m-0 mb-2.5 text-[14px] font-bold text-brand-700">
          {STRINGS.AGENT.SIDEBAR.PERF_TITLE}
        </h4>
        <p className="m-0 text-[13px] leading-[1.8] text-slate-500">
          {STRINGS.AGENT.SIDEBAR.PERF_DEAL_COUNT_PREFIX}{' '}
          <b className="text-brand-700">{stats.deals}</b>{' '}
          {STRINGS.AGENT.SIDEBAR.PERF_DEAL_COUNT_UNIT}
          <br />
          {STRINGS.AGENT.SIDEBAR.PERF_AMOUNT_PREFIX}{' '}
          <b className="text-brand-700">${stats.amount.toLocaleString()}萬</b>
          <br />
          {STRINGS.AGENT.SIDEBAR.PERF_CLIENTS_PREFIX}{' '}
          <b className="text-brand-700">{stats.clients}</b>{' '}
          {STRINGS.AGENT.SIDEBAR.PERF_CLIENTS_UNIT}
        </p>
      </div>

      {/* Todos Card */}
      <div className="rounded-[14px] border border-brand-100 bg-white p-[14px] shadow-card">
        <div className="mb-2.5 flex items-center justify-between">
          <h4 className="m-0 text-[14px] font-bold text-brand-700">
            {STRINGS.AGENT.SIDEBAR.TODO_TITLE}
          </h4>
          {todos.length > 0 && (
            <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
              {todos.length}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {todos.length === 0 ? (
            <span className="text-xs text-gray-400">{STRINGS.AGENT.SIDEBAR.TODO_EMPTY}</span>
          ) : (
            todoItems
          )}
        </div>
      </div>

      {/* Hot Posts (Added for M2) */}
      {hotPosts.length > 0 && (
        <div className="rounded-[14px] border border-brand-100 bg-white p-[14px] shadow-card">
          <h4 className="m-0 mb-2.5 text-[14px] font-bold text-brand-700">
            {STRINGS.FEED.SIDEBAR.HOT_TITLE}
          </h4>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">{hotPostItems}</ul>
        </div>
      )}
    </aside>
  );
});
