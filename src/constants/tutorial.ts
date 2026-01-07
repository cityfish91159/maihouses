export const TUTORIAL_CONFIG = {
  // Idle Timer
  IDLE_TIMEOUT_MS: 5 * 60 * 1000,

  // Interaction Configs
  CELEBRATE_CLICK_COUNT_THRESHOLD: 5,
  WELCOME_DELAY_MS: 1000,

  // Messages
  MESSAGES: {
    WELCOME: "嗨！我是邁邁，你的買房小助手！點我看看能做什麼～",
    SEARCH_HINT: "試試搜尋「捷運」或「學區宅」找好房～",
    IDLE_WAKEUP: "Zzz... 需要幫忙嗎？",
    CELEBRATE: "哈哈！你發現隱藏功能了！",
    DEAFULT_HINT: "點我可以看到提示喔～",
  },

  // Click Tips Carousel
  CLICK_TIPS: [
    "點我可以看到提示喔～",
    "我會根據你的操作改變表情！",
    "再點兩下試試看...",
    "快了快了！",
  ] as const,

  // ARIA Accessibility Config
  ARIA: {
    LIVE_REGION_ID: "maimai-live-region",
    POLITENESS: "polite" as const,
  },
};
