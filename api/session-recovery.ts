import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'crypto';
import { z } from 'zod';
import { enforceCors } from './lib/cors';
import { logger } from './lib/logger';
import { checkRateLimit, getIdentifier } from './lib/rateLimiter';
import {
  consumeSessionRecoveryToken,
  issueSessionRecoveryToken,
  type RecoverySessionData,
} from './lib/sessionRecoveryToken';

// ============================================================================
// Constants
// ============================================================================

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_LOOKUP_RATE_LIMIT_MAX = 5;
const DEFAULT_LOOKUP_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const DEFAULT_REDEEM_RATE_LIMIT_MAX = 20;
const DEFAULT_REDEEM_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const LOOKUP_RATE_LIMIT_MAX_ENV = 'RATE_LIMIT_SESSION_RECOVERY_LOOKUP_MAX';
const LOOKUP_RATE_LIMIT_WINDOW_ENV = 'RATE_LIMIT_SESSION_RECOVERY_LOOKUP_WINDOW_MS';
const REDEEM_RATE_LIMIT_MAX_ENV = 'RATE_LIMIT_SESSION_RECOVERY_REDEEM_MAX';
const REDEEM_RATE_LIMIT_WINDOW_ENV = 'RATE_LIMIT_SESSION_RECOVERY_REDEEM_WINDOW_MS';
const RATE_LIMIT_ERROR_MESSAGE = 'Too many requests, please try again later.';
const INVALID_REQUEST_BODY_MESSAGE = 'Invalid request body';
const INVALID_RECOVERY_TOKEN_MESSAGE = 'Invalid or expired recovery token';

// ============================================================================
// Schemas
// ============================================================================

const SessionRecoveryLookupRequestSchema = z
  .object({
    fingerprint: z.string().trim().min(1),
    agentId: z.string().trim().optional(),
  })
  .strict();

const SessionRecoveryRedeemRequestSchema = z
  .object({
    recoveryToken: z.string().trim().min(1).max(4096),
  })
  .strict();

// ============================================================================
// Types
// ============================================================================

export interface SessionRecoveryLookupRequest {
  fingerprint: string;
  agentId?: string;
}

export interface SessionRecoveryRedeemRequest {
  recoveryToken: string;
}

export type SessionRecoveryRequest = SessionRecoveryLookupRequest | SessionRecoveryRedeemRequest;

export interface SessionRecoveryResponse {
  recovered: boolean;
  recovery_token?: string;
  session_id?: string;
  grade?: string;
  last_active?: string;
  error?: string;
  retryAfter?: number;
}

interface SessionData {
  session_id: string;
  last_active: string;
  grade: string;
}

type ParsedRequestBody =
  | { kind: 'lookup'; payload: SessionRecoveryLookupRequest }
  | { kind: 'redeem'; payload: SessionRecoveryRedeemRequest };

// ============================================================================
// Supabase Client
// ============================================================================

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// Helpers
// ============================================================================

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) return fallback;
  return Math.floor(parsedValue);
}

function resolveRateLimitConfig(
  maxEnvVar: string,
  windowEnvVar: string,
  maxFallback: number,
  windowFallback: number
): { maxRequests: number; windowMs: number } {
  return {
    maxRequests: parsePositiveInt(process.env[maxEnvVar], maxFallback),
    windowMs: parsePositiveInt(process.env[windowEnvVar], windowFallback),
  };
}

function parseRequestBody(body: unknown): ParsedRequestBody | null {
  const lookupResult = SessionRecoveryLookupRequestSchema.safeParse(body);
  if (lookupResult.success) {
    return {
      kind: 'lookup',
      payload: lookupResult.data,
    };
  }

  const redeemResult = SessionRecoveryRedeemRequestSchema.safeParse(body);
  if (redeemResult.success) {
    return {
      kind: 'redeem',
      payload: redeemResult.data,
    };
  }

  return null;
}

function getFingerprintHash(fingerprint: string): string {
  return createHash('sha256').update(fingerprint).digest('hex').slice(0, 16);
}

function enforceRequestRateLimit(
  res: VercelResponse,
  identifier: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const rateLimitResult = checkRateLimit(identifier, maxRequests, windowMs);

  res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000).toString());

  if (rateLimitResult.allowed) {
    return true;
  }

  if (rateLimitResult.retryAfter !== undefined) {
    res.setHeader('Retry-After', rateLimitResult.retryAfter.toString());
  }

  res.status(429).json({
    recovered: false,
    error: RATE_LIMIT_ERROR_MESSAGE,
    retryAfter: rateLimitResult.retryAfter,
  } satisfies SessionRecoveryResponse);

  return false;
}

async function findRecoverableSession(
  fingerprint: string,
  agentId?: string
): Promise<SessionData | null> {
  const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS).toISOString();

  let query = supabase
    .from('uag_sessions')
    .select('session_id, last_active, grade')
    .eq('fingerprint', fingerprint)
    .gte('last_active', sevenDaysAgo)
    .order('last_active', { ascending: false })
    .limit(1);

  if (agentId && agentId !== 'unknown') {
    query = query.eq('agent_id', agentId);
  }

  const { data, error } = await query.single<SessionData>();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data ?? null;
}

async function handleLookupRequest(
  req: VercelRequest,
  res: VercelResponse,
  payload: SessionRecoveryLookupRequest
): Promise<void> {
  const clientIp = getIdentifier(req);
  const fingerprintHash = getFingerprintHash(payload.fingerprint);
  const lookupRateLimit = resolveRateLimitConfig(
    LOOKUP_RATE_LIMIT_MAX_ENV,
    LOOKUP_RATE_LIMIT_WINDOW_ENV,
    DEFAULT_LOOKUP_RATE_LIMIT_MAX,
    DEFAULT_LOOKUP_RATE_LIMIT_WINDOW_MS
  );
  const lookupRateLimitKey = `session-recovery:lookup:${clientIp}:${fingerprintHash}`;

  if (
    !enforceRequestRateLimit(
      res,
      lookupRateLimitKey,
      lookupRateLimit.maxRequests,
      lookupRateLimit.windowMs
    )
  ) {
    return;
  }

  const session = await findRecoverableSession(payload.fingerprint, payload.agentId);
  if (!session) {
    logger.info('[session-recovery] No session found', {
      fingerprintHash,
      agentId: payload.agentId,
    });
    res.status(200).json({ recovered: false } satisfies SessionRecoveryResponse);
    return;
  }

  const recoveryToken = issueSessionRecoveryToken({
    sessionId: session.session_id,
    grade: session.grade,
    lastActive: session.last_active,
  } satisfies RecoverySessionData);

  logger.info('[session-recovery] Issued one-time recovery token', {
    fingerprintHash,
    grade: session.grade,
    lastActive: session.last_active,
    agentId: payload.agentId,
  });

  res.status(200).json({
    recovered: true,
    recovery_token: recoveryToken,
    grade: session.grade,
    last_active: session.last_active,
  } satisfies SessionRecoveryResponse);
}

function handleRedeemRequest(
  req: VercelRequest,
  res: VercelResponse,
  payload: SessionRecoveryRedeemRequest
): void {
  const clientIp = getIdentifier(req);
  const redeemRateLimit = resolveRateLimitConfig(
    REDEEM_RATE_LIMIT_MAX_ENV,
    REDEEM_RATE_LIMIT_WINDOW_ENV,
    DEFAULT_REDEEM_RATE_LIMIT_MAX,
    DEFAULT_REDEEM_RATE_LIMIT_WINDOW_MS
  );
  const redeemRateLimitKey = `session-recovery:redeem:${clientIp}`;

  if (
    !enforceRequestRateLimit(
      res,
      redeemRateLimitKey,
      redeemRateLimit.maxRequests,
      redeemRateLimit.windowMs
    )
  ) {
    return;
  }

  const session = consumeSessionRecoveryToken(payload.recoveryToken);
  if (!session) {
    res.status(200).json({
      recovered: false,
      error: INVALID_RECOVERY_TOKEN_MESSAGE,
    } satisfies SessionRecoveryResponse);
    return;
  }

  logger.info('[session-recovery] Redeemed one-time recovery token', {
    grade: session.grade,
    lastActive: session.lastActive,
  });

  res.status(200).json({
    recovered: true,
    session_id: session.sessionId,
    grade: session.grade,
    last_active: session.lastActive,
  } satisfies SessionRecoveryResponse);
}

// ============================================================================
// Handler
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!enforceCors(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({
      error: 'Method not allowed',
      recovered: false,
    } satisfies SessionRecoveryResponse);
    return;
  }

  const parsedBody = parseRequestBody(req.body);
  if (!parsedBody) {
    res.status(400).json({
      error: INVALID_REQUEST_BODY_MESSAGE,
      recovered: false,
    } satisfies SessionRecoveryResponse);
    return;
  }

  try {
    if (parsedBody.kind === 'lookup') {
      await handleLookupRequest(req, res, parsedBody.payload);
      return;
    }

    handleRedeemRequest(req, res, parsedBody.payload);
  } catch (error) {
    logger.error(
      '[session-recovery] Unexpected error',
      error instanceof Error ? error : new Error(String(error)),
      { requestKind: parsedBody.kind }
    );
    res.status(200).json({
      recovered: false,
      error: 'Internal server error',
    } satisfies SessionRecoveryResponse);
  }
}

