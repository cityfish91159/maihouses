import React from 'react';
import type { FeaturedProperty, PropertyReview } from '../../../types/property';
import { isSpecTag } from '../../../lib/tagUtils';

// Re-export for backward compatibility
export type { PropertyReview as Review, FeaturedProperty as Property };

export default function PropertyCard({ property }: { property: FeaturedProperty }) {
    return (
        <article
            className="hover:border-brand-700/20 group relative isolate overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-none transition-all duration-[180ms] ease-out hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(13,39,94,0.12)]"
        >
            {/* Background Glow Effect */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_80%_-10%,rgba(23,73,215,0.12),transparent_60%)] opacity-80" />

            {/* Cover Image */}
            <a href={`/property/${property.id}`} className="relative block aspect-[4/3] overflow-hidden bg-[#e9ecf5]">
                <img
                    src={property.image}
                    alt="物件封面"
                    className="cubic-bezier(0.2,0.65,0.2,1) block size-full scale-100 object-cover transition-transform duration-[600ms] group-hover:scale-105"
                />
                <span className="absolute left-2.5 top-2.5 rounded-full bg-black/75 px-2 py-1 text-xs font-extrabold tracking-[0.2px] text-white shadow-[0_4px_10px_rgba(0,0,0,0.18)]">
                    {property.badge}
                </span>
            </a>

            {/* Body */}
            <div className="p-3 pb-3.5">
                <div className="my-0.5 mb-2 text-base font-extrabold leading-[1.35] tracking-[0.3px] text-primary lg:text-[21px]">
                    {property.title}
                </div>

                <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[13px] text-ink-600">
                    {/* UP-4.2: 僅渲染前 2 個非規格亮點 */}
                    {property.tags
                        .filter(tag => !isSpecTag(tag)) // 過濾規格
                        .slice(0, 2) // 取前兩位
                        .map((tag, i) => (
                            <span
                                key={i}
                                className="duration-120 rounded-full border border-brand-100 bg-brand-50 px-2.5 py-0.5 font-extrabold text-ink-700 transition-all ease-out group-hover:-translate-y-px group-hover:shadow-brand-md"
                            >
                                {tag}
                            </span>
                        ))}
                </div>

                <div className="my-2 mb-1 text-[19px] font-black tracking-[0.2px] text-[#111]">
                    NT$ {property.price} 萬
                </div>
                <div className="text-[13px] text-ink-600">
                    {property.location}
                </div>

                {/* Reviews Mini */}
                <div className="mt-2.5 rounded-xl border border-brand-100 bg-gradient-to-b from-brand-50 to-white px-3 py-2.5">
                    <div className="mb-2 flex items-center gap-2 text-[13px] font-black text-black/85 before:text-xs before:leading-none before:text-brand-700 before:drop-shadow-brand-xs before:content-['★']">
                        住戶真實留言
                    </div>

                    {property.reviews.map((review, i) => (
                        <div
                            key={i}
                            className={`flex items-start gap-2.5 py-2 ${i !== 0 ? 'border-t border-dashed border-black/10' : ''}`}
                        >
                            <div className="ring-brand-700/15 grid size-[30px] flex-none place-items-center rounded-full bg-gradient-to-b from-neutral-150 to-neutral-200 text-xs font-black text-brand-700 ring-1 ring-inset">
                                {review.avatar}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="mb-0.5 flex items-center gap-1.5 text-xs text-black/60">
                                    <span className="font-black text-black/85">{review.name} · {review.role}</span>
                                    <span className="inline-block size-1 rounded-full bg-black/20" />
                                    <span className="bg-brand-700/10 rounded-full px-2 py-0.5 font-black text-brand-700">
                                        {review.tag}
                                    </span>
                                </div>
                                <div className="text-[13px] leading-[1.6] text-black/85">
                                    {review.text}
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        type="button"
                        className="border-brand-700/30 mt-2.5 w-full cursor-pointer rounded-xl border bg-gradient-to-b from-white to-neutral-100 px-3 py-2.5 text-[13px] font-black text-brand-700 transition-all duration-150 ease-out hover:from-white hover:to-neutral-80 hover:shadow-brand-lg active:translate-y-px"
                    >
                        註冊後看更多評價
                    </button>
                </div>
            </div>
        </article>
    );
}
