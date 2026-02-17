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
    <article className="relative flex gap-3 rounded-2xl border border-brand-100 bg-white p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-brand-md">
      <div className="flex size-[38px] shrink-0 items-center justify-center rounded-full border border-brand-100 bg-gradient-to-b from-neutral-150 to-neutral-200 text-[15px] font-black text-brand-700 shadow-brand-xs">
        {id}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[15px] font-black text-primary">
            {name}
          </div>
          <div className="flex gap-0.5" aria-label={`${rating} stars`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={`text-xs ${i < rating ? 'text-brand-700' : 'text-brand-100'}`}
              >
                ★
              </span>
            ))}
          </div>
        </div>

        <div className="mb-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-brand-100 bg-brand-50 px-2 py-0.5 text-[11px] font-bold tracking-wide text-brand-700"
            >
              {tag}
            </span>
          ))}
        </div>

        <p className="text-justify text-[13px] font-medium leading-relaxed text-[var(--mh-color-4b5563)]">
          {content}
        </p>
      </div>
    </article>
  );
});

ReviewCard.displayName = 'ReviewCard';
