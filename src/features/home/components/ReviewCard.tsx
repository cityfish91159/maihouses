import React from 'react';

interface ReviewProps {
  id: string;
  name: string;
  rating: number;
  tags: string[];
  content: string;
}

export const ReviewCard = React.memo(({ id, name, rating, tags, content }: ReviewProps) => {
  return (
    <article className="flex gap-3 border border-[#E6EDF7] rounded-2xl p-3.5 bg-white relative hover:shadow-[0_4px_12px_rgba(0,56,90,0.08)] transition-all duration-200 hover:-translate-y-0.5">
      <div className="w-[38px] h-[38px] rounded-full bg-gradient-to-b from-[#F2F5F8] to-[#E1E6EB] border border-[#E6EDF7] flex items-center justify-center font-black text-[#00385a] text-[15px] shrink-0 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_2px_4px_rgba(0,56,90,0.05)]">
        {id}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <div className="font-black text-[15px] text-[#0A2246] flex items-center gap-1.5">
            {name}
          </div>
          <div className="flex gap-0.5" aria-label={`${rating} stars`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`text-xs ${i < rating ? 'text-[#00385a]' : 'text-[#E6EDF7]'}`}>★</span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map(tag => (
            <span key={tag} className="text-[11px] px-2 py-0.5 rounded-md bg-[#F6F9FF] border border-[#E6EDF7] text-[#00385a] font-bold tracking-wide">
              {tag}
            </span>
          ))}
        </div>

        <p className="text-[13px] leading-relaxed text-[#4B5563] font-medium text-justify">
          {content}
        </p>
      </div>
    </article>
  );
});

ReviewCard.displayName = 'ReviewCard';
