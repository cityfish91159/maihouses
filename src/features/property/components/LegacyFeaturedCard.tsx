import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { FeaturedPropertyCard, FeaturedReview } from '../../../types/property-page';

interface LegacyFeaturedCardProps {
  data: FeaturedPropertyCard;
  variant: 'main' | 'side';
}

const LegacyFeaturedCard: React.FC<LegacyFeaturedCardProps> = ({ data, variant }) => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    // 使用 id 進行導航，若無則使用 demo 預設
    const targetId = data.id || 'MH-100001';
    navigate(`/property/${targetId}`);
  };

  return (
    <div className="property-card">
      <div
        className="property-media legacy-clickable"
        onClick={handleNavigate}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleNavigate();
        }}
        role="button"
        tabIndex={0}
      >
        <img src={data.image} alt={data.title} />
        <div className="property-badge">{data.badge}</div>
      </div>

      <div className="property-content">
        <h3 className="property-title">
          <button
            type="button"
            onClick={handleNavigate}
            className="property-title-btn"
          >
            {data.title}
          </button>
        </h3>
        <div className="property-location">{data.location}</div>

        <div className="property-tags-row">
          {(data.tags || []).slice(0, 3).map((tag: string, i: number) => (
            <span
              key={i}
              className={`capsule-chip ${variant !== 'main' ? 'capsule-chip-sm' : ''}`}
            >
              {tag}
            </span>
          ))}
        </div>

        {variant === 'main' && data.highlights && (
          <div className="tiny-text tiny-text-highlight">
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
              {data.reviews.map((review: FeaturedReview, i: number) => (
                <div key={i} className="property-review-item">
                  <div className="review-header">
                    <span className="review-stars">{review.stars}</span>
                    <span className="review-author">{review.author}</span>
                  </div>
                  <div className="review-tags">
                    {review.tags &&
                      review.tags.map((tag: string, ti: number) => (
                        <span key={ti} className="review-tag">
                          {tag}
                        </span>
                      ))}
                  </div>
                  <div className="review-content">{review.content}</div>
                </div>
              ))}
            </div>

            <div
              className="property-more-reviews legacy-clickable"
              onClick={handleNavigate}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleNavigate();
              }}
              role="button"
              tabIndex={0}
            >
              <span className="lock-icon">🔒</span>
              <span>查看其他 {data.lockCount} 則住戶真實評價</span>
              <button className="register-btn">免費註冊</button>
            </div>

            <div className="property-price">
              {data.price}
              <span>{data.size}</span>
            </div>

            <div className="property-cta">
              <button className="btn-primary" onClick={handleNavigate}>
                預約看屋
              </button>
              <button className="heart-btn">♥</button>
            </div>
          </>
        ) : (
          // Side Card Layout
          <>
            <div className="property-reviews">
              {data.reviews.map((review: FeaturedReview, i: number) => (
                <div key={i} className="property-review-item">
                  <div className="review-header">
                    <span className="review-stars">{review.stars}</span>
                    <span className="review-author">{review.author}</span>
                  </div>
                  <div className="review-content">{review.content}</div>
                </div>
              ))}
            </div>

            <div
              className="property-more-reviews legacy-clickable"
              onClick={handleNavigate}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleNavigate();
              }}
              role="button"
              tabIndex={0}
            >
              <div className="property-review-lock-meta">
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
