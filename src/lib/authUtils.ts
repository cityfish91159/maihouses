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

/** Auth URL 參數 */
export interface AuthUrlParams {
  /** 認證模式 */
  mode: AuthMode;
  /** 認證完成後返回的路徑 */
  returnPath?: string;
  /** 使用者角色 */
  role?: AuthRole;
}

/** Auth 頁面基礎路徑 */
const AUTH_BASE_PATH = '/maihouses/auth.html';

/**
 * 產生 auth.html URL
 *
 * @param mode - 認證模式 ('login' | 'signup')
 * @param returnPath - 認證完成後返回的路徑
 * @param role - 使用者角色 ('agent' | 'consumer')
 * @returns 完整的 auth URL
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
  try {
    const url = new URL(AUTH_BASE_PATH, window.location.origin);
    url.searchParams.set('mode', mode);

    if (returnPath) {
      url.searchParams.set('return', returnPath);
    }

    if (role) {
      url.searchParams.set('role', role);
    }

    return url.toString();
  } catch {
    // fallback: SSR 或異常 origin 下硬拼路徑
    const params = new URLSearchParams({ mode });

    if (returnPath) {
      params.set('return', returnPath);
    }

    if (role) {
      params.set('role', role);
    }

    return `${AUTH_BASE_PATH}?${params.toString()}`;
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
  const targetPath = returnPath ?? getCurrentPath();
  const authUrl = getAuthUrl(mode, targetPath, role);

  logger.debug('[authUtils] Navigating to auth', { mode, returnPath: targetPath, role });

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
