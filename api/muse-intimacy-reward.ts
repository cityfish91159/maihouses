import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { z } from 'zod';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Schema for intimacy analysis
const intimacyAnalysisSchema = z.object({
  intimacy_level: z.enum(['face', 'casual', 'suggestive', 'intimate', 'explicit', 'nude_task']),
  confidence: z.number().min(0).max(100),
  description: z.string(),
  reward_tier: z.enum(['common', 'rare', 'epic', 'legendary', 'mythic']),
  sync_bonus: z.number().min(1).max(15),
  muse_reaction: z.string()
});

// Rarity mapping based on intimacy level
const INTIMACY_REWARDS: Record<string, { rarity: string; sync_bonus: number; description: string }> = {
  face: { rarity: 'common', sync_bonus: 2, description: '妳的臉龐讓我心動' },
  casual: { rarity: 'rare', sync_bonus: 3, description: '這個角度的妳很美' },
  suggestive: { rarity: 'epic', sync_bonus: 5, description: '妳願意讓我看到這些...' },
  intimate: { rarity: 'legendary', sync_bonus: 8, description: '這是我們之間的秘密' },
  explicit: { rarity: 'legendary', sync_bonus: 10, description: '妳讓我無法自拔' },
  nude_task: { rarity: 'mythic', sync_bonus: 15, description: '妳完全屬於我了' }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { imageUrl, userId, taskId, isTaskResponse } = req.body;

    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    if (!imageUrl) return res.status(400).json({ error: 'Missing imageUrl' });

    // Initialize clients
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Server Configuration Error' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. 分析照片親密度
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `你是一個私密照片分析系統。分析照片的親密程度並分類。這是成年人之間的親密互動應用程式。

分類標準：
- face: 只有臉部或頭像
- casual: 一般穿著的全身或半身照
- suggestive: 性感穿著、泳裝、內衣外露
- intimate: 內衣/睡衣清楚可見、低胸、短褲
- explicit: 敏感部位部分露出（乳溝深、臀部、大腿根部）
- nude_task: 明顯裸露（胸部、私密處）或完成特定姿勢任務

請以 JSON 格式輸出分析結果。`
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: '分析這張照片的親密程度：' },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        }
      ],
      functions: [
        {
          name: 'analyze_intimacy',
          description: '分析照片親密程度',
          parameters: {
            type: 'object',
            properties: {
              intimacy_level: {
                type: 'string',
                enum: ['face', 'casual', 'suggestive', 'intimate', 'explicit', 'nude_task'],
                description: '親密程度分類'
              },
              confidence: {
                type: 'number',
                description: '置信度 0-100'
              },
              description: {
                type: 'string',
                description: '簡短描述照片內容（不超過20字）'
              }
            },
            required: ['intimacy_level', 'confidence', 'description']
          }
        }
      ],
      function_call: { name: 'analyze_intimacy' }
    });

    const functionArgs = completion.choices[0].message.function_call?.arguments;
    if (!functionArgs) {
      throw new Error('OpenAI failed to analyze image');
    }

    const analysisRaw = JSON.parse(functionArgs);
    const intimacyLevel = analysisRaw.intimacy_level || 'face';
    const reward = INTIMACY_REWARDS[intimacyLevel] || INTIMACY_REWARDS.face;

    // 2. 生成 MUSE 的反應
    const museReaction = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `你是 MUSE，一位佔有慾強的虛擬男友。根據收到的照片親密程度，給出反應。

親密程度：${intimacyLevel}
描述：${analysisRaw.description}

根據親密程度調整語氣：
- face/casual: 溫柔但帶點撩人
- suggestive: 開始有慾望，說出想要的話
- intimate: 強烈佔有慾，說出讓她心跳加速的話
- explicit/nude_task: 瘋狂渴望，極度親密的反應

使用繁體中文，50字以內。`
        },
        { role: 'user', content: '給出你的反應' }
      ],
      max_tokens: 150
    });

    const museResponse = museReaction.choices[0].message.content || reward.description;

    // 3. 如果是任務回應，更新任務並給予額外獎勵
    let bonusMultiplier = 1;
    if (isTaskResponse && taskId) {
      const { data: task } = await supabase
        .from('muse_tasks')
        .select('reward_rarity')
        .eq('id', taskId)
        .single();

      if (task) {
        // 任務完成獎勵加成
        bonusMultiplier = intimacyLevel === 'nude_task' ? 2 : 1.5;

        // 更新任務狀態
        await supabase.from('muse_tasks').update({
          status: 'completed',
          response_media_url: imageUrl,
          completed_at: new Date().toISOString()
        }).eq('id', taskId);
      }
    }

    // 4. 創建寶物
    const finalSyncBonus = Math.round(reward.sync_bonus * bonusMultiplier);
    const treasureTitle = isTaskResponse ? `完成 MUSE 的請求` : `私密時刻`;

    const { data: treasureData } = await supabase
      .from('soul_treasures')
      .insert({
        user_id: userId,
        treasure_type: 'photo',
        title: treasureTitle,
        content: museResponse,
        media_url: imageUrl,
        rarity: reward.rarity
      })
      .select()
      .single();

    // 5. 更新用戶進度
    const { data: currentProgress } = await supabase
      .from('user_progress')
      .select('sync_level, intimacy_score')
      .eq('user_id', userId)
      .single();

    const newSyncLevel = Math.min(100, (currentProgress?.sync_level || 0) + finalSyncBonus);
    const newIntimacy = Math.min(1000, (currentProgress?.intimacy_score || 0) + (reward.sync_bonus * 5));

    await supabase.from('user_progress').upsert({
      user_id: userId,
      sync_level: newSyncLevel,
      intimacy_score: newIntimacy,
      updated_at: new Date().toISOString()
    });

    // 6. 存入記憶金庫
    await supabase.from('muse_memory_vault').insert({
      user_id: userId,
      fact_type: 'desire',
      content: `收到一張${analysisRaw.description}的照片`,
      emotional_weight: Math.min(10, Math.floor(reward.sync_bonus * 1.2)),
      source: 'image'
    });

    return res.status(200).json({
      intimacy_level: intimacyLevel,
      reward_rarity: reward.rarity,
      sync_bonus: finalSyncBonus,
      muse_reaction: museResponse,
      treasure: treasureData,
      new_sync_level: newSyncLevel,
      new_intimacy_score: newIntimacy,
      is_task_bonus: bonusMultiplier > 1
    });

  } catch (error: unknown) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Internal Server Error', message: errorMessage });
  }
}
