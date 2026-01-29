import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    let data = req.body;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON' });
      }
    }

    const { event, ...properties } = data;

    if (!event) {
      return res.status(400).json({ error: 'Missing event name' });
    }

    // 插入到 analytics_events 表
    const { error } = await supabase.from('analytics_events').insert({
      event_name: event,
      properties: properties,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Analytics insert error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Analytics API Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
