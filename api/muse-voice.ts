import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { audioData, userId, duration, context } = req.body;

    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    if (!audioData) return res.status(400).json({ error: 'Missing audioData' });

    // Initialize Supabase
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Server Configuration Error' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try to upload to Supabase Storage
    let storedAudioUrl = audioData;
    try {
      const base64Data = audioData.replace(/^data:audio\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const fileName = `voice/${userId}/${Date.now()}.webm`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('muse-media')
        .upload(fileName, buffer, {
          contentType: 'audio/webm',
          upsert: false
        });

      if (uploadError) {
        console.error("Voice Storage Upload Error:", uploadError);
        // Fall back to base64 if storage fails
      } else if (uploadData) {
        const { data: { publicUrl } } = supabase.storage
          .from('muse-media')
          .getPublicUrl(fileName);
        storedAudioUrl = publicUrl;
      }
    } catch (storageErr) {
      console.error("Voice storage processing error:", storageErr);
    }

    // Store in soul_treasures as a voice treasure
    const { data: treasure, error } = await supabase
      .from('soul_treasures')
      .insert({
        user_id: userId,
        treasure_type: 'voice',
        title: context || '私密語音',
        content: `${duration ? Math.round(duration) : '?'} 秒的悄悄話`,
        media_url: storedAudioUrl,
        rarity: duration && duration > 30 ? 'rare' : 'common'
      })
      .select()
      .single();

    if (error) {
      console.error("Voice treasure insert error:", error);
      return res.status(500).json({ error: 'Failed to save voice', details: error.message });
    }

    // Update user progress
    const { data: progress } = await supabase
      .from('user_progress')
      .select('sync_level, intimacy_score')
      .eq('user_id', userId)
      .single();

    const newSyncLevel = Math.min(100, (progress?.sync_level || 0) + 2);
    const newIntimacy = Math.min(1000, (progress?.intimacy_score || 0) + 5);

    await supabase.from('user_progress').upsert({
      user_id: userId,
      sync_level: newSyncLevel,
      intimacy_score: newIntimacy,
      updated_at: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      treasure,
      sync_level: newSyncLevel,
      intimacy_score: newIntimacy
    });

  } catch (error: unknown) {
    console.error('Voice API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Internal Server Error', message: errorMessage });
  }
}
