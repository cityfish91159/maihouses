import React from 'react';
import { useNavigate } from 'react-router-dom';

interface LegacyFeaturedCardProps {
    data: any;
    variant: 'main' | 'side';
}

const LegacyFeaturedCard: React.FC<LegacyFeaturedCardProps> = ({ data, variant }) => {
    const navigate = useNavigate();

    const handleNavigate = () => {
        navigate('/maihouses/property/detail');
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
