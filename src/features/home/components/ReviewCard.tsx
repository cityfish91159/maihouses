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
    <article className="flex gap-2 border border-border-light rounded-[var(--r-sm)] p-3 bg-white relative hover:shadow-md transition-shadow duration-200">
      <div className="w-[34px] h-[34px] rounded-full bg-brand/10 border-2 border-brand flex items-center justify-center font-extrabold text-brand text-[17px] shrink-0">
        {id}
      </div>
      <div>
        <div className="font-extrabold text-sm text-text-ink flex items-center gap-1">
          {name} 
          <span className="text-yellow-400 text-xs" aria-label={`${rating} stars`}>
            {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
          </span>
        </div>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {tags.map(tag => (
            <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-success/10 border border-success/40 text-success font-bold">
              {tag}
            </span>
          ))}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-brand font-medium">
          {content}
        </p>
      </div>
    </article>
  );
});

ReviewCard.displayName = 'ReviewCard';
