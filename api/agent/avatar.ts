import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'crypto';
import { cors } from '../lib/cors';
import { logger } from '../lib/logger';
import { getSupabaseAdmin } from '../lib/supabase';
import { verifyAuth, sendAuthError } from '../lib/auth';
import { successResponse, errorResponse, API_ERROR_CODES } from '../lib/apiResponse';

export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

interface ParsedFile {
  filename: string;
  mimeType: string;
  buffer: Buffer;
}

async function readBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function parseMultipart(buffer: Buffer, boundary: string): ParsedFile | null {
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  let position = buffer.indexOf(boundaryBuffer);

  while (position !== -1) {
    position += boundaryBuffer.length;

    // End marker
    if (buffer.slice(position, position + 2).toString() === '--') {
      break;
    }

    // Skip CRLF
    if (buffer.slice(position, position + 2).toString() === '\r\n') {
      position += 2;
    }

    const headerEnd = buffer.indexOf(Buffer.from('\r\n\r\n'), position);
    if (headerEnd === -1) break;

    const headerText = buffer.slice(position, headerEnd).toString('utf8');
    const contentStart = headerEnd + 4;
    const nextBoundary = buffer.indexOf(boundaryBuffer, contentStart);
    if (nextBoundary === -1) break;

    const contentEnd = nextBoundary - 2; // strip trailing CRLF
    const partBuffer = buffer.slice(contentStart, contentEnd);

    const nameMatch = headerText.match(/name=\"([^\"]+)\"/);
    const filenameMatch = headerText.match(/filename=\"([^\"]+)\"/);
    const typeMatch = headerText.match(/Content-Type:\s*([^\r\n]+)/i);

    const fieldName = nameMatch?.[1];
    if (fieldName === 'avatar' && filenameMatch?.[1] && typeMatch?.[1]) {
      return {
        filename: filenameMatch[1],
        mimeType: typeMatch[1].trim(),
        buffer: partBuffer,
      };
    }

    position = nextBoundary;
  }

  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  cors(req, res);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json(errorResponse(API_ERROR_CODES.METHOD_NOT_ALLOWED, 'Method not allowed'));
    return;
  }

  const authResult = await verifyAuth(req);
  if (!authResult.success) {
    sendAuthError(res, authResult);
    return;
  }

  const contentType = req.headers['content-type'] || '';
  const boundaryMatch = contentType.match(/boundary=([^;]+)/i);
  const boundary = boundaryMatch?.[1]?.trim().replace(/^\"|\"$/g, '');

  if (!boundary) {
    res.status(400).json(errorResponse(API_ERROR_CODES.INVALID_INPUT, '缺少 multipart boundary'));
    return;
  }

  try {
    const bodyBuffer = await readBody(req);
    const parsed = parseMultipart(bodyBuffer, boundary);

    if (!parsed) {
      res.status(400).json(errorResponse(API_ERROR_CODES.INVALID_INPUT, '缺少 avatar 檔案'));
      return;
    }

    if (!ALLOWED_MIME.has(parsed.mimeType)) {
      res
        .status(400)
        .json(errorResponse(API_ERROR_CODES.INVALID_INPUT, '僅支援 jpg/png/webp 格式'));
      return;
    }

    if (parsed.buffer.length > MAX_FILE_SIZE) {
      res
        .status(400)
        .json(errorResponse(API_ERROR_CODES.INVALID_INPUT, '檔案大小不可超過 2MB'));
      return;
    }

    const fileExt = (() => {
      const ext = parsed.filename.split('.').pop()?.toLowerCase();
      if (ext === 'jpg' || ext === 'jpeg') return 'jpg';
      if (ext === 'png') return 'png';
      if (ext === 'webp') return 'webp';
      if (parsed.mimeType.includes('png')) return 'png';
      if (parsed.mimeType.includes('webp')) return 'webp';
      return 'jpg';
    })();

    const filePath = `${authResult.userId}/${randomUUID()}.${fileExt}`;
    const supabase = getSupabaseAdmin();

    const { error: uploadError } = await supabase.storage
      .from('agent-avatars')
      .upload(filePath, parsed.buffer, {
        contentType: parsed.mimeType,
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      logger.error('[agent/avatar] upload failed', { error: uploadError.message });
      res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.DATA_FETCH_FAILED, '上傳失敗，請稍後再試'));
      return;
    }

    const { data: publicData } = supabase.storage
      .from('agent-avatars')
      .getPublicUrl(filePath);

    const publicUrl = publicData.publicUrl;

    const { error: updateError } = await supabase
      .from('agents')
      .update({ avatar_url: publicUrl })
      .eq('id', authResult.userId);

    if (updateError) {
      logger.error('[agent/avatar] update avatar_url failed', {
        error: updateError.message,
        id: authResult.userId,
      });
    }

    res.status(200).json(successResponse({ avatar_url: publicUrl }));
  } catch (e) {
    logger.error('[agent/avatar] POST error', {
      error: e instanceof Error ? e.message : e,
      id: authResult.userId,
    });
    res.status(500).json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, '伺服器內部錯誤'));
  }
}
