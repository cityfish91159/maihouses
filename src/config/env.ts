const REQUIRED_KEYS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const;
const OPTIONAL_KEYS = ['VITE_API_BASE_URL', 'VITE_APP_URL'] as const;

const DEFAULT_COMMUNITY_API_BASE = '/api/community';

type RequiredKey = (typeof REQUIRED_KEYS)[number];
type OptionalKey = (typeof OPTIONAL_KEYS)[number];

type EnvShape = Record<RequiredKey, string> & Partial<Record<OptionalKey, string>>;

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

function readEnv(): EnvShape {
  const missing = REQUIRED_KEYS.filter((key) => !import.meta.env[key]);
  if (missing.length > 0) {
    const message = `缺少必要的環境變數：${missing.join(', ')}`;
    throw new Error(message);
  }

  const env: EnvShape = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL!,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY!,
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    VITE_APP_URL: import.meta.env.VITE_APP_URL,
  };

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