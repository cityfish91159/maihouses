import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { logger } from '../lib/logger';
import { errorResponse, API_ERROR_CODES } from '../lib/apiResponse';
import { SYSTEM_API_KEY } from './_utils';
import autoCreateCaseHandler from './auto-create-case';

const ALLOWED_ORIGINS = new Set([
  'https://maihouses.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
]);

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.has(origin);
}

const PublicRequestSchema = z.object({
  propertyId: z
    .string()
    .min(1, 'propertyId 不可為空')
    .regex(/^MH-\d+$/, 'propertyId 格式錯誤（應為 MH-XXXXX）'),
  userId: z.string().uuid('userId 格式錯誤').optional(),
  userName: z.string().min(1, 'userName 不可為空').max(50, 'userName 不可超過 50 字').optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST' && req.method !== 'OPTIONS') {
    res.status(405).json(errorResponse(API_ERROR_CODES.METHOD_NOT_ALLOWED, 'Method Not Allowed'));
    return;
  }

  if (req.method === 'POST') {
    const origin = req.headers.origin;
    if (!isAllowedOrigin(origin)) {
      logger.warn('[trust/auto-create-case-public] Blocked origin', { origin });
      res
        .status(403)
        .json(errorResponse(API_ERROR_CODES.FORBIDDEN, '此來源不允許呼叫此 API'));
      return;
    }

    const bodyResult = PublicRequestSchema.safeParse(req.body);
    if (!bodyResult.success) {
      res
        .status(400)
        .json(errorResponse(API_ERROR_CODES.INVALID_INPUT, '請求參數格式錯誤', bodyResult.error.issues));
      return;
    }
  }

  (req.headers as Record<string, string | string[] | undefined>)['x-system-key'] = SYSTEM_API_KEY;
  await autoCreateCaseHandler(req, res);
}
