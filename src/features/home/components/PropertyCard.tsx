import React from 'react';
import type { FeaturedProperty, PropertyReview } from '../../../types/property';

// Re-export for backward compatibility
export type { PropertyReview as Review, FeaturedProperty as Property };

export default function PropertyCard({ property }: { property: FeaturedProperty }) {
    return (
        <article
            className="group relative isolate overflow-hidden rounded-2xl border border-[#E6EDF7] bg-white shadow-none transition-all duration-[180ms] ease-out hover:-translate-y-0.5 hover:border-[#1749d738] hover:shadow-[0_10px_26px_rgba(13,39,94,0.12)]"
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

                <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[13px] text-[#6C7B91]">
                    {property.tags.slice(0, 3).map((tag, i) => (
                        <span
                            key={i}
                            className="duration-120 rounded-full border border-[#E6EDF7] bg-[#F6F9FF] px-2.5 py-0.5 font-extrabold text-[#2A2F3A] transition-all ease-out group-hover:-translate-y-px group-hover:shadow-[0_4px_10px_rgba(0,56,90,0.10)]"
                        >
                            {tag}
                        </span>
                    ))}
                </div>

                <div className="my-2 mb-1 text-[19px] font-black tracking-[0.2px] text-[#111]">
                    NT$ {property.price} 萬
                </div>
                <div className="text-[13px] text-[#6C7B91]">
                    {property.location}
                </div>

                {/* Reviews Mini */}
                <div className="mt-2.5 rounded-xl border border-[#E6EDF7] bg-gradient-to-b from-[#F6F9FF] to-white px-3 py-2.5">
                    <div className="mb-2 flex items-center gap-2 text-[13px] font-black text-black/85 before:text-xs before:leading-none before:text-[#00385a] before:drop-shadow-[0_1px_0_rgba(0,56,90,0.12)] before:content-['★']">
                        住戶真實留言
                    </div>

                    {property.reviews.map((review, i) => (
                        <div
                            key={i}
                            className={`flex items-start gap-2.5 py-2 ${i !== 0 ? 'border-t border-dashed border-black/10' : ''}`}
                        >
                            <div className="grid size-[30px] flex-none place-items-center rounded-full bg-gradient-to-b from-[#F2F5F8] to-[#E1E6EB] text-xs font-black text-[#00385a] shadow-[inset_0_0_0_1px_rgba(0,56,90,0.15)]">
                                {review.avatar}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="mb-0.5 flex items-center gap-1.5 text-xs text-black/60">
                                    <span className="font-black text-black/85">{review.name} · {review.role}</span>
                                    <span className="inline-block size-1 rounded-full bg-black/20" />
                                    <span className="rounded-full bg-[#00385a]/10 px-2 py-0.5 font-black text-[#00385a]">
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
                        className="mt-2.5 w-full cursor-pointer rounded-xl border border-[#00385a]/30 bg-gradient-to-b from-white to-[#F5F7FA] px-3 py-2.5 text-[13px] font-black text-[#00385a] transition-all duration-150 ease-out hover:from-white hover:to-[#E8F0FF] hover:shadow-[0_6px_14px_rgba(0,56,90,0.18)] active:translate-y-px"
                    >
                        註冊後看更多評價
                    </button>
                </div>
            </div>
        </article>
    );
}
