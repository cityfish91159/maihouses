import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { agentId, grade, limit = 20 } = req.query;

  if (!agentId) return res.status(400).json({ error: 'Missing agentId' });

  try {
    let query = supabase
      .from('uag_lead_rankings')
      .select('*')
      .eq('agent_id', agentId)
      .in('temperature', ['HOT', 'WARM'])
      .lte('rank', limit)
      .order('rank');

    if (grade) {
      query = query.eq('grade', grade);
    }

    const { data, error } = await query;

    if (error) throw error;

    return res.status(200).json({
      leads: data,
      count: data.length,
      cached_at: new Date()
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
