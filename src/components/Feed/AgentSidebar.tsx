import React from 'react';
import type { PerformanceStats, TodoItem } from '../../types/agent';

interface AgentSidebarProps {
    stats: PerformanceStats;
    todos: TodoItem[];
    className?: string;
}

export const AgentSidebar: React.FC<AgentSidebarProps> = ({ stats, todos, className = '' }) => {
    return (
        <aside className={`hidden md:flex flex-col gap-3 w-[280px] shrink-0 sticky top-[70px] self-start ${className}`}>
            {/* Navigation Card */}
            <div className="bg-white border border-[#e6edf7] rounded-[14px] p-[14px] shadow-[0_4px_14px_rgba(0,51,102,0.04)]">
                <h4 className="m-0 mb-2.5 text-[14px] font-bold text-[#00385a]">🧭 快速導航</h4>
                <div className="flex flex-col gap-1.5">
                    <a href="#workbench" className="flex items-center gap-2 p-2.5 rounded-[10px] no-underline text-white text-[13px] font-semibold bg-gradient-to-br from-[#00385a] to-[#005282]">
                        📊 客戶工作臺
                    </a>
                    <a href="#stats" className="flex items-center gap-2 p-2.5 rounded-[10px] no-underline text-[#0b214a] text-[13px] font-semibold hover:bg-[#f0f7ff] transition-colors">
                        📈 業績統計
                    </a>
                    <a href="#trust" className="flex items-center gap-2 p-2.5 rounded-[10px] no-underline text-[#0b214a] text-[13px] font-semibold hover:bg-[#f0f7ff] transition-colors">
                        🛡️ 安心留痕
                    </a>
                    <a href="#my-community" className="flex items-center gap-2 p-2.5 rounded-[10px] no-underline text-[#0b214a] text-[13px] font-semibold hover:bg-[#f0f7ff] transition-colors">
                        🧱 我的社區牆
                    </a>
                </div>
            </div>

            {/* Performance Card */}
            <div className="bg-white border border-[#e6edf7] rounded-[14px] p-[14px] shadow-[0_4px_14px_rgba(0,51,102,0.04)]">
                <h4 className="m-0 mb-2.5 text-[14px] font-bold text-[#00385a]">📊 業績總覽</h4>
                <p className="text-[13px] text-[#6c7b91] m-0 leading-[1.8]">
                    本月成交 <b className="text-[#00385a]">2</b> 件<br />
                    成交金額 <b className="text-[#00385a]">$3,280萬</b><br />
                    服務中客戶 <b className="text-[#00385a]">18</b> 位
                </p>
            </div>

            {/* Todos Card */}
            <div className="bg-white border border-[#e6edf7] rounded-[14px] p-[14px] shadow-[0_4px_14px_rgba(0,51,102,0.04)]">
                <h4 className="m-0 mb-2.5 text-[14px] font-bold text-[#00385a]">🎯 今日待辦</h4>
                <div className="flex flex-col gap-2">
                    {todos.map(todo => (
                        <div key={todo.id} className="text-[13px] text-[#6c7b91] leading-tight">
                            {todo.type === 'contact' ? '📞' : '🔔'} {todo.content}
                        </div>
                    ))}
                    {todos.length === 0 && <span className="text-gray-400 text-xs">無待辦事項</span>}
                </div>
            </div>
        </aside>
    );
};
