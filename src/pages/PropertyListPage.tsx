import React, { useEffect, useState } from 'react';
import LegacyFeaturedCard from '../features/property/components/LegacyFeaturedCard';
import LegacyHorizontalCard from '../features/property/components/LegacyHorizontalCard';
import { SEED_DATA } from '../features/property/data/seed';
import '../styles/LegacyPropertyPage.css'; // Import strict legacy styles

// Mimic legacy behavior: Fetch directly from the endpoint
const API_ENDPOINT = '/api/property/page-data';

// Legacy Header Component (Inline for strict structure matching)
const LegacyHeader = () => (
    <header className="legacy-header">
        <a href="/maihouses/" className="logo-container" style={{ textDecoration: 'none' }}>
            <div className="logo-icon-box">
                <svg
                    className="logo-icon-svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <div className="logo-badge" />
            </div>
            <div className="logo-text-group">
                <div className="logo-text-main">邁房子</div>
                <div className="logo-separator">
                    <div className="logo-slogan">家，不只是地址</div>
                </div>
            </div>
        </a>
        <a href="/maihouses/auth.html" className="auth-btn" style={{ textDecoration: 'none' }}>登入/註冊</a>
    </header>
);

export default function PropertyListPage() {
    // S2: Instant Render with Mock Data (Legacy Behavior)
    const [data, setData] = useState<typeof SEED_DATA>(SEED_DATA);

    useEffect(() => {
        const fetchLive = async () => {
            try {
                const res = await fetch(API_ENDPOINT);
                const json = await res.json();
                if (json.success && json.data) {
                    setData(json.data);
                }
            } catch (err) {
                console.warn('Background update failed, using seed data');
            }
        };
        fetchLive();
    }, []);

    return (
        <div className="legacy-property-page">
            <LegacyHeader />

            <div className="page">
                {/* Page Header */}
                <div className="page-header">
                    <div className="page-title-row">
                        <h1 className="page-title">社區口碑房源</h1>
                        <span className="page-sub">真實評價・透明資訊</span>
                    </div>
                    <p className="page-desc">來自真實住戶的生活體驗</p>
                </div>

                {/* Search Box */}
                <div className="search-container">
                    <div className="search-box">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-2 text-[#5b6b7b]"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="搜尋社區名稱、區域或建案關鍵字..."
                            defaultValue=""
                        />
                        <button className="search-btn">搜尋</button>
                    </div>
                    <div className="search-hint">例如：「林口」、「捷運」、「學區」</div>
                </div>

                {/* Featured Section */}
                <section className="featured-section">
                    <div className="featured-header">
                        <h2>本週精選社區</h2>
                        <span className="tiny-text">每週五更新</span>
                    </div>

                    <div className="featured-grid">
                        <div className="featured-top-row">
                            {/* Main Card */}
                            {data?.featured?.main && (
                                <div className="featured-main">
                                    <LegacyFeaturedCard data={data.featured.main} variant="main" />
                                </div>
                            )}

                            {/* Side Stack */}
                            <div className="featured-side-container">
                                {data?.featured?.sideTop && (
                                    <div className="featured-side-top">
                                        <LegacyFeaturedCard data={data.featured.sideTop} variant="side" />
                                    </div>
                                )}
                                {data?.featured?.sideBottom && (
                                    <div className="featured-side-bottom">
                                        <LegacyFeaturedCard data={data.featured.sideBottom} variant="side" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Listing Section */}
                <section className="listing-section">
                    <div className="listing-header">
                        <h2>更多精選房源</h2>
                        <span className="small-text">共 {data?.listings?.length || 0} 個社區</span>
                    </div>

                    <div className="listing-grid">
                        {data?.listings?.map((item, index) => (
                            <LegacyHorizontalCard key={index} data={item} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
