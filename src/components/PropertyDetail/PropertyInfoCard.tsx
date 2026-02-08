import { memo, type CSSProperties } from 'react';
import { MapPin, Heart, Eye, Users, Flame } from 'lucide-react';
import type { PropertyData } from '../../services/propertyService';
import { LineShareAction } from '../social/LineShareAction';
import { LINE_BRAND_GREEN, LINE_BRAND_GREEN_HOVER } from './constants';

interface PropertyInfoCardProps {
  property: PropertyData;
  isFavorite: boolean;
  onFavoriteToggle: () => void;
  onLineShare: () => void;
  onMapClick: () => void;
  capsuleTags: string[];
  socialProof: {
    currentViewers: number;
    trustCasesCount: number;
    isHot: boolean;
  };
  trustEnabled: boolean; // #8 控制賞屋組數顯示
}

/**
 * 房源資訊卡片組件
 *
 * 包含:
 * - 標題、地址、價格
 * - 分享與收藏按鈕
 * - 社會證明標籤
 * - 關鍵特色標籤
 *
 * @remarks
 * 使用 React.memo 優化,僅在 props 變化時重新渲染
 */
export const PropertyInfoCard = memo(function PropertyInfoCard({
  property,
  isFavorite,
  onFavoriteToggle,
  onLineShare,
  onMapClick,
  capsuleTags,
  socialProof,
  trustEnabled,
}: PropertyInfoCardProps) {
  const lineBrandVars = {
    '--line-brand-green': LINE_BRAND_GREEN,
    '--line-brand-green-hover': LINE_BRAND_GREEN_HOVER,
  } as CSSProperties;

  return (
    <div style={lineBrandVars}>
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold leading-tight text-slate-900">{property.title}</h1>
        {/* 分享 + 收藏按鈕群組 */}
        <div className="flex items-center gap-2">
          <LineShareAction
            url={`${window.location.origin}/maihouses/property/${property.publicId}`}
            title={`【邁房子推薦】${property.title} | 總價 ${property.price} 萬`}
            onShareClick={onLineShare}
            className="rounded-full bg-[var(--line-brand-green)] p-2 text-white transition-all hover:bg-[var(--line-brand-green-hover)] hover:shadow-md"
            showIcon={true}
            btnText=""
          />
          <button
            onClick={onFavoriteToggle}
            className={`rounded-full p-2 transition-all ${isFavorite ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
          >
            <Heart size={24} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
        <MapPin size={16} />
        <span>{property.address}</span>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.address)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onMapClick}
          className="ml-2 flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100"
        >
          <MapPin size={12} />
          查看地圖
        </a>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-[#003366]">{property.price}</span>
        <span className="text-lg font-medium text-slate-500">萬</span>
        <span className="ml-2 text-sm font-medium text-red-500">可議價</span>
      </div>

      {/* 社會證明提示 - FOMO (#8 真實數據) */}
      <div className="mt-3 flex flex-wrap gap-2">
        {/* 熱門標記：trustEnabled && trustCasesCount >= 3 才顯示 */}
        {trustEnabled && socialProof.isHot && (
          <div className="inline-flex animate-pulse items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-xs font-medium text-orange-600">
            <Flame size={12} />
            熱門物件
          </div>
        )}
        {/* 瀏覽人數 — 永遠顯示 */}
        <div className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-xs text-slate-600">
          <Eye size={12} className="text-blue-500" />
          {socialProof.currentViewers} 人正在瀏覽
        </div>
        {/* 賞屋組數 — 有開啟安心留痕服務 且 案件數 > 0 時才顯示 */}
        {trustEnabled && socialProof.trustCasesCount > 0 && (
          <div className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-xs text-slate-600">
            <Users size={12} className="text-green-500" />
            本物件 {socialProof.trustCasesCount} 組客戶已賞屋
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="mt-4 flex flex-wrap gap-2">
        {capsuleTags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-[#003366]"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
});
