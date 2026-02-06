/**
 * UAG Connect Token 加密模組
 *
 * 使用 AES-256-GCM 加密 Connect Token，防止敏感資料外洩
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// 加密算法
const ALGORITHM = 'aes-256-gcm';
// IV 長度（GCM 推薦 12 bytes）
const IV_LENGTH = 12;
// Auth Tag 長度
const AUTH_TAG_LENGTH = 16;

/**
 * 獲取加密密鑰
 * 從環境變數讀取，若不存在則使用預設密鑰（僅開發環境）
 */
function getSecretKey(): Buffer {
  const secret = process.env.UAG_TOKEN_SECRET;

  if (!secret) {
    // 開發環境使用預設密鑰（生產環境應配置 UAG_TOKEN_SECRET）
    if (process.env.NODE_ENV === 'production') {
      throw new Error('UAG_TOKEN_SECRET is required in production');
    }
    // 開發環境預設密鑰（32 bytes = 256 bits）
    return Buffer.from('dev-only-secret-key-32-bytes!!!!');
  }

  // 確保密鑰長度為 32 bytes
  const keyBuffer = Buffer.from(secret, 'utf-8');
  if (keyBuffer.length < 32) {
    // 若密鑰過短，使用 SHA256 擴展
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(secret).digest();
  }

  return keyBuffer.subarray(0, 32);
}

/** Connect Token Payload 類型 */
export interface ConnectTokenPayload {
  conversationId: string;
  sessionId: string;
  propertyId?: string;
  exp: number;
}

/**
 * 加密 Connect Token 資料
 *
 * @param payload - 要加密的 Connect Token 物件
 * @returns 加密後的 base64url 字串
 */
export function encryptConnectToken(payload: ConnectTokenPayload): string {
  const key = getSecretKey();
  const iv = randomBytes(IV_LENGTH);
  const plaintext = JSON.stringify(payload);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // 組合格式：IV (12 bytes) + AuthTag (16 bytes) + Ciphertext
  const combined = Buffer.concat([iv, authTag, encrypted]);

  return combined.toString('base64url');
}

/**
 * 解密 Connect Token
 *
 * @param token - 加密的 base64url 字串
 * @returns 解密後的 JSON 物件，或 null（解密失敗）
 */
export function decryptConnectToken(token: string): Record<string, unknown> | null {
  try {
    const key = getSecretKey();
    const combined = Buffer.from(token, 'base64url');

    // 解析格式：IV (12 bytes) + AuthTag (16 bytes) + Ciphertext
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

    return JSON.parse(decrypted.toString('utf-8'));
  } catch {
    // 解密失敗（可能是 token 被篡改或過期）
    return null;
  }
}

/**
 * 檢查 Connect Token 是否有效且未過期
 *
 * @param payload - 解密後的 payload
 * @returns 是否有效
 */
export function isTokenValid(
  payload: Record<string, unknown> | null
): payload is { conversationId: string; sessionId: string; exp: number } {
  if (!payload) return false;
  if (typeof payload.conversationId !== 'string') return false;
  if (typeof payload.sessionId !== 'string') return false;
  if (typeof payload.exp !== 'number') return false;

  // 檢查是否過期
  if (Date.now() > payload.exp) return false;

  return true;
}

/**
 * 向後兼容：嘗試解碼舊版 base64url token
 * 舊版 token 僅使用 base64url 編碼，無加密
 */
export function tryDecodeOldToken(token: string): Record<string, unknown> | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
