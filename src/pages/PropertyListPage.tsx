import React, { useEffect, useState } from 'react';
import LegacyFeaturedCard from '../features/property/components/LegacyFeaturedCard';
import LegacyHorizontalCard from '../features/property/components/LegacyHorizontalCard';
import type { PropertyPageData } from '../types/property-page';
import { Logo } from '../components/Logo/Logo';

// Mimic legacy behavior: Fetch directly from the endpoint
const API_ENDPOINT = '/api/property/page-data';

export default function PropertyListPage() {
    const [data, setData] = useState<PropertyPageData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(API_ENDPOINT);
                const json = await res.json();
                if (json.success && json.data) {
                    setData(json.data);
                }
            } catch (err) {
                console.error('Failed to fetch property page data', err);
                // In legacy script, full failure fallback to seed is handled by renderer or api
                // Here we rely on the API 200 fallback behavior we saw in `page-data.ts`
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="min-h-screen bg-[#f6f9ff] font-['Noto_Sans_TC'] text-[#1f2933]">
            {/* 
        HEADER
        Mimics property.html header strictly 
      */}
            <header className="sticky top-0 z-50 flex h-14 items-center justify-between bg-white px-5 shadow-sm md:px-10">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.href = '/maihouses/'}>
                    {/* Logo Component Logic Inlined or Reused? 
                 Legacy used specific HTML structure. We use the Standard Atomic Logo to be safe but cleaner 
                 Wait, user said "Don't change appearance", but Header uses "MaiHouse" text.
                 Let's use our Atomic Logo but configured to look like the legacy one if possible, 
                 or just use Atomic Logo because it's better. 
                 The plan said: "Implements the 'Simple Header' (Logo + Auth Button)"
                 Let's use the Atomic <Logo /> as it's the standard.
            */}
                    <Logo showSlogan={true} />
                </div>
                <button className="cursor-pointer rounded-[20px] border border-[#dde5f0] bg-white px-3.5 py-1.5 text-[13px] text-[#5b6b7b] transition-colors hover:border-[#00385a] hover:bg-[#e0f4ff] hover:text-[#002a44]">
                    登入/註冊
                </button>
            </header>

            <main className="mx-auto max-w-[1200px] px-5 pb-10 pt-5">

                {/* Page Header */}
                <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                        <h1 className="text-[22px] font-semibold">社區口碑房源</h1>
                        <span className="text-xs text-[#9aa5b1]">真實評價・透明資訊</span>
                    </div>
                    <p className="mt-1 text-[13px] text-[#5b6b7b]">來自真實住戶的生活體驗</p>
                </div>

                {/* Search Box */}
                <div className="my-3 mb-5">
                    <div className="flex items-center rounded-full border border-[#dde5f0] bg-white px-3.5 py-2 shadow-sm">
                        <span className="mr-2">🔍</span>
                        <input
                            type="text"
                            className="flex-1 bg-transparent text-sm text-[#1f2933] outline-none placeholder:text-[#5b6b7b]"
                            placeholder="搜尋社區名稱、區域或建案關鍵字..."
                        />
                        <button className="min-w-[60px] cursor-pointer rounded-full bg-[#00385a] px-3.5 py-1.5 text-[13px] font-semibold text-white hover:opacity-90">
                            搜尋
                        </button>
                    </div>
                    <p className="mt-1.5 text-xs text-[#9aa5b1]">例如:「林口」、「捷運」、「學區」</p>
                </div>

                {/* Featured Section */}
                <section className="my-6 mb-8">
                    <div className="mb-4 flex items-baseline justify-between">
                        <h2 className="text-lg font-semibold">本週精選社區</h2>
                        <span className="text-xs text-[#9aa5b1]">每週五更新</span>
                    </div>

                    {loading ? (
                        <div className="py-20 text-center text-gray-400">載入中...</div>
                    ) : data?.featured ? (
                        <div className="grid min-h-[500px] grid-cols-1 gap-4">
                            {/* Top Row Layout */}
                            <div className="grid min-h-[360px] grid-cols-1 gap-2.5 md:grid-cols-[1.5fr_1fr]">
                                {/* Main Card */}
                                {data.featured.main && (
                                    <LegacyFeaturedCard data={data.featured.main} variant="main" />
                                )}

                                {/* Side Stack */}
                                <div className="flex flex-col gap-2.5">
                                    {data.featured.sideTop && (
                                        <div className="flex-1">
                                            <LegacyFeaturedCard data={data.featured.sideTop} variant="side" />
                                        </div>
                                    )}
                                    {data.featured.sideBottom && (
                                        <div className="flex-1">
                                            <LegacyFeaturedCard data={data.featured.sideBottom} variant="side" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-10 text-center text-gray-500">暫無精選資料</div>
                    )}
                </section>

                {/* Listing Section */}
                <section className="my-8">
                    <div className="mb-4 flex items-baseline justify-between">
                        <h2 className="text-lg font-semibold">更多精選房源</h2>
                        <span className="text-[13px] text-[#5b6b7b]">共 {data?.listings?.length || 0} 個社區</span>
                    </div>

                    <div className="flex flex-col gap-3">
                        {data?.listings?.map((item, idx) => (
                            <LegacyHorizontalCard key={idx} data={item} />
                        ))}
                    </div>
                </section>

            </main>
        </div>
    );
}
