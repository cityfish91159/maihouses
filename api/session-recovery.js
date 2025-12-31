import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Session Recovery API
 *
 * 功能：根據設備指紋恢復用戶的 session_id
 * 場景：用戶清除 localStorage 後，避免創建新 session
 * 時間窗口：7 天內活躍的 session 可恢復
 *
 * @param {string} fingerprint - 設備指紋（base64 編碼的 JSON）
 * @param {string} agentId - 房仲 ID（可選，用於過濾）
 * @returns {object} { recovered: boolean, session_id?: string, grade?: string, last_active?: string }
 */
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      recovered: false
    });
  }

  const { fingerprint, agentId } = req.body;

  // 驗證必填參數
  if (!fingerprint) {
    return res.status(400).json({
      error: 'Missing required parameter: fingerprint',
      recovered: false
    });
  }

  try {
    // 查詢最近 7 天內相同指紋的活躍 session
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    let query = supabase
      .from('uag_sessions')
      .select('session_id, last_active, grade')
      .eq('fingerprint', fingerprint)
      .gte('last_active', sevenDaysAgo)
      .order('last_active', { ascending: false })
      .limit(1);

    // 如果提供 agentId，優先查找該房仲的 session
    if (agentId && agentId !== 'unknown') {
      query = query.eq('agent_id', agentId);
    }

    const { data, error } = await query.single();

    // PGRST116 = "Row not found" - 這是正常情況，不是錯誤
    if (error && error.code !== 'PGRST116') {
      console.error('[session-recovery] Supabase error:', {
        code: error.code,
        message: error.message,
        fingerprint: fingerprint.substring(0, 20) + '...',
        agentId
      });
      throw error;
    }

    // 成功找到可恢復的 session
    if (data) {
      console.log('[session-recovery] ✅ Session recovered:', {
        session_id: data.session_id,
        grade: data.grade,
        last_active: data.last_active,
        agentId
      });

      return res.status(200).json({
        recovered: true,
        session_id: data.session_id,
        grade: data.grade,
        last_active: data.last_active
      });
    }

    // 沒有找到可恢復的 session
    console.log('[session-recovery] No session found for fingerprint:', {
      fingerprint: fingerprint.substring(0, 20) + '...',
      agentId
    });

    return res.status(200).json({ recovered: false });

  } catch (err) {
    console.error('[session-recovery] Unexpected error:', {
      message: err.message,
      stack: err.stack,
      fingerprint: fingerprint ? fingerprint.substring(0, 20) + '...' : 'undefined'
    });

    // 即使出錯也回傳 recovered: false，不中斷前端追蹤器
    return res.status(200).json({
      recovered: false,
      error: 'Internal server error'
    });
  }
}
