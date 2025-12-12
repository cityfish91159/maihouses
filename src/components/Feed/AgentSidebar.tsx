import React from 'react';
import { Link } from 'react-router-dom';
import type { PerformanceStats, TodoItem } from '../../types/agent';
import { STRINGS } from '../../constants/strings';
import { ROUTES } from '../../constants/routes';

interface AgentSidebarProps {
    stats: PerformanceStats;
    todos: TodoItem[];
    hotPosts?: { id: string | number; title: string; communityName: string; likes: number }[];
    className?: string;
}

export const AgentSidebar: React.FC<AgentSidebarProps> = ({ stats, todos, hotPosts = [], className = '' }) => {
    return (
        <aside className={`hidden md:flex flex-col gap-3 w-[280px] shrink-0 sticky top-[70px] self-start ${className}`}>
            {/* Navigation Card */}
            <div className="bg-white border border-[#e6edf7] rounded-[14px] p-[14px] shadow-[0_4px_14px_rgba(0,51,102,0.04)]">
                <h4 className="m-0 mb-2.5 text-[14px] font-bold text-[#00385a]">{STRINGS.AGENT.SIDEBAR.NAV_TITLE}</h4>
                <div className="flex flex-col gap-1.5">
                    <Link to={ROUTES.UAG} className="flex items-center gap-2 p-2.5 rounded-[10px] no-underline text-white text-[13px] font-semibold bg-gradient-to-br from-[#00385a] to-[#005282]">
                        {STRINGS.AGENT.SIDEBAR.LINK_UAG}
                    </Link>
                    <Link to={`${ROUTES.UAG}#stats`} className="flex items-center gap-2 p-2.5 rounded-[10px] no-underline text-[#0b214a] text-[13px] font-semibold hover:bg-[#f0f7ff] transition-colors">
                        {STRINGS.AGENT.SIDEBAR.LINK_STATS}
                    </Link>
                    <Link to={ROUTES.ASSURE} className="flex items-center gap-2 p-2.5 rounded-[10px] no-underline text-[#0b214a] text-[13px] font-semibold hover:bg-[#f0f7ff] transition-colors">
                        {STRINGS.AGENT.SIDEBAR.LINK_TRUST}
                    </Link>
                    <Link to={`/community/${'test-uuid'}/wall`} className="flex items-center gap-2 p-2.5 rounded-[10px] no-underline text-[#0b214a] text-[13px] font-semibold hover:bg-[#f0f7ff] transition-colors relative">
                        {STRINGS.AGENT.SIDEBAR.LINK_WALL}
                        {/* Notification Badge Example */}
                        <span className="absolute right-2 top-3 w-2 h-2 rounded-full bg-red-500"></span>
                    </Link>
                </div>
            </div>

            {/* Performance Card */}
            <div className="bg-white border border-[#e6edf7] rounded-[14px] p-[14px] shadow-[0_4px_14px_rgba(0,51,102,0.04)]">
                <h4 className="m-0 mb-2.5 text-[14px] font-bold text-[#00385a]">{STRINGS.AGENT.SIDEBAR.PERF_TITLE}</h4>
                <p className="text-[13px] text-[#6c7b91] m-0 leading-[1.8]">
                    {STRINGS.AGENT.SIDEBAR.PERF_DEAL_COUNT_PREFIX} <b className="text-[#00385a]">2</b> {STRINGS.AGENT.SIDEBAR.PERF_DEAL_COUNT_UNIT}<br />
                    {STRINGS.AGENT.SIDEBAR.PERF_AMOUNT_PREFIX} <b className="text-[#00385a]">$3,280萬</b><br />
                    {STRINGS.AGENT.SIDEBAR.PERF_CLIENTS_PREFIX} <b className="text-[#00385a]">18</b> {STRINGS.AGENT.SIDEBAR.PERF_CLIENTS_UNIT}
                </p>
            </div>

            {/* Todos Card */}
            <div className="bg-white border border-[#e6edf7] rounded-[14px] p-[14px] shadow-[0_4px_14px_rgba(0,51,102,0.04)]">
                <div className="flex items-center justify-between mb-2.5">
                    <h4 className="m-0 text-[14px] font-bold text-[#00385a]">{STRINGS.AGENT.SIDEBAR.TODO_TITLE}</h4>
                    {todos.length > 0 && (
                        <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{todos.length}</span>
                    )}
                </div>
                <div className="flex flex-col gap-2">
                    {todos.map(todo => (
                        <div key={todo.id} className="text-[13px] text-[#6c7b91] leading-tight flex gap-1.5 align-baseline">
                            <span className="shrink-0">{todo.type === 'contact' ? '📞' : '🔔'}</span>
                            <span>{todo.content}</span>
                        </div>
                    ))}
                    {todos.length === 0 && <span className="text-gray-400 text-xs">{STRINGS.AGENT.SIDEBAR.TODO_EMPTY}</span>}
                </div>
            </div>

            {/* Hot Posts (Added for M2) */}
            {hotPosts.length > 0 && (
                <div className="bg-white border border-[#e6edf7] rounded-[14px] p-[14px] shadow-[0_4px_14px_rgba(0,51,102,0.04)]">
                    <h4 className="m-0 mb-2.5 text-[14px] font-bold text-[#00385a]">{STRINGS.FEED.SIDEBAR.HOT_TITLE}</h4>
                    <ul className="m-0 p-0 list-none flex flex-col gap-3">
                        {hotPosts.map(post => (
                            <li key={post.id} className="text-[13px] leading-tight">
                                <Link to={`/post/${post.id}`} className="text-[#0b214a] no-underline hover:text-[#005282] font-medium block mb-0.5 line-clamp-2">
                                    {post.title}
                                </Link>
                                <span className="text-[#94a3b8] text-[11px] flex items-center gap-1">
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
