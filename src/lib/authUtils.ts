/**
 * Auth URL 工具函數
 *
 * 統一管理所有 auth.html 跳轉邏輯
 * - 禁止使用 navigate() 導向 .html 頁面
 * - 統一使用 window.location.href 跳轉
 * - 所有跳轉必須帶 ?return= 參數
 *
 * @see MOCK-SYSTEM.md #15
 */

import { logger } from './logger';

/** Auth 模式 */
export type AuthMode = 'login' | 'signup';

/** 使用者角色 */
export type AuthRole = 'agent' | 'consumer';

/** Auth 頁面基礎路徑 */
const AUTH_BASE_PATH = '/maihouses/auth.html';
const DEFAULT_RETURN_PATH = '/maihouses/';

function assertValidAuthMode(mode: AuthMode): void {
  if (mode !== 'login' && mode !== 'signup') {
    throw new Error(`[authUtils] 無效的認證模式: ${String(mode)}`);
  }
}

function assertValidAuthRole(role?: AuthRole): void {
  if (role === undefined) return;
  if (role !== 'agent' && role !== 'consumer') {
    throw new Error(`[authUtils] 無效的使用者角色: ${String(role)}`);
  }
}

function normalizeReturnPath(returnPath?: string): string | undefined {
  if (returnPath === undefined) return undefined;
  const trimmedPath = returnPath.trim();
  if (!trimmedPath) return undefined;

  const hasInvalidPrefix = !trimmedPath.startsWith('/') || trimmedPath.startsWith('//');
  if (hasInvalidPrefix) {
    logger.warn('[authUtils] returnPath 格式無效，改用預設路徑', {
      returnPath: trimmedPath,
    });
    return DEFAULT_RETURN_PATH;
  }

  return trimmedPath;
}

function buildAuthSearchParams(
  mode: AuthMode,
  returnPath?: string,
  role?: AuthRole
): URLSearchParams {
  assertValidAuthMode(mode);
  assertValidAuthRole(role);

  const params = new URLSearchParams({ mode });
  const normalizedReturnPath = normalizeReturnPath(returnPath);

  if (normalizedReturnPath) {
    params.set('return', normalizedReturnPath);
  }

  if (role) {
    params.set('role', role);
  }

  return params;
}

function toRelativeAuthUrl(params: URLSearchParams): string {
  return `${AUTH_BASE_PATH}?${params.toString()}`;
}

/**
 * 產生 auth.html URL
 *
 * @param mode - 認證模式 ('login' | 'signup')
 * @param returnPath - 認證完成後返回的路徑
 * @param role - 使用者角色 ('agent' | 'consumer')
 * @returns 完整的 auth URL
 * @throws {Error} 當 mode 或 role 非法時拋出錯誤（僅非型別安全的 runtime 呼叫）
 *
 * @example
 * // 基本登入
 * getAuthUrl('login', '/maihouses/chat')
 * // => '/maihouses/auth.html?mode=login&return=%2Fmaihouses%2Fchat'
 *
 * @example
 * // UAG 房仲註冊
 * getAuthUrl('signup', '/maihouses/uag', 'agent')
 * // => '/maihouses/auth.html?mode=signup&return=%2Fmaihouses%2Fuag&role=agent'
 */
export function getAuthUrl(mode: AuthMode, returnPath?: string, role?: AuthRole): string {
  const params = buildAuthSearchParams(mode, returnPath, role);

  if (typeof window === 'undefined') {
    return toRelativeAuthUrl(params);
  }

  const origin = window.location.origin;
  if (!origin || origin === 'null') {
    return toRelativeAuthUrl(params);
  }

  try {
    const url = new URL(AUTH_BASE_PATH, origin);
    url.search = params.toString();
    return url.toString();
  } catch {
    logger.warn('[authUtils] window.location.origin 無效，改用相對路徑', { origin });
    return toRelativeAuthUrl(params);
  }
}

/**
 * 取得當前頁面完整路徑（含 search 和 hash）
 *
 * @returns 當前頁面路徑
 */
export function getCurrentPath(): string {
  if (typeof window === 'undefined') {
    return '/maihouses/';
  }

  const { pathname, search, hash } = window.location;
  return `${pathname}${search}${hash}`;
}

/**
 * 導向 auth 頁面
 *
 * @param mode - 認證模式
 * @param returnPath - 認證完成後返回的路徑（預設為當前頁面）
 * @param role - 使用者角色
 */
export function navigateToAuth(mode: AuthMode, returnPath?: string, role?: AuthRole): void {
  if (typeof window === 'undefined') {
    logger.warn('[authUtils] 非瀏覽器環境呼叫 navigateToAuth，已略過', {
      mode,
      returnPath,
      role,
    });
    return;
  }

  const targetPath = returnPath ?? getCurrentPath();
  const authUrl = getAuthUrl(mode, targetPath, role);

  logger.debug('[authUtils] 導向認證頁', { mode, returnPath: targetPath, role });

  window.location.href = authUrl;
}

/**
 * 產生登入 URL（快捷方法）
 *
 * @param returnPath - 登入完成後返回的路徑
 * @returns 登入頁面 URL
 */
export function getLoginUrl(returnPath?: string): string {
  return getAuthUrl('login', returnPath);
}

/**
 * 產生註冊 URL（快捷方法）
 *
 * @param returnPath - 註冊完成後返回的路徑
 * @param role - 使用者角色
 * @returns 註冊頁面 URL
 */
export function getSignupUrl(returnPath?: string, role?: AuthRole): string {
  return getAuthUrl('signup', returnPath, role);
}
