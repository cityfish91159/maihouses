import { ExternalLink, Star, MessageSquare } from 'lucide-react';

type CommunityWallCardProps = {
  name: string;
  topic?: string;
  reviewCount?: number;
  rating?: number;
};

/**
 * 社區牆推薦卡片
 * 當 AI 偵測到需求後，會在聊天中插入這個卡片引導用戶去看社區評價
 */
export default function CommunityWallCard({ 
  name, 
  topic = '住戶真實評價',
  reviewCount = 12,
  rating = 4.2
}: CommunityWallCardProps) {
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
          <span className="font-bold text-ink-700">{rating}</span>
        </span>
        <span>{reviewCount} 則評價</span>
      </div>
      
      {/* CTA */}
      <div className="mt-3 py-2 px-3 rounded-lg bg-brand-700 text-white text-center text-xs font-bold group-hover:bg-brand-600 transition-colors">
        去看看住戶怎麼說 →
      </div>
    </a>
  );
}
