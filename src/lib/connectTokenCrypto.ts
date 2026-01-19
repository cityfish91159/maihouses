/**
 * UAG Connect Token 前端解密模組
 *
 * 使用 Web Crypto API 解密後端加密的 Connect Token
 * 向後兼容：同時支援舊版 base64url 格式和新版 AES-256-GCM 加密格式
 */

// ============================================================================
// Constants
// ============================================================================

// 加密參數（需與後端一致）
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * 開發環境預設密鑰（需與後端一致）
 * 生產環境應通過環境變數配置
 */
const DEV_SECRET_KEY = "dev-only-secret-key-32-bytes!!!!";

// ============================================================================
// Types
// ============================================================================

interface ConnectTokenPayload {
  conversationId: string;
  sessionId: string;
  propertyId?: string;
  exp: number;
}

// [NASA TypeScript Safety] 類型守衛驗證 ConnectTokenPayload
function isConnectTokenPayload(obj: unknown): obj is ConnectTokenPayload {
  if (typeof obj !== "object" || obj === null) return false;
  const record = obj as Record<string, unknown>;
  return (
    typeof record.conversationId === "string" &&
    typeof record.sessionId === "string" &&
    typeof record.exp === "number"
  );
}

type TokenFormat = "encrypted" | "legacy" | "invalid";

interface ParseResult {
  success: boolean;
  payload: ConnectTokenPayload | null;
  format: TokenFormat;
  error?: string;
}

// ============================================================================
// Telemetry
// ============================================================================

/**
 * 記錄 Token 解析結果（用於監控和除錯）
 */
function logTokenParsing(
  result: ParseResult,
  durationMs: number,
  tokenLength: number,
): void {
  const isProduction = import.meta.env.PROD;

  // 開發環境詳細日誌
  if (!isProduction) {
    console.debug("[ConnectToken]", {
      success: result.success,
      format: result.format,
      durationMs: durationMs.toFixed(2),
      tokenLength,
      error: result.error,
    });
  }

  // 生產環境只記錄失敗情況（簡化版）
  if (isProduction && !result.success) {
    console.warn("[ConnectToken] Parse failed:", {
      format: result.format,
      error: result.error,
      tokenLength,
    });
  }
}

/**
 * 記錄效能指標（如果可用）
 */
function recordMetric(name: string, value: number): void {
  // 使用 Performance API 記錄（如果可用）
  if (
    typeof performance !== "undefined" &&
    typeof performance.measure === "function"
  ) {
    try {
      performance.measure(name, {
        start: performance.now() - value,
        duration: value,
      });
    } catch {
      // 忽略不支援的瀏覽器
    }
  }
}

// ============================================================================
// Crypto Helpers
// ============================================================================

/**
 * 將字串轉換為固定長度的密鑰（SHA-256）
 */
async function deriveKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);

  // 如果密鑰過短，使用 SHA-256 擴展
  const keyMaterial =
    keyData.length >= 32
      ? keyData.slice(0, 32)
      : new Uint8Array(await crypto.subtle.digest("SHA-256", keyData));

  return crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "AES-GCM" },
    false,
    ["decrypt"],
  );
}

/**
 * Base64URL 解碼
 */
function base64UrlDecode(base64url: string): Uint8Array {
  // base64url -> base64
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

  const binaryString = atob(padded);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// ============================================================================
// Token Parsing
// ============================================================================

/**
 * 嘗試解密加密版 Connect Token（AES-256-GCM）
 */
async function tryDecryptToken(
  token: string,
  secretKey: string,
): Promise<ConnectTokenPayload | null> {
  try {
    const combined = base64UrlDecode(token);

    // 解析格式：IV (12 bytes) + AuthTag (16 bytes) + Ciphertext
    if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
      return null;
    }

    const iv = combined.slice(0, IV_LENGTH);
    const authTag = combined.slice(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = combined.slice(IV_LENGTH + AUTH_TAG_LENGTH);

    // 合併 ciphertext 和 authTag（Web Crypto API 要求）
    const ciphertextWithTag = new Uint8Array(
      ciphertext.length + authTag.length,
    );
    ciphertextWithTag.set(ciphertext);
    ciphertextWithTag.set(authTag, ciphertext.length);

    const key = await deriveKey(secretKey);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertextWithTag,
    );

    const plaintext = new TextDecoder().decode(decrypted);
    const parsed: unknown = JSON.parse(plaintext);
    // [NASA TypeScript Safety] 使用類型守衛取代 as ConnectTokenPayload
    if (isConnectTokenPayload(parsed)) return parsed;
    return null;
  } catch {
    return null;
  }
}

/**
 * 嘗試解碼舊版 base64url Token（向後兼容）
 */
function tryDecodeOldToken(token: string): ConnectTokenPayload | null {
  try {
    const bytes = base64UrlDecode(token);
    const decoded = new TextDecoder().decode(bytes);
    const parsed: unknown = JSON.parse(decoded);
    // [NASA TypeScript Safety] 使用類型守衛取代 as ConnectTokenPayload
    if (!isConnectTokenPayload(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * 解析 Connect Token（自動判斷格式）
 *
 * 優先嘗試解密新版加密格式，失敗則嘗試舊版 base64url 格式
 *
 * @param token - Connect Token 字串
 * @returns 解析後的 payload，或 null（無效/過期）
 */
export async function parseConnectToken(
  token: string,
): Promise<ConnectTokenPayload | null> {
  const startTime = performance.now();
  const tokenLength = token.length;

  // 獲取密鑰（從環境變數或使用預設）
  const secretKey = import.meta.env.VITE_UAG_TOKEN_SECRET || DEV_SECRET_KEY;

  // 嘗試解密新版格式
  const decrypted = await tryDecryptToken(token, secretKey);
  if (decrypted) {
    const duration = performance.now() - startTime;
    const result: ParseResult = {
      success: true,
      payload: decrypted,
      format: "encrypted",
    };
    logTokenParsing(result, duration, tokenLength);
    recordMetric("connectToken.decrypt", duration);
    return decrypted;
  }

  // 向後兼容：嘗試舊版 base64url 格式
  const legacy = tryDecodeOldToken(token);
  const duration = performance.now() - startTime;

  if (legacy) {
    const result: ParseResult = {
      success: true,
      payload: legacy,
      format: "legacy",
    };
    logTokenParsing(result, duration, tokenLength);
    recordMetric("connectToken.decodeLegacy", duration);
    return legacy;
  }

  // 解析失敗
  const result: ParseResult = {
    success: false,
    payload: null,
    format: "invalid",
    error: "Unable to parse token with any known format",
  };
  logTokenParsing(result, duration, tokenLength);
  return null;
}

/**
 * 檢查 Token 是否已過期
 */
export function isTokenExpired(payload: ConnectTokenPayload): boolean {
  return Date.now() > payload.exp;
}

/**
 * 獲取 Token 剩餘有效時間（毫秒）
 */
export function getTokenRemainingTime(payload: ConnectTokenPayload): number {
  return Math.max(0, payload.exp - Date.now());
}
