import { PHONE_DIGITS_MAX, PHONE_DIGITS_MIN } from './constants';

/**
 * 清理電話號碼輸入，只保留數字和加號
 * @param value - 原始輸入
 * @returns 清理後的電話號碼字串
 */
export const sanitizePhoneInput = (value: string): string => {
  const raw = value.replace(/[^\d+]/g, '');
  if (!raw) return '';
  return raw.startsWith('+') ? `+${raw.slice(1).replace(/\+/g, '')}` : raw.replace(/\+/g, '');
};

/**
 * 驗證電話號碼是否有效
 * @param value - 電話號碼
 * @returns 是否有效
 */
export const isValidPhone = (value: string): boolean => {
  const normalized = sanitizePhoneInput(value.trim());
  if (!/^\+?\d+$/.test(normalized)) return false;
  const digitsOnly = normalized.startsWith('+') ? normalized.slice(1) : normalized;
  return digitsOnly.length >= PHONE_DIGITS_MIN && digitsOnly.length <= PHONE_DIGITS_MAX;
};
