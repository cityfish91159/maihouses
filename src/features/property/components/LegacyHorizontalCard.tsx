import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { ListingPropertyCard, ListingReview } from '../../../types/property-page';

interface LegacyHorizontalCardProps {
  data: ListingPropertyCard;
}

const LegacyHorizontalCard: React.FC<LegacyHorizontalCardProps> = ({ data }) => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    // 使用 id 進行導航，若無則使用 demo 預設
    const targetId = data.id || 'MH-100001';
    navigate(`/property/${targetId}`);
  };

  const firstTag = data.tags && data.tags.length > 0 ? data.tags[0] : null;

  return (
    <div className="horizontal-card">
      <div className="horizontal-left">
        <div
          className="horizontal-thumb legacy-clickable"
          onClick={handleNavigate}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleNavigate();
          }}
          role="button"
          tabIndex={0}
        >
          <img src={data.image} alt={data.title} loading="lazy" />
        </div>
        <div className="horizontal-main">
          <div>
            <div className="horizontal-title-row">
              <button type="button" onClick={handleNavigate} className="horizontal-title-btn">
                {data.title}
              </button>
              {firstTag && <span className="horizontal-tag">{firstTag}</span>}
            </div>
            <div className="horizontal-rating">
              <span className="star">★</span>
              {data.rating}
            </div>
          </div>

          <div className="horizontal-reviews">
            {data.reviews.map((review: ListingReview, i: number) => (
              <div key={i} className="review-item-compact">
                <span className="review-badge">{review.badge}</span>
                <p className="review-text">{review.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="horizontal-right">
        <div className="property-price">
          {data.price}
          <span>{data.size}</span>
        </div>

        <div className="lock-row">
          <div className="lock-header">
            <span className="lock-icon">🔒</span>
            <div className="lock-text">
              <div className="lock-label">{data.lockLabel}</div>
              {data.lockCount && <div className="lock-count">({data.lockCount})</div>}
            </div>
          </div>
        </div>

        <div className="property-cta">
          <button className="btn-primary horizontal-cta-btn" onClick={handleNavigate}>
            查看詳情
          </button>
          <button className="heart-btn horizontal-heart-btn">♥</button>
        </div>
      </div>
    </div>
  );
};

export default LegacyHorizontalCard;
