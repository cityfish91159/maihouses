/**
 * Application Defaults
 * 
 * Central configuration for default values used across the application.
 * Prevents magic numbers and ensures consistency.
 */

export const DEFAULTS = {
    /** Default notification count to show when no real data is available */
    NOTIFICATION_COUNT: 0,

    /** Default user name if profile is missing */
    USER_NAME: '用戶',

    /** Default community name */
    COMMUNITY_NAME: '未加入社區',
} as const;
