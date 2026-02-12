import { createClient } from '@supabase/supabase-js';
import { enforceCors } from './lib/cors';
import { logger } from './lib/logger';

const ALLOWED_METHODS = new Set(['GET', 'POST']);
const METHOD_NOT_ALLOWED_ERROR = 'Method not allowed';
const MISSING_CRON_SECRET_ERROR = 'CRON_SECRET is not configured';
const UNAUTHORIZED_ERROR = 'Unauthorized';
const SUPABASE_NOT_CONFIGURED_ERROR = 'Supabase service role is not configured';

function getHeaderValue(headerValue) {
  if (typeof headerValue === 'string') return headerValue;
  if (Array.isArray(headerValue) && headerValue.length > 0) return headerValue[0];
  return '';
}

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export default async function handler(req, res) {
  if (!enforceCors(req, res)) return;
  if (!ALLOWED_METHODS.has(req.method)) return res.status(405).json({ error: METHOD_NOT_ALLOWED_ERROR });

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return res.status(503).json({ error: MISSING_CRON_SECRET_ERROR });

  const authHeader = getHeaderValue(req.headers['authorization']);
  if (authHeader !== `Bearer ${cronSecret}`) return res.status(401).json({ error: UNAUTHORIZED_ERROR });

  const supabase = getSupabaseClient();
  if (!supabase) return res.status(503).json({ error: SUPABASE_NOT_CONFIGURED_ERROR });

  try {
    const { data, error } = await supabase.rpc('archive_old_history');

    if (error) throw error;

    return res.status(200).json({
      success: true,
      archived_count: data,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('[archive-handler] Archive error', {
      message,
    });
    return res.status(500).json({ error: message });
  }
}

