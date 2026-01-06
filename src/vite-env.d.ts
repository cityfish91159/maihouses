/// <reference types="vite/client" />

/**
 * Vite 環境變數類型定義
 *
 * 所有 VITE_ 開頭的環境變數需要在此定義類型
 */
interface ImportMetaEnv {
  /** Supabase 專案 URL */
  readonly VITE_SUPABASE_URL: string;
  /** Supabase 匿名金鑰 */
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** API 基底 URL（可選） */
  readonly VITE_API_BASE_URL?: string;
  /** App URL（可選） */
  readonly VITE_APP_URL?: string;
  /** VAPID 公鑰（Web Push 推播用，可選） */
  readonly VITE_VAPID_PUBLIC_KEY?: string;
  /** AI Proxy URL（可選） */
  readonly VITE_AI_PROXY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
