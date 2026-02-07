import { z } from 'zod';

/**
 * [Team 8 第五位修復] 錯誤分類輔助函數
 *
 * 將複雜的 if-else 鏈條提取為獨立函數，降低 cyclomatic complexity。
 *
 * @param error - 錯誤物件
 * @returns 錯誤標題和描述
 */
export function classifyTrustServiceError(error: unknown): {
  title: string;
  description: string;
} {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorCode =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';

  // 優先使用 error.code（更可靠）
  if (errorCode === 'RATE_LIMIT_EXCEEDED') {
    return {
      title: '操作過於頻繁',
      description: '請稍後再試（約 1 分鐘）',
    };
  }

  if (errorCode === 'UNAUTHORIZED') {
    return {
      title: '權限不足',
      description: '請登入後再試',
    };
  }

  if (errorCode === 'NOT_FOUND') {
    return {
      title: '物件不存在',
      description: '此物件可能已下架',
    };
  }

  // Timeout 錯誤
  if (
    errorMessage.includes('timed out') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('Timeout')
  ) {
    return {
      title: '請求超時',
      description: '伺服器回應時間過長，請稍後再試',
    };
  }

  // CORS 錯誤
  if (
    errorMessage.includes('CORS') ||
    errorMessage.includes('Cross-Origin') ||
    errorCode === 'ERR_BLOCKED_BY_CLIENT'
  ) {
    return {
      title: '連線被阻擋',
      description: '請檢查瀏覽器設定或網路環境',
    };
  }

  // 網路連線錯誤
  if (
    errorMessage.includes('NetworkError') ||
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('網路') ||
    errorCode === 'ERR_NETWORK'
  ) {
    return {
      title: '網路連線異常',
      description: '請檢查網路連線後重試',
    };
  }

  // 速率限制（字串匹配作為 fallback）
  if (errorMessage.includes('429') || errorMessage.includes('請求過於頻繁')) {
    return {
      title: '操作過於頻繁',
      description: '請稍後再試（約 1 分鐘）',
    };
  }

  // 權限錯誤（字串匹配作為 fallback）
  if (
    errorMessage.includes('401') ||
    errorMessage.includes('403') ||
    errorMessage.includes('未授權')
  ) {
    return {
      title: '權限不足',
      description: '請登入後再試',
    };
  }

  // 資源不存在（字串匹配作為 fallback）
  if (errorMessage.includes('404') || errorMessage.includes('not found')) {
    return {
      title: '物件不存在',
      description: '此物件可能已下架',
    };
  }

  // 伺服器錯誤（字串匹配作為 fallback）
  if (errorMessage.includes('500') || errorMessage.includes('系統錯誤')) {
    return {
      title: '伺服器異常',
      description: '請稍後再試，或聯繫客服',
    };
  }

  // 預設錯誤
  return {
    title: '無法進入服務',
    description: '請稍後再試',
  };
}

export const AUTO_CREATE_CASE_RESPONSE_SCHEMA = z.object({
  data: z.object({
    token: z.string().uuid(),
    case_id: z.string().uuid(),
    buyer_name: z.string(),
  }),
});
