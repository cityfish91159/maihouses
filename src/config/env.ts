import { logger } from '../lib/logger';

const REQUIRED_KEYS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const;
const OPTIONAL_KEYS = ['VITE_API_BASE_URL', 'VITE_APP_URL'] as const;

const DEFAULT_COMMUNITY_API_BASE = '/api/community';

type RequiredKey = (typeof REQUIRED_KEYS)[number];
type OptionalKey = (typeof OPTIONAL_KEYS)[number];

type EnvShape = Record<RequiredKey, string> & Partial<Record<OptionalKey, string | undefined>>;

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

/**
 * 驗證字串是否為有效的 HTTP(S) URL
 */
const isValidHttpUrl = (str: string): boolean => {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * 取得應用程式的基底路徑（用於連結導向）
 * 優先順序：import.meta.env.BASE_URL → document.baseURI → /maihouses/
 */
const resolveAppBaseHref = (): string => {
  // Vite 在 build 時會根據 vite.config.ts 的 base 設定注入 BASE_URL
  const viteBase = import.meta.env.BASE_URL;
  if (viteBase && viteBase !== '/') {
    // 確保結尾只有一個 /
    return viteBase.endsWith('/') ? viteBase : `${viteBase}/`;
  }

  // SSR 或特殊情境下從 document.baseURI 取得
  if (typeof document !== 'undefined' && document.baseURI) {
    try {
      const baseUrl = new URL(document.baseURI);
      const pathname = baseUrl.pathname;
      if (pathname && pathname !== '/') {
        return pathname.endsWith('/') ? pathname : `${pathname}/`;
      }
    } catch {
      // 解析失敗則繼續 fallback
    }
  }

  // 最終 fallback：本專案部署於 /maihouses/
  return '/maihouses/';
};

/**
 * HTML 轉義函數 - 防止 XSS 攻擊
 *
 * [Team 5 修復] 安全防護
 * @param str - 要轉義的字串
 * @returns 轉義後的字串
 */
const escapeHtml = (str: string): string => {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

/**
 * 顯示友善錯誤頁面（用於 PROD 環境關鍵錯誤）
 *
 * [Team 5 修復] XSS 防護:
 * - 使用 escapeHtml 轉義所有用戶輸入
 * - 防止惡意腳本注入
 */
const showFriendlyErrorPage = (title: string, message: string): void => {
  if (typeof document !== 'undefined' && document.body) {
    const homeHref = resolveAppBaseHref();
    const safeTitle = escapeHtml(title);
    const safeMessage = escapeHtml(message);
    const safeHomeHref = escapeHtml(homeHref);

    document.body.innerHTML = `
      <style>
        .env-error-page {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          font-family: system-ui, -apple-system, sans-serif;
          background: var(--mh-color-f8fafc);
        }
        .env-error-card {
          text-align: center;
          max-width: 400px;
          padding: 2rem;
        }
        .env-error-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        .env-error-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--mh-color-1e293b);
          margin-bottom: 0.5rem;
        }
        .env-error-message {
          color: var(--mh-color-475569);
          margin-bottom: 1.5rem;
        }
        .env-error-link {
          display: inline-block;
          padding: 0.75rem 1.5rem;
          background: var(--mh-color-3b82f6);
          color: var(--mh-color-ffffff);
          border-radius: 0.5rem;
          text-decoration: none;
          font-weight: 500;
        }
      </style>
      <div class="env-error-page">
        <div class="env-error-card">
          <div class="env-error-icon">⚠️</div>
          <h1 class="env-error-title">${safeTitle}</h1>
          <p class="env-error-message">${safeMessage}</p>
          <a href="${safeHomeHref}" class="env-error-link">回到首頁</a>
        </div>
      </div>
    `;
  }
};

function readEnv(): EnvShape {
  const isTest = import.meta.env.MODE === 'test' || Boolean(import.meta.env.VITEST);

  if (isTest) {
    // 測試環境提供安全的預設值，避免因缺少 .env 而中斷
    return {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key',
      VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4173/api',
      VITE_APP_URL: import.meta.env.VITE_APP_URL || 'http://localhost:4173',
    };
  }

  const missing = REQUIRED_KEYS.filter((key) => !import.meta.env[key]);
  if (missing.length > 0) {
    const message = `缺少必要的環境變數：${missing.join(', ')}`;
    if (import.meta.env.PROD) {
      showFriendlyErrorPage('系統設定錯誤', '請聯繫管理員');
    }
    throw new Error(message);
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
  if (!isValidHttpUrl(supabaseUrl)) {
    const message = 'VITE_SUPABASE_URL 必須是有效的 HTTP(S) URL';
    if (import.meta.env.PROD) {
      showFriendlyErrorPage('系統設定錯誤', '請聯繫管理員');
    }
    throw new Error(message);
  }

  const env: EnvShape = {
    VITE_SUPABASE_URL: supabaseUrl,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY!,
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    VITE_APP_URL: import.meta.env.VITE_APP_URL,
  };

  // 驗證 VITE_API_BASE_URL 格式（如果有設定）
  if (
    env.VITE_API_BASE_URL &&
    !isValidHttpUrl(env.VITE_API_BASE_URL) &&
    !env.VITE_API_BASE_URL.startsWith('/')
  ) {
    logger.warn('[env] VITE_API_BASE_URL 格式無效，應為 HTTP(S) URL 或以 / 開頭的路徑');
  }

  if (!env.VITE_API_BASE_URL && import.meta.env.DEV) {
    logger.warn('[env] VITE_API_BASE_URL 未設定，預設為 /api');
  }

  return env;
}

export const env = readEnv();

function resolveCommunityApiBase(envShape: EnvShape): string {
  if (!envShape.VITE_API_BASE_URL) {
    // 正式環境使用同 origin 的 /api/community
    if (import.meta.env.PROD) {
      logger.warn('[env] VITE_API_BASE_URL 未設定，使用預設 /api/community');
    }
    return DEFAULT_COMMUNITY_API_BASE;
  }

  const normalized = envShape.VITE_API_BASE_URL.trim();
  if (!normalized) {
    logger.warn('[env] VITE_API_BASE_URL 為空字串，使用預設 /api/community');
    return DEFAULT_COMMUNITY_API_BASE;
  }

  return `${trimTrailingSlash(normalized)}/community`;
}

export const communityApiBase = resolveCommunityApiBase(env);
