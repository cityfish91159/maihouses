import { ExternalLink, Star, MessageSquare } from 'lucide-react';

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
 * 1. 建立社區牆 API：GET /api/community-wall/:communityId
 * 2. 修改 props 從 name/topic 改為 communityId
 * 3. 用 communityId 查詢真實的：
 *    - 社區名稱
 *    - 評價數量
 *    - 平均評分
 *    - 熱門討論話題
 * 4. 修改連結為動態：/maihouses/community-wall.html?id={communityId}
 * 
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

// ============================================
// 🎭 MOCK 資料 - 之後替換為 API 查詢
// ============================================
const MOCK_COMMUNITY_DATA: Record<string, { reviewCount: number; rating: number }> = {
  '快樂花園': { reviewCount: 28, rating: 4.3 },
  '遠雄二代宅': { reviewCount: 45, rating: 4.1 },
  '美河市': { reviewCount: 67, rating: 3.9 },
  '景安和院': { reviewCount: 19, rating: 4.5 },
  '松濤苑': { reviewCount: 32, rating: 4.2 },
  '華固名邸': { reviewCount: 24, rating: 4.4 },
  // 預設值
  'default': { reviewCount: 12, rating: 4.2 }
};

function getMockData(name: string) {
  return MOCK_COMMUNITY_DATA[name] || MOCK_COMMUNITY_DATA['default'];
}
// ============================================

export default function CommunityWallCard({ 
  name, 
  topic = '住戶真實評價',
  reviewCount,
  rating
}: CommunityWallCardProps) {
  // 使用 mock 資料（之後改為 API 查詢）
  const mockData = getMockData(name);
  const finalReviewCount = reviewCount ?? mockData.reviewCount;
  const finalRating = rating ?? mockData.rating;
  
  // TODO: 改為動態連結 /maihouses/community-wall.html?id={communityId}
  const communityWallUrl = '/maihouses/community-wall_mvp.html';
  
  return (
    <a 
      href={communityWallUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-3 p-4 rounded-xl bg-gradient-to-br from-brand-50 to-white border-2 border-brand-100 hover:border-brand-300 hover:shadow-md transition-all group"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
            <MessageSquare size={16} className="text-brand-700" />
          </div>
          <div>
            <p className="font-black text-brand-700 text-sm">{name}</p>
            <p className="text-[11px] text-ink-500 font-medium">社區牆</p>
          </div>
        </div>
        <ExternalLink size={16} className="text-brand-400 group-hover:text-brand-600 transition-colors" />
      </div>
      
      {/* Topic */}
      <p className="text-xs text-ink-600 font-medium mb-3 line-clamp-2">
        💬 {topic}
      </p>
      
      {/* Stats */}
      <div className="flex items-center gap-4 text-[11px] text-ink-500">
        <span className="flex items-center gap-1">
          <Star size={12} className="text-amber-500 fill-amber-500" />
          <span className="font-bold text-ink-700">{finalRating}</span>
        </span>
        <span>{finalReviewCount} 則評價</span>
      </div>
      
      {/* CTA */}
      <div className="mt-3 py-2 px-3 rounded-lg bg-brand-700 text-white text-center text-xs font-bold group-hover:bg-brand-600 transition-colors">
        去看看住戶怎麼說 →
      </div>
    </a>
  );
}
