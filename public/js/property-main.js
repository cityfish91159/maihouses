import { propertyMockData } from './property-data.js';
import PropertyRenderer from './property-renderer.js';
import propertyAPI from './services/property-api.js';

// 主流程：Mock 秒開 + 背景 API 靜默更新 + 圖片預載 + 版本檢查
(async function bootstrap() {
  const renderer = new PropertyRenderer();

  // 1) 首屏：立即渲染 Mock，確保秒開
  renderer.render(propertyMockData.default);

  // 2) 背景撈取真實資料並靜默更新
  try {
    const data = await propertyAPI.getPageData();
    if (!data) return;

    // 3) 防閃爍：預載主要圖片後再渲染
    await renderer.preloadImages(data);
    renderer.render(data);
  } catch (error) {
    // 靜默降級；保留 Mock 畫面
    console.warn('[property-main] background update skipped:', error?.message || error);
  }
})();
