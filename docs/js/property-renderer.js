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
      this.versionLogIndex =
        (this.versionLogIndex + 1) % this.versionLogCapacity;
    }

    if (typeof window !== "undefined") {
      // 為了相容性，對外暴露時仍提供排序後的陣列
      window.__renderVersionLog = this.getVersionLog();
    }
  }

  clearLog() {
    this.versionLog = [];
    this.versionLogIndex = 0;
    if (typeof window !== "undefined") {
      window.__renderVersionLog = [];
    }
  }

  getVersionLog() {
    if (
      !this.versionLogCapacity ||
      this.versionLog.length < this.versionLogCapacity
    ) {
      return [...this.versionLog];
    }
    // 重新排序 Ring Buffer
    return [
      ...this.versionLog.slice(this.versionLogIndex),
      ...this.versionLog.slice(0, this.versionLogIndex),
    ];
  }

  ensureContainers() {
    if (this.containers) return;
    this.containers = {
      main: document.getElementById("featured-main-container"),
      sideTop: document.getElementById("featured-side-top-container"),
      sideBottom: document.getElementById("featured-side-bottom-container"),
      listings: document.getElementById("listing-grid-container"),
    };
  }

  escapeHtml(str) {
    if (typeof str !== "string") return str;
    return str.replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[m],
    );
  }

  async preloadImages(data) {
    const rawUrls = [
      data?.featured?.main?.image,
      data?.featured?.sideTop?.image,
      data?.featured?.sideBottom?.image,
      ...(data?.listings || []).map((item) => item.image),
    ].filter(Boolean);

    const urls = [...new Set(rawUrls)];

    const summary = {
      attempted: urls.length,
      loaded: 0,
      failed: [],
      durationMs: 0,
      coverage: 0,
    };

    const start =
      typeof performance !== "undefined" && performance.now
        ? performance.now()
        : Date.now();

    await Promise.all(
      urls.map(
        (url) =>
          new Promise((resolve) => {
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
          }),
      ),
    );

    summary.durationMs =
      (typeof performance !== "undefined" && performance.now
        ? performance.now()
        : Date.now()) - start;
    summary.coverage =
      summary.attempted === 0 ? 1 : summary.loaded / summary.attempted;
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
        source: context.source || "unknown",
        reason: context.reason || null,
        ts:
          typeof performance !== "undefined" && performance.now
            ? performance.now()
            : Date.now(),
      };

      // S4: 抽取共用渲染邏輯
      this.renderFeaturedCard(
        data?.featured?.main,
        this.containers?.main,
        "main",
      );
      this.renderFeaturedCard(
        data?.featured?.sideTop,
        this.containers?.sideTop,
        "sideTop",
      );
      this.renderFeaturedCard(
        data?.featured?.sideBottom,
        this.containers?.sideBottom,
        "sideBottom",
      );

      this.renderListings(data?.listings || []);
      this.updateListingCount(
        Array.isArray(data?.listings) ? data.listings.length : 0,
      );

      this.logVersion(eventMeta);
    });

    return currentVersion;
  }

  updateListingCount(total) {
    const countEl = document.querySelector(".listing-header .small-text");
    if (countEl && typeof total === "number" && total > 0) {
      countEl.textContent = `共 ${total} 個社區`;
    }
  }

  createReviewElement(review, compact = false) {
    const container = document.createElement("div");
    if (compact) {
      container.className = "review-item-compact";
      const badgeSpan = document.createElement("span");
      badgeSpan.className = "review-badge";
      badgeSpan.textContent = review?.badge || "";

      const contentP = document.createElement("p");
      contentP.className = "review-text";
      contentP.textContent = review?.content || "";

      container.appendChild(badgeSpan);
      container.appendChild(contentP);
      return container;
    }

    container.className = "property-review-item";
    const header = document.createElement("div");
    header.className = "review-header";

    const stars = document.createElement("span");
    stars.className = "review-stars";
    stars.textContent = review?.stars || "";

    const author = document.createElement("span");
    author.className = "review-author";
    author.textContent = review?.author || "";

    header.appendChild(stars);
    header.appendChild(author);
    container.appendChild(header);

    if (Array.isArray(review?.tags) && review.tags.length > 0) {
      const tagsDiv = document.createElement("div");
      tagsDiv.className = "review-tags";
      review.tags.forEach((tag) => {
        const tagSpan = document.createElement("span");
        tagSpan.className = "review-tag";
        tagSpan.textContent = tag;
        tagsDiv.appendChild(tagSpan);
      });
      container.appendChild(tagsDiv);
    }

    const contentP = document.createElement("p");
    contentP.className = "review-content";
    contentP.textContent = review?.content || "";
    container.appendChild(contentP);

    return container;
  }

  renderFeaturedCard(item, container, variant = "main") {
    if (!container || !item) return;

    const config =
      {
        main: {
          cardClass: "",
          chipClass: "",
          showHighlights: true,
          lockPrefix: "還有 ",
          btnText: "註冊查看",
          showCta: true,
        },
        sideTop: {
          cardClass: "variant-side",
          chipClass: "capsule-chip-sm",
          showHighlights: false,
          lockPrefix: "",
          btnText: "查看",
          showCta: false,
        },
        sideBottom: {
          cardClass: "variant-side",
          chipClass: "capsule-chip-sm",
          showHighlights: false,
          lockPrefix: "",
          btnText: "查看",
          showCta: false,
        },
      }[variant] || config.main;

    const article = document.createElement("article");
    article.className = `property-card ${config.cardClass}`.trim();

    // Media Section
    const mediaDiv = document.createElement("div");
    mediaDiv.className = "property-media";
    const img = document.createElement("img");
    img.src = item.image;
    img.alt = item.title;
    img.loading = "lazy";
    img.decoding = "async";
    const badge = document.createElement("span");
    badge.className = "property-badge";
    badge.textContent = item.badge;
    mediaDiv.appendChild(img);
    mediaDiv.appendChild(badge);

    // Content Section
    const contentDiv = document.createElement("div");
    contentDiv.className = "property-content";

    const title = document.createElement("h3");
    title.className = "property-title";
    title.textContent = item.title;

    const location = document.createElement("div");
    location.className = "property-location";
    location.textContent = item.location;

    const tagsRow = document.createElement("div");
    tagsRow.className = "property-tags-row";
    (item.tags || []).slice(0, 3).forEach((t) => {
      const span = document.createElement("span");
      span.className = `capsule-chip ${config.chipClass}`.trim();
      span.textContent = t;
      tagsRow.appendChild(span);
    });

    contentDiv.appendChild(title);
    contentDiv.appendChild(location);
    contentDiv.appendChild(tagsRow);

    if (config.showHighlights) {
      const highlights = document.createElement("div");
      highlights.className = "tiny-text tiny-text-highlight";
      highlights.textContent = item.highlights || "";
      contentDiv.appendChild(highlights);
    }

    const rating = document.createElement("div");
    rating.className = "property-rating";
    const star = document.createElement("span");
    star.className = "star";
    star.textContent = "★";
    rating.appendChild(star);
    rating.appendChild(document.createTextNode(item.rating));
    contentDiv.appendChild(rating);

    const reviewsHost = document.createElement("div");
    reviewsHost.className = "property-reviews";
    const nodes = (item.reviews || []).map((r) => this.createReviewElement(r));
    reviewsHost.replaceChildren(...nodes);
    contentDiv.appendChild(reviewsHost);

    const moreReviews = document.createElement("div");
    moreReviews.className = "property-more-reviews";
    const lockInfo = document.createElement("div");
    lockInfo.className = "lock-info";
    const lockIcon = document.createElement("span");
    lockIcon.className = "lock-icon";
    lockIcon.textContent = "🔒";
    const lockText = document.createElement("span");
    lockText.textContent = `${config.lockPrefix}${item.lockCount} 則評價`;
    lockInfo.appendChild(lockIcon);
    lockInfo.appendChild(lockText);
    const regBtn = document.createElement("button");
    regBtn.className = "register-btn";
    regBtn.type = "button";
    regBtn.textContent = config.btnText;
    moreReviews.appendChild(lockInfo);
    moreReviews.appendChild(regBtn);
    contentDiv.appendChild(moreReviews);

    const price = document.createElement("div");
    price.className = "property-price";
    price.textContent = item.price;
    const size = document.createElement("span");
    size.textContent = item.size;
    price.appendChild(size);
    contentDiv.appendChild(price);

    if (config.showCta) {
      const cta = document.createElement("div");
      cta.className = "property-cta";
      const detailBtn = document.createElement("button");
      detailBtn.className = "btn-primary";
      detailBtn.type = "button";
      detailBtn.textContent = "查看詳情";
      const heartBtn = document.createElement("button");
      heartBtn.className = "heart-btn";
      heartBtn.type = "button";
      heartBtn.setAttribute("aria-label", "加入收藏");
      heartBtn.textContent = "♡";
      cta.appendChild(detailBtn);
      cta.appendChild(heartBtn);
      contentDiv.appendChild(cta);
    }

    article.appendChild(mediaDiv);
    article.appendChild(contentDiv);

    container.replaceChildren(article);
  }

  renderListings(items) {
    const container = this.containers?.listings;
    if (!container) return;

    // S1: 實作 DOM Diffing (Key-based Update with stable keys and signature)
    const existingCards = Array.from(
      container.querySelectorAll(".horizontal-card"),
    );
    const existingMap = new Map();
    existingCards.forEach((card) => {
      const key = card.getAttribute("data-key");
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

      const chipTags = Array.isArray(item.tags) ? item.tags.slice(0, 3) : [];
      const signature = [
        item.image,
        item.title,
        item.price,
        item.size,
        item.rating,
        item.note,
        chipTags.join(","),
        item.lockLabel,
        item.lockCount,
      ].join("|");

      const article = document.createElement("article");
      article.className = "horizontal-card";
      article.setAttribute("data-key", key);
      article.dataset.sig = signature;

      // Left Section
      const leftDiv = document.createElement("div");
      leftDiv.className = "horizontal-left";

      const thumbDiv = document.createElement("div");
      thumbDiv.className = "horizontal-thumb";
      const img = document.createElement("img");
      img.src = item.image;
      img.alt = item.title;
      img.loading = "lazy";
      img.decoding = "async";
      thumbDiv.appendChild(img);

      const mainDiv = document.createElement("div");
      mainDiv.className = "horizontal-main";

      const titleRow = document.createElement("div");
      titleRow.className = "horizontal-title-row";
      const pin = document.createElement("span");
      pin.textContent = "📍";
      const strong = document.createElement("strong");
      strong.textContent = item.title;
      titleRow.appendChild(pin);
      titleRow.appendChild(strong);
      chipTags.forEach((t) => {
        const span = document.createElement("span");
        span.className = "capsule-chip capsule-chip-sm";
        span.textContent = t;
        titleRow.appendChild(span);
      });

      const priceDiv = document.createElement("div");
      priceDiv.className = "horizontal-price";
      priceDiv.textContent = item.price;
      const sizeSpan = document.createElement("span");
      sizeSpan.textContent = item.size;
      priceDiv.appendChild(sizeSpan);

      const ratingDiv = document.createElement("div");
      ratingDiv.className = "horizontal-rating";
      const star = document.createElement("span");
      star.className = "star";
      star.textContent = "★";
      ratingDiv.appendChild(star);
      ratingDiv.appendChild(document.createTextNode(item.rating));

      const reviewsHost = document.createElement("div");
      reviewsHost.className = "horizontal-reviews";
      const nodes = (item.reviews || []).map((r) =>
        this.createReviewElement(r, true),
      );
      reviewsHost.replaceChildren(...nodes);

      const noteDiv = document.createElement("div");
      noteDiv.className = "horizontal-bottom-note";
      noteDiv.textContent = item.note || "";

      mainDiv.appendChild(titleRow);
      mainDiv.appendChild(priceDiv);
      mainDiv.appendChild(ratingDiv);
      mainDiv.appendChild(reviewsHost);
      mainDiv.appendChild(noteDiv);

      leftDiv.appendChild(thumbDiv);
      leftDiv.appendChild(mainDiv);

      // Right Section
      const rightDiv = document.createElement("div");
      rightDiv.className = "horizontal-right";

      const rightPrice = priceDiv.cloneNode(true);

      const lockRow = document.createElement("div");
      lockRow.className = "lock-row";
      const lockHeader = document.createElement("div");
      lockHeader.className = "lock-header";
      const lockIcon = document.createElement("span");
      lockIcon.className = "lock-icon";
      lockIcon.textContent = "🔒";
      const lockText = document.createElement("div");
      lockText.className = "lock-text";
      const lockLabel = document.createElement("span");
      lockLabel.className = "lock-label";
      lockLabel.textContent = item.lockLabel || "";
      const lockCount = document.createElement("span");
      lockCount.className = "lock-count";
      lockCount.textContent = `還有 ${item.lockCount} 則評價`;
      lockText.appendChild(lockLabel);
      lockText.appendChild(lockCount);
      lockHeader.appendChild(lockIcon);
      lockHeader.appendChild(lockText);
      const lockBtn = document.createElement("button");
      lockBtn.className = "lock-btn";
      lockBtn.type = "button";
      lockBtn.textContent = "註冊查看更多評價";
      lockRow.appendChild(lockHeader);
      lockRow.appendChild(lockBtn);

      const ctaRow = document.createElement("div");
      ctaRow.className = "horizontal-cta-row";
      const viewBtn = document.createElement("button");
      viewBtn.className = "btn-outline";
      viewBtn.type = "button";
      viewBtn.textContent = "查看";
      const heartBtn = document.createElement("button");
      heartBtn.className = "heart-btn";
      heartBtn.type = "button";
      heartBtn.setAttribute("aria-label", "加入收藏");
      heartBtn.textContent = "♡";
      ctaRow.appendChild(viewBtn);
      ctaRow.appendChild(heartBtn);

      rightDiv.appendChild(rightPrice);
      rightDiv.appendChild(lockRow);
      rightDiv.appendChild(ctaRow);

      article.appendChild(leftDiv);
      article.appendChild(rightDiv);

      // S1: DOM Diffing - 如果已存在相同 key 的 card 且簽名不同才更新
      const existingCard = existingMap.get(key);
      if (existingCard) {
        if (existingCard.dataset.sig !== signature) {
          existingCard.replaceChildren(...article.childNodes);
          existingCard.dataset.sig = signature;
        }
        fragment.appendChild(existingCard);
      } else {
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
