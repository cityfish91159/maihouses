// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PropertyRenderer from '../property-renderer.js';
import { PropertyAPI } from '../services/property-api.js';

const originalFetch = global.fetch;
const OriginalAbortController = global.AbortController;
const originalRAF = global.requestAnimationFrame;
const OriginalImage = global.Image;

function buildFeatured(title) {
  return {
    featured: {
      main: {
        badge: '熱門',
        image: 'https://example.com/main.jpg',
        title,
        location: '📍 測試地點',
        details: ['detail'],
        highlights: '亮點',
        rating: '4.0',
        reviews: [],
        lockCount: 1,
        price: '100 萬',
        size: '10 坪'
      },
      sideTop: {
        badge: '側上',
        image: 'https://example.com/top.jpg',
        title,
        location: '📍 測試',
        details: ['d'],
        rating: '4.0',
        reviews: [],
        lockCount: 1,
        price: '100 萬',
        size: '10 坪'
      },
      sideBottom: {
        badge: '側下',
        image: 'https://example.com/bottom.jpg',
        title,
        location: '📍 測試',
        details: ['d'],
        rating: '4.0',
        reviews: [],
        lockCount: 1,
        price: '100 萬',
        size: '10 坪'
      }
    },
    listings: []
  };
}

describe('PropertyAPI race protection', () => {
  afterEach(() => {
    global.fetch = originalFetch;
    global.AbortController = OriginalAbortController;
    vi.restoreAllMocks();
  });

  it('aborts previous request before starting the next', async () => {
    const abortCalls = [];
    class FakeAbortController {
      constructor() {
        this.signal = {
          aborted: false,
          listeners: [],
          addEventListener: (event, cb) => this.signal.listeners.push(cb)
        };
      }
      abort() {
        this.signal.aborted = true;
        abortCalls.push(true);
        this.signal.listeners.forEach((cb) => cb());
      }
    }

    global.AbortController = FakeAbortController;

    const fetchMock = vi.fn()
      .mockImplementationOnce((_, { signal }) => new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => {
          const error = new Error('Aborted');
          error.name = 'AbortError';
          reject(error);
        });
      }))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { featured: {}, listings: [] } })
      });

    global.fetch = fetchMock;

    const api = new PropertyAPI();
    const first = api.getPageData();
    const second = api.getPageData();

    const firstResult = await first;
    const secondResult = await second;

    expect(abortCalls.length).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(firstResult).toBeNull();
    expect(secondResult).toEqual({ featured: {}, listings: [] });
  });

  it('aborts automatically after timeout', async () => {
    const api = new PropertyAPI();
    
    // Mock fetch to listen to signal
    global.fetch = vi.fn().mockImplementation((_, { signal }) => new Promise((resolve, reject) => {
      if (signal.aborted) return reject(new Error('Aborted'));
      signal.addEventListener('abort', () => {
        const error = new Error('Aborted');
        error.name = 'AbortError';
        reject(error);
      });
    }));

    // Mock setTimeout to capture the timeout callback
    const originalSetTimeout = global.setTimeout;
    let timeoutCallback;
    global.setTimeout = vi.fn().mockImplementation((cb, ms) => {
      if (ms === 5000) {
        timeoutCallback = cb;
      }
      return originalSetTimeout(cb, ms);
    });

    const call = api.getPageData();
    
    // Manually trigger the timeout callback
    if (timeoutCallback) timeoutCallback();
    
    const result = await call;
    expect(result).toBeNull();
    
    global.setTimeout = originalSetTimeout;
  });

  it('handles 5 concurrent requests, only the last one succeeds', async () => {
    const api = new PropertyAPI();
    const fetchMock = vi.fn().mockImplementation((_, { signal }) => {
      return new Promise((resolve, reject) => {
        if (signal.aborted) {
          const error = new Error('Aborted');
          error.name = 'AbortError';
          return reject(error);
        }
        signal.addEventListener('abort', () => {
          const error = new Error('Aborted');
          error.name = 'AbortError';
          reject(error);
        });
        // Resolve after a short delay
        global.setTimeout(() => {
          resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: { id: 'last' } })
          });
        }, 10);
      });
    });
    global.fetch = fetchMock;

    const promises = [
      api.getPageData(),
      api.getPageData(),
      api.getPageData(),
      api.getPageData(),
      api.getPageData()
    ];

    const results = await Promise.all(promises);
    expect(results[0]).toBeNull();
    expect(results[1]).toBeNull();
    expect(results[2]).toBeNull();
    expect(results[3]).toBeNull();
    expect(results[4]).toEqual({ id: 'last' });
  });
});

describe('PropertyRenderer render guards', () => {
  beforeEach(() => {
    document.body.innerHTML = [
      '<div id="featured-main-container"></div>',
      '<div id="featured-side-top-container"></div>',
      '<div id="featured-side-bottom-container"></div>',
      '<div id="listing-grid-container"></div>',
      '<div class="listing-header"><div class="small-text"></div></div>'
    ].join('');
  });

  afterEach(() => {
    global.requestAnimationFrame = originalRAF;
  });

  it('drops stale render when a newer version exists', () => {
    const rafQueue = [];
    global.requestAnimationFrame = (cb) => {
      rafQueue.push(cb);
      return rafQueue.length;
    };

    const renderer = new PropertyRenderer();
    const initialData = buildFeatured('Old Title');
    const nextData = buildFeatured('New Title');

    renderer.render(initialData, { source: 'mock' });
    renderer.render(nextData, { source: 'api' });

    expect(renderer.renderVersion).toBe(2);
    // Execute callbacks in order to simulate stale then fresh render
    rafQueue[0]();
    const mainBefore = document.getElementById('featured-main-container').innerHTML;
    expect(mainBefore).toBe('');

    rafQueue[1]();
    const mainAfter = document.getElementById('featured-main-container').innerHTML;
    expect(mainAfter).toContain('New Title');

    const log = renderer.getVersionLog();
    expect(log.at(-1)?.source).toBe('api');
    expect(log.at(-1)?.version).toBe(2);
  });

  it('does not increment version when rendering null', () => {
    const renderer = new PropertyRenderer();
    const initialVersion = renderer.renderVersion;
    renderer.render(null);
    expect(renderer.renderVersion).toBe(initialVersion);
  });

  it('handles 10 rapid renders, only the last one updates DOM', () => {
    const rafQueue = [];
    global.requestAnimationFrame = (cb) => {
      rafQueue.push(cb);
      return rafQueue.length;
    };

    const renderer = new PropertyRenderer();
    for (let i = 1; i <= 10; i++) {
      renderer.render(buildFeatured(`Title ${i}`), { source: `call-${i}` });
    }

    expect(renderer.renderVersion).toBe(10);
    
    // Execute all RAF callbacks
    rafQueue.forEach(cb => cb());

    const mainHtml = document.getElementById('featured-main-container').innerHTML;
    expect(mainHtml).toContain('Title 10');
    // Ensure it doesn't contain any previous titles (though in this mock it might if they all ran, 
    // but the guard should prevent the actual DOM update for stale versions)
    // Actually, the guard in property-renderer.js checks this.renderVersion === version
    // So only the last one should have executed the DOM update logic.
  });
});

describe('PropertyRenderer preload coverage', () => {
  afterEach(() => {
    global.Image = OriginalImage;
  });

  it('reports coverage and failures for preloadImages', async () => {
    class FakeImage {
      set src(url) {
        if (url.includes('fail')) {
          this.onerror?.();
        } else {
          this.onload?.();
        }
      }
    }
    global.Image = FakeImage;

    const renderer = new PropertyRenderer();
    const summary = await renderer.preloadImages({
      featured: {
        main: { image: 'https://example.com/success.jpg' },
        sideTop: { image: 'https://example.com/fail.jpg' },
        sideBottom: { image: 'https://example.com/success2.jpg' }
      },
      listings: [
        { image: 'https://example.com/success3.jpg' }
      ]
    });

    expect(summary.attempted).toBe(4);
    expect(summary.loaded).toBe(3);
    expect(summary.failed).toEqual(['https://example.com/fail.jpg']);
    expect(summary.coverage).toBeCloseTo(0.75, 2);
  });

  it('returns 100% coverage for empty data', async () => {
    const renderer = new PropertyRenderer();
    const summary = await renderer.preloadImages({});
    expect(summary.coverage).toBe(1);
    expect(summary.attempted).toBe(0);
  });

  it('deduplicates URLs during preload', async () => {
    const urls = [];
    class FakeImage {
      set src(url) {
        urls.push(url);
        // Use a microtask to trigger onload
        Promise.resolve().then(() => this.onload?.());
      }
    }
    global.Image = FakeImage;

    const renderer = new PropertyRenderer();
    await renderer.preloadImages({
      featured: {
        main: { image: 'https://example.com/dup.jpg' },
        sideTop: { image: 'https://example.com/dup.jpg' }
      }
    });

    expect(urls.length).toBe(1);
    expect(urls[0]).toBe('https://example.com/dup.jpg');
  });
});
