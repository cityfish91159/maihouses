/**
 * Vercel API: /api/generate-community-profile
 * 
 * AI 自動生成/優化社區牆內容
 * 觸發時機：房仲上傳物件後（非同步）
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RequestBody {
  communityId: string;
  communityName: string;
  address: string;
  newReview: {
    pros: string[];
    cons: string;
  };
  isNew: boolean;
}

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

  try {
    const { communityId, communityName, address, newReview, isNew } = req.body as RequestBody;

    if (!communityId || !communityName) {
      return res.status(400).json({ error: '缺少必要參數' });
    }

    // 收集評價資料
    let allReviews: { pros: string[]; cons: string }[] = [newReview];

    // 舊社區：撈最近 5 筆物件評價
    if (!isNew) {
      const { data: properties } = await supabase
        .from('properties')
        .select('advantage_1, advantage_2, disadvantage')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (properties) {
        properties.forEach((p: any) => {
          allReviews.push({
            pros: [p.advantage_1, p.advantage_2].filter(Boolean),
            cons: p.disadvantage || ''
          });
        });
      }
    }

    // AI Prompt
    const reviewsText = allReviews
      .map((r, i) => `評價${i + 1}：優點=[${r.pros.join(', ')}]，缺點=[${r.cons}]`)
      .join('\n');

    const prompt = `你是台灣房地產專家。根據以下資訊，生成社區牆介紹。

社區名稱：${communityName}
地址：${address}

房仲評價：
${reviewsText}

請用 JSON 格式回覆（只要 JSON）：
{
  "story_vibe": "一句話描述社區氛圍（15字內）",
  "two_good": ["優點1", "優點2"],
  "one_fair": "客觀抗性（委婉但真實）",
  "lifestyle_tags": ["標籤1", "標籤2", "標籤3"],
  "best_for": ["適合族群1", "適合族群2"]
}`;

    // 呼叫 OpenAI
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      console.error('OPENAI_API_KEY not configured');
      return res.status(500).json({ error: 'AI 服務未設定' });
    }

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: '你是台灣房地產專家，擅長撰寫吸引人的社區介紹。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`OpenAI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';

    // 解析 JSON
    let aiResult;
    try {
      const jsonStr = aiContent.replace(/```json\n?|\n?```/g, '').trim();
      aiResult = JSON.parse(jsonStr);
    } catch {
      console.error('Failed to parse AI response:', aiContent);
      return res.status(500).json({ error: 'AI 回覆格式錯誤' });
    }

    // 更新社區牆
    const { error: updateError } = await supabase
      .from('communities')
      .update({
        story_vibe: aiResult.story_vibe,
        two_good: aiResult.two_good,
        one_fair: aiResult.one_fair,
        lifestyle_tags: aiResult.lifestyle_tags,
        best_for: aiResult.best_for,
        completeness_score: isNew ? 50 : 70,
        ai_metadata: {
          last_analysis: new Date().toISOString(),
          review_count: allReviews.length,
          model: 'gpt-4o-mini'
        }
      })
      .eq('id', communityId);

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ 社區牆 AI 優化完成: ${communityName}`);

    return res.status(200).json({
      success: true,
      community: communityName,
      result: aiResult
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
