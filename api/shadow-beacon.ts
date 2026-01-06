import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * Shadow Beacon API - 處理頁面關閉時的 sendBeacon 請求
 * 使用 sendBeacon 確保資料在頁面關閉前送出
 */

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // sendBeacon 發送的是純文字，需要解析
    let data = req.body;
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }

    const { user_id, content, hesitation_count, mode, metadata } = data;

    if (!user_id || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 插入 shadow_logs
    const { error } = await supabase.from('shadow_logs').insert({
      user_id,
      content,
      hesitation_count: hesitation_count || 0,
      mode: mode || 'night',
      metadata: metadata || {}
    });

    if (error) {
      console.error('Shadow beacon insert error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Shadow beacon error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
