/**
 * Community Wall Page
 * 
 * 社區牆主頁面
 * 重構版 - 組件化、React Query、a11y 優化
 */

import { useState, useCallback } from 'react';
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

// Types & Data
import type { Role, WallTab } from './types';
import { getPermissions } from './types';
import { MOCK_DATA } from './mockData';

// Hooks
import { useCommunityWall } from '../../hooks/useCommunityWallQuery';

// ============ Main Component ============
export default function Wall() {
  const { id } = useParams<{ id: string }>();
  const [role, setRole] = useState<Role>('guest');
  const [currentTab, setCurrentTab] = useState<WallTab>('public');
  const [useMock, setUseMock] = useState(true);

  // React Query Hook（API 模式時使用）
  const { 
    data: apiData, 
    isLoading, 
    error,
    toggleLike: apiToggleLike,
  } = useCommunityWall(useMock ? undefined : id, {
    includePrivate: getPermissions(role).canAccessPrivate,
    enabled: !useMock && !!id,
  });

  // 當切換到私密牆但沒權限時，自動切回公開牆
  const perm = getPermissions(role);
  
  const handleTabChange = useCallback((tab: WallTab) => {
    if (tab === 'private' && !perm.canAccessPrivate) {
      return;
    }
    setCurrentTab(tab);
  }, [perm.canAccessPrivate]);

  // 如果身份變更導致無法存取私密牆，切回公開牆
  if (currentTab === 'private' && !perm.canAccessPrivate) {
    setCurrentTab('public');
  }

  // 按讚處理（目前只支援 Mock）
  const handleLike = useCallback((postId: number) => {
    if (!useMock && apiToggleLike) {
      apiToggleLike(String(postId));
    }
    // Mock 模式下暫不處理
  }, [useMock, apiToggleLike]);

  // 資料來源（Mock 或 API）
  const communityName = useMock 
    ? MOCK_DATA.communityInfo.name 
    : (apiData?.posts?.public?.[0]?.community_id || '社區牆');
    
  const reviews = useMock ? MOCK_DATA.reviews : [];
  const publicPosts = useMock ? MOCK_DATA.posts.public : [];
  const privatePosts = useMock ? MOCK_DATA.posts.private : [];
  const questions = useMock ? MOCK_DATA.questions : [];
  const communityInfo = useMock ? MOCK_DATA.communityInfo : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--bg-base)] to-[var(--bg-alt)]">
      <Topbar communityName={communityName} />
      
      <div className="mx-auto flex max-w-[960px] gap-5 p-2.5 pb-[calc(80px+env(safe-area-inset-bottom,20px))] lg:p-2.5">
        {/* 主內容區 */}
        <main className="flex max-w-[600px] flex-1 animate-[fadeInUp_0.5s_ease-out] flex-col gap-3">
          <ReviewsSection role={role} reviews={reviews} />
          <PostsSection 
            role={role} 
            currentTab={currentTab} 
            onTabChange={handleTabChange}
            publicPosts={publicPosts}
            privatePosts={privatePosts}
            onLike={handleLike}
          />
          <QASection role={role} questions={questions} />
        </main>

        {/* 側邊欄 */}
        {communityInfo && (
          <Sidebar 
            info={communityInfo} 
            questions={questions}
            posts={publicPosts}
          />
        )}
      </div>

      {/* 底部 CTA */}
      <BottomCTA role={role} />

      {/* Mock 切換按鈕 */}
      <MockToggle useMock={useMock} onToggle={() => setUseMock(!useMock)} />

      {/* 身份切換器 */}
      <RoleSwitcher role={role} onRoleChange={setRole} />

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
