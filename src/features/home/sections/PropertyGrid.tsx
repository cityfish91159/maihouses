import { useState, useEffect } from 'react';
import { PROPERTIES } from '../../../constants/data';
import PropertyCard from '../components/PropertyCard';
import { getFeaturedProperties } from '../../../services/propertyService';
import type { FeaturedProperty } from '../../../types/property';

export default function PropertyGrid() {
  // 🚀 關鍵 1: 初始狀態直接給 Seed (零秒載入，無閃爍)
  // PROPERTIES 已有 source: 'seed'，型別安全
  const [properties, setProperties] = useState<FeaturedProperty[]>(PROPERTIES);

  useEffect(() => {
    // React 18 最佳實踐: 使用 AbortController 取代 isMounted flag
    const controller = new AbortController();

    // 🚀 關鍵 2: 背景靜默更新
    getFeaturedProperties().then(data => {
      if (!controller.signal.aborted && data && data.length > 0) {
        setProperties(data);
      }
      // 如果 API 失敗或回傳空陣列，維持顯示初始 Seed (Level 3)
    });

    return () => { controller.abort(); };
  }, []);

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="my-[18px] mb-3 flex items-center gap-2.5" aria-label="智能房源推薦">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-gradient-to-b from-white to-brand-50 px-3 py-1.5 text-sm font-black tracking-[0.2px] text-brand-700">
          <span className="grid size-[18px] place-items-center rounded-md bg-gradient-to-b from-brand-700 to-brand-600 text-xs font-black text-white shadow-brand-sm">
            ★
          </span>
          <span className="text-base leading-none md:text-lg md:font-bold">〔智能房源推薦〕</span>
          <span className="ml-1.5 text-sm font-bold text-ink-600">依瀏覽行為與社區口碑輔助排序</span>
        </div>
        <div
          className="animate-mhRecoBar ml-2.5 h-1.5 flex-1 rounded-full bg-gradient-to-r from-brand-700 via-brand-600 to-brand-300 bg-[length:200%_100%] opacity-25"
          aria-hidden="true"
        />
      </div>

      {/* Grid Section */}
      <div
        className="grid grid-cols-1 gap-[18px] md:grid-cols-2 lg:grid-cols-3"
        aria-label="房源清單"
        title="房源清單"
      >
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  );
}
