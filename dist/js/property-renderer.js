
/**
 * Property Page Renderer
 * Handles rendering of property cards based on the provided data set.
 * Optimized for performance with DocumentFragment and template literals.
 * 
 * v2.0 - 支援新的資料架構 (PropertyAPI + DataAdapter)
 */

const PropertyRenderer = {
  // 快取 DOM 元素
  containers: null,
  
  init() {
    this.containers = {
      main: document.getElementById('featured-main-container'),
      sideTop: document.getElementById('featured-side-top-container'),
      sideBottom: document.getElementById('featured-side-bottom-container'),
      listings: document.getElementById('listing-grid-container')
    };
  },

  /**
   * v2 渲染方法 - 使用 PropertyAPI
   */
  async renderAsync() {
    if (!this.containers) this.init();
    
    try {
      // 並行取得精選和列表資料
      const [featured, listings] = await Promise.all([
        window.PropertyAPI.getFeatured(),
        window.PropertyAPI.getListings()
      ]);
      
      // 使用 requestAnimationFrame 確保渲染效能
      requestAnimationFrame(() => {
        if (featured.main) this.renderFeaturedMain(featured.main);
        if (featured.sideTop) this.renderFeaturedSide(featured.sideTop, 'sideTop');
        if (featured.sideBottom) this.renderFeaturedSide(featured.sideBottom, 'sideBottom');
        if (listings.items) this.renderListings(listings.items);
        
        // 更新列表計數
        this.updateListingCount(listings.total);
      });
    } catch (error) {
      console.error('[PropertyRenderer] renderAsync error:', error);
      // Fallback 到舊版渲染
      this.render('default');
    }
  },

  /**
   * 更新列表計數顯示
   */
  updateListingCount(total) {
    const countEl = document.querySelector('.listing-header .small-text');
    if (countEl && total) {
      countEl.textContent = `共 ${total} 個社區`;
    }
  },

  /**
   * v1 渲染方法 - 保留向下相容 (使用舊版 propertyMockData)
   * @deprecated 請使用 renderAsync()
   */
  render(dataSetKey = 'default') {
    const data = window.propertyMockData?.[dataSetKey];
    if (!data) {
      console.error(`Data set '${dataSetKey}' not found.`);
      return;
    }
    
    if (!this.containers) this.init();

    // 使用 requestAnimationFrame 確保渲染效能
    requestAnimationFrame(() => {
      this.renderFeaturedMain(data.featured.main);
      this.renderFeaturedSide(data.featured.sideTop, 'sideTop');
      this.renderFeaturedSide(data.featured.sideBottom, 'sideBottom');
      this.renderListings(data.listings);
    });
  },

  // 建立評論 HTML（共用函式）
  createReviewHtml(review, compact = false) {
    if (compact) {
      return `<div class="review-item-compact">
        <span class="review-badge">${review.badge}</span>
        <p class="review-text">${review.content}</p>
      </div>`;
    }
    
    const tagsHtml = review.tags?.map(tag => `<span class="review-tag">${tag}</span>`).join('') || '';
    return `<div class="property-review-item">
      <div class="review-header">
        <span class="review-stars">${review.stars}</span>
        <span class="review-author">${review.author}</span>
      </div>
      ${tagsHtml ? `<div class="review-tags">${tagsHtml}</div>` : ''}
      <p class="review-content">${review.content}</p>
    </div>`;
  },

  renderFeaturedMain(item) {
    const container = this.containers?.main;
    if (!container) return;

    const detailsHtml = item.details.map(d => `<div style="margin-bottom:0.25rem">${d}</div>`).join('');
    const reviewsHtml = item.reviews.map(r => this.createReviewHtml(r)).join('');

    container.innerHTML = `
      <article class="property-card">
        <div class="property-media">
          <img src="${item.image}" alt="${item.title}" loading="lazy" decoding="async" />
          <span class="property-badge">${item.badge}</span>
        </div>
        <div class="property-content">
          <h3 class="property-title">${item.title}</h3>
          <div class="property-location">${item.location}</div>
          <div class="small-text" style="margin-bottom:0.5rem;color:var(--text-secondary)">${detailsHtml}</div>
          <div class="tiny-text" style="margin-bottom:0.5rem;color:var(--primary)">${item.highlights}</div>
          <div class="property-rating"><span class="star">★</span>${item.rating}</div>
          <div class="property-reviews"><strong>住戶真實評價：</strong>${reviewsHtml}</div>
          <div class="property-more-reviews">
            <div style="display:flex;align-items:center;gap:0.5rem">
              <span class="lock-icon">🔒</span><span>還有 ${item.lockCount} 則評價</span>
            </div>
            <button class="register-btn" type="button">註冊查看</button>
          </div>
          <div class="property-price">${item.price}<span>${item.size}</span></div>
          <div class="property-cta">
            <button class="btn-primary" type="button">查看詳情</button>
            <button class="heart-btn" type="button" aria-label="加入收藏">♡</button>
          </div>
        </div>
      </article>`;
  },

  renderFeaturedSide(item, key) {
    const container = this.containers?.[key];
    if (!container) return;

    const detailsHtml = item.details.join('・');
    const reviewsHtml = item.reviews.map(r => this.createReviewHtml(r)).join('');

    container.innerHTML = `
      <article class="property-card" style="height:100%">
        <div class="property-media" style="aspect-ratio:2/1">
          <img src="${item.image}" alt="${item.title}" loading="lazy" decoding="async" />
          <span class="property-badge">${item.badge}</span>
        </div>
        <div class="property-content">
          <h3 class="property-title" style="font-size:1rem">${item.title}</h3>
          <div class="property-location" style="font-size:0.75rem">${item.location}</div>
          <div class="tiny-text" style="margin-bottom:0.5rem">${detailsHtml}</div>
          <div class="property-rating" style="font-size:0.8125rem"><span class="star">★</span>${item.rating}</div>
          <div class="property-reviews">${reviewsHtml}</div>
          <div class="property-more-reviews" style="padding:0.375rem;margin:0.5rem 0">
            <div style="display:flex;align-items:center;gap:0.25rem;font-size:0.75rem">
              <span class="lock-icon">🔒</span><span>${item.lockCount} 則評價</span>
            </div>
            <button class="register-btn" type="button" style="padding:0.125rem 0.5rem;min-height:1.5rem">查看</button>
          </div>
          <div class="property-price" style="font-size:1rem;margin-bottom:0.5rem">${item.price}<span style="font-size:0.75rem">${item.size}</span></div>
        </div>
      </article>`;
  },

  renderListings(items) {
    const container = this.containers?.listings;
    if (!container) return;

    // 使用 DocumentFragment 減少 reflow
    const fragment = document.createDocumentFragment();
    const template = document.createElement('template');
    
    template.innerHTML = items.map(item => {
      const reviewsHtml = item.reviews.map(r => this.createReviewHtml(r, true)).join('');
      return `
        <article class="horizontal-card">
          <div class="horizontal-left">
            <div class="horizontal-thumb">
              <img src="${item.image}" alt="${item.title}" loading="lazy" decoding="async" />
            </div>
            <div class="horizontal-main">
              <div class="horizontal-title-row">
                <span>📍</span><strong>${item.title}</strong>
                <span class="horizontal-tag">${item.tag}</span>
              </div>
              <div class="horizontal-price">${item.price}<span>${item.size}</span></div>
              <div class="horizontal-rating"><span class="star">★</span>${item.rating}</div>
              <div class="horizontal-reviews">${reviewsHtml}</div>
              <div class="horizontal-bottom-note">${item.note}</div>
            </div>
          </div>
          <div class="horizontal-right">
            <div class="horizontal-price">${item.price}<span>${item.size}</span></div>
            <div class="lock-row">
              <div class="lock-header">
                <span class="lock-icon">🔒</span>
                <div class="lock-text">
                  <span class="lock-label">${item.lockLabel}</span>
                  <span class="lock-count">還有 ${item.lockCount} 則評價</span>
                </div>
              </div>
              <button class="lock-btn" type="button">註冊查看更多評價</button>
            </div>
            <div class="horizontal-cta-row">
              <button class="btn-outline" type="button">查看</button>
              <button class="heart-btn" type="button" aria-label="加入收藏">♡</button>
            </div>
          </div>
        </article>`;
    }).join('');
    
    fragment.appendChild(template.content);
    container.innerHTML = '';
    container.appendChild(fragment);
  }
};

// Initialize with new async method (v2)
document.addEventListener('DOMContentLoaded', () => {
  PropertyRenderer.init();
  
  // 優先使用新架構
  if (window.PropertyAPI && window.MockProperties) {
    PropertyRenderer.renderAsync();
  } else {
    // Fallback 到舊版
    PropertyRenderer.render('default');
  }
});

// Expose for switching datasets (保留向下相容)
window.renderPropertyPage = (key) => PropertyRenderer.render(key);

// Expose async render method
window.renderPropertyPageAsync = () => PropertyRenderer.renderAsync();