import { OpenAI } from 'openai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { text } = req.body;

    if (!text) return res.status(400).json({ error: 'Missing text' });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 使用 OpenAI TTS API 生成語音
    // 選擇 "onyx" 聲音 - 低沉、磁性的男聲，符合 MUSE 人設
    const mp3Response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'onyx', // 低沉磁性男聲
      input: text,
      speed: 0.95 // 稍微慢一點，更有磁性
    });

    // 將音頻轉換為 base64
    const buffer = Buffer.from(await mp3Response.arrayBuffer());
    const base64Audio = buffer.toString('base64');
    const audioDataUrl = `data:audio/mp3;base64,${base64Audio}`;

    return res.status(200).json({
      audioUrl: audioDataUrl
    });

  } catch (error: unknown) {
    console.error('TTS API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'TTS Failed', message: errorMessage });
  }
}
