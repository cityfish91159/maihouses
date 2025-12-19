/**
 * Property Page Renderer (ESM)
 * - Version guarded rendering to prevent stale updates
 * - Optional image preload to reduce flicker
 */

export class PropertyRenderer {
  constructor() {
    this.renderVersion = 0;
    this.containers = null;
    this.versionLog = [];
  }

  logVersion(entry) {
    // M1: 實作 Ring Buffer 避免 O(n) 陣列搬移
    if (!this.versionLogCapacity) {
      this.versionLogCapacity = 50;
      this.versionLogIndex = 0;
    }
    
    if (this.versionLog.length < this.versionLogCapacity) {
      this.versionLog.push(entry);
    } else {
      this.versionLog[this.versionLogIndex] = entry;
      this.versionLogIndex = (this.versionLogIndex + 1) % this.versionLogCapacity;
    }
    
    if (typeof window !== 'undefined') {
      // 為了相容性，對外暴露時仍提供排序後的陣列
      window.__renderVersionLog = this.getVersionLog();
    }
  }

  clearLog() {
    this.versionLog = [];
    this.versionLogIndex = 0;
    if (typeof window !== 'undefined') {
      window.__renderVersionLog = [];
    }
  }

  getVersionLog() {
    if (!this.versionLogCapacity || this.versionLog.length < this.versionLogCapacity) {
      return [...this.versionLog];
    }
    // 重新排序 Ring Buffer
    return [
      ...this.versionLog.slice(this.versionLogIndex),
      ...this.versionLog.slice(0, this.versionLogIndex)
    ];
  }

  ensureContainers() {
    if (this.containers) return;
    this.containers = {
      main: document.getElementById('featured-main-container'),
      sideTop: document.getElementById('featured-side-top-container'),
      sideBottom: document.getElementById('featured-side-bottom-container'),
      listings: document.getElementById('listing-grid-container')
    };
  }

  escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  async preloadImages(data) {
    const rawUrls = [
      data?.featured?.main?.image,
      data?.featured?.sideTop?.image,
      data?.featured?.sideBottom?.image,
      ...(data?.listings || []).map((item) => item.image)
    ].filter(Boolean);

    const urls = [...new Set(rawUrls)];

    const summary = {
      attempted: urls.length,
      loaded: 0,
      failed: [],
      durationMs: 0,
      coverage: 0
    };

    const start = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();

    await Promise.all(urls.map((url) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        summary.loaded += 1;
        resolve();
      };
      img.onerror = () => {
        summary.failed.push(url);
        resolve();
      };
      img.src = url;
    })));

    summary.durationMs = (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()) - start;
    summary.coverage = summary.attempted === 0 ? 1 : summary.loaded / summary.attempted;
    return summary;
  }

  render(data, context = {}) {
    if (!data) return;
    this.ensureContainers();

    const currentVersion = ++this.renderVersion;
    requestAnimationFrame(() => {
      if (currentVersion !== this.renderVersion) return;

      const eventMeta = {
        version: currentVersion,
        source: context.source || 'unknown',
        reason: context.reason || null,
        ts: (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now())
      };

      // S4: 抽取共用渲染邏輯
      this.renderFeaturedCard(data?.featured?.main, this.containers?.main, 'main');
      this.renderFeaturedCard(data?.featured?.sideTop, this.containers?.sideTop, 'sideTop');
      this.renderFeaturedCard(data?.featured?.sideBottom, this.containers?.sideBottom, 'sideBottom');
      
      this.renderListings(data?.listings || []);
      this.updateListingCount(Array.isArray(data?.listings) ? data.listings.length : 0);

      this.logVersion(eventMeta);
    });

    return currentVersion;
  }

  updateListingCount(total) {
    const countEl = document.querySelector('.listing-header .small-text');
    if (countEl && typeof total === 'number' && total > 0) {
      countEl.textContent = `共 ${total} 個社區`;
    }
  }

  createReviewHtml(review, compact = false) {
    if (!review) return '';

    const container = document.createElement('div');
    if (compact) {
      container.className = 'review-item-compact';
      const badgeSpan = document.createElement('span');
      badgeSpan.className = 'review-badge';
      badgeSpan.textContent = review.badge || '';
      
      const contentP = document.createElement('p');
      contentP.className = 'review-text';
      contentP.textContent = review.content || '';
      
      container.appendChild(badgeSpan);
      container.appendChild(contentP);
      return container.outerHTML;
    }

    container.className = 'property-review-item';
    const header = document.createElement('div');
    header.className = 'review-header';
    
    const stars = document.createElement('span');
    stars.className = 'review-stars';
    stars.textContent = review.stars || '';
    
    const author = document.createElement('span');
    author.className = 'review-author';
    author.textContent = review.author || '';
    
    header.appendChild(stars);
    header.appendChild(author);
    container.appendChild(header);

    if (review.tags && review.tags.length > 0) {
      const tagsDiv = document.createElement('div');
      tagsDiv.className = 'review-tags';
      review.tags.forEach((tag) => {
        const tagSpan = document.createElement('span');
        tagSpan.className = 'review-tag';
        tagSpan.textContent = tag;
        tagsDiv.appendChild(tagSpan);
      });
      container.appendChild(tagsDiv);
    }

    const contentP = document.createElement('p');
    contentP.className = 'review-content';
    contentP.textContent = review.content || '';
    container.appendChild(contentP);

    return container.outerHTML;
  }

  renderFeaturedCard(item, container, variant = 'main') {
    if (!container || !item) return;

    const config = {
      main: {
        cardClass: '',
        chipClass: '',
        showHighlights: true,
        lockPrefix: '還有 ',
        btnText: '註冊查看',
        showCta: true
      },
      sideTop: {
        cardClass: 'variant-side',
        chipClass: 'capsule-chip-sm',
        showHighlights: false,
        lockPrefix: '',
        btnText: '查看',
        showCta: false
      },
      sideBottom: {
        cardClass: 'variant-side',
        chipClass: 'capsule-chip-sm',
        showHighlights: false,
        lockPrefix: '',
        btnText: '查看',
        showCta: false
      }
    }[variant] || config.main;

    const chipTags = Array.isArray(item.tags) ? item.tags.slice(0, 3) : [];
    const tagsHtml = chipTags.map((t) => `<span class="capsule-chip ${config.chipClass}">${this.escapeHtml(t)}</span>`).join('');
    const reviewsHtml = (item.reviews || []).map((r) => this.createReviewHtml(r)).join('');

    container.innerHTML = `
      <article class="property-card ${config.cardClass}">
        <div class="property-media">
          <img src="${item.image}" alt="${this.escapeHtml(item.title)}" loading="lazy" decoding="async" />
          <span class="property-badge">${this.escapeHtml(item.badge)}</span>
        </div>
        <div class="property-content">
          <h3 class="property-title">${this.escapeHtml(item.title)}</h3>
          <div class="property-location">${this.escapeHtml(item.location)}</div>
          <div class="property-tags-row">${tagsHtml}</div>
          ${config.showHighlights ? `<div class="tiny-text" style="margin-bottom:0.5rem;color:var(--primary)">${this.escapeHtml(item.highlights || '')}</div>` : ''}
          <div class="property-rating"><span class="star">★</span>${this.escapeHtml(item.rating)}</div>
          <div class="property-reviews">${reviewsHtml}</div>
          <div class="property-more-reviews">
            <div class="lock-info" style="display:flex;align-items:center;gap:0.5rem">
              <span class="lock-icon">🔒</span><span>${config.lockPrefix}${item.lockCount} 則評價</span>
            </div>
            <button class="register-btn" type="button">${config.btnText}</button>
          </div>
          <div class="property-price">${this.escapeHtml(item.price)}<span>${this.escapeHtml(item.size)}</span></div>
          ${config.showCta ? `
          <div class="property-cta">
            <button class="btn-primary" type="button">查看詳情</button>
            <button class="heart-btn" type="button" aria-label="加入收藏">♡</button>
          </div>` : ''}
        </div>
      </article>`;
  }

  renderListings(items) {
    const container = this.containers?.listings;
    if (!container) return;

    // S1: 實作 DOM Diffing (Key-based Update with stable keys and signature)
    const existingCards = Array.from(container.querySelectorAll('.horizontal-card'));
    const existingMap = new Map();
    existingCards.forEach((card) => {
      const key = card.getAttribute('data-key');
      if (key) existingMap.set(key, card);
    });

    const newKeys = new Set();
    const fragment = document.createDocumentFragment();

    (items || []).forEach((item, idx) => {
      const baseKey = item.id || item.title || `listing-${idx}`;
      let key = baseKey;
      // 保證同一批資料中 key 唯一
      while (newKeys.has(key)) {
        key = `${baseKey}-${idx}`;
      }
      newKeys.add(key);

      const reviewsHtml = (item.reviews || []).map((r) => this.createReviewHtml(r, true)).join('');
      const chipTags = Array.isArray(item.tags) ? item.tags.slice(0, 3) : [];
      const tagsHtml = chipTags.map((t) => `<span class="capsule-chip capsule-chip-sm">${this.escapeHtml(t)}</span>`).join('');

      const signature = [
        item.image,
        item.title,
        item.price,
        item.size,
        item.rating,
        item.note,
        tagsHtml,
        reviewsHtml,
        item.lockLabel,
        item.lockCount
      ].join('|');

      const cardHtml = `
          <div class="horizontal-left">
            <div class="horizontal-thumb">
              <img src="${item.image}" alt="${this.escapeHtml(item.title)}" loading="lazy" decoding="async" />
            </div>
            <div class="horizontal-main">
              <div class="horizontal-title-row">
                <span>📍</span><strong>${this.escapeHtml(item.title)}</strong>
                ${tagsHtml}
              </div>
              <div class="horizontal-price">${this.escapeHtml(item.price)}<span>${this.escapeHtml(item.size)}</span></div>
              <div class="horizontal-rating"><span class="star">★</span>${this.escapeHtml(item.rating)}</div>
              <div class="horizontal-reviews">${reviewsHtml}</div>
              <div class="horizontal-bottom-note">${this.escapeHtml(item.note || '')}</div>
            </div>
          </div>
          <div class="horizontal-right">
            <div class="horizontal-price">${this.escapeHtml(item.price)}<span>${this.escapeHtml(item.size)}</span></div>
            <div class="lock-row">
              <div class="lock-header">
                <span class="lock-icon">🔒</span>
                <div class="lock-text">
                  <span class="lock-label">${this.escapeHtml(item.lockLabel || '')}</span>
                  <span class="lock-count">還有 ${item.lockCount} 則評價</span>
                </div>
              </div>
              <button class="lock-btn" type="button">註冊查看更多評價</button>
            </div>
            <div class="horizontal-cta-row">
              <button class="btn-outline" type="button">查看</button>
              <button class="heart-btn" type="button" aria-label="加入收藏">♡</button>
            </div>
          </div>`;

      if (existingMap.has(key)) {
        const existingCard = existingMap.get(key);
        if (existingCard.dataset.sig !== signature) {
          existingCard.innerHTML = cardHtml;
          existingCard.dataset.sig = signature;
        }
        fragment.appendChild(existingCard);
      } else {
        const article = document.createElement('article');
        article.className = 'horizontal-card';
        article.setAttribute('data-key', key);
        article.dataset.sig = signature;
        article.innerHTML = cardHtml;
        fragment.appendChild(article);
      }
    });

    existingMap.forEach((card, key) => {
      if (!newKeys.has(key)) {
        card.remove();
      }
    });

    container.replaceChildren(fragment);
  }
}

export default PropertyRenderer;
