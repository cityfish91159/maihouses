import React from 'react';
import type { FeaturedPropertyCard } from '../../../types/property-page';

type Variant = 'main' | 'side';

interface LegacyFeaturedCardProps {
    data: FeaturedPropertyCard;
    variant?: Variant;
}

export default function LegacyFeaturedCard({ data, variant = 'main' }: LegacyFeaturedCardProps) {
    const isMain = variant === 'main';

    // CSS mappings from property.html
    // --primary: #00385a
    // --text-secondary: #5b6b7b
    data: any;
    variant: 'main' | 'side';
}

const LegacyFeaturedCard: React.FC<LegacyFeaturedCardProps> = ({ data, variant }) => {
    return (
        <div className="property-card">
            <div className="property-media">
                <img src={data.image} alt={data.title} />
                <div className="property-badge">{data.badge}</div>
            </div>

            <div className="property-content">
                <h3 className="property-title">{data.title}</h3>
                <div className="property-location">{data.location}</div>

                <div className="property-rating">
                    <span className="star">★</span>
                    {data.rating}
                </div>

                {variant === 'main' ? (
                    // Main Card Layout
                    <>
                        <div className="property-reviews">
                            {data.reviews.map((review: any, i: number) => (
                 <div key={i} className="property-review-item">
                    <div className="review-header">
                       <span className="review-stars">{review.stars}</span>
                       <span className="review-author">{review.author}</span>
                    </div>
                     <div className="review-tags">
                        {review.tags.map((tag: string, ti: number) => (
                           <span key={ti} className="review-tag">{tag}</span>
                        ))}
                            {/* Fallback text logic mimicking legacy */}
                            {isMain ? '還有 ' : ''}
                            {data.lockCount} 則評價
                        </span>
                    </div>
                    <button
                        type="button"
                        className={`cursor-pointer rounded-2xl bg-[#00385a] font-bold text-white transition-opacity active:opacity-80 ${isMain ? 'px-3 py-1 text-xs' : 'min-h-6 px-2 py-0.5 text-[10px]'}`}
                    >
                        {isMain ? '註冊查看' : '查看'}
                    </button>
                </div>

                        {/* Price */}
                        <div className={`mb-3 font-bold text-[#00385a] ${isMain ? 'text-lg' : 'text-base'}`}>
                            {data.price}
                            {data.size && (
                                <span className="ml-1.5 text-[13px] font-normal text-[#9aa5b1]">{data.size}</span>
                            )}
                        </div>

                        {/* CTA Buttons (Main Only) */}
                        {isMain && (
                            <div className="mt-auto flex gap-2">
                                <button className="min-h-[48px] flex-1 cursor-pointer rounded-lg bg-[#00385a] px-2.5 py-2.5 text-sm font-bold text-white transition-opacity active:opacity-80">
                                    查看詳情
                                </button>
                                <button className="flex size-9 min-w-9 items-center justify-center rounded-lg border border-[#dde5f0] bg-transparent text-base text-[#9aa5b1] transition-colors hover:border-[#ef4444] hover:bg-red-50 hover:text-[#ef4444] active:scale-95" aria-label="加入收藏">
                                    ♡
                                </button>
                            </div>
                        )}

                    </div>
            </article>
            );
}
