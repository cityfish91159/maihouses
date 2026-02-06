export const HEADER_MODES = {
  COMMUNITY: 'community',
  CONSUMER: 'consumer',
  AGENT: 'agent',
} as const;

export type GlobalHeaderMode = (typeof HEADER_MODES)[keyof typeof HEADER_MODES];

export const HEADER_STRINGS = {
  BACK_HOME: '回首頁',
  SUBTITLE_WALL: '社區牆',
  AGENT_BADGE: '專業版',
  BTN_LOGIN: '登入',
  BTN_REGISTER: '免費註冊',
  BTN_LOGOUT: '登出',
  BTN_MY_ACCOUNT: '我的帳號',
  LABEL_NOTIFICATIONS: '通知',
  LABEL_AVATAR: '使用者選單',
  MENU_PROFILE: '個人檔案',
  ROLE_GUEST: '訪客',
  ROLE_MEMBER: '一般會員',
  ROLE_RESIDENT: '住戶',
  ROLE_AGENT: '認證房仲',
  ROLE_OFFICIAL: '官方帳號',
  MSG_LOGOUT_SUCCESS: '已登出',
  MSG_LOGOUT_DESC: '期待下次見面！',
  MSG_LOGOUT_ERROR: '登出失敗',
  MSG_LOGOUT_RETRY: '請稍後再試',
  MSG_FEATURE_DEV: '功能開發中',
  MSG_PROFILE_SOON: '個人檔案頁面即將推出',
};
