/**
 * Property API Service
 * 統一的資料存取層，支援 Mock 和真實 API 切換
 */

const PropertyAPI = {
  /**
   * 取得精選房源
   * @returns {Promise<Object>} - { main, sideTop, sideBottom }
   */
  async getFeatured() {
    const config = window.PropertyConfig;
    
    if (config?.isMock()) {
      // 使用 Mock 資料
      const featured = window.MockProperties?.featured || [];
      return window.DataAdapter.toFeaturedSet(featured);
    }
    
    // 使用真實 API
    try {
      const response = await fetch(`${config.api.baseUrl}${config.api.endpoints.featured}`);
      if (!response.ok) throw new Error('API Error');
      
      const { data } = await response.json();
      return window.DataAdapter.toFeaturedSet(data);
    } catch (error) {
      console.error('[PropertyAPI] getFeatured error:', error);
      // Fallback 到 Mock
      const featured = window.MockProperties?.featured || [];
      return window.DataAdapter.toFeaturedSet(featured);
    }
  },

  /**
   * 取得房源列表
   * @param {Object} options - 查詢選項
   * @param {number} options.page - 頁碼
   * @param {number} options.pageSize - 每頁筆數
   * @param {string} options.search - 搜尋關鍵字
   * @param {string} options.district - 區域篩選
   * @returns {Promise<Object>} - { items, total, page, pageSize }
   */
  async getListings(options = {}) {
    const config = window.PropertyConfig;
    const { page = 1, pageSize = 8, search = '', district = '' } = options;
    
    if (config?.isMock()) {
      // 使用 Mock 資料
      let listings = window.MockProperties?.listings || [];
      
      // 搜尋篩選
      if (search) {
        const keyword = search.toLowerCase();
        listings = listings.filter(p => 
          p.title.toLowerCase().includes(keyword) ||
          p.address.toLowerCase().includes(keyword) ||
          p.features?.some(f => f.toLowerCase().includes(keyword))
        );
      }
      
      // 區域篩選
      if (district) {
        listings = listings.filter(p => p.address.includes(district));
      }
      
      // 分頁
      const start = (page - 1) * pageSize;
      const paged = listings.slice(start, start + pageSize);
      
      return {
        items: window.DataAdapter.toListings(paged),
        total: listings.length,
        page,
        pageSize
      };
    }
    
    // 使用真實 API
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(search && { search }),
        ...(district && { district })
      });
      
      const response = await fetch(`${config.api.baseUrl}${config.api.endpoints.list}?${params}`);
      if (!response.ok) throw new Error('API Error');
      
      const { data, total } = await response.json();
      return {
        items: window.DataAdapter.toListings(data),
        total,
        page,
        pageSize
      };
    } catch (error) {
      console.error('[PropertyAPI] getListings error:', error);
      // Fallback 到 Mock
      const listings = window.MockProperties?.listings || [];
      return {
        items: window.DataAdapter.toListings(listings),
        total: listings.length,
        page: 1,
        pageSize: 8
      };
    }
  },

  /**
   * 取得單一房源詳情
   * @param {string} publicId - 房源公開編號 (MH-100001)
   * @returns {Promise<Object|null>}
   */
  async getDetail(publicId) {
    const config = window.PropertyConfig;
    
    if (config?.isMock()) {
      // 從 Mock 資料中尋找
      const all = [
        ...(window.MockProperties?.featured || []),
        ...(window.MockProperties?.listings || [])
      ];
      
      const property = all.find(p => p.public_id === publicId);
      if (!property) return null;
      
      return {
        ...property,
        formatted: window.DataAdapter.toFeaturedMain(property)
      };
    }
    
    // 使用真實 API
    try {
      const response = await fetch(`${config.api.baseUrl}${config.api.endpoints.detail}?id=${publicId}`);
      if (!response.ok) throw new Error('API Error');
      
      const { data } = await response.json();
      return {
        ...data,
        formatted: window.DataAdapter.toFeaturedMain(data)
      };
    } catch (error) {
      console.error('[PropertyAPI] getDetail error:', error);
      return null;
    }
  },

  /**
   * 搜尋房源
   * @param {string} keyword - 搜尋關鍵字
   * @returns {Promise<Array>}
   */
  async search(keyword) {
    return this.getListings({ search: keyword, pageSize: 20 });
  },

  /**
   * 依區域取得房源
   * @param {string} district - 區域名稱
   * @returns {Promise<Array>}
   */
  async getByDistrict(district) {
    return this.getListings({ district, pageSize: 20 });
  }
};

// 暴露給全域
window.PropertyAPI = PropertyAPI;
