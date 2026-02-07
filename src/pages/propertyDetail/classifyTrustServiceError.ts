const hasErrorCode = (error: unknown): error is { code: unknown } =>
  typeof error === 'object' && error !== null && 'code' in error;

export function classifyTrustServiceError(error: unknown): {
  title: string;
  description: string;
} {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorCode = hasErrorCode(error) ? String(error.code) : '';

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

  if (errorMessage.includes('429') || errorMessage.includes('請求過於頻繁')) {
    return {
      title: '操作過於頻繁',
      description: '請稍後再試（約 1 分鐘）',
    };
  }

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

  if (errorMessage.includes('404') || errorMessage.includes('not found')) {
    return {
      title: '物件不存在',
      description: '此物件可能已下架',
    };
  }

  if (errorMessage.includes('500') || errorMessage.includes('系統錯誤')) {
    return {
      title: '伺服器異常',
      description: '請稍後再試，或聯繫客服',
    };
  }

  return {
    title: '無法進入服務',
    description: '請稍後再試',
  };
}
