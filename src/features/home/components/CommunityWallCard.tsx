import { ExternalLink, Star, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES, RouteUtils } from '../../../constants/routes';
import { SEED_COMMUNITY_ID } from '../../../constants/seed';
import { getCommunityWallSummaryMock } from '../../../constants/mock';

/**
 * ============================================
 * 社區牆推薦卡片 (CommunityWallCard)
 * ============================================
 *
 * 【功能說明】
 * 當 AI 偵測到用戶需求後，會在聊天中插入這個卡片，
 * 引導用戶去社區牆研究評價，而不是直接推薦物件。
 *
 * 【目前狀態】
 * ⚠️ MOCK 模式 - 社區牆功能尚未完善，目前使用假資料
 *
 * 【TODO: 接入真實社區牆】
 * 1. 建立社區牆 API：GET /api/community/wall?communityId={communityId}
 * 2. 修改 props 從 name/topic 改為 communityId
 * 3. 用 communityId 查詢真實的：
 *    - 社區名稱
 *    - 評價數量
 *    - 平均評分
 *    - 熱門討論話題
 * 【觸發格式】
 * AI 在回覆中使用：[[社區牆:社區名稱:討論話題]]
 * ChatMessage.tsx 會解析並渲染此卡片
 *
 * @see ChatMessage.tsx - 解析社區牆標記
 * @see maimai-persona.ts - AI Prompt 設定
 */

type CommunityWallCardProps = {
  name: string;
  topic?: string;
  reviewCount?: number;
  rating?: number;
};

export default function CommunityWallCard({
  name,
  topic = '住戶真實評價',
  reviewCount,
  rating,
}: CommunityWallCardProps) {
  const navigate = useNavigate();

  // 使用 mock 資料（之後改為 API 查詢）
  const mockData = getCommunityWallSummaryMock(name);
  const finalReviewCount = reviewCount ?? mockData.reviewCount;
  const finalRating = rating ?? mockData.rating;

  const communityWallPath = RouteUtils.toNavigatePath(ROUTES.COMMUNITY_WALL(SEED_COMMUNITY_ID));
  const handleNavigate = () => navigate(communityWallPath);

  return (
    <button
      type="button"
      onClick={handleNavigate}
      className="group mt-3 block w-full rounded-xl border-2 border-brand-100 bg-gradient-to-br from-brand-50 to-white p-4 text-left transition-all hover:border-brand-300 hover:shadow-md"
    >
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-brand-100">
            <MessageSquare size={16} className="text-brand-700" />
          </div>
          <div>
            <p className="text-sm font-black text-brand-700">{name}</p>
            <p className="text-ink-500 text-[11px] font-medium">社區牆</p>
          </div>
        </div>
        <ExternalLink
          size={16}
          className="text-brand-400 transition-colors group-hover:text-brand-600"
        />
      </div>

      {/* Topic */}
      <p className="mb-3 line-clamp-2 text-xs font-medium text-ink-600">💬 {topic}</p>

      {/* Stats */}
      <div className="text-ink-500 flex items-center gap-4 text-[11px]">
        <span className="flex items-center gap-1">
          <Star size={12} className="fill-amber-500 text-amber-500" />
          <span className="font-bold text-ink-700">{finalRating}</span>
        </span>
        <span>{finalReviewCount} 則評價</span>
      </div>

      {/* CTA */}
      <div className="mt-3 rounded-lg bg-brand-700 px-3 py-2 text-center text-xs font-bold text-white transition-colors group-hover:bg-brand-600">
        去看看住戶怎麼說 →
      </div>
    </button>
  );
}
