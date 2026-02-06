/**
 * Permission Domain Types (L7+ Optimized)
 *
 * 定義系統中的所有權限能力與角色映射
 * 採用 Capability-Based Security 模型與 const assertion 確保型別安全
 *
 * @module Permissions
 */

import { Role } from './community';

/**
 * 權限能力定義 (Use 'as const' for literal types)
 * 系統核心的權限常數，所有權限檢查應依賴此定義
 */
export const PERMISSIONS = {
  // === 私密牆模組 ===
  /** 查看私密牆內容 */
  VIEW_PRIVATE_WALL: 'view:private_wall',
  /** 發佈私密貼文 */
  POST_PRIVATE_WALL: 'post:private_wall',

  // === 房仲模組 ===
  /** 查看房仲數據 (UAG/績效) */
  VIEW_AGENT_STATS: 'view:agent_stats',
  /** 管理客戶資料 */
  MANAGE_CLIENTS: 'manage:clients',

  // === 管理員模組 ===
  /** 社區管理權限 */
  MANAGE_COMMUNITY: 'manage:community',
} as const;

/**
 * 權限型別 (Permission Type)
 * 自動從 PERMISSIONS 常數推導，確保型別與值同步
 */
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * 角色權限矩陣定義 (Role-Permission Matrix)
 * Single Source of Truth for Role Capabilities
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  /** 訪客: 無任何特殊權限 */
  guest: [],

  /** 一般會員: 需驗證住戶身分，暫無權限 */
  member: [],

  /** 認證住戶: 擁有完整私密牆存取權 */
  resident: [PERMISSIONS.VIEW_PRIVATE_WALL, PERMISSIONS.POST_PRIVATE_WALL],
  official: [
    // Added missing official key
    PERMISSIONS.VIEW_PRIVATE_WALL,
    PERMISSIONS.POST_PRIVATE_WALL,
  ],
  /** 房仲: 可透視社區狀態以服務客戶，但不可在私密牆發言 */
  agent: [PERMISSIONS.VIEW_PRIVATE_WALL, PERMISSIONS.VIEW_AGENT_STATS, PERMISSIONS.MANAGE_CLIENTS],

  // 管理員 (已啟用)
  admin: [
    PERMISSIONS.VIEW_PRIVATE_WALL,
    PERMISSIONS.POST_PRIVATE_WALL,
    PERMISSIONS.VIEW_AGENT_STATS,
    PERMISSIONS.MANAGE_COMMUNITY,
    PERMISSIONS.MANAGE_CLIENTS,
  ],
};

/** 輔助型別：定義擁有權限的函數介面 */
export type PermissionCheck = (permission: Permission) => boolean;
