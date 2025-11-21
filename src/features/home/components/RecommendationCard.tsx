import React, { memo } from 'react';
import type { PropertyCard } from '../../../types';

interface RecommendationCardProps {
  property: PropertyCard;
}

export const RecommendationCard = memo(({ property }: RecommendationCardProps) => {
  return (
    <article
      className="rounded-xl bg-white p-3 transition-all hover:-translate-y-1 hover:shadow-lg border border-border-light hover:border-brand"
    >
      <div
        className="mb-2 h-28 rounded-md bg-cover bg-center"
        style={{ backgroundImage: `url(${property.cover})` }}
        aria-hidden="true"
      />
      <div className="mb-1 font-semibold text-text-primary text-sm line-clamp-1">
        {property.title}
      </div>
      <div className="mb-2 text-xs text-text-secondary">{property.communityName}</div>
      <div className="mb-2 font-bold text-brand text-base">
        NT$ {property.price} 萬
      </div>
      <a
        href={`#/community/${property.communityId}/wall`}
        className="inline-block rounded-full px-3 py-1.5 text-xs font-medium text-white transition-all hover:-translate-y-0.5 bg-gradient-to-br from-brand to-brand-light"
        aria-label="前往社區牆"
      >
        看社區牆 →
      </a>
    </article>
  );
});

RecommendationCard.displayName = 'RecommendationCard';