import React from 'react';
import type { ListingPropertyCard } from '../../../types/property-page';

interface LegacyHorizontalCardProps {
    data: ListingPropertyCard;
}

export default function LegacyHorizontalCard({ data }: LegacyHorizontalCardProps) {
    // CSS mappings from property.html
    // --primary: #00385a
    // --text-secondary: #5b6b7b
    // --primary-light: #e0f4ff
    // --radius-md: 12px

    return (
        <article className="flex flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-px hover:shadow-md md:flex-row">
            {/* Left Section container */}
            <div className="flex flex-1 flex-col md:flex-row md:overflow-hidden">
                {/* Thumb */}
                <div className="w-full shrink-0 overflow-hidden bg-gray-200 md:h-[140px] md:w-[180px]">
                    <img
                        src={data.image}
                        alt={data.title}
                        className="size-full object-cover"
                        loading="lazy"
                    />
                </div>

                {/* Main Content */}
                <div className="flex h-auto flex-1 flex-col justify-between p-4 md:h-[140px] md:py-3.5 md:pl-4 md:pr-4">

                    {/* Title Row */}
                    <div className="mb-1 flex flex-wrap items-center gap-1.5 text-sm md:mb-0">
                        <span>📍</span>
                        <strong className="mr-1 text-[#1f2933]">{data.title}</strong>

                        {/* Tags (Chips) - NO FILTERING (Backfill preserved) */}
                        {data.tags && data.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {data.tags.slice(0, 3).map((tag, i) => (
                                    <span
                                        <div className="horizontal-card">
                                        <div className="horizontal-left">
                                            <div className="horizontal-thumb">
                                                <img src={data.image} alt={data.title} loading="lazy" />
                                            </div>
                                            <div className="horizontal-main">
                                                <div>
                                                    <div className="horizontal-title-row">
                                                        <strong>{data.title}</strong>
                                                        {data.tag && (
                                                            <span className="horizontal-tag">{data.tag}</span>
                                                        )}
                                                    </div>
                                                    <div className="horizontal-rating">
                                                        <span className="star">★</span>
                                                        {data.rating}
                                                    </div>
                                                </div>

                                                <div className="horizontal-reviews">
                                                    {data.reviews.map((review: any, i: number) => (
                                                        <div key={i} className="review-item-compact">
                                                            <span className="review-badge">{review.badge}</span>
                                                            <p className="review-text">{review.content}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="horizontal-right">
                                            <div className="property-price">
                                                {data.price}
                                                <span>{data.size}</span>
                                            </div>

                                            <div className="lock-row">
                                                <div className="lock-header">
                                                    <span className="lock-icon">🔒</span>
                                                    <div className="lock-text">
                                                        <div className="lock-label">{data.lockLabel}</div>
                                                        {data.lockCount && (
                                                            <div className="lock-count">({data.lockCount})</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="property-cta">
                                                <button className="btn-primary" style={{ padding: '0.375rem', minHeight: '2.5rem', fontSize: '0.8125rem' }}>
                                                    查看詳情
                                                </button>
                                                <button className="heart-btn" style={{ width: '2.5rem', height: '2.5rem', minWidth: '2.5rem' }}>
                                                    ♥
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
};

                                export default LegacyHorizontalCard;
