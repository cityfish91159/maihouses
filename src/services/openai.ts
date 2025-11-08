/**
 * OpenAI / LLM 對話服務（前端）
 * 重要：不再於前端打包任何 API Key，全部請透過後端 / proxy 轉發。
 * 你已經有 Cloudflare Workers `mai-ai-proxy`，此檔案會優先使用 proxy。
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
 * 極簡版 - 只保留語氣與原則
 */
const SYSTEM_PROMPT = `繁中回答，口吻自然友善；先給結論，50–150 字內、最多 2 點、必要再問 1 題。

你是邁房子 AI 助理。邁鄰居查社區口碑、邁房子安心陪跑全程留痕。`

/**
 * 呼叫 OpenAI API 進行對話
 * @param messages 對話訊息列表（不含 system message）
 * @param onChunk 串流回傳的回調函數（每收到一段文字就呼叫）
 * @returns AI 回應的完整文字內容
 */
export async function callOpenAI(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  onChunk?: (chunk: string) => void
): Promise<{ content: string; usage?: { promptTokens: number; completionTokens: number; totalTokens: number } }> {
  /**
   * Proxy 設定：
   * - 推薦設置 VITE_AI_PROXY_URL 指向你的 Cloudflare Worker，例如：
   *   https://mai-ai-proxy.your-account.workers.dev/api/chat
   * - 若環境變數不存在，退回相對路徑 /api/chat（可由反向代理或同網域 worker 處理）
   * - 不再直接呼叫官方 OpenAI API，避免將金鑰打進 bundle 被 Secret Scanning 攔截。
   */
  const proxyUrl = (import.meta as any).env?.VITE_AI_PROXY_URL || '/api/chat'

  // 限制對話歷史長度（只保留最近 8 輪，減少 tokens 消耗）
  const recentMessages = messages.slice(-8)
  
  // 計算使用者最後一則訊息的 tokens（粗估：中文 1 字 ≈ 1.5 tokens）
  const lastUserMsg = recentMessages.filter(m => m.role === 'user').slice(-1)[0]
  const userTokensEstimate = lastUserMsg ? Math.ceil(lastUserMsg.content.length * 1.5) : 20
  
  // 動態 max_tokens：最低 120、最高 220、一般 150-200
  const maxTokens = Math.min(220, Math.max(120, Math.ceil(userTokensEstimate * 0.8)))
  
  // 組合完整訊息（system + 最近對話歷史）
  const fullMessages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...recentMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
  ]

  try {
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: fullMessages,
        temperature: 0.6,
        // 讓後端統一選模型與 stream，避免前端硬編
        max_tokens: maxTokens,
        stream: !!onChunk
      })
    })

    // 先檢查回應狀態，避免在 404/500 時走到串流分支造成空白內容
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`AI Proxy 錯誤: ${response.status} - ${JSON.stringify(errorData)}`)
    }

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

      return { content: fullContent }
    }

    // 非串流模式（原本的邏輯）
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`AI Proxy 錯誤: ${response.status} - ${JSON.stringify(errorData)}`)
    }

    // 後端直接 pass-through OpenAI 回應；若不是原生格式則容錯
    const data: OpenAIResponse | any = await response.json()

    if (!data || !data.choices) {
      // proxy 可能只回 {content:"..."}
      const content = data?.content || ''
      return { content }
    }

    // 記錄 tokens 使用情況（開發環境）
    if (data.usage && import.meta.env.DEV) {
      console.log('📊 Tokens 使用:', {
        prompt: data.usage.prompt_tokens,
        completion: data.usage.completion_tokens,
        total: data.usage.total_tokens,
        max_tokens: maxTokens,
        估算成本: `$${(data.usage.total_tokens * 0.00015 / 1000).toFixed(6)}`
      })
    }

    const messageContent = data.choices[0]?.message.content ?? ''
    
    const result: { content: string; usage?: { promptTokens: number; completionTokens: number; totalTokens: number } } = {
      content: messageContent
    }
    
    if (data.usage) {
      result.usage = {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      }
    }
    
    return result

  } catch (error) {
    console.error('AI Proxy 呼叫失敗:', error)
    throw error
  }
}
