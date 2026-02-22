/**
 * ListingSection Component
 *
 * PropertyListPage 的房源列表區塊
 */

import LegacyHorizontalCard from '../../../features/property/components/LegacyHorizontalCard';
import type { ListingPropertyCard } from '../../../types/property-page';

interface ListingSectionProps {
  listings: ListingPropertyCard[];
  urlQuery: string;
  totalCount: number;
}

export function ListingSection({ listings, urlQuery, totalCount }: ListingSectionProps) {
  return (
    <section className="listing-section">
      <div className="listing-header">
        <h2>{urlQuery ? '搜尋結果' : '更多精選房源'}</h2>
        <span className="small-text">
          {urlQuery ? `找到 ${listings.length} 個符合的社區` : `共 ${totalCount} 個社區`}
        </span>
      </div>

      <div className="listing-grid">
        {listings.length > 0 ? (
          listings.map((item, index) => <LegacyHorizontalCard key={item.id || index} data={item} />)
        ) : (
          <div className="empty-state col-[1/-1] p-12 text-center">
            <p className="mb-2 text-lg font-semibold text-[var(--mh-color-5b6b7b)]">
              找不到符合「{urlQuery}」的房源
            </p>
            <p className="text-sm text-[var(--mh-color-8b9cad)]">
              試試其他關鍵字，例如：林口、捷運、學區
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
