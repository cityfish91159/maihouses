import type { AiAction } from '../types'

/**
 * 從 AI 回應文字中解析特殊操作指令
 * 支援 JSON code block 格式：```json\n{...}\n```
 */
export function parseAiAction(content: string): AiAction | null {
  try {
    // 嘗試從 markdown code block 中提取 JSON
    const jsonBlockMatch = content.match(/```json\s*\n([\s\S]*?)\n```/)
    if (jsonBlockMatch) {
      const jsonStr = jsonBlockMatch[1].trim()
      const parsed = JSON.parse(jsonStr)

      // 驗證是否為有效的 AiAction
      if (isValidAiAction(parsed)) {
        return parsed as AiAction
      }
    }

    // 嘗試直接解析整個內容（如果是純 JSON）
    const trimmed = content.trim()
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const parsed = JSON.parse(trimmed)
      if (isValidAiAction(parsed)) {
        return parsed as AiAction
      }
    }
  } catch (e) {
    // 解析失敗，返回 null
  }

  return null
}

/**
 * 驗證是否為有效的 AiAction
 */
function isValidAiAction(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false
  if (!obj.type || typeof obj.type !== 'string') return false

  const validTypes = ['community_post_refine', 'navigate_listings', 'scroll_to', 'invite_text']
  return validTypes.includes(obj.type) && obj.data !== undefined
}

/**
 * 從 AI 回應中移除 JSON block，保留純文字說明
 */
export function stripJsonFromContent(content: string): string {
  return content
    .replace(/```json\s*\n[\s\S]*?\n```/g, '')
    .trim()
}
