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

    // 3. 組成 AI Prompt（毒舌真實風格，統計頻率選出最常見的）
    const allAdvantages = reviews
      .flatMap(r => [r.advantage_1, r.advantage_2])
      .filter(Boolean);
    const allDisadvantages = reviews
      .map(r => r.disadvantage)
      .filter(Boolean);

    const prompt = `你是台北最毒舌的信義房屋王牌經紀人，專門寫社區牆。

社區：${community.name}
地址：${community.address}

以下是 ${reviews.length} 位房仲的真實評價（可能有重複，請統計頻率）：

【優點清單】
${allAdvantages.join('、') || '無'}

【缺點清單】
${allDisadvantages.join('、') || '無'}

請從中總結：
1. 最常被提到的兩個優點（用房客會信的口吻，每句12字內）
2. 最常被提到的那一個缺點（一定要有，哪怕要挖也要挖出來，講真話房客才信）
3. 居住氛圍總結（50字內，毒舌但真實風格）
4. 生活標籤（2-3個，如「捷運宅」「學區優」「公園綠地」）
5. 適合族群（1-2個，如「小資首購」「退休養老」）

回傳純 JSON（只要 JSON，不要其他文字）：
{
  "story_vibe": "...",
  "two_good": ["...", "..."],
  "one_fair": "...",
  "lifestyle_tags": ["...", "..."],
  "best_for": ["...", "..."]
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

    interface OpenAIResponse {
      choices?: Array<{ message?: { content?: string } }>;
    }
    const aiData = await aiResponse.json() as OpenAIResponse;
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

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
