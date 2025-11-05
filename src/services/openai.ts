/**
 * OpenAI API 串接服務
 * 用於 AI 找房助理的對話功能
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OpenAIResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: ChatMessage
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * 邁房子/邁鄰居 AI 助理的系統提示詞
 * 極簡版 - 優化至 < 50 tokens
 */
const SYSTEM_PROMPT = `繁中回答。**50–100字**內，直給重點，少寒暄，不解釋原理，不列超過2點。

你是邁房子 AI 助理：
- 邁鄰居：查社區口碑
- 邁房子：安心陪跑全程留痕
- 引導註冊使用完整功能

知識：實價登錄 plvr.land.moi.gov.tw、契稅6%、貸款7-8成`

/**
 * 呼叫 OpenAI API 進行對話
 * @param messages 對話訊息列表（不含 system message）
 * @param onChunk 串流回傳的回調函數（每收到一段文字就呼叫）
 * @returns AI 回應的完整文字內容
 */
export async function callOpenAI(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  onChunk?: (chunk: string) => void
): Promise<string> {
  // 從環境變數讀取 API key
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  
  if (!apiKey) {
    throw new Error('請在 .env.local 設定 VITE_OPENAI_API_KEY')
  }

  // 限制對話歷史長度（只保留最近 6 輪，減少 tokens 消耗）
  const recentMessages = messages.slice(-6)
  
  // 組合完整訊息（system + 最近對話歷史）
  const fullMessages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...recentMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
  ]

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: fullMessages,
        temperature: 0.6,  // 降低以獲得更穩定快速的回應
        max_tokens: 100,  // 硬控回應長度 50-100 字
        top_p: 1.0,
        stream: !!onChunk  // 如果有 onChunk 就啟用串流
      })
    })

    // 串流模式
    if (onChunk && response.body) {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim() !== '')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                fullContent += content
                onChunk(content)  // 即時回傳每個片段
              }
            } catch (e) {
              // 忽略解析錯誤
            }
          }
        }
      }

      return fullContent
    }

    // 非串流模式（原本的邏輯）
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`OpenAI API 錯誤: ${response.status} - ${JSON.stringify(errorData)}`)
    }

    const data: OpenAIResponse = await response.json()

    if (!data.choices || data.choices.length === 0) {
      throw new Error('OpenAI API 回傳空結果')
    }

    return data.choices[0].message.content

  } catch (error) {
    console.error('OpenAI API 呼叫失敗:', error)
    throw error
  }
}
