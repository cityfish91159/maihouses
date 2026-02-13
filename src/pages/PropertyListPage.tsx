/**
 * PropertyListPage
 *
 * 社區口碑房源列表頁面
 * 重構說明：
 * - LegacyHeader: 抽取至 Property/components/LegacyHeader.tsx
 * - SearchBox: 抽取至 Property/components/SearchBox.tsx
 * - FeaturedSection: 抽取至 Property/components/FeaturedSection.tsx
 * - ListingSection: 抽取至 Property/components/ListingSection.tsx
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { SEED_DATA } from '../features/property/data/seed';
import { logger } from '../lib/logger';
import { PropertyPageDataSchema } from '../types/property-page';
import type { PropertyPageData, ListingPropertyCard } from '../types/property-page';
import { LegacyHeader, SearchBox, FeaturedSection, ListingSection } from './Property/components';
import '../styles/LegacyPropertyPage.css';

const API_ENDPOINT = '/api/property/page-data';

const PropertyPageApiResponseSchema = z.object({
  success: z.boolean(),
  data: PropertyPageDataSchema.optional(),
});

function filterByQuery(items: ListingPropertyCard[], query: string): ListingPropertyCard[] {
  if (!query.trim()) return items;

  const lowerQuery = query.toLowerCase().trim();
  return items.filter((item) => {
    const searchableText = [
      item.title,
      item.note,
      item.lockLabel,
      ...item.tags,
      ...item.reviews.map((r) => r.content),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchableText.includes(lowerQuery);
  });
}

async function preloadImages(data: PropertyPageData): Promise<void> {
  const imageUrls: string[] = [];

  if (data.featured?.main?.image) imageUrls.push(data.featured.main.image);
  if (data.featured?.sideTop?.image) imageUrls.push(data.featured.sideTop.image);
  if (data.featured?.sideBottom?.image) imageUrls.push(data.featured.sideBottom.image);

  data.listings?.slice(0, 3).forEach((item) => {
    if (item.image) imageUrls.push(item.image);
  });

  const preloadPromises = imageUrls.map(
    (url) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = url;
      })
  );

  await Promise.race([
    Promise.all(preloadPromises),
    new Promise<void>((resolve) => setTimeout(resolve, 2000)),
  ]);
}

export default function PropertyListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';

  const [data, setData] = useState<PropertyPageData>(SEED_DATA);
  const [searchInput, setSearchInput] = useState(urlQuery);

  useEffect(() => {
    setSearchInput(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await fetch(API_ENDPOINT);
        const json: unknown = await res.json();

        const parseResult = PropertyPageApiResponseSchema.safeParse(json);
        if (!parseResult.success) {
          logger.warn('[PropertyListPage] API 回應格式驗證失敗', {
            error: parseResult.error,
          });
          return;
        }

        const { data: apiResponse } = parseResult;
        if (apiResponse.success && apiResponse.data) {
          await preloadImages(apiResponse.data);
          setData(apiResponse.data);
        }
      } catch (err) {
        logger.warn('[PropertyListPage] 背景更新失敗，使用 seed data', { error: err });
      }
    };
    void fetchLive();
  }, []);

  const handleSearch = useCallback(() => {
    const trimmed = searchInput.trim();
    if (trimmed) {
      setSearchParams({ q: trimmed });
    } else {
      setSearchParams({});
    }
  }, [searchInput, setSearchParams]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    },
    [handleSearch]
  );

  const handleClear = useCallback(() => {
    setSearchInput('');
    setSearchParams({});
  }, [setSearchParams]);

  const filteredListings = useMemo(() => {
    return filterByQuery(data.listings || [], urlQuery);
  }, [data.listings, urlQuery]);

  return (
    <div className="legacy-property-page">
      <LegacyHeader />

      <div className="page">
        <div className="page-header">
          <div className="page-title-row">
            <h1 className="page-title">社區口碑房源</h1>
            <span className="page-sub">真實評價・透明資訊</span>
          </div>
          <p className="page-desc">來自真實住戶的生活體驗</p>
        </div>

        <SearchBox
          searchInput={searchInput}
          urlQuery={urlQuery}
          onSearchInputChange={setSearchInput}
          onSearch={handleSearch}
          onClear={handleClear}
          onKeyDown={handleKeyDown}
        />

        <FeaturedSection data={data} />

        <ListingSection
          listings={filteredListings}
          urlQuery={urlQuery}
          totalCount={data.listings?.length || 0}
        />
      </div>
    </div>
  );
}
