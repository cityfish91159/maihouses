/**
 * Permission Domain Types
 * 
 * 定義系統中的所有權限能力與角色映射
 * 採用 Capability-Based Security 模型
 */

import { Role } from './community';

// 權限能力枚舉
export enum Permission {
    // 私密牆相關
    VIEW_PRIVATE_WALL = 'view:private_wall',    // 查看私密牆內容
    POST_PRIVATE_WALL = 'post:private_wall',    // 發佈私密貼文

    // 房仲相關
    VIEW_AGENT_STATS = 'view:agent_stats',      // 查看房仲數據 (UAG)
    MANAGE_CLIENTS = 'manage:clients',          // 管理客戶資料

    // 管理相關
    MANAGE_COMMUNITY = 'manage:community',      // 社區管理
}

// 角色權限矩陣定義
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    // 訪客 (無權限)
    guest: [],

    // 一般會員 (需驗證住戶身分)
    member: [],

    // 認證住戶 (完整私密牆權限)
    resident: [
        Permission.VIEW_PRIVATE_WALL,
        Permission.POST_PRIVATE_WALL
    ],

    // 房仲 (可查看私密牆以了解社區動態，但不可發文)
    agent: [
        Permission.VIEW_PRIVATE_WALL,
        Permission.VIEW_AGENT_STATS,
        Permission.MANAGE_CLIENTS
    ],

    // 管理員 (暫無此角色，保留未來擴充空間)
    // admin: [
    //   Permission.VIEW_PRIVATE_WALL,
    //   Permission.POST_PRIVATE_WALL,
    //   Permission.MANAGE_COMMUNITY
    // ]
};

// 輔助型別：定義擁有權限的函數介面
export type PermissionCheck = (permission: Permission) => boolean;
