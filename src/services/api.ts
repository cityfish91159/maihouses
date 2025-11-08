import { v4 as uuidv4 } from 'uuid'
import { getConfig } from '../app/config'
import { callOpenAI } from './openai'
import type { ApiResponse, Paginated, PropertyCard, ReviewSnippet, AiAskReq, AiAskRes, CommunityPreview } from '../types'

let sessionId = uuidv4()
export const getSessionId = () => sessionId

export async function apiFetch<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const cfg = await getConfig()
  const url = `${cfg.apiBaseUrl}${endpoint}`
  const method = (options.method || 'GET').toUpperCase()

  const baseHeaders: Record<string, string> = {
    Accept: 'application/json',
    'X-API-Version': 'v1',
    'X-App-Version': cfg.appVersion,
    'X-Session-Id': sessionId,
    'X-Request-Id': uuidv4(),
    'Accept-Language': 'zh-Hant-TW'
  }

  const userHeaders: Record<string, string> = (() => {
    const h = options.headers
    if (!h) return {}
    if (h instanceof Headers) {
      const o: Record<string, string> = {}
      h.forEach((v, k) => (o[k] = v))
      return o
    }
    if (Array.isArray(h)) return h.reduce((a, [k, v]) => ((a[k] = v), a), {} as Record<string, string>)
    return h as Record<string, string>
  })()

  if (method === 'POST' && !userHeaders['Idempotency-Key'] && !userHeaders['idempotency-key']) {
    userHeaders['Idempotency-Key'] = uuidv4()
  }

  const headers = { ...baseHeaders, ...userHeaders }

  if (cfg.mock) {
    const { mockHandler } = await import('./mock')
    return mockHandler<T>(endpoint, { ...options, headers })
  }

  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(url, { ...options, headers, signal: controller.signal })
    if (!res.ok) {
      return { ok: false, error: { code: 'API_ERROR', message: 'API 請求失敗' } }
    }
    const data = await res.json()
    return { ok: true, data }
  } catch (e) {
    if ((e as any)?.name === 'AbortError')
      return { ok: false, error: { code: 'NETWORK_TIMEOUT', message: '請求超時' } }
    return { ok: false, error: { code: 'NETWORK_ERROR', message: (e as Error).message } }
  } finally {
    clearTimeout(id)
  }
}

export const getMeta = () =>
  apiFetch<{ backendVersion: string; apiVersion: string; maintenance: boolean }>('/api/v1/meta')

export const getProperties = (page: number, pageSize: number, q?: string) =>
  apiFetch<Paginated<PropertyCard>>(
    `/api/v1/properties?${new URLSearchParams({ page: String(page), pageSize: String(pageSize), ...(q ? { q } : {}) })}`
  )

export const getProperty = (id: string) => apiFetch<PropertyCard>(`/api/v1/properties/${id}`)

export const getReviews = (communityId: string, limit = 2, offset = 0) =>
  apiFetch<ReviewSnippet[]>(
    `/api/v1/communities/${communityId}/reviews?${new URLSearchParams({ limit: String(limit), offset: String(offset) })}`
  )

export const getCommunities = () => apiFetch<CommunityPreview[]>('/api/v1/communities/preview')

export const aiAsk = async (
  req: AiAskReq,
  onChunk?: (chunk: string) => void
): Promise<ApiResponse<AiAskRes>> => {
  /**
   * 說明：移除前端直接攜帶 OpenAI Key；現在透過 callOpenAI -> Cloudflare Worker proxy。
   * 若 proxy 故障，回傳 AI_ERROR；可在 UI 顯示「AI 暫時離線」。
   */
  try {
    const messages = req.messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }))

    const result = await callOpenAI(messages, onChunk)

    const aiResult: AiAskRes = {
      answers: [result.content],
      recommends: []
    }
    if (result.usage) aiResult.usage = result.usage

    return { ok: true, data: aiResult }

  } catch (error) {
    console.error('AI Ask 失敗 (proxy):', error)
    // 若啟用 mock（由 app.config.json 或 ?mock=1 控制），提供極簡降級回覆避免空白
    try {
      const cfg = await getConfig()
      if (cfg.mock) {
        const last = req.messages.filter(m => m.role === 'user').slice(-1)[0]
        const echo = last?.content?.trim().slice(0, 120) || '您的需求'
        const text = `我理解您的需求：「${echo}」。\n\n目前 AI 服務暫時不可用，我先給您兩個方向：\n1) 明確區域/預算/坪數，可更快找到合適標的。\n2) 若有社區名稱，我可以先幫您彙整口碑與注意事項。`
        return {
          ok: true,
          data: { answers: [text], recommends: [] }
        }
      }
    } catch {}

    return {
      ok: false,
      error: {
        code: 'AI_ERROR',
        message: error instanceof Error ? error.message : 'AI 服務暫時無法使用'
      }
    }
  }
}
