
/**
 * Property Page Renderer
 * Handles rendering of property cards based on the provided data set.
 */

const PropertyRenderer = {
  render: function(dataSetKey = 'default') {
    const data = window.propertyMockData[dataSetKey];
    if (!data) {
      console.error(`Data set '${dataSetKey}' not found.`);
      return;
    }

    this.renderFeaturedMain(data.featured.main);
    this.renderFeaturedSide(data.featured.sideTop, 'featured-side-top-container');
    this.renderFeaturedSide(data.featured.sideBottom, 'featured-side-bottom-container');
    this.renderListings(data.listings);
  },

  renderFeaturedMain: function(item) {
    const container = document.getElementById('featured-main-container');
    if (!container) return;

    const detailsHtml = item.details.map(detail => `<span>${detail}</span>`).join('・');
    const reviewsHtml = item.reviews.map(review => `
      <div class="property-review-item">
        <div class="review-header">
          <span class="review-stars">${review.stars}</span>
          <span class="review-author">${review.author}</span>
        </div>
        <div class="review-tags">
          ${review.tags.map(tag => `<span class="review-tag">${tag}</span>`).join('')}
        </div>
        <p class="review-content">${review.content}</p>
      </div>
    `).join('');

    const html = `
      <article class="property-card">
        <div class="property-media">
          <img src="${item.image}" alt="${item.title}" />
          <span class="property-badge">${item.badge}</span>
        </div>
        <div class="property-content">
          <h3 class="property-title">${item.title}</h3>
          <div class="property-location">${item.location}</div>
          <div class="small-text" style="margin-bottom: 0.5rem; color: var(--text-secondary);">
            ${detailsHtml}
          </div>
          <div class="tiny-text" style="margin-bottom: 0.5rem; color: var(--primary);">
            ${item.highlights}
          </div>
          <div class="property-rating">
            <span class="star">★</span>${item.rating}
          </div>
          <div class="property-reviews">
            <strong>住戶真實評價：</strong>
            ${reviewsHtml}
          </div>
          <div class="property-more-reviews">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span class="lock-icon">🔒</span>
              <span>還有 ${item.lockCount} 則評價</span>
            </div>
            <button class="register-btn">註冊查看</button>
          </div>
          <div class="property-price">
            ${item.price}<span>${item.size}</span>
          </div>
          <div class="property-cta">
            <button class="btn-primary">查看詳情</button>
            <button class="heart-btn" aria-label="加入收藏">♡</button>
          </div>
        </div>
      </article>
    `;

    container.innerHTML = html;
  },

  renderFeaturedSide: function(item, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const detailsHtml = item.details.map(detail => `<span>${detail}</span>`).join('・');
    const reviewsHtml = item.reviews.map(review => `
      <div class="property-review-item">
        <div class="review-header">
          <span class="review-stars">${review.stars}</span>
          <span class="review-author">${review.author}</span>
        </div>
        <p class="review-content">${review.content}</p>
      </div>
    `).join('');

    const html = `
      <article class="property-card" style="height: 100%;">
        <div class="property-media" style="aspect-ratio: 2/1;">
          <img src="${item.image}" alt="${item.title}" loading="lazy" />
          <span class="property-badge">${item.badge}</span>
        </div>
        <div class="property-content">
          <h3 class="property-title" style="font-size: 1rem;">${item.title}</h3>
          <div class="property-location" style="font-size: 0.75rem;">${item.location}</div>
          <div class="tiny-text" style="margin-bottom: 0.5rem;">
            ${detailsHtml}
          </div>
          <div class="property-rating" style="font-size: 0.8125rem;">
            <span class="star">★</span>${item.rating}
          </div>
          <div class="property-reviews">
            ${reviewsHtml}
          </div>
          <div class="property-more-reviews" style="padding: 0.375rem; margin: 0.5rem 0;">
            <div style="display:flex; align-items:center; gap:0.25rem; font-size: 0.75rem;">
              <span class="lock-icon">🔒</span>
              <span>${item.lockCount} 則評價</span>
            </div>
            <button class="register-btn" style="padding: 0.125rem 0.5rem; min-height: 1.5rem;">查看</button>
          </div>
          <div class="property-price" style="font-size: 1rem; margin-bottom: 0.5rem;">
            ${item.price}<span style="font-size: 0.75rem;">${item.size}</span>
          </div>
        </div>
      </article>
    `;

    container.innerHTML = html;
  },

  renderListings: function(items) {
    const container = document.getElementById('listing-grid-container');
    if (!container) return;

    const html = items.map(item => {
      const reviewsHtml = item.reviews.map(review => `
        <div class="review-item-compact">
          <span class="review-badge">${review.badge}</span>
          <p class="review-text">${review.content}</p>
        </div>
      `).join('');

      return `
        <article class="horizontal-card">
          <div class="horizontal-left">
            <div class="horizontal-thumb">
              <img
                src="${item.image}"
                alt="${item.title} 外觀"
              />
            </div>
            <div class="horizontal-main">
              <div class="horizontal-title-row">
                <span>📍</span>
                <strong>${item.title}</strong>
                <span class="horizontal-tag">${item.tag}</span>
              </div>
              <div class="horizontal-price">
                ${item.price}<span>${item.size}</span>
              </div>
              <div class="horizontal-rating">
                <span class="star">★</span>${item.rating}
              </div>
              <div class="horizontal-reviews">
                ${reviewsHtml}
              </div>
              <div class="horizontal-bottom-note">
                ${item.note}
              </div>
            </div>
          </div>
          <div class="horizontal-right">
            <div class="horizontal-price">
              ${item.price}<span>${item.size}</span>
            </div>
            <div class="lock-row">
              <div class="lock-header">
                <span class="lock-icon">🔒</span>
                <div class="lock-text">
                  <span class="lock-label">${item.lockLabel}</span>
                  <span class="lock-count">還有 ${item.lockCount} 則評價</span>
                </div>
              </div>
              <button class="lock-btn">註冊查看更多評價</button>
            </div>
            <div class="horizontal-cta-row">
              <button class="btn-outline">查看</button>
              <button class="heart-btn" aria-label="加入收藏">♡</button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    container.innerHTML = html;
  }
};

// Initialize with default data
document.addEventListener('DOMContentLoaded', () => {
  PropertyRenderer.render('default');
});

// Expose for switching
window.renderPropertyPage = (key) => PropertyRenderer.render(key);
