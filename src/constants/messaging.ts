/**
 * MSG-2: 私訊通知系統配置常數
 * 所有 magic numbers 集中管理
 */

export const MESSAGING_CONFIG = {
    // 通知列表
    /** 通知下拉選單最多顯示的項目數 */
    MAX_NOTIFICATIONS_DISPLAY: 20,

    /** 訊息預覽截斷長度（字元數） */
    MESSAGE_PREVIEW_MAX_LENGTH: 40,

    // 資料過期
    /** 資料過期閾值（毫秒）- 5 分鐘 */
    STALE_THRESHOLD_MS: 5 * 60 * 1000,

    // 查詢限制
    /** 單次查詢最大對話數 */
    QUERY_LIMIT: 50,

    // Retry 機制
    /** 最大重試次數 */
    RETRY_COUNT: 3,

    /** 初始重試延遲（毫秒） */
    RETRY_INITIAL_DELAY_MS: 1000,

    // UI
    /** 未讀數徽章顯示上限 */
    UNREAD_BADGE_MAX: 99,

    /** Loading skeleton 項目數 */
    LOADING_SKELETON_COUNT: 3,
} as const;

// 類型安全的常數存取
export type MessagingConfigKey = keyof typeof MESSAGING_CONFIG;
