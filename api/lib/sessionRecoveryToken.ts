import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

// ============================================================================
// Constants
// ============================================================================

const TOKEN_VERSION = 1 as const;
const TOKEN_DELIMITER = '.';
const TOKEN_ID_BYTES = 16;
const MAX_TOKEN_LENGTH = 4096;
const DEFAULT_TOKEN_TTL_MS = 2 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const DEV_RECOVERY_SECRET = 'dev-only-session-recovery-secret-change-me';

// ============================================================================
// Types
// ============================================================================

export interface RecoverySessionData {
  sessionId: string;
  grade: string;
  lastActive: string;
}

interface RecoveryTokenPayload {
  v: typeof TOKEN_VERSION;
  jti: string;
  iat: number;
  exp: number;
}

interface RecoveryTokenStoreRecord {
  exp: number;
  session: RecoverySessionData;
}

// ============================================================================
// In-memory store (single-use token records)
// ============================================================================

const recoveryTokenStore = new Map<string, RecoveryTokenStoreRecord>();

function cleanupExpiredTokens(now: number): void {
  for (const [tokenId, record] of recoveryTokenStore.entries()) {
    if (record.exp <= now) {
      recoveryTokenStore.delete(tokenId);
    }
  }
}

const cleanupTimer = setInterval(() => {
  cleanupExpiredTokens(Date.now());
}, CLEANUP_INTERVAL_MS);

if (typeof cleanupTimer.unref === 'function') {
  cleanupTimer.unref();
}

// ============================================================================
// Helpers
// ============================================================================

function getRecoveryTokenSecret(): string {
  const explicitSecret = process.env.SESSION_RECOVERY_TOKEN_SECRET?.trim();
  if (explicitSecret) return explicitSecret;

  const fallbackSecret = process.env.UAG_TOKEN_SECRET?.trim();
  if (fallbackSecret) return fallbackSecret;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_RECOVERY_TOKEN_SECRET is required in production');
  }

  return DEV_RECOVERY_SECRET;
}

function getTokenTtlMs(): number {
  const rawValue = process.env.SESSION_RECOVERY_TOKEN_TTL_MS;
  if (!rawValue) return DEFAULT_TOKEN_TTL_MS;

  const parsedValue = Number(rawValue);
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return DEFAULT_TOKEN_TTL_MS;
  }

  return Math.floor(parsedValue);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isRecoveryTokenPayload(value: unknown): value is RecoveryTokenPayload {
  if (!isRecord(value)) return false;

  return (
    value.v === TOKEN_VERSION &&
    typeof value.jti === 'string' &&
    value.jti.length > 0 &&
    typeof value.iat === 'number' &&
    Number.isFinite(value.iat) &&
    typeof value.exp === 'number' &&
    Number.isFinite(value.exp) &&
    value.exp > value.iat
  );
}

function validateSessionData(session: RecoverySessionData): void {
  if (!session.sessionId.trim()) {
    throw new Error('sessionId is required');
  }
  if (!session.grade.trim()) {
    throw new Error('grade is required');
  }
  if (!session.lastActive.trim()) {
    throw new Error('lastActive is required');
  }
}

function signEncodedPayload(encodedPayload: string, secret: string): string {
  return createHmac('sha256', secret).update(encodedPayload).digest('base64url');
}

function verifySignature(encodedPayload: string, signature: string, secret: string): boolean {
  const expectedSignature = signEncodedPayload(encodedPayload, secret);
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  const actualBuffer = Buffer.from(signature, 'utf8');

  if (expectedBuffer.length !== actualBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, actualBuffer);
}

function decodePayload(encodedPayload: string): RecoveryTokenPayload | null {
  try {
    const payloadJson = Buffer.from(encodedPayload, 'base64url').toString('utf8');
    const parsedPayload: unknown = JSON.parse(payloadJson);
    if (!isRecoveryTokenPayload(parsedPayload)) return null;
    return parsedPayload;
  } catch {
    return null;
  }
}

// ============================================================================
// Public API
// ============================================================================

export function issueSessionRecoveryToken(session: RecoverySessionData): string {
  validateSessionData(session);

  cleanupExpiredTokens(Date.now());

  const now = Date.now();
  const exp = now + getTokenTtlMs();
  const tokenId = randomBytes(TOKEN_ID_BYTES).toString('hex');
  const payload: RecoveryTokenPayload = {
    v: TOKEN_VERSION,
    jti: tokenId,
    iat: now,
    exp,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = signEncodedPayload(encodedPayload, getRecoveryTokenSecret());
  const signedToken = `${encodedPayload}${TOKEN_DELIMITER}${signature}`;

  recoveryTokenStore.set(tokenId, {
    exp,
    session: { ...session },
  });

  return signedToken;
}

export function consumeSessionRecoveryToken(token: string): RecoverySessionData | null {
  if (typeof token !== 'string') return null;

  const trimmedToken = token.trim();
  if (!trimmedToken || trimmedToken.length > MAX_TOKEN_LENGTH) return null;

  const delimiterIndex = trimmedToken.indexOf(TOKEN_DELIMITER);
  if (delimiterIndex <= 0 || delimiterIndex >= trimmedToken.length - 1) return null;

  const encodedPayload = trimmedToken.slice(0, delimiterIndex);
  const signature = trimmedToken.slice(delimiterIndex + 1);
  const secret = getRecoveryTokenSecret();

  if (!verifySignature(encodedPayload, signature, secret)) {
    return null;
  }

  const payload = decodePayload(encodedPayload);
  if (!payload) {
    return null;
  }

  const now = Date.now();
  if (payload.exp <= now) {
    recoveryTokenStore.delete(payload.jti);
    return null;
  }

  const tokenRecord = recoveryTokenStore.get(payload.jti);
  if (!tokenRecord) {
    return null;
  }

  recoveryTokenStore.delete(payload.jti);

  if (tokenRecord.exp <= now) {
    return null;
  }

  return { ...tokenRecord.session };
}

export function resetSessionRecoveryTokenState(): void {
  recoveryTokenStore.clear();
}

