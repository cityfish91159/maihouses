import React from 'react';

export type Review = {
    avatar: string;
    name: string;
    role: string;
    tag: string;
    text: string;
};

export type Property = {
    id: number;
    image: string;
    badge: string;
    title: string;
    tags: string[];
    price: string;
    location: string;
    reviews: Review[];
};

export default function PropertyCard({ property }: { property: Property }) {
    return (
        <article
            className="bg-white border border-[#E6EDF7] rounded-2xl overflow-hidden relative transition-all duration-[180ms] ease-out shadow-none hover:shadow-[0_10px_26px_rgba(13,39,94,0.12)] hover:-translate-y-0.5 hover:border-[#1749d738] group isolate"
        >
            {/* Background Glow Effect */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(60%_60%_at_80%_-10%,rgba(23,73,215,0.12),transparent_60%)] opacity-80" />

            {/* Cover Image */}
            <a href={`/property/${property.id}`} className="block aspect-[4/3] bg-[#e9ecf5] relative overflow-hidden">
                <img
                    src={property.image}
                    alt="物件封面"
                    className="w-full h-full object-cover block transform scale-100 transition-transform duration-[600ms] cubic-bezier(0.2,0.65,0.2,1) group-hover:scale-105"
                />
                <span className="absolute left-2.5 top-2.5 bg-black/75 text-white text-xs font-extrabold px-2 py-1 rounded-full tracking-[0.2px] shadow-[0_4px_10px_rgba(0,0,0,0.18)]">
                    {property.badge}
                </span>
            </a>

            {/* Body */}
            <div className="p-3 pb-3.5">
                <div className="font-extrabold text-base leading-[1.35] my-0.5 mb-2 tracking-[0.3px] text-[#0A2246] lg:text-[21px]">
                    {property.title}
                </div>

                <div className="flex flex-wrap gap-2 items-center text-[#6C7B91] text-[13px] mb-1.5">
                    {property.tags.map((tag, i) => (
                        <span
                            key={i}
                            className="px-2.5 py-0.5 rounded-full bg-[#F6F9FF] border border-[#E6EDF7] font-extrabold text-[#2A2F3A] transition-all duration-120 ease-out group-hover:-translate-y-px group-hover:shadow-[0_4px_10px_rgba(0,56,90,0.10)]"
                        >
                            {tag}
                        </span>
                    ))}
                </div>

                <div className="text-[19px] font-black text-[#111] my-2 mb-1 tracking-[0.2px]">
                    NT$ {property.price} 萬
                </div>
                <div className="text-[13px] text-[#6C7B91]">
                    {property.location}
                </div>

                {/* Reviews Mini */}
                <div className="mt-2.5 px-3 py-2.5 border border-[#E6EDF7] rounded-xl bg-gradient-to-b from-[#F6F9FF] to-white">
                    <div className="flex items-center gap-2 text-[13px] font-black mb-2 text-black/85 before:content-['★'] before:text-xs before:leading-none before:text-[#00385a] before:drop-shadow-[0_1px_0_rgba(0,56,90,0.12)]">
                        住戶真實留言
                    </div>

                    {property.reviews.map((review, i) => (
                        <div
                            key={i}
                            className={`flex gap-2.5 items-start py-2 ${i !== 0 ? 'border-t border-dashed border-black/10' : ''}`}
                        >
                            <div className="w-[30px] h-[30px] rounded-full grid place-items-center text-xs font-black bg-gradient-to-b from-[#F2F5F8] to-[#E1E6EB] text-[#00385a] flex-none shadow-[inset_0_0_0_1px_rgba(0,56,90,0.15)]">
                                {review.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5 text-xs text-black/60">
                                    <span className="font-black text-black/85">{review.name} · {review.role}</span>
                                    <span className="w-1 h-1 rounded-full bg-black/20 inline-block" />
                                    <span className="px-2 py-0.5 rounded-full bg-[#00385a]/10 text-[#00385a] font-black">
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
                        className="mt-2.5 w-full px-3 py-2.5 rounded-xl border border-[#00385a]/30 bg-gradient-to-b from-white to-[#F5F7FA] cursor-pointer text-[13px] font-black text-[#00385a] transition-all duration-150 ease-out hover:from-white hover:to-[#E8F0FF] hover:shadow-[0_6px_14px_rgba(0,56,90,0.18)] active:translate-y-px"
                    >
                        註冊後看更多評價
                    </button>
                </div>
            </div>
        </article>
    );
}
