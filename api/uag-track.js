import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    let data = req.body;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { return res.status(400).json({ error: 'Invalid JSON' }); }
    }

    const { session_id, agent_id, event, fingerprint } = data;

    if (!session_id || !event) {
      return res.status(400).json({ error: 'Missing required fields: session_id or event' });
    }

    // Basic Event Validation
    if (typeof event !== 'object' || !event.property_id || !event.duration) {
       return res.status(400).json({ error: 'Invalid event structure' });
    }

    // Call v8 RPC for atomic incremental update
    // Note: Function name includes version 'v8' to match deployed database schema
    const { data: result, error } = await supabase.rpc('track_uag_event_v8', {
      p_session_id: session_id,
      p_agent_id: agent_id || 'unknown',
      p_fingerprint: fingerprint || null,
      p_event_data: event
    });

    if (error) {
      console.error('Supabase RPC Error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Realtime Trigger (Optional: If Grade is S, send webhook or push)
    if (result && result.grade === 'S') {
      console.log(`[UAG] S-Grade Lead Detected! Session: ${session_id}`);
      // await sendWebhookToAgent(agent_id, session_id);
    }

    return res.status(200).json(result);

  } catch (err) {
    console.error('UAG Track Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
