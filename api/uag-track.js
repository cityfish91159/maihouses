/**
 * @deprecated 此檔案已棄用，請使用 api/uag/track.ts
 * 保留此檔案僅為向後兼容，新功能請在 TypeScript 版本中開發
 * Migration: 2026-01-10
 */
import { createClient } from '@supabase/supabase-js';
import { enforceCors } from './lib/cors';
import { logger } from './lib/logger';

const UAG_RPC_VERSION = process.env.UAG_RPC_VERSION || 'v8_2';
const DEFAULT_AGENT_ID = 'unknown';

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function parseBody(rawBody) {
  if (typeof rawBody === 'string') {
    try {
      return { ok: true, data: JSON.parse(rawBody) };
    } catch {
      return { ok: false, error: 'Invalid JSON' };
    }
  }

  if (!rawBody || typeof rawBody !== 'object') {
    return { ok: false, error: 'Invalid payload' };
  }

  return { ok: true, data: rawBody };
}

function validateEvent(event) {
  if (!event || typeof event !== 'object') {
    return { ok: false, error: 'Invalid event structure' };
  }

  if (!event.property_id || typeof event.property_id !== 'string') {
    return { ok: false, error: 'Invalid event structure' };
  }

  return { ok: true };
}

function buildRpcPayload(data) {
  return {
    p_session_id: data.session_id,
    p_agent_id: typeof data.agent_id === 'string' && data.agent_id ? data.agent_id : DEFAULT_AGENT_ID,
    p_fingerprint: data.fingerprint || null,
    p_event_data: data.event,
  };
}

async function runTrackRpc(rpcName, payload) {
  const { data, error } = await supabase.rpc(rpcName, payload);
  return { data, error };
}

export default async function handler(req, res) {
  if (!enforceCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parsedBody = parseBody(req.body);
  if (!parsedBody.ok) {
    return res.status(400).json({ error: parsedBody.error });
  }

  const data = parsedBody.data;
  if (!data.session_id || !data.event) {
    return res.status(400).json({ error: 'Missing required fields: session_id or event' });
  }

  const eventValidation = validateEvent(data.event);
  if (!eventValidation.ok) {
    return res.status(400).json({ error: eventValidation.error });
  }

  const rpcName = UAG_RPC_VERSION === 'v8_2' ? 'track_uag_event_v8_2' : 'track_uag_event_v8';
  const payload = buildRpcPayload(data);

  try {
    const { data: result, error } = await runTrackRpc(rpcName, payload);

    if (error) {
      logger.error('[uag-track] Primary RPC failed', {
        rpcName,
        error: error.message,
      });

      if (UAG_RPC_VERSION === 'v8_2') {
        const { data: fallbackResult, error: fallbackError } = await runTrackRpc(
          'track_uag_event_v8',
          payload
        );

        if (!fallbackError) {
          return res.status(200).json(fallbackResult);
        }

        logger.error('[uag-track] Fallback RPC failed', {
          rpcName: 'track_uag_event_v8',
          error: fallbackError.message,
        });
      }

      return res.status(500).json({ error: error.message });
    }

    if (result && result.grade === 'S') {
      logger.info('[uag-track] S-grade lead detected', {
        sessionId: payload.p_session_id,
        score: result.score,
        reason: result.reason,
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    logger.error('[uag-track] Unexpected error', {
      message: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
