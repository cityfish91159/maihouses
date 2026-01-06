/**
 * Property Page Configuration
 * 環境設定與 API 配置
 */

export const PropertyConfig = {
  // 資料來源模式: 'mock' | 'api'
  dataSource: 'api',
  
  // API 設定
  api: {
    baseUrl: '/api',
    endpoints: {
      list: '/properties/list',
      detail: '/properties/detail',
      featured: '/properties/featured'
    }
  },
  
  // Supabase 設定 (從環境變數讀取，這裡只是 fallback)
  supabase: {
    url: 'https://your-project.supabase.co',
    anonKey: 'your-anon-key'
  },
  
  // 分頁設定
  pagination: {
    pageSize: 8,
    maxFeatured: 3
  },
  
  // 圖片 fallback
  images: {
    placeholder: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop',
    agentAvatar: 'https://via.placeholder.com/150'
  },
  
  // 切換資料來源的方法
  setDataSource(source) {
    if (['mock', 'api'].includes(source)) {
      this.dataSource = source;
      console.log(`[PropertyConfig] 資料來源切換為: ${source}`);
    }
  },
  
  // 檢查是否使用 Mock 資料
  isMock() {
    return this.dataSource === 'mock';
  }
};

// 開發環境自動使用 mock
if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
  PropertyConfig.setDataSource('mock');
}

// 保留全域曝光以兼容舊代碼
if (typeof window !== 'undefined') {
  window.PropertyConfig = PropertyConfig;
}

export default PropertyConfig;
