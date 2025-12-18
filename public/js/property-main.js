import { propertyMockData } from './property-data.js';
import PropertyRenderer from './property-renderer.js';
import propertyAPI from './services/property-api.js';

const now = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());

export function createTelemetry() {
  const events = [];
  let lcp = null;
  let fcp = null;

  const lcpObserver = (typeof PerformanceObserver !== 'undefined')
    ? new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          lcp = entries[entries.length - 1].startTime;
        }
      })
    : null;

  if (lcpObserver) {
    try {
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (error) {
      console.warn('[telemetry] LCP observer unavailable', error);
    }
  }

  const recordFcp = () => {
    const paints = performance?.getEntriesByType?.('paint') || [];
    const fcpEntry = paints.find((p) => p.name === 'first-contentful-paint');
    if (fcpEntry) {
      fcp = fcpEntry.startTime;
    }
  };

  const log = (name, data = {}) => {
    const entry = { name, ts: now(), ...data };
    events.push(entry);
    return entry;
  };

  const expose = () => {
    recordFcp();
    if (lcpObserver) {
      try {
        lcpObserver.disconnect();
      } catch (error) {
        console.warn('[telemetry] LCP observer disconnect failed', error);
      }
    }

    const snapshot = { events: [...events], lcp, fcp };
    if (typeof window !== 'undefined') {
      window.__phase4Telemetry = snapshot;
    }
    return snapshot;
  };

  return { log, expose };
}

// 主流程：Mock 秒開 + 背景 API 靜默更新 + 圖片預載 + 版本檢查 + Telemetry
async function bootstrap() {
  const telemetry = createTelemetry();
  const renderer = new PropertyRenderer();
  telemetry.log('bootstrap:start');

  // 1) 首屏：立即渲染 Mock，確保秒開
  const mockVersion = renderer.render(propertyMockData.default, { source: 'mock', reason: 'bootstrap' });
  telemetry.log('render:mock', { version: mockVersion });

  // 2) 背景撈取真實資料並靜默更新
  try {
    const apiStart = now();
    const data = await propertyAPI.getPageData();
    const apiMs = now() - apiStart;

    if (!data) {
      const fallbackVersion = renderer.render(propertyMockData.default, { source: 'fallback', reason: 'api-null' });
      telemetry.log('render:fallback', { version: fallbackVersion, apiMs });
      telemetry.expose();
      return;
    }

    // 3) 防閃爍：預載主要圖片後再渲染
    const preloadStart = now();
    const preloadSummary = await renderer.preloadImages(data);
    const preloadMs = now() - preloadStart;

    const realVersion = renderer.render(data, { source: 'api', reason: 'success' });
    telemetry.log('render:api', {
      version: realVersion,
      apiMs,
      preloadMs,
      preloadCoverage: preloadSummary.coverage,
      preloadFailed: preloadSummary.failed
    });
    telemetry.expose();
  } catch (error) {
    const fallbackVersion = renderer.render(propertyMockData.default, { source: 'fallback', reason: 'api-error' });
    telemetry.log('render:fallback', { version: fallbackVersion, error: error?.message || error });
    telemetry.expose();
    console.warn('[property-main] background update skipped:', error?.message || error);
  }
}

// 避免在 Vitest/jsdom 進行 unit tests 時觸發副作用（fetch / render 等）
const isVitest = typeof globalThis !== 'undefined' && Boolean(globalThis.__vitest_worker__);
if (!isVitest && typeof window !== 'undefined' && typeof document !== 'undefined') {
  // eslint-disable-next-line no-void
  void bootstrap();
}
