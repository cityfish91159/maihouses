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
 * 呼叫 OpenAI Chat Completion API
 * @param messages 對話歷史
 * @param systemPrompt 系統提示詞 (選填)
 * @returns AI 回覆內容
 */
export async function callOpenAI(
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('未設定 VITE_OPENAI_API_KEY 環境變數')
  }

  // 如果有系統提示詞，加在最前面
  const fullMessages: ChatMessage[] = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages

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
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `OpenAI API 錯誤 (${response.status}): ${errorData.error?.message || response.statusText}`
      )
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
