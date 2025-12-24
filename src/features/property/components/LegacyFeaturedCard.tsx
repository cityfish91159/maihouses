import React from 'react';
import { useNavigate } from 'react-router-dom';

interface LegacyFeaturedCardProps {
    data: any;
    variant: 'main' | 'side';
}

const LegacyFeaturedCard: React.FC<LegacyFeaturedCardProps> = ({ data, variant }) => {
    const navigate = useNavigate();

    const handleNavigate = () => {
        // Priority: id (Mock) -> public_id (DB) -> fallback
        const targetId = data.id || data.public_id || 'detail';
        window.location.href = `/maihouses/property/${targetId}`;
    };

    return (
        <div className="property-card">
            <div className="property-media" onClick={handleNavigate} style={{ cursor: 'pointer' }}>
                <img src={data.image} alt={data.title} />
                <div className="property-badge">{data.badge}</div>
            </div>

            <div className="property-content">
                <h3 className="property-title" onClick={handleNavigate} style={{ cursor: 'pointer' }}>{data.title}</h3>
                <div className="property-location">{data.location}</div>

                <div className="property-tags-row" style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.625rem' }}>
                    {(data.tags || []).slice(0, 3).map((tag: string, i: number) => (
                        <span key={i} className={`capsule-chip ${variant !== 'main' ? 'capsule-chip-sm' : ''}`} style={{
                            fontSize: '0.75rem',
                            padding: '0.125rem 0.5rem',
                            borderRadius: '999px',
                            background: 'var(--primary-light)',
                            color: 'var(--primary-dark)',
                            fontWeight: 500
                        }}>
                            {tag}
                        </span>
                    ))}
                </div>

                {variant === 'main' && data.highlights && (
                    <div className="tiny-text tiny-text-highlight" style={{
                        fontSize: '0.75rem',
                        color: '#E63946',
                        fontWeight: 600,
                        marginBottom: '0.5rem'
                    }}>
                        {data.highlights}
                    </div>
                )}

                <div className="property-rating">
                    <span className="star">★</span>
                    {data.rating}
                </div>

                {variant === 'main' ? (
                    // Main Card Layout
                    <>
                        <div className="property-reviews">
                            {data.reviews.map((review: any, i: number) => (
                                <div key={i} className="property-review-item">
                                    <div className="review-header">
                                        <span className="review-stars">{review.stars}</span>
                                        <span className="review-author">{review.author}</span>
                                    </div>
                                    <div className="review-tags">
                                        {review.tags && review.tags.map((tag: string, ti: number) => (
                                            <span key={ti} className="review-tag">{tag}</span>
                                        ))}
                                    </div>
                                    <div className="review-content">
                                        {review.content}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="property-more-reviews" onClick={handleNavigate} style={{ cursor: 'pointer' }}>
                            <span className="lock-icon">🔒</span>
                            <span>查看其他 {data.lockCount} 則住戶真實評價</span>
                            <button className="register-btn">免費註冊</button>
                        </div>

                        <div className="property-price">
                            {data.price}
                            <span>{data.size}</span>
                        </div>

                        <div className="property-cta">
                            <button className="btn-primary" onClick={handleNavigate}>預約看屋</button>
                            <button className="heart-btn">♥</button>
                        </div>
                    </>
                ) : (
                    // Side Card Layout
                    <>
                        <div className="property-reviews">
                            {data.reviews.map((review: any, i: number) => (
                                <div key={i} className="property-review-item">
                                    <div className="review-header">
                                        <span className="review-stars">{review.stars}</span>
                                        <span className="review-author">{review.author}</span>
                                    </div>
                                    <div className="review-content">
                                        {review.content}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="property-more-reviews" onClick={handleNavigate} style={{ cursor: 'pointer' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span className="lock-icon">🔒</span>
                                <span>{data.lockCount} 則評價</span>
                            </div>
                            <button className="register-btn">看詳情</button>
                        </div>

                        <div className="property-price">
                            {data.price}
                            <span>{data.size}</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default LegacyFeaturedCard;
