/**
 * Community Wall Page
 * 
 * 社區牆主頁面
 * 重構版 - 統一資料來源、組件化、React Query、a11y 優化
 */

import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';

// Components
import {
  Topbar,
  ReviewsSection,
  PostsSection,
  QASection,
  Sidebar,
  RoleSwitcher,
  MockToggle,
  BottomCTA,
} from './components';

// Types
import type { Role, WallTab } from './types';
import { getPermissions } from './types';

// Hooks - 統一資料來源
import { useCommunityWallData } from '../../hooks/useCommunityWallData';

// ============ Main Component ============
export default function Wall() {
  const { id } = useParams<{ id: string }>();
  const [role, setRole] = useState<Role>('guest');
  const [currentTab, setCurrentTab] = useState<WallTab>('public');

  // 統一資料來源 Hook
  const { 
    data,
    useMock,
    setUseMock,
    isLoading,
    error,
    toggleLike,
    createPost,
  } = useCommunityWallData(id, {
    includePrivate: getPermissions(role).canAccessPrivate,
  });

  const perm = getPermissions(role);
  
  // Tab 切換
  const handleTabChange = useCallback((tab: WallTab) => {
    if (tab === 'private' && !perm.canAccessPrivate) {
      return;
    }
    setCurrentTab(tab);
  }, [perm.canAccessPrivate]);

  // 如果身份變更導致無法存取私密牆，切回公開牆
  useEffect(() => {
    if (currentTab === 'private' && !perm.canAccessPrivate) {
      setCurrentTab('public');
    }
  }, [currentTab, perm.canAccessPrivate]);

  // 按讚處理
  const handleLike = useCallback((postId: number | string) => {
    toggleLike(postId);
  }, [toggleLike]);

  // 發文處理
  const handleCreatePost = useCallback((content: string, visibility: 'public' | 'private' = 'public') => {
    createPost(content, visibility);
  }, [createPost]);

  // Loading 狀態（僅 API 模式）
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-bg-base to-bg-soft">
        <div className="text-center">
          <div className="mb-2 text-2xl">🏠</div>
          <div className="text-sm text-ink-600">載入中...</div>
        </div>
      </div>
    );
  }

  // Error 狀態（僅 API 模式）
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-bg-base to-bg-soft">
        <div className="text-center">
          <div className="mb-2 text-2xl">😢</div>
          <div className="mb-2 text-sm text-ink-600">載入失敗</div>
          <button 
            onClick={() => setUseMock(true)}
            className="rounded-lg bg-brand px-4 py-2 text-sm text-white"
          >
            切換 Mock 模式
          </button>
        </div>
      </div>
    );
  }

  // 從統一資料來源取得資料
  const { communityInfo, posts, reviews, questions } = data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--bg-base)] to-[var(--bg-alt)]">
      <Topbar communityName={communityInfo.name} />
      
      <div className="mx-auto flex max-w-[960px] gap-5 p-2.5 pb-[calc(80px+env(safe-area-inset-bottom,20px))] lg:p-2.5">
        {/* 主內容區 */}
        <main className="flex max-w-[600px] flex-1 animate-[fadeInUp_0.5s_ease-out] flex-col gap-3">
          <ReviewsSection role={role} reviews={reviews} />
          <PostsSection 
            role={role} 
            currentTab={currentTab} 
            onTabChange={handleTabChange}
            publicPosts={posts.public}
            privatePosts={posts.private}
            onLike={handleLike}
            onCreatePost={handleCreatePost}
          />
          <QASection role={role} questions={questions} />
        </main>

        {/* 側邊欄 - 使用同一個資料來源 */}
        <Sidebar 
          info={communityInfo} 
          questions={questions}
          posts={posts.public}
        />
      </div>

      {/* 底部 CTA */}
      <BottomCTA role={role} />

      {/* 開發工具：僅開發環境顯示 */}
      {import.meta.env.DEV && (
        <>
          <MockToggle useMock={useMock} onToggle={() => setUseMock(!useMock)} />
          <RoleSwitcher role={role} onRoleChange={setRole} />
        </>
      )}

      {/* 動畫 keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-25deg); }
          40% { transform: rotate(10deg); }
          60% { transform: rotate(-20deg); }
          80% { transform: rotate(5deg); }
        }
      `}</style>
    </div>
  );
}
