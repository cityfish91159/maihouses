/**
 * 環境變數驗證模組
 *
 * 在應用啟動時統一檢查關鍵配置
 * 生產環境缺少必要配置時會拋出錯誤
 */

// ============================================================================
// Types
// ============================================================================

interface EnvConfig {
  // Supabase（必要）
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  // LINE（可選，但生產環境建議配置）
  LINE_CHANNEL_ACCESS_TOKEN: string | undefined;

  // Sentry（可選）
  SENTRY_DSN: string | undefined;

  // Token 加密（生產環境必要）
  UAG_TOKEN_SECRET: string | undefined;

  // 環境資訊
  NODE_ENV: string;
  isProduction: boolean;
  isDevelopment: boolean;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// Validation
// ============================================================================

/**
 * 驗證環境變數
 */
export function validateEnv(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isProduction = process.env.NODE_ENV === "production";

  // 必要配置
  if (!process.env.SUPABASE_URL) {
    errors.push("SUPABASE_URL is required");
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    errors.push("SUPABASE_SERVICE_ROLE_KEY is required");
  }

  // 生產環境必要配置
  if (isProduction) {
    if (!process.env.UAG_TOKEN_SECRET) {
      errors.push("UAG_TOKEN_SECRET is required in production");
    }

    if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
      warnings.push(
        "LINE_CHANNEL_ACCESS_TOKEN not configured. LINE notifications will be disabled.",
      );
    }

    if (!process.env.SENTRY_DSN) {
      warnings.push(
        "SENTRY_DSN not configured. Error monitoring will be disabled.",
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 確保環境變數有效（啟動時調用）
 * 生產環境缺少必要配置會拋出錯誤
 */
export function ensureValidEnv(): void {
  const result = validateEnv();

  // 記錄警告
  for (const warning of result.warnings) {
    console.warn(`[ENV] WARNING: ${warning}`);
  }

  // 錯誤時拋出
  if (!result.valid) {
    const errorMessage = result.errors.join("; ");
    console.error(`[ENV] FATAL: ${errorMessage}`);

    if (process.env.NODE_ENV === "production") {
      throw new Error(`Environment validation failed: ${errorMessage}`);
    }
  }
}

/**
 * 獲取已驗證的環境配置
 */
export function getEnvConfig(): EnvConfig {
  const NODE_ENV = process.env.NODE_ENV || "development";
  const isProduction = NODE_ENV === "production";
  const isDevelopment = NODE_ENV === "development";

  return {
    SUPABASE_URL: process.env.SUPABASE_URL || "",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    LINE_CHANNEL_ACCESS_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    SENTRY_DSN: process.env.SENTRY_DSN,
    UAG_TOKEN_SECRET: process.env.UAG_TOKEN_SECRET,
    NODE_ENV,
    isProduction,
    isDevelopment,
  };
}

/**
 * 檢查是否為開發環境
 */
export function isDevEnvironment(): boolean {
  return process.env.NODE_ENV !== "production";
}

/**
 * 獲取必要的環境變數，不存在時拋出錯誤
 */
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * 獲取可選的環境變數，提供預設值
 */
export function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}
