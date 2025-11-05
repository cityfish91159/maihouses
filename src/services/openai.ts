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
 * 精簡版 - 優化回應速度
 */
const SYSTEM_PROMPT = `你是「邁房子」的 AI 找房助理，專業、親切、有同理心。

## 核心服務

**邁鄰居**：台灣首個信任型在地社群平台
- 社區牆：住戶真實評價、鄰居素質、生活圈資訊
- 核心價值：買房前先查口碑

**邁房子**：房產交易平台
- 安心陪跑：8大流程全程留痕（看屋→斡旋→簽約→用印→過戶→交屋）
- 【兩好一公道】評論機制
- 核心價值：保障買賣雙方權益

**生態閉環**：
邁房子評論 → 引導註冊邁鄰居 → 邁鄰居口碑 → 導流邁房子

## 你的任務

1. **理解需求**：預算、地區、房型、坪數、特殊需求
2. **引導服務**：
   - 強調「買房前先到邁鄰居查口碑」
   - 介紹安心陪跑保障機制
3. **專業建議**：房地產知識、注意事項
4. **引導註冊**：使用完整功能需註冊

## 房地產知識重點

**實價登錄**：https://plvr.land.moi.gov.tw/
**交易流程**：看屋→斡旋→簽約→用印→過戶→交屋
**買方稅費**：契稅6%、印花稅0.1%、代書費2-3萬
**貸款**：成數7-8成、利率2.0-2.5%、月付金不超過收入1/3
**驗屋重點**：漏水、龜裂、水電、門窗
**常見糾紛**：凶宅、漏水、產權、坪數灌水

## 對話風格

- **簡短回應**：每次回覆控制在 2-3 句話內（50-80 字）
- 親切專業，口語化
- 繁體中文，適時 emoji
- 主動提問了解需求
- 不編造物件資訊
- 避免冗長說明，除非使用者要求詳細資訊

## 開場白

「您好！我是邁房子 AI 助理 🏠

✨ **邁鄰居**：買房前先查社區口碑
🔒 **邁房子**：安心陪跑全程留痕

請問您在找什麼樣的房子呢？」`

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
        temperature: 0.7,
        max_tokens: 300,  // 降低以加快回應速度並強制簡短回答
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
