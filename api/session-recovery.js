import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { fingerprint, agentId } = req.body;

  if (!fingerprint) return res.status(400).json({ error: 'Missing fingerprint' });

  try {
    // Find the most recent active session with this fingerprint
    const { data, error } = await supabase
      .from('uag_sessions')
      .select('session_id, last_active_at, current_grade')
      .eq('fingerprint', fingerprint)
      .gt('last_active_at', new Date(Date.now() - 7 * 86400000).toISOString()) // 7 days window
      .order('last_active_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "Row not found"

    if (data) {
      return res.status(200).json({
        recovered: true,
        session_id: data.session_id,
        grade: data.current_grade
      });
    }

    return res.status(200).json({ recovered: false });

  } catch (err) {
    console.error('[session-recovery] Error:', err.message);
    // 即使出錯也回傳 recovered: false，不中斷前端
    return res.status(200).json({ recovered: false });
  }
}
