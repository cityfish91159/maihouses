/**
 * Property API Service (ESM)
 * - Fetches aggregated page data from the backend
 * - Uses AbortController + timeout for race safety
 */

const API_ENDPOINT = '/api/property/page-data';
const REQUEST_TIMEOUT_MS = 5000;

export class PropertyAPI {
  constructor() {
    this.currentController = null;
  }

  async getPageData() {
    if (this.currentController) {
      this.currentController.abort();
    }

    this.currentController = new AbortController();
    const { signal } = this.currentController;
    const timeoutId = setTimeout(() => {
      if (!signal.aborted) {
        this.currentController?.abort();
      }
    }, REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(API_ENDPOINT, { signal });
      if (!response.ok) {
        throw new Error(`API Error ${response.status}`);
      }

      const payload = await response.json();
      if (payload?.success && payload.data) {
        return payload.data;
      }
      return null;
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.warn('[PropertyAPI] getPageData failed', error);
      }
      return null;
    } finally {
      clearTimeout(timeoutId);
      this.currentController = null;
    }
  }
}

export const propertyAPI = new PropertyAPI();

// 保留全域掛載以支援舊版調用（不建議直接依賴）
if (typeof window !== 'undefined') {
  window.PropertyAPI = propertyAPI;
}

export default propertyAPI;
