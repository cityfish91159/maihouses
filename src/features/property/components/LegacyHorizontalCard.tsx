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
                                        key={i}
                                        className="inline-block rounded-full bg-[#e0f4ff] px-2 py-0.5 text-[11px] text-[#00385a]"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Price (Mobile Only - Order changed via flex) */}
                    <div className="mb-2 text-xl font-bold text-[#00385a] md:hidden">
                        {data.price}
                        <span className="ml-1.5 text-[13px] font-normal text-[#9aa5b1]">{data.size}</span>
                    </div>

                    {/* Rating */}
                    <div className="mb-2 text-xs text-[#5b6b7b] md:mb-0">
                        <span className="mr-0.5 text-[#fbbf24]">★</span>
                        <span>{data.rating}</span>
                    </div>

                    {/* Reviews */}
                    <div className="flex flex-1 flex-col justify-center gap-1.5">
                        {(data.reviews || []).slice(0, 2).map((review, i) => (
                            <div key={i} className={`flex items-start gap-2 ${i > 0 ? 'hidden md:flex' : ''}`}>
                                <span className="shrink-0 rounded bg-[#e0f4ff] px-1.5 py-0.5 text-[10px] font-semibold text-[#00385a]">
                                    {review.badge}
                                </span>
                                <p className="line-clamp-1 text-[11px] leading-relaxed text-[#5b6b7b]">
                                    {review.content}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Note (Hidden on mobile per legacy css) */}
                    {data.note && (
                        <div className="hidden text-[11px] text-[#00385a] md:block">
                            {data.note}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Section (Desktop Only mostly, but adapted for responsive) */}
            <div className="flex w-full min-w-0 flex-col justify-center border-t border-[#dde5f0] p-3.5 md:h-[140px] md:w-60 md:min-w-[240px] md:border-l md:border-t-0 md:p-4">

                {/* Price (Desktop) */}
                <div className="mb-2 hidden text-lg font-bold text-[#00385a] md:block">
                    {data.price}
                    <span className="ml-1.5 text-[13px] font-normal text-[#9aa5b1]">{data.size}</span>
                </div>

                {/* Lock Info */}
                <div className="mb-2.5 flex flex-col gap-2 rounded-lg bg-[#e0f4ff] border border-[#00385a]/20 p-2 md:p-2.5">
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm text-[#00385a]">🔒</span>
                        <div className="text-[11px] font-semibold text-[#00385a]">
                            {data.lockLabel}
                            <span className="ml-1 text-[10px] font-normal text-[#9aa5b1]">還有 {data.lockCount} 則評價</span>
                        </div>
                    </div>
                    <button className="min-h-8 cursor-pointer rounded-lg bg-[#00385a] px-4 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-all hover:translate-y-px hover:shadow-md active:opacity-90">
                        註冊查看更多評價
                    </button>
                </div>

                {/* CTA Row */}
                <div className="flex gap-1.5">
                    <button className="min-h-9 flex-1 cursor-pointer rounded-lg border border-[#00385a] bg-transparent px-2.5 py-1.5 text-xs font-semibold text-[#00385a] transition-colors hover:bg-[#e0f4ff] active:opacity-80">
                        查看
                    </button>
                    <button className="flex size-9 min-w-9 items-center justify-center rounded-lg border border-[#dde5f0] bg-transparent text-base text-[#9aa5b1] transition-colors hover:border-[#ef4444] hover:bg-red-50 hover:text-[#ef4444] active:scale-95" aria-label="加入收藏">
                        ♡
                    </button>
                </div>

            </div>
        </article>
    );
}
