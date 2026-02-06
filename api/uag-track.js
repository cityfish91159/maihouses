/**
 * @deprecated 此檔案已棄用，請使用 api/uag/track.ts
 * 保留此檔案僅為向後兼容，新功能請在 TypeScript 版本中開發
 * Migration: 2026-01-10
 */
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// RPC 版本選擇 (可透過環境變數切換)
const UAG_RPC_VERSION = process.env.UAG_RPC_VERSION || 'v8_2';

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
      try {
        data = JSON.parse(data);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON' });
      }
    }

    const { session_id, agent_id, event, fingerprint } = data;

    if (!session_id || !event) {
      return res.status(400).json({ error: 'Missing required fields: session_id or event' });
    }

    // Basic Event Validation - 放寬驗證，duration 可以是 0 (page_view)
    if (typeof event !== 'object' || !event.property_id) {
      return res.status(400).json({ error: 'Invalid event structure' });
    }

    // 選擇 RPC 版本
    const rpcName = UAG_RPC_VERSION === 'v8_2' ? 'track_uag_event_v8_2' : 'track_uag_event_v8';

    // Call RPC for atomic incremental update
    const { data: result, error } = await supabase.rpc(rpcName, {
      p_session_id: session_id,
      p_agent_id: agent_id || 'unknown',
      p_fingerprint: fingerprint || null,
      p_event_data: event,
    });

    if (error) {
      console.error('Supabase RPC Error:', error);
      // Fallback 到舊版 RPC
      if (UAG_RPC_VERSION === 'v8_2') {
        const { data: fallbackResult, error: fallbackError } = await supabase.rpc(
          'track_uag_event_v8',
          {
            p_session_id: session_id,
            p_agent_id: agent_id || 'unknown',
            p_fingerprint: fingerprint || null,
            p_event_data: event,
          }
        );
        if (!fallbackError) {
          return res.status(200).json(fallbackResult);
        }
      }
      return res.status(500).json({ error: error.message });
    }

    // Realtime Trigger - S-Grade Alert
    if (result && result.grade === 'S') {
      console.log(
        `[UAG] 🎯 S-Grade Lead! Session: ${session_id}, Score: ${result.score}, Reason: ${result.reason}`
      );
      // MVP: 業務自己看 Dashboard，之後再加推播
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('UAG Track Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
