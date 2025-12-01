/**
 * Vercel API: /api/generate-community-profile
 * 
 * AI 生成社區牆摘要（後台按鈕觸發）
 * 從 community_reviews 讀取所有評價，AI 歸納成 story_vibe / two_good / one_fair
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    const { communityId } = req.body;

    if (!communityId) {
      return res.status(400).json({ error: '缺少 communityId' });
    }

    // 1. 取社區基本資料
    const { data: community, error: commError } = await supabase
      .from('communities')
      .select('name, address')
      .eq('id', communityId)
      .single();

    if (commError || !community) {
      return res.status(404).json({ error: '找不到社區' });
    }

    // 2. 取該社區所有評價（最多 20 筆）
    const { data: reviews } = await supabase
      .from('community_reviews')
      .select('advantage_1, advantage_2, disadvantage')
      .eq('community_id', communityId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!reviews || reviews.length === 0) {
      return res.status(400).json({ error: '該社區還沒有評價' });
    }

    // 3. 組成 AI Prompt
    const reviewsText = reviews
      .map((r, i) => `${i + 1}. 優點=[${r.advantage_1 || ''}, ${r.advantage_2 || ''}]，缺點=[${r.disadvantage || ''}]`)
      .join('\n');

    const prompt = `你是台灣房地產專家。根據以下房仲評價，歸納出社區介紹。

社區：${community.name}
地址：${community.address}

房仲評價（${reviews.length} 筆）：
${reviewsText}

請用 JSON 格式回覆（只要 JSON）：
{
  "story_vibe": "一句話社區氛圍（15字內）",
  "two_good": ["精選優點1", "精選優點2"],
  "one_fair": "客觀中肯的一句話",
  "lifestyle_tags": ["標籤1", "標籤2"],
  "best_for": ["適合族群1", "適合族群2"]
}`;

    // 4. 呼叫 OpenAI
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
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
          { role: 'system', content: '你是台灣房地產專家。' },
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

    // 5. 解析 JSON
    let aiResult;
    try {
      const jsonStr = aiContent.replace(/```json\n?|\n?```/g, '').trim();
      aiResult = JSON.parse(jsonStr);
    } catch {
      console.error('AI parse failed:', aiContent);
      return res.status(500).json({ error: 'AI 回覆格式錯誤' });
    }

    // 6. 更新社區牆
    const { error: updateError } = await supabase
      .from('communities')
      .update({
        story_vibe: aiResult.story_vibe,
        two_good: aiResult.two_good,
        one_fair: aiResult.one_fair,
        lifestyle_tags: aiResult.lifestyle_tags,
        best_for: aiResult.best_for,
        completeness_score: Math.min(90, 50 + reviews.length * 5),
        ai_metadata: {
          last_analysis: new Date().toISOString(),
          review_count: reviews.length,
          model: 'gpt-4o-mini'
        }
      })
      .eq('id', communityId);

    if (updateError) throw updateError;

    return res.status(200).json({
      success: true,
      community: community.name,
      reviewCount: reviews.length,
      result: aiResult
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
