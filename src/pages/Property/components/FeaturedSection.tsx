/**
 * FeaturedSection Component
 *
 * PropertyListPage 的本週精選區塊
 */

import LegacyFeaturedCard from '../../../features/property/components/LegacyFeaturedCard';
import type { PropertyPageData } from '../../../types/property-page';

interface FeaturedSectionProps {
  data: PropertyPageData | null;
}

export function FeaturedSection({ data }: FeaturedSectionProps) {
  if (!data?.featured) return null;

  return (
    <section className="featured-section">
      <div className="featured-header">
        <h2>本週精選社區</h2>
        <span className="tiny-text">每週五更新</span>
      </div>

      <div className="featured-grid">
        <div className="featured-top-row">
          {data.featured.main && (
            <div className="featured-main">
              <LegacyFeaturedCard data={data.featured.main} variant="main" />
            </div>
          )}

          <div className="featured-side-container">
            {data.featured.sideTop && (
              <div className="featured-side-top">
                <LegacyFeaturedCard data={data.featured.sideTop} variant="side" />
              </div>
            )}
            {data.featured.sideBottom && (
              <div className="featured-side-bottom">
                <LegacyFeaturedCard data={data.featured.sideBottom} variant="side" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
