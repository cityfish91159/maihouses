import React from 'react';
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
    hotPosts?: { id: string | number; title: string; communityName: string; likes: number }[];
    /** MSG-5 FIX 5: 客戶對話列表 */
    conversations?: ConversationListItem[];
    className?: string;
}

export const AgentSidebar: React.FC<AgentSidebarProps> = ({ 
    stats, 
    todos, 
    hotPosts = [], 
    conversations = [],
    className = '' 
}) => {
    return (
        <aside className={`sticky top-[70px] hidden w-[280px] shrink-0 flex-col gap-3 self-start md:flex ${className}`}>
            {/* MSG-5 FIX 5: 客戶對話列表（優先顯示） */}
            <AgentConversationList conversations={conversations} />

            {/* Navigation Card */}
            <div className="rounded-[14px] border border-[#e6edf7] bg-white p-[14px] shadow-[0_4px_14px_rgba(0,51,102,0.04)]">
                <h4 className="m-0 mb-2.5 text-[14px] font-bold text-[#00385a]">{STRINGS.AGENT.SIDEBAR.NAV_TITLE}</h4>
                <div className="flex flex-col gap-1.5">
                    <Link to={ROUTES.UAG} className="flex items-center gap-2 rounded-[10px] bg-gradient-to-br from-[#00385a] to-[#005282] p-2.5 text-[13px] font-semibold text-white no-underline">
                        {STRINGS.AGENT.SIDEBAR.LINK_UAG}
                    </Link>
                    <Link to={`${ROUTES.UAG}#stats`} className="flex items-center gap-2 rounded-[10px] p-2.5 text-[13px] font-semibold text-[#0b214a] no-underline transition-colors hover:bg-[#f0f7ff]">
                        {STRINGS.AGENT.SIDEBAR.LINK_STATS}
                    </Link>
                    <Link to={ROUTES.ASSURE} className="flex items-center gap-2 rounded-[10px] p-2.5 text-[13px] font-semibold text-[#0b214a] no-underline transition-colors hover:bg-[#f0f7ff]">
                        {STRINGS.AGENT.SIDEBAR.LINK_TRUST}
                    </Link>
                    <Link to={`/community/${DEFAULT_COMMUNITY_ID}/wall`} className="relative flex items-center gap-2 rounded-[10px] p-2.5 text-[13px] font-semibold text-[#0b214a] no-underline transition-colors hover:bg-[#f0f7ff]">
                        {STRINGS.AGENT.SIDEBAR.LINK_WALL}
                        {/* Notification Badge Example */}
                        <span className="absolute right-2 top-3 size-2 rounded-full bg-red-500"></span>
                    </Link>
                </div>
            </div>

            {/* Performance Card */}
            <div className="rounded-[14px] border border-[#e6edf7] bg-white p-[14px] shadow-[0_4px_14px_rgba(0,51,102,0.04)]">
                <h4 className="m-0 mb-2.5 text-[14px] font-bold text-[#00385a]">{STRINGS.AGENT.SIDEBAR.PERF_TITLE}</h4>
                <p className="m-0 text-[13px] leading-[1.8] text-[#6c7b91]">
                    {STRINGS.AGENT.SIDEBAR.PERF_DEAL_COUNT_PREFIX} <b className="text-[#00385a]">2</b> {STRINGS.AGENT.SIDEBAR.PERF_DEAL_COUNT_UNIT}<br />
                    {STRINGS.AGENT.SIDEBAR.PERF_AMOUNT_PREFIX} <b className="text-[#00385a]">$3,280萬</b><br />
                    {STRINGS.AGENT.SIDEBAR.PERF_CLIENTS_PREFIX} <b className="text-[#00385a]">18</b> {STRINGS.AGENT.SIDEBAR.PERF_CLIENTS_UNIT}
                </p>
            </div>

            {/* Todos Card */}
            <div className="rounded-[14px] border border-[#e6edf7] bg-white p-[14px] shadow-[0_4px_14px_rgba(0,51,102,0.04)]">
                <div className="mb-2.5 flex items-center justify-between">
                    <h4 className="m-0 text-[14px] font-bold text-[#00385a]">{STRINGS.AGENT.SIDEBAR.TODO_TITLE}</h4>
                    {todos.length > 0 && (
                        <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">{todos.length}</span>
                    )}
                </div>
                <div className="flex flex-col gap-2">
                    {todos.map(todo => (
                        <div key={todo.id} className="flex gap-1.5 align-baseline text-[13px] leading-tight text-[#6c7b91]">
                            <span className="shrink-0">{todo.type === 'contact' ? '📞' : '🔔'}</span>
                            <span>{todo.content}</span>
                        </div>
                    ))}
                    {todos.length === 0 && <span className="text-xs text-gray-400">{STRINGS.AGENT.SIDEBAR.TODO_EMPTY}</span>}
                </div>
            </div>

            {/* Hot Posts (Added for M2) */}
            {hotPosts.length > 0 && (
                <div className="rounded-[14px] border border-[#e6edf7] bg-white p-[14px] shadow-[0_4px_14px_rgba(0,51,102,0.04)]">
                    <h4 className="m-0 mb-2.5 text-[14px] font-bold text-[#00385a]">{STRINGS.FEED.SIDEBAR.HOT_TITLE}</h4>
                    <ul className="m-0 flex list-none flex-col gap-3 p-0">
                        {hotPosts.map(post => (
                            <li key={post.id} className="text-[13px] leading-tight">
                                <Link to={`/post/${post.id}`} className="mb-0.5 line-clamp-2 block font-medium text-[#0b214a] no-underline hover:text-[#005282]">
                                    {post.title}
                                </Link>
                                <span className="flex items-center gap-1 text-[11px] text-[#94a3b8]">
                                    {post.communityName} · 👍 {post.likes}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </aside>
    );
};
