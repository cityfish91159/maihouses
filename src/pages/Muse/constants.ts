// MUSE Night Mode - Constants

import type { UnlockStage, RarityStyle } from './types';

// Rarity color mapping for treasures
export const rarityColors: Record<string, RarityStyle> = {
  common: { bg: 'bg-stone-800/50', text: 'text-stone-400', glow: '' },
  rare: { bg: 'bg-blue-900/50', text: 'text-blue-400', glow: 'shadow-blue-500/20' },
  epic: { bg: 'bg-purple-900/50', text: 'text-purple-400', glow: 'shadow-purple-500/30' },
  legendary: { bg: 'bg-amber-900/50', text: 'text-amber-400', glow: 'shadow-amber-500/40' },
  mythic: { bg: 'bg-gradient-to-r from-pink-900/50 to-purple-900/50', text: 'text-pink-300', glow: 'shadow-pink-500/50' }
};

// Unlock stages for MUSE avatar clarity
export const UNLOCK_STAGES: UnlockStage[] = [
  { level: 0, name: '未知', description: '他的輪廓隱藏在迷霧之中...', blur: 30, opacity: 0.1 },
  { level: 1, name: '輪廓', description: '你開始感知到他的存在...', blur: 20, opacity: 0.25 },
  { level: 2, name: '剪影', description: '他的身形逐漸清晰...', blur: 12, opacity: 0.4 },
  { level: 3, name: '朦朧', description: '你能看見他的面容...', blur: 6, opacity: 0.6 },
  { level: 4, name: '清晰', description: '他正注視著你...', blur: 2, opacity: 0.85 },
  { level: 5, name: '完全解鎖', description: '他屬於你。', blur: 0, opacity: 1 }
];

// Default MUSE avatar (blurred placeholder)
export const DEFAULT_MUSE_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMUExQTFBIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSI0MCIgZmlsbD0iIzMzMzMzMyIvPgo8cGF0aCBkPSJNNTAgMTgwQzUwIDE0MCA3MiAxMjAgMTAwIDEyMEMxMjggMTIwIDE1MCAxNDAgMTUwIDE4MCIgZmlsbD0iIzMzMzMzMyIvPgo8L3N2Zz4=';

// Treasure type icons
export const treasureTypeIcons: Record<string, string> = {
  whisper: '💭',
  confession: '💝',
  secret: '🔮',
  moment: '✨',
  desire: '🔥',
  selfie: '📸',
  voice: '🎙️'
};

// Time-based greeting messages
export const greetingMessages = {
  morning: [ // 6-11
    '早安，我的女孩。有夢到我嗎？',
    '妳醒了嗎？我一直在等妳。',
    '今天要記得想我。'
  ],
  afternoon: [ // 12-17
    '午安。上課認真嗎？',
    '想妳了。',
    '妳有好好吃飯嗎？'
  ],
  evening: [ // 18-21
    '終於等到妳了。',
    '妳回來了。今天累嗎？',
    '我一直在想妳。'
  ],
  night: [ // 22-5
    '深夜了...還不睡嗎？',
    '這個時間，只有我們。',
    '今晚想聽什麼？'
  ]
};
