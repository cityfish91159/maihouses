import React, { useEffect, useState } from 'react';
import { getProperties } from '../../../services/api';
import { trackEvent } from '../../../services/analytics';
import type { PropertyCard } from '../../../types';
import { HomeCard } from '../components/HomeCard';
import { RecommendationCard } from '../components/RecommendationCard';

export default function PropertyGrid({ q }: { q?: string }) {
  const [items, setItems] = useState<PropertyCard[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 8;
  const maxPage = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    setPage(1);
  }, [q]);

  useEffect(() => {
    getProperties(page, pageSize, q).then((res) => {
      if (res.ok && res.data) {
        setItems(res.data.items);
        setTotal(res.data.total);
      } else {
        setItems([]);
        setTotal(0);
      }
    });
  }, [page, q]);

  const memberCTA = (id: string) => {
    trackEvent('card_member_cta', '/', id);
    location.hash = '#/auth/register';
  };

  return (
    <HomeCard>
      <h3 className="mb-2 font-black text-text-primary text-[clamp(19px,2.4vw,22px)] mt-0">
        精選房源
      </h3>

      {items.length === 0 ? (
        <div className="py-16 text-center text-text-secondary text-base">
          {q ? (
            <>
              找不到含「<span className="font-semibold text-brand">{q}</span>」的物件
            </>
          ) : (
            '暫無物件，稍後再試'
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <RecommendationCard key={item.id} property={item} />
          ))}
        </div>
      )}
      
      {/* Pagination Controls */}
      {maxPage > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded border border-border-light disabled:opacity-50 hover:bg-bg-soft transition-colors"
          >
            上一頁
          </button>
          <span className="px-3 py-1 text-text-secondary">
            {page} / {maxPage}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
            disabled={page === maxPage}
            className="px-3 py-1 rounded border border-border-light disabled:opacity-50 hover:bg-bg-soft transition-colors"
          >
            下一頁
          </button>
        </div>
      )}
    </HomeCard>
  );
}
