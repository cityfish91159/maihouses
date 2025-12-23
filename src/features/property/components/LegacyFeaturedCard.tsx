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
    // --text-tertiary: #9aa5b1
    // --primary-light: #e0f4ff

    return (
        <article className={`flex flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${isMain ? 'w-full' : 'h-full'}`}>
            {/* Media Section */}
            <div className={`relative w-full overflow-hidden bg-gray-200 ${isMain ? 'aspect-video' : 'aspect-[2/1]'}`}>
                <img
                    src={data.image}
                    alt={data.title}
                    className="absolute inset-0 size-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                />
                <span className="absolute left-3 top-3 z-10 rounded-2xl bg-[#00385a]/90 px-2.5 py-1 text-xs font-semibold text-white">
                    {data.badge}
                </span>
            </div>

            {/* Content Section */}
            <div className={`flex flex-1 flex-col p-4 ${isMain ? 'pt-5' : 'p-3 pt-4'}`}>

                {/* Title */}
                <h3 className={`mb-1.5 font-bold text-[#1f2933] ${isMain ? 'text-lg' : 'text-base'}`}>
                    {data.title}
                </h3>

                {/* Location */}
                <div className={`mb-2 text-[#5b6b7b] ${isMain ? 'text-[13px]' : 'text-xs'}`}>
                    {data.location}
                </div>

                {/* Tags (Chips) */}
                {/* Note: We intentionally do NOT filter spec tags here to match legacy behavior */}
                <div className="mb-2 flex flex-wrap gap-1.5">
                    {(data.details || []).slice(0, 3).map((tag, i) => (
                        <span
                            key={i}
                            className={`inline-block rounded-full bg-[#e0f4ff] font-medium text-[#00385a] ${isMain ? 'px-2 py-0.5 text-xs' : 'px-1.5 py-[1px] text-[11px]'}`}
                        >
                            {tag}
                        </span>
                    ))}
                </div>

                {/* Highlights (Main only) */}
                {isMain && data.highlights && (
                    <div className="mb-2 text-[11px] text-[#00385a]">
                        {data.highlights}
                    </div>
                )}

                {/* Rating */}
                <div className={`mb-2.5 flex items-center text-[#1f2933] ${isMain ? 'text-sm' : 'text-[13px]'}`}>
                    <span className="mr-0.5 text-[#fbbf24]">★</span>
                    <span>{data.rating}</span>
                </div>

                {/* Reviews (Main only) */}
                {isMain && data.reviews && data.reviews.length > 0 && (
                    <div className="mb-3 flex-1 space-y-2 text-[13px] leading-relaxed text-[#5b6b7b]">
                        {data.reviews.map((review, i) => (
                            <div key={i} className={`border-b border-gray-100 py-1 last:border-0`}>
                                <div className="mb-1 flex items-center gap-1.5">
                                    <span className="text-xs text-[#fbbf24]">{review.stars}</span>
                                    <span className="text-xs text-[#9aa5b1]">{review.author}</span>
                                </div>
                                {/* Review tags if present */}
                                {review.tags && (
                                    <div className="mb-1 flex gap-1">
                                        {review.tags.map((t, ti) => (
                                            <span key={ti} className="rounded bg-[rgba(40,163,138,0.07)] px-1.5 py-0.5 text-[11px] text-[#28a38a]">{t}</span>
                                        ))}
                                    </div>
                                )}
                                <p>{review.content}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* More Reviews / CTA Area */}
                <div className={`my-3 flex items-center justify-between rounded-lg bg-[#e0f4ff] text-[#5b6b7b] ${isMain ? 'mx-0 p-2.5 text-[13px]' : 'my-2 p-1.5 text-xs'}`}>
                    <div className={`flex items-center ${isMain ? 'gap-2' : 'gap-1'}`}>
                        <span className={isMain ? 'text-sm' : 'text-xs'}>🔒</span>
                        <span>
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
