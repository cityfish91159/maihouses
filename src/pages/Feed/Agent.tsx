import React, { useMemo } from 'react';
import { GlobalHeader } from '../../components/layout/GlobalHeader';
import { InlineComposer } from '../../components/Feed/InlineComposer';
import { FeedPostCard } from '../../components/Feed/FeedPostCard';
import { AgentProfileCard } from '../../components/Feed/AgentProfileCard';
import { AgentSidebar } from '../../components/Feed/AgentSidebar';
import { UagSummaryCard } from '../../components/Feed/UagSummaryCard';
import { useAgentFeed } from './useAgentFeed';
import { useAuth } from '../../hooks/useAuth';
import { useAgentConversations } from '../../hooks/useAgentConversations';
import { STRINGS } from '../../constants/strings';
import { MockToggle } from '../../components/common/MockToggle';
import type { PageMode } from '../../hooks/usePageMode';

interface AgentPageProps {
  userId?: string;
  mode?: PageMode;
}

export default function AgentPage({ userId, mode }: AgentPageProps) {
  const {
    data,
    uagSummary,
    performanceStats,
    todoList,
    viewerRole, // Kept for consistency if logic expands
    createPost,
    toggleLike,
    isLiked,
    handleComment,
    handleReply,
    handleShare,
    useMock,
    setUseMock,
  } = useAgentFeed(userId, mode);

  const { user } = useAuth();
  const { conversations } = useAgentConversations();

  const userProfile = useMemo(
    () => ({
      id: user?.id || 'demo-agent',
      name: user?.user_metadata?.name || '游杰倫', // Fallback name
      role: (viewerRole || 'agent') as 'agent', // Explicit cast for now as this is Agent view
      communityId: STRINGS.FEED.DEFAULT_COMMUNITY_ID,
      communityName: STRINGS.FEED.DEFAULT_COMMUNITY_NAME, // Fallback community
      email: user?.email || 'agent@maihouses.com',
      stats: {
        days: performanceStats.days,
        liked: performanceStats.liked,
        contributions: performanceStats.replies, // mapping replies to contributions
      },
    }),
    [user, viewerRole, performanceStats]
  );

  const handleCreatePost = async (content: string, images?: File[]) => {
    // P0: Pass correct communityId (from profile) and images to useFeedData
    await createPost(content, userProfile.communityId, images);
  };

  return (
    <div className="min-h-screen bg-[#f6f9ff]">
      <GlobalHeader mode="agent" title={STRINGS.FEED.PAGE_TITLE} />

      <div className="mx-auto flex max-w-[960px] gap-5 p-2.5 pb-24 md:pb-5">
        {/* Main Feed Area */}
        <main className="mx-auto flex w-full max-w-[560px] flex-1 flex-col gap-3 pb-20 md:pb-0">
          <AgentProfileCard profile={userProfile} stats={performanceStats} />

          <InlineComposer
            userInitial={userProfile.name.charAt(0).toUpperCase()}
            onSubmit={handleCreatePost}
          />

          {/* UAG Summary Card */}
          <UagSummaryCard data={uagSummary} />

          {/* Mock Safety Trace Posts (Static for MVP V4.2 Replica) */}
          <article className="animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-3 rounded-2xl border border-brand-100 bg-white p-4 shadow-card duration-500">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-2.5">
              <div className="flex size-10 items-center justify-center rounded-full border border-badge-trust-border bg-badge-trust-bg font-black text-badge-trust-text">
                安
              </div>
              <div className="flex-1 leading-[1.3]">
                <b className="block text-[15px] text-ink-900">{STRINGS.AGENT.TRUST.TITLE}</b>
                <div className="text-[12px] text-ink-600">帶看完成 · 惠宇上晴 12F A2 · 剛剛</div>
              </div>
            </div>
            <div className="pt-1">
              <p className="m-0 mb-2.5 leading-[1.6]">{STRINGS.AGENT.TRUST.DESC_1}</p>
              <p className="m-0 mb-2.5 leading-[1.6]">{STRINGS.AGENT.TRUST.DESC_2}</p>
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-full border border-grade-s-border bg-grade-s-bg px-2 py-0.5 text-[12px] text-grade-s-text">
                  {STRINGS.AGENT.TRUST.TAG_COMPLETED}
                </span>
                <span className="rounded-full border border-brand-100 bg-white px-2 py-0.5 text-[12px]">
                  {STRINGS.AGENT.TRUST.TAG_CERT}
                </span>
                <span className="rounded-full border border-brand-100 bg-white px-2 py-0.5 text-[12px]">
                  {STRINGS.AGENT.TRUST.TAG_PRIVATE}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm font-extrabold">
                {STRINGS.AGENT.TRUST.BTN_LIKE}
              </button>
              <button className="flex-1 rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm font-extrabold">
                {STRINGS.AGENT.TRUST.BTN_REPLY}
              </button>
              <button className="flex-1 rounded-lg border border-blue-700 bg-blue-700 px-3 py-2 text-sm font-extrabold text-white">
                {STRINGS.AGENT.TRUST.BTN_DETAIL}
              </button>
            </div>
          </article>

          {/* Regular Feed Posts */}
          {data.posts.map((post) => (
            <FeedPostCard
              key={post.id}
              post={post}
              isLiked={isLiked(post.id)}
              onLike={() => toggleLike(post.id)}
              onReply={handleReply}
              onShare={handleShare}
              onComment={handleComment}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
              communityId={post.communityId}
              currentUserId={user?.id}
              userInitial={userProfile.name.charAt(0).toUpperCase()}
            />
          ))}
        </main>

        {/* Sidebar */}
        <AgentSidebar
          stats={performanceStats}
          todos={todoList}
          hotPosts={data.sidebarData?.hotPosts || []}
          conversations={conversations}
        />
      </div>

      {/* Mock Toggle */}
      <MockToggle useMock={useMock} onToggle={() => setUseMock(!useMock)} />
    </div>
  );
}
