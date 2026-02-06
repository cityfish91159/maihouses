import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getEnvConfig } from './env';

let cachedAdminClient: SupabaseClient | null = null;

/**
 * 建立 Supabase Admin Client（Service Role）
 * - 僅用於 Server API 端點
 * - 自帶 RLS bypass 權限，請務必自行做權限驗證
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (cachedAdminClient) return cachedAdminClient;

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = getEnvConfig();

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    if (process.env.VITEST) {
      throw new Error('[api/lib/supabase] Missing Supabase credentials in test environment.');
    }
    throw new Error('[api/lib/supabase] Missing Supabase credentials.');
  }

  cachedAdminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    db: { schema: 'public' },
  });

  return cachedAdminClient;
}
