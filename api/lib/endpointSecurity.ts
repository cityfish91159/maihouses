import type { VercelRequest, VercelResponse } from '@vercel/node';
import { enforceCors } from './cors';
import { logger } from './logger';
import { rateLimitMiddleware } from './rateLimiter';

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  maxEnvVar?: string;
  windowEnvVar?: string;
}

export interface EndpointSecurityOptions {
  endpointName: string;
  allowedMethods: string[];
  requireSystemKey?: boolean;
  systemKeyEnvVar?: string;
  rateLimit?: RateLimitOptions;
}

const HTTP_STATUS_METHOD_NOT_ALLOWED = 405;
const HTTP_STATUS_UNAUTHORIZED = 401;
const HTTP_STATUS_SERVICE_UNAVAILABLE = 503;
const HTTP_STATUS_TOO_MANY_REQUESTS = 429;
const DEFAULT_SYSTEM_KEY_ENV_VAR = 'SYSTEM_API_KEY';

const ERROR_METHOD_NOT_ALLOWED = 'Method not allowed';
const ERROR_UNAUTHORIZED = 'Unauthorized';
const ERROR_RATE_LIMITED = 'Too many requests, please try again later.';

function getHeaderValue(headerValue: string | string[] | undefined): string {
  if (typeof headerValue === 'string') return headerValue;
  if (Array.isArray(headerValue) && headerValue.length > 0) return headerValue[0] ?? '';
  return '';
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function resolveRateLimitConfig(rateLimit: RateLimitOptions): { maxRequests: number; windowMs: number } {
  return {
    maxRequests: parsePositiveInt(
      rateLimit.maxEnvVar ? process.env[rateLimit.maxEnvVar] : undefined,
      rateLimit.maxRequests
    ),
    windowMs: parsePositiveInt(
      rateLimit.windowEnvVar ? process.env[rateLimit.windowEnvVar] : undefined,
      rateLimit.windowMs
    ),
  };
}

function isMethodAllowed(req: VercelRequest, res: VercelResponse, allowedMethods: string[]): boolean {
  const normalizedMethods = allowedMethods.map((method) => method.toUpperCase());
  const method = (req.method || '').toUpperCase();

  if (normalizedMethods.includes(method)) {
    return true;
  }

  res.setHeader('Allow', normalizedMethods.join(', '));
  res.status(HTTP_STATUS_METHOD_NOT_ALLOWED).json({ error: ERROR_METHOD_NOT_ALLOWED });
  return false;
}

function isSystemKeyAuthorized(
  req: VercelRequest,
  res: VercelResponse,
  endpointName: string,
  systemKeyEnvVar: string
): boolean {
  const expectedSystemKey = process.env[systemKeyEnvVar];

  if (!expectedSystemKey) {
    logger.error(`[${endpointName}] Missing required system key env var`, undefined, {
      systemKeyEnvVar,
    });
    res.status(HTTP_STATUS_SERVICE_UNAVAILABLE).json({ error: `${systemKeyEnvVar} not configured` });
    return false;
  }

  const requestSystemKey = getHeaderValue(req.headers['x-system-key']);
  if (!requestSystemKey || requestSystemKey !== expectedSystemKey) {
    res.status(HTTP_STATUS_UNAUTHORIZED).json({ error: ERROR_UNAUTHORIZED });
    return false;
  }

  return true;
}

function isWithinRateLimit(req: VercelRequest, res: VercelResponse, rateLimit: RateLimitOptions): boolean {
  const { maxRequests, windowMs } = resolveRateLimitConfig(rateLimit);
  const rateLimitError = rateLimitMiddleware(req, maxRequests, windowMs);

  if (!rateLimitError) {
    return true;
  }

  res.setHeader('X-RateLimit-Remaining', rateLimitError.remaining.toString());
  res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimitError.resetTime / 1000).toString());
  if (rateLimitError.retryAfter) {
    res.setHeader('Retry-After', rateLimitError.retryAfter.toString());
  }
  res.status(HTTP_STATUS_TOO_MANY_REQUESTS).json({
    error: ERROR_RATE_LIMITED,
    retryAfter: rateLimitError.retryAfter,
  });
  return false;
}

export function secureEndpoint(
  req: VercelRequest,
  res: VercelResponse,
  options: EndpointSecurityOptions
): boolean {
  if (!enforceCors(req, res)) return false;
  if (!isMethodAllowed(req, res, options.allowedMethods)) return false;

  if (options.requireSystemKey) {
    const systemKeyEnvVar = options.systemKeyEnvVar || DEFAULT_SYSTEM_KEY_ENV_VAR;
    if (!isSystemKeyAuthorized(req, res, options.endpointName, systemKeyEnvVar)) return false;
  }

  if (options.rateLimit && !isWithinRateLimit(req, res, options.rateLimit)) return false;

  return true;
}
