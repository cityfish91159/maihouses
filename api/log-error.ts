import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { logger } from './lib/logger';
import { enforceCors } from './lib/cors';

// [NASA TypeScript Safety] Error Payload Schema
const IncomingErrorPayloadSchema = z.object({
  error: z
    .object({
      message: z.string().optional(),
      stack: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
  componentStack: z.string().optional(),
  url: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: z.string().optional(),
});

type IncomingErrorPayload = {
  error?: {
    message?: string;
    stack?: string;
    name?: string;
  };
  componentStack?: string;
  url?: string;
  userAgent?: string;
  timestamp?: string;
};

const MAX_STACK_LENGTH = 2000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!enforceCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const rawBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    // [NASA TypeScript Safety] 使用 Zod safeParse 取代 as IncomingErrorPayload
    const parseResult = IncomingErrorPayloadSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: 'Invalid error payload format' });
    }
    const payload = parseResult.data;

    if (!payload?.error?.message) {
      return res.status(400).json({ success: false, error: 'Missing error message' });
    }

    const sanitized = {
      message: payload.error.message.slice(0, 500),
      stack: payload.error.stack ? payload.error.stack.slice(0, MAX_STACK_LENGTH) : undefined,
      name: payload.error.name?.slice(0, 120),
      componentStack: payload.componentStack?.slice(0, MAX_STACK_LENGTH),
      url: payload.url?.slice(0, 500),
      userAgent: payload.userAgent?.slice(0, 500),
      timestamp: payload.timestamp ?? new Date().toISOString(),
    };

    logger.error('[log-error] Client error reported', null, sanitized);

    return res.status(200).json({ success: true, recordedAt: sanitized.timestamp });
  } catch (error) {
    logger.error('[log-error] Failed to record client error', error);
    return res.status(400).json({ success: false, error: 'Invalid JSON payload' });
  }
}
