/**
 * Supabase Edge Function: generate-community-profile
 * 
 * 功能：AI 自動生成/優化社區牆內容
 * 觸發時機：房仲上傳物件後（非同步，不阻塞 UI）
 * 
 * 邏輯：
 * 1. 新社區 → 用 AI 生成初始 story_vibe、two_good、one_fair
 * 2. 舊社區 → 讀取最近 5 筆物件評價，AI 歸納更新
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  communityId: string
  communityName: string
  address: string
  newReview: {
    pros: string[]
    cons: string
  }
  isNew: boolean
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { communityId, communityName, address, newReview, isNew } = await req.json() as RequestBody

    if (!communityId || !communityName) {
      return new Response(JSON.stringify({ error: '缺少必要參數' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 初始化 Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 收集評價資料
    let allReviews: { pros: string[], cons: string }[] = [newReview]

    // 如果是舊社區，撈取最近 5 筆物件的評價
    if (!isNew) {
      const { data: properties } = await supabase
        .from('properties')
        .select('advantage_1, advantage_2, disadvantage')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (properties) {
        properties.forEach((p: any) => {
          allReviews.push({
            pros: [p.advantage_1, p.advantage_2].filter(Boolean),
            cons: p.disadvantage || ''
          })
        })
      }
    }

    // 準備 AI Prompt
    const reviewsText = allReviews.map((r, i) => 
      `評價${i + 1}：優點=[${r.pros.join(', ')}]，缺點=[${r.cons}]`
    ).join('\n')

    const prompt = `你是台灣房地產專家。根據以下資訊，生成社區牆介紹。

社區名稱：${communityName}
地址：${address}

房仲評價：
${reviewsText}

請用 JSON 格式回覆（只要 JSON，不要其他文字）：
{
  "story_vibe": "一句話描述社區氛圍（15字內）",
  "two_good": ["優點1（具體、吸引人）", "優點2（具體、吸引人）"],
  "one_fair": "客觀抗性（委婉但真實）",
  "lifestyle_tags": ["標籤1", "標籤2", "標籤3"],
  "best_for": ["適合族群1", "適合族群2"]
}`

    // 呼叫 OpenAI
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      console.error('OPENAI_API_KEY not configured')
      return new Response(JSON.stringify({ error: 'AI 服務未設定' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
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
    })

    if (!aiResponse.ok) {
      throw new Error(`OpenAI API error: ${aiResponse.status}`)
    }

    const aiData = await aiResponse.json()
    const aiContent = aiData.choices?.[0]?.message?.content || ''

    // 解析 AI 回覆的 JSON
    let aiResult
    try {
      // 移除可能的 markdown code block
      const jsonStr = aiContent.replace(/```json\n?|\n?```/g, '').trim()
      aiResult = JSON.parse(jsonStr)
    } catch {
      console.error('Failed to parse AI response:', aiContent)
      return new Response(JSON.stringify({ error: 'AI 回覆格式錯誤' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
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
        completeness_score: isNew ? 50 : 70, // AI 優化後提升分數
        ai_metadata: {
          last_analysis: new Date().toISOString(),
          review_count: allReviews.length,
          model: 'gpt-4o-mini'
        }
      })
      .eq('id', communityId)

    if (updateError) {
      throw updateError
    }

    console.log(`✅ 社區牆 AI 優化完成: ${communityName}`)

    return new Response(JSON.stringify({
      success: true,
      community: communityName,
      result: aiResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Edge Function Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
