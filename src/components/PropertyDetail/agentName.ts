const DEFAULT_AGENT_NAME = '專屬業務';
const MAX_AGENT_NAME_LENGTH = 40;

/**
 * React 文字節點本身會 escape HTML，這裡額外做輸入正規化：
 * - 去除控制字元
 * - trim
 * - 長度上限
 * - 空值 fallback
 */
export function normalizeAgentName(name: string | null | undefined): string {
  if (typeof name !== 'string') return DEFAULT_AGENT_NAME;

  const cleaned = name.replace(/[<>\u0000-\u001F\u007F]/g, '').trim();
  if (!cleaned) return DEFAULT_AGENT_NAME;

  return cleaned.slice(0, MAX_AGENT_NAME_LENGTH);
}

export { DEFAULT_AGENT_NAME };
