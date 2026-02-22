import { memo, useMemo, useState } from 'react';
import { Eye, Flame, Heart, MapPin, Users } from 'lucide-react';
import type { PropertyData } from '../../services/propertyService';
import { cn } from '../../lib/utils';
import { motionA11y } from '../../lib/motionA11y';
import { LineShareAction } from '../social/LineShareAction';
import { useAnimatedNumber } from './hooks/useAnimatedNumber';

interface PropertyInfoCardProps {
  property: PropertyData;
  isFavorite: boolean;
  onFavoriteToggle: () => void;
  onLineShare: () => void;
  capsuleTags: string[];
  socialProof: {
    currentViewers: number;
    trustCasesCount: number;
    isHot: boolean;
  };
  trustEnabled: boolean;
}

const VIEWER_COUNT_ANIMATION_DURATION_MS = 700;

export const PropertyInfoCard = memo(function PropertyInfoCard({
  property,
  isFavorite,
  onFavoriteToggle,
  onLineShare,
  capsuleTags,
  socialProof,
  trustEnabled,
}: PropertyInfoCardProps) {
  const [isAddressExpanded, setIsAddressExpanded] = useState(false);
  const animatedCurrentViewers = useAnimatedNumber(socialProof.currentViewers, {
    durationMs: VIEWER_COUNT_ANIMATION_DURATION_MS,
  });

  const shareUrl = useMemo(
    () =>
      typeof window === 'undefined'
        ? `/maihouses/property/${property.publicId}`
        : `${window.location.origin}/maihouses/property/${property.publicId}`,
    [property.publicId]
  );

  return (
    <div className="rounded-2xl p-4 glass-card sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <h1 className="line-clamp-2 text-2xl font-bold leading-tight text-slate-900">
          {property.title}
        </h1>

        <div data-testid="property-info-actions" className="flex items-center gap-2">
          <LineShareAction
            url={shareUrl}
            title={`【邁房子推薦】${property.title} | 總價 ${property.price} 萬`}
            onShareClick={onLineShare}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-line p-2.5 text-white transition-all hover:bg-line-hover hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            showIcon={true}
            btnText=""
          />
          <button
            type="button"
            onClick={onFavoriteToggle}
            aria-label={isFavorite ? '取消收藏' : '加入收藏'}
            data-testid="favorite-button"
            className={cn(
              'inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2.5 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2',
              isFavorite
                ? 'bg-red-50 text-red-500 focus:ring-red-500'
                : 'bg-slate-50 text-slate-400 hover:bg-slate-100 focus:ring-slate-400'
            )}
          >
            <Heart size={24} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      <div className="mt-2 space-y-2 text-sm text-slate-500">
        <div className="flex items-start gap-2">
          <MapPin size={16} className="mt-3 shrink-0" />
          <button
            type="button"
            aria-expanded={isAddressExpanded}
            aria-controls="property-address-text"
            aria-label={isAddressExpanded ? '收起完整地址' : '展開完整地址'}
            data-testid="address-toggle"
            onClick={() => setIsAddressExpanded((prev) => !prev)}
            className="min-h-[44px] flex-1 rounded-xl p-2 text-left outline-none transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1"
          >
            <span
              id="property-address-text"
              data-testid="property-address-text"
              className={cn('block text-sm text-slate-600', !isAddressExpanded && 'truncate')}
              title={property.address}
            >
              {property.address}
            </span>
            <span className="mt-0.5 block text-xs font-medium text-brand-700">
              {isAddressExpanded ? '收起地址' : '查看完整地址'}
            </span>
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-brand-700">{property.price}</span>
        <span className="text-lg font-medium text-slate-500">萬</span>
        <span className="ml-2 text-sm font-medium text-red-500">可議價</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {trustEnabled && socialProof.isHot && (
          <div
            className={cn(
              'inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-sm font-medium text-orange-600',
              motionA11y.pulse
            )}
          >
            <Flame size={12} />
            熱門物件
          </div>
        )}

        <div className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-sm text-slate-600">
          <Eye size={12} className="text-blue-500" />
          <span data-testid="current-viewers-count">{animatedCurrentViewers}</span> 人正在瀏覽
        </div>

        {trustEnabled && socialProof.trustCasesCount > 0 && (
          <div className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-sm text-slate-600">
            <Users size={12} className="text-green-500" />
            本物件 {socialProof.trustCasesCount} 組客戶已賞屋
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {capsuleTags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-brand-700"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
});
