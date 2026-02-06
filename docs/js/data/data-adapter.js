/**
 * Data Adapter
 * 將 Supabase properties 格式轉換為 Renderer 需要的格式
 * 這樣無論資料來自 Mock 還是真實 API，Renderer 都能正常運作
 */

export const DataAdapter = {
  /**
   * 轉換精選房源（大卡）
   * @param {Object} property - Supabase properties 格式的資料
   * @returns {Object} - Renderer 需要的格式
   */
  toFeaturedMain(property) {
    const p = property;
    const community = p.community || {};

    return {
      badge: p.badge || '精選房源',
      image: p.images?.[0] || window.PropertyConfig?.images?.placeholder,
      title: p.title,
      location: `📍 ${p.address}${community.name ? `・${this._extractArea(p.address)}生活圈` : ''}`,
      details: this._buildDetails(p, community),
      highlights: community.nearby ? `🏪 ${community.nearby}` : '',
      rating: `${p.average_rating || 4.0} 分(${p.review_count || 0} 則評價)`,
      reviews: this._formatReviews(p.reviews, false),
      lockCount: Math.max(0, (p.review_count || 0) - 2),
      price: this._formatPrice(p.price),
      size: `約 ${p.size || 0} 坪`,
    };
  },

  /**
   * 轉換精選房源（小卡）
   * @param {Object} property - Supabase properties 格式的資料
   * @returns {Object} - Renderer 需要的格式
   */
  toFeaturedSide(property) {
    const p = property;
    const community = p.community || {};

    return {
      badge: p.badge || '推薦',
      image: p.images?.[0] || window.PropertyConfig?.images?.placeholder,
      title: p.title,
      location: `📍 ${p.address}`,
      details: [
        p.description,
        community.year_built
          ? `🏢 ${community.year_built}年完工・${community.total_units || '?'}戶`
          : '',
        community.owner_occupied_rate
          ? `👥 自住${community.owner_occupied_rate}%・${community.demographic || '住戶'}`
          : '',
      ].filter(Boolean),
      rating: `${p.average_rating || 4.0} 分(${p.review_count || 0} 則評價)`,
      reviews: this._formatReviews(p.reviews, true),
      lockCount: p.review_count || 0,
      price: this._formatPrice(p.price),
      size: `約 ${p.size || 0} 坪`,
    };
  },

  /**
   * 轉換列表房源（橫式卡片）
   * @param {Object} property - Supabase properties 格式的資料
   * @returns {Object} - Renderer 需要的格式
   */
  toListing(property) {
    const p = property;

    return {
      image: p.images?.[0] || window.PropertyConfig?.images?.placeholder,
      title: `${p.title}・${this._extractDistrict(p.address)}`,
      tag: p.tag || p.features?.[0] || '',
      price: `${p.rooms || '?'} 房 ${this._formatPrice(p.price)}`,
      size: `約 ${p.size || 0} 坪`,
      rating: `${p.average_rating || 4.0} 分(${p.review_count || 0} 則評價)・${p.badge || ''}`,
      reviews: this._formatListingReviews(p.reviews),
      note: p.note || p.disadvantage || '',
      lockLabel: this._getLockLabel(p),
      lockCount: Math.max(0, (p.review_count || 0) - 2),
    };
  },

  /**
   * 批量轉換精選房源
   * @param {Array} properties - 精選房源陣列
   * @returns {Object} - { main, sideTop, sideBottom }
   */
  toFeaturedSet(properties) {
    const [main, sideTop, sideBottom] = properties;
    return {
      main: main ? this.toFeaturedMain(main) : null,
      sideTop: sideTop ? this.toFeaturedSide(sideTop) : null,
      sideBottom: sideBottom ? this.toFeaturedSide(sideBottom) : null,
    };
  },

  /**
   * 批量轉換列表房源
   * @param {Array} properties - 列表房源陣列
   * @returns {Array} - 轉換後的陣列
   */
  toListings(properties) {
    return properties.map((p) => this.toListing(p));
  },

  // ==================== 私有方法 ====================

  /**
   * 建立房屋詳情列表
   */
  _buildDetails(property, community) {
    const details = [];

    // 基本資訊
    if (property.rooms || property.halls || property.bathrooms) {
      const layout = [
        property.rooms ? `${property.rooms}房` : '',
        property.halls ? `${property.halls}廳` : '',
        property.bathrooms ? `${property.bathrooms}衛` : '',
      ]
        .filter(Boolean)
        .join('');

      const sizeInfo = property.size ? `・室內 ${property.size}坪` : '';
      details.push(layout + sizeInfo);
    }

    // 社區資訊
    if (community.year_built) {
      details.push(
        `🏢 ${community.year_built}年完工・${community.buildings || 1}棟・${community.total_units || '?'}戶`
      );
    }

    if (community.owner_occupied_rate) {
      details.push(`👥 自住${community.owner_occupied_rate}%・${community.demographic || ''}`);
    }

    if (community.parking_type) {
      details.push(`🚗 ${community.parking_type}(好停)`);
    }

    if (community.management_fee) {
      details.push(`💰 管理費約 ${community.management_fee}元/坪`);
    }

    return details;
  },

  /**
   * 格式化評論（精選卡片用）
   */
  _formatReviews(reviews, simple = false) {
    if (!reviews || reviews.length === 0) return [];

    return reviews.slice(0, 2).map((review) => {
      if (simple) {
        return {
          stars: this._ratingToStars(review.rating),
          author: review.author,
          content: review.content,
        };
      }

      return {
        stars: this._ratingToStars(review.rating),
        author: `${review.author} ・ ${review.unit_info || '住戶'}`,
        tags: review.tags?.map((t) => `#${t}`) || [],
        content: review.content,
      };
    });
  },

  /**
   * 格式化評論（列表卡片用）
   */
  _formatListingReviews(reviews) {
    if (!reviews || reviews.length === 0) return [];

    return reviews.slice(0, 2).map((review) => ({
      badge: review.badge || '住戶評價',
      content: `「${review.content}」— ${review.author}`,
    }));
  },

  /**
   * 評分轉星星
   */
  _ratingToStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    return (
      '★'.repeat(fullStars) + (hasHalf ? '☆' : '') + '☆'.repeat(5 - fullStars - (hasHalf ? 1 : 0))
    );
  },

  /**
   * 格式化價格
   */
  _formatPrice(price) {
    if (!price) return '價格洽詢';
    if (price >= 10000) {
      return `${(price / 10000).toFixed(1).replace('.0', '')} 億`;
    }
    return `${price.toLocaleString()} 萬`;
  },

  /**
   * 提取區域名稱
   */
  _extractArea(address) {
    if (!address) return '';
    // 從地址提取區域，如「板橋區」→「江子翠」需要額外 mapping
    const match = address.match(/(.+?市|.+?縣)?(.+?區|.+?鄉|.+?鎮)/);
    return match ? match[2] : '';
  },

  /**
   * 提取行政區
   */
  _extractDistrict(address) {
    if (!address) return '';
    const match = address.match(/(.+?區|.+?鄉|.+?鎮)/);
    return match ? match[1] : '';
  },

  /**
   * 取得鎖定標籤
   */
  _getLockLabel(property) {
    const badge = property.badge || '';
    if (badge.includes('豪宅')) return '豪宅住戶真實評價';
    if (badge.includes('首購')) return '首購族完整評價';
    if (badge.includes('收租')) return '收租族完整心得';
    if (badge.includes('換屋')) return '換屋族完整評價';
    if (badge.includes('通勤')) return '通勤族完整評價';
    if (badge.includes('科技')) return '科技人置產心得';
    return '完整住戶評價';
  },
};

// 暴露給全域以兼容舊版
if (typeof window !== 'undefined') {
  window.DataAdapter = DataAdapter;
}

export default DataAdapter;
