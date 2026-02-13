/**
 * API 層錯誤工具重匯出
 * 集中管理 API 對錯誤工具的引用，避免跨層 import。
 */

export {
  getErrorMessage,
  getErrorInfo,
  safeAsync,
  safeSync,
  UNKNOWN_ERROR_MESSAGE,
  type ErrorInfo,
  type Result,
} from '../../src/lib/error';
