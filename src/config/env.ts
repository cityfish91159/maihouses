const REQUIRED_KEYS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const;
const OPTIONAL_KEYS = ['VITE_API_BASE_URL', 'VITE_APP_URL'] as const;

const DEFAULT_COMMUNITY_API_BASE = '/api/community';

type RequiredKey = (typeof REQUIRED_KEYS)[number];
type OptionalKey = (typeof OPTIONAL_KEYS)[number];

type EnvShape = Record<RequiredKey, string> & Partial<Record<OptionalKey, string>>;

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
 * 顯示友善錯誤頁面（用於 PROD 環境關鍵錯誤）
 */
const showFriendlyErrorPage = (title: string, message: string): void => {
  if (typeof document !== 'undefined' && document.body) {
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;">
        <div style="text-align:center;max-width:400px;padding:2rem;">
          <div style="font-size:3rem;margin-bottom:1rem;">⚠️</div>
          <h1 style="font-size:1.25rem;font-weight:600;color:#1e293b;margin-bottom:0.5rem;">${title}</h1>
          <p style="color:#64748b;margin-bottom:1.5rem;">${message}</p>
          <a href="/" style="display:inline-block;padding:0.75rem 1.5rem;background:#3b82f6;color:white;border-radius:0.5rem;text-decoration:none;font-weight:500;">回到首頁</a>
        </div>
      </div>
    `;
  }
};

function readEnv(): EnvShape {
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
  if (env.VITE_API_BASE_URL && !isValidHttpUrl(env.VITE_API_BASE_URL) && !env.VITE_API_BASE_URL.startsWith('/')) {
    console.warn('[env] VITE_API_BASE_URL 格式無效，應為 HTTP(S) URL 或以 / 開頭的路徑');
  }

  if (!env.VITE_API_BASE_URL && import.meta.env.DEV) {
    console.warn('[env] VITE_API_BASE_URL 未設定，預設為 /api');
  }

  return env;
}

export const env = readEnv();

function resolveCommunityApiBase(envShape: EnvShape): string {
  if (!envShape.VITE_API_BASE_URL) {
    // 正式環境使用同 origin 的 /api/community
    if (import.meta.env.PROD) {
      console.warn('[env] VITE_API_BASE_URL 未設定，使用預設 /api/community');
    }
    return DEFAULT_COMMUNITY_API_BASE;
  }

  const normalized = envShape.VITE_API_BASE_URL.trim();
  if (!normalized) {
    console.warn('[env] VITE_API_BASE_URL 為空字串，使用預設 /api/community');
    return DEFAULT_COMMUNITY_API_BASE;
  }

  return `${trimTrailingSlash(normalized)}/community`;
}

export const communityApiBase = resolveCommunityApiBase(env);