/**
 * PostsSection Component
 * 
 * 社區貼文區塊（公開牆/私密牆）
 */

import type { Role, Post, WallTab, Permissions } from '../types';
import { getPermissions, GUEST_VISIBLE_COUNT } from '../types';

interface PostCardProps {
  post: Post;
  perm: Permissions;
  onLike?: ((postId: number) => void) | undefined;
}

function PostCard({ post, perm, onLike }: PostCardProps) {
  const isAgent = post.type === 'agent';
  const isOfficial = post.type === 'official';

  const badge = isAgent 
    ? <span className="rounded bg-[#e0f4ff] px-1.5 py-0.5 text-[9px] font-bold text-[#004E7C]">認證房仲</span>
    : isOfficial 
      ? <span className="rounded bg-[#f6f9ff] px-1.5 py-0.5 text-[9px] font-bold text-[#00385a]">官方公告</span>
      : post.floor 
        ? <span className="rounded bg-[#e6edf7] px-1.5 py-0.5 text-[9px] font-bold text-[#00385a]">{post.floor} 住戶</span>
        : null;

  const stats = post.likes 
    ? <span className="flex items-center gap-1">❤️ {post.likes}</span>
    : post.views 
      ? <span className="flex items-center gap-1">👁️ {post.views}</span>
      : null;

  return (
    <article className="flex gap-2.5 rounded-[14px] border border-[var(--border-light)] bg-white p-3 transition-all hover:border-[var(--primary-light)] hover:shadow-[0_2px_8px_rgba(0,56,90,0.06)]">
      <div 
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-gradient-to-br from-[#eef3ff] to-white text-base font-extrabold ${isAgent ? 'border-[var(--brand-light)] text-[var(--brand-600)]' : 'border-[var(--primary)] text-[var(--primary)]'}`}
        aria-hidden="true"
      >
        {post.author.charAt(0)}
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-bold text-[var(--text-primary)]">{post.author}</span>
          {badge}
          <span className="text-[11px] text-[var(--text-secondary)]">{post.time}</span>
        </div>
        <div className="text-[13px] leading-relaxed text-[var(--text-primary)]">
          <b>{post.title}</b><br/>
          {post.content}
        </div>
        <div className="flex gap-3 text-[11px] text-[var(--text-secondary)]">
          {stats}
          <span className="flex items-center gap-1">💬 {post.comments}</span>
          {post.private && <span className="flex items-center gap-1">🔒 僅社區可見</span>}
        </div>
        <div className="mt-1 flex gap-2">
          {isAgent ? (
            <button 
              className="flex items-center gap-1 rounded-lg border border-[rgba(0,56,90,0.1)] bg-[rgba(0,56,90,0.06)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--primary)] transition-all hover:bg-[rgba(0,56,90,0.12)]"
              aria-label="私訊房仲"
            >
              📩 私訊房仲
            </button>
          ) : (
            <>
              <button 
                className="flex items-center gap-1 rounded-lg border border-[rgba(0,56,90,0.1)] bg-[rgba(0,56,90,0.06)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--primary)] transition-all hover:bg-[rgba(0,56,90,0.12)]"
                onClick={() => onLike?.(post.id)}
                aria-label="按讚這則貼文"
              >
                ❤️ 讚
              </button>
              <button 
                className="flex items-center gap-1 rounded-lg border border-[rgba(0,56,90,0.1)] bg-[rgba(0,56,90,0.06)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--primary)] transition-all hover:bg-[rgba(0,56,90,0.12)]"
                aria-label="回覆這則貼文"
              >
                💬 回覆
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

interface PostsSectionProps {
  role: Role;
  currentTab: WallTab;
  onTabChange: (tab: WallTab) => void;
  publicPosts: Post[];
  privatePosts: Post[];
  onLike?: (postId: number) => void;
}

export function PostsSection({ 
  role, 
  currentTab, 
  onTabChange, 
  publicPosts, 
  privatePosts,
  onLike 
}: PostsSectionProps) {
  const perm = getPermissions(role);

  const visiblePublic = perm.canSeeAllPosts ? publicPosts : publicPosts.slice(0, GUEST_VISIBLE_COUNT);
  const hiddenPublicCount = publicPosts.length - visiblePublic.length;

  const handlePrivateClick = () => {
    if (!perm.canAccessPrivate) {
      alert(perm.isGuest ? '🔐 登入/註冊\n\n請先登入或註冊' : '🏠 住戶驗證\n\n請上傳水電帳單或管理費收據');
      return;
    }
    onTabChange('private');
  };

  return (
    <section className="overflow-hidden rounded-[18px] border border-[var(--border-light)] bg-[rgba(255,255,255,0.98)] shadow-[0_2px_12px_rgba(0,51,102,0.04)]" aria-labelledby="posts-heading">
      <div className="flex items-center justify-between border-b border-[rgba(0,56,90,0.05)] bg-gradient-to-br from-[rgba(0,56,90,0.03)] to-[rgba(0,82,130,0.01)] px-4 py-3.5">
        <h2 id="posts-heading" className="flex items-center gap-1.5 text-[15px] font-extrabold text-[var(--primary-dark)]">🔥 社區熱帖</h2>
      </div>
      
      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 px-3.5 pb-3.5 pt-2" role="tablist">
        <button 
          role="tab"
          aria-selected={currentTab === 'public'}
          onClick={() => onTabChange('public')}
          className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${currentTab === 'public' ? 'border-[var(--primary-light)] bg-[rgba(0,56,90,0.1)] font-bold text-[var(--primary)]' : 'border-transparent bg-[rgba(240,244,250,0.8)] text-[var(--text-secondary)] hover:bg-[rgba(0,56,90,0.08)] hover:text-[var(--primary)]'}`}
        >
          公開牆
        </button>
        <button 
          role="tab"
          aria-selected={currentTab === 'private'}
          onClick={handlePrivateClick}
          className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${currentTab === 'private' ? 'border-[var(--primary-light)] bg-[rgba(0,56,90,0.1)] font-bold text-[var(--primary)]' : 'border-transparent bg-[rgba(240,244,250,0.8)] text-[var(--text-secondary)] hover:bg-[rgba(0,56,90,0.08)] hover:text-[var(--primary)]'} ${!perm.canAccessPrivate ? 'opacity-60' : ''}`}
        >
          私密牆 {!perm.canAccessPrivate && '🔒'}
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2.5 px-3.5 pb-3.5" role="tabpanel">
        {currentTab === 'public' ? (
          <>
            {visiblePublic.map(post => (
              <PostCard key={post.id} post={post} perm={perm} onLike={onLike} />
            ))}
            {hiddenPublicCount > 0 && publicPosts[GUEST_VISIBLE_COUNT] && (
              <div className="relative">
                <div className="pointer-events-none select-none blur-[4px]" aria-hidden="true">
                  <PostCard post={publicPosts[GUEST_VISIBLE_COUNT]} perm={perm} />
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[14px] bg-[rgba(255,255,255,0.85)] p-5 text-center">
                  <h4 className="mb-1 text-sm font-extrabold text-[var(--primary-dark)]">🔒 還有 {hiddenPublicCount} 則熱帖</h4>
                  <p className="mb-2.5 text-xs text-[var(--text-secondary)]">✓ 查看完整動態　✓ 新回答通知</p>
                  <button className="rounded-full bg-gradient-to-br from-[var(--primary)] to-[#005282] px-6 py-2.5 text-[13px] font-bold text-white transition-transform hover:scale-[1.02]">
                    免費註冊 / 登入
                  </button>
                </div>
              </div>
            )}
            {perm.canPostPublic && (
              <div className="flex justify-center rounded-[14px] border border-dashed border-[var(--border-light)] bg-[rgba(0,56,90,0.03)] p-5">
                <button className="flex w-full items-center justify-center gap-1 rounded-lg border border-[rgba(0,56,90,0.1)] bg-[rgba(0,56,90,0.06)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--primary)]">
                  ✏️ 發布貼文
                </button>
              </div>
            )}
          </>
        ) : perm.canAccessPrivate ? (
          <>
            {privatePosts.map(post => (
              <PostCard key={post.id} post={post} perm={perm} onLike={onLike} />
            ))}
            {perm.canPostPrivate ? (
              <div className="flex justify-center rounded-[14px] border border-dashed border-[var(--border-light)] bg-[rgba(0,56,90,0.03)] p-5">
                <button className="flex w-full items-center justify-center gap-1 rounded-lg border border-[rgba(0,56,90,0.1)] bg-[rgba(0,56,90,0.06)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--primary)]">
                  ✏️ 發布私密貼文
                </button>
              </div>
            ) : (
              <p className="py-3 text-center text-[11px] text-[var(--text-secondary)]">💡 房仲可查看私密牆，但無法發文</p>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-[14px] bg-[rgba(0,56,90,0.03)] px-5 py-10 text-center">
            <div className="mb-3 text-5xl opacity-50" aria-hidden="true">🔐</div>
            <h4 className="mb-1.5 text-sm font-bold text-[var(--primary-dark)]">私密牆僅限本社區住戶查看</h4>
            <p className="mb-4 text-xs text-[var(--text-secondary)]">{perm.isGuest ? '請先登入或註冊' : '驗證住戶身份後即可加入討論'}</p>
            <button className="rounded-full bg-[var(--primary)] px-5 py-2.5 text-xs font-bold text-white">
              {perm.isGuest ? '免費註冊 / 登入' : '我是住戶，驗證身份'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
