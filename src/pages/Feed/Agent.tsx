import React, { useEffect } from 'react';
import { GlobalHeader } from '../../components/layout/GlobalHeader';
import { InlineComposer } from '../../components/Feed/InlineComposer'; // Correct path? Check Consumer.tsx import
import { FeedPostCard } from '../../components/Feed/FeedPostCard';
import { AgentProfileCard } from '../../components/Feed/AgentProfileCard';
import { AgentSidebar } from '../../components/Feed/AgentSidebar';
import { UagSummaryCard } from '../../components/Feed/UagSummaryCard';
import { useAgentFeed } from './useAgentFeed';
import { useAuth } from '../../hooks/useAuth';
import { STRINGS } from '../../constants/strings';

interface AgentPageProps {
    userId?: string;
    forceMock?: boolean;
}

export default function AgentPage({ userId, forceMock }: AgentPageProps) {
    const {
        data,
        uagSummary,
        performanceStats,
        todoList,
        isAuthenticated,
        viewerRole,
        // ... actions
        createPost,
        toggleLike,
        isLiked,
        handleComment
    } = useAgentFeed(userId, forceMock);

    const { user } = useAuth();

    // Redirect or handle Guest? Agent page implies Agent role.
    // For now, render anyway.

    const userProfile = {
        id: user?.id || 'demo-agent',
        name: user?.user_metadata?.name || '游杰倫', // Match HTML mock
        role: (viewerRole === 'agent' ? 'agent' : 'agent') as any, // Force agent for demo
        communityId: 'test-uuid',
        communityName: '惠宇上晴', // Match HTML mock
        email: user?.email || 'agent@maihouses.com',
        stats: {
            days: performanceStats.days,
            liked: performanceStats.liked,
            contributions: performanceStats.replies // mapping replies to contributions
        }
    };

    return (
        <div className="min-h-screen bg-[#f6f9ff]">
            <GlobalHeader mode="agent" title="個人信息流" />

            <div className="mx-auto max-w-[960px] flex gap-5 p-2.5 pb-24 md:pb-5">

                {/* Main Feed Area */}
                <main className="flex-1 max-w-[560px] flex flex-col gap-3 pb-20 md:pb-0 mx-auto w-full">

                    <AgentProfileCard
                        profile={userProfile}
                        stats={performanceStats}
                    />

                    <InlineComposer
                        userInitial={userProfile.name.charAt(0).toUpperCase()}
                        onSubmit={createPost}
                    // placeholder="分享社區想法、上傳物件或提出提問…"  // InlineComposer interface might strip unknown props but good to be clean
                    />

                    {/* UAG Summary Card */}
                    <UagSummaryCard data={uagSummary} />

                    {/* Mock Safety Trace Posts (Static for MVP V4.2 Replica) */}
                    <article className="bg-white border border-[#e6edf7] rounded-2xl p-4 flex flex-col gap-3 shadow-[0_4px_14px_rgba(12,34,80,0.04)] animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex gap-3 items-center border-b border-[#f1f5f9] pb-2.5">
                            <div className="w-10 h-10 rounded-full bg-[#eef3ff] flex items-center justify-center text-[#173a7c] font-black border border-[#e6edf7]">安</div>
                            <div className="flex-1 leading-[1.3]">
                                <b className="block text-[15px] text-[#0f172a]">安心留痕</b>
                                <div className="text-[12px] text-[#6c7b91]">帶看完成 · 惠宇上晴 12F A2 · 剛剛</div>
                            </div>
                        </div>
                        <div className="pt-1">
                            <p className="m-0 mb-2.5 leading-[1.6]"><b>11:30–12:05 帶看完成。</b>簽到、位置軌跡、現場照片 3 張與對話摘要已留存。</p>
                            <p className="m-0 mb-2.5 leading-[1.6]"><b>憑證號 MJ-2025-11-10-0007。</b>僅你與 買方 可見（個資受保護）。</p>
                            <div className="flex gap-1.5 flex-wrap">
                                <span className="border border-[#cbead4] bg-[#e8faef] rounded-full px-2 py-0.5 text-[12px] text-[#107a39]">帶看完成</span>
                                <span className="border border-[#e6edf7] bg-white rounded-full px-2 py-0.5 text-[12px]">留痕憑證</span>
                                <span className="border border-[#e6edf7] bg-white rounded-full px-2 py-0.5 text-[12px]">僅雙方可見</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="border border-[#e6edf7] rounded-lg bg-white px-3 py-2 font-extrabold flex-1 text-sm">👍 讚</button>
                            <button className="border border-[#e6edf7] rounded-lg bg-white px-3 py-2 font-extrabold flex-1 text-sm">💬 回覆</button>
                            <button className="border border-[#1749d7] rounded-lg bg-[#1749d7] text-white px-3 py-2 font-extrabold flex-1 text-sm">➡️ 看詳情</button>
                        </div>
                    </article>

                    {/* Regular Feed Posts */}
                    {data.posts.map(post => (
                        <FeedPostCard
                            key={post.id}
                            post={post}
                            isLiked={isLiked(post.id)}
                            onLike={() => toggleLike(post.id)}
                            onComment={handleComment} // Use handleComment
                            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                        />
                    ))}

                </main>

                {/* Sidebar */}
                <AgentSidebar
                    stats={performanceStats}
                    todos={todoList}
                />

            </div>
        </div>
    );
}
