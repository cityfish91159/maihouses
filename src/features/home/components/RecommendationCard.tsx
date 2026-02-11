import React, { memo } from 'react';
import type { PropertyCard } from '../../../types';

interface RecommendationCardProps {
  property: PropertyCard;
}

export const RecommendationCard = memo(({ property }: RecommendationCardProps) => {
  return (
    <article className="rounded-xl border border-border-light bg-white p-3 transition-all hover:-translate-y-1 hover:border-brand hover:shadow-lg">
      <div className="mb-2 h-28 overflow-hidden rounded-md">
        <img src={property.cover} alt="" aria-hidden="true" className="size-full object-cover" />
      </div>
      <div className="mb-1 line-clamp-1 text-sm font-semibold text-text-primary">
        {property.title}
      </div>
      <div className="mb-2 text-xs text-text-secondary">{property.communityName}</div>
      <div className="mb-2 text-base font-bold text-brand">NT$ {property.price} 萬</div>
      <a
        href={`#/community/${property.communityId}/wall`}
        className="inline-block rounded-full bg-gradient-to-br from-brand to-brand-light px-3 py-1.5 text-xs font-medium text-white transition-all hover:-translate-y-0.5"
        aria-label="前往社區牆"
      >
        看社區牆 →
      </a>
    </article>
  );
});

RecommendationCard.displayName = 'RecommendationCard';
