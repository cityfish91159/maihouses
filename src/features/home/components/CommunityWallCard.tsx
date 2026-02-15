import { ExternalLink, MessageCircle, MessageSquare, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES, RouteUtils } from '../../../constants/routes';
import { SEED_COMMUNITY_ID } from '../../../constants/seed';
import { getCommunityWallSummaryMock } from '../../../constants/mock';

/**
 * ============================================
 * 社區牆推薦卡片 (CommunityWallCard)
 * ============================================
 *
 * 當 AI 偵測到用戶需求後，會在聊天中插入這個卡片，
 * 引導用戶去社區牆研究評價。
 *
 * 觸發格式：
 * - 舊版：[[社區牆:社區名稱:討論話題]]
 * - 新版：[[社區牆:communityId:社區名稱:討論話題]]
 * - 若缺少 communityId 或為空白，fallback SEED_COMMUNITY_ID
 */

type CommunityWallCardProps = {
  communityId?: string;
  name: string;
  topic?: string;
  reviewCount?: number;
  rating?: number;
};

export default function CommunityWallCard({
  communityId,
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

  const targetCommunityId = communityId?.trim() ? communityId : SEED_COMMUNITY_ID;
  const communityWallPath = RouteUtils.toNavigatePath(ROUTES.COMMUNITY_WALL(targetCommunityId));
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
      <div className="mb-3 flex items-start gap-1 text-xs font-medium text-ink-600">
        <MessageCircle size={12} className="mt-0.5 shrink-0 text-brand-500" aria-hidden="true" />
        <p className="line-clamp-2">{topic}</p>
      </div>

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
