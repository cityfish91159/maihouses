// MUSE Night Mode - Type Definitions

export interface SoulTreasure {
  id: string;
  treasure_type: string;
  title: string;
  content: string;
  media_url?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  unlocked_at: string;
}

export interface MuseTask {
  id: string;
  task_type: 'selfie' | 'voice' | 'confession' | 'photo';
  instruction: string;
  location_hint?: string;
  status: 'pending' | 'completed' | 'expired';
  reward_rarity: string;
  created_at: string;
}

export interface ChatMessage {
  role: 'user' | 'muse';
  content: string;
  timestamp: Date;
  hasTask?: boolean;
  task?: MuseTask;
}

export interface Report {
  risk: number;
  whisper: string;
  physiognomy?: string;
  socio_status?: string;
  hidden_intent?: string;
  red_flag?: string;
  user_zodiac_insight?: string;
}

export interface ConversationReport {
  trust_score: number;
  intent_analysis: string;
  red_flags: string;
  green_flags: string;
  advice: string;
  muse_comment: string;
}

export interface PerformanceReport {
  obedience: string;
  wetness: string;
  endurance: string;
  vocalization: string;
  comment: string;
}

export interface UnlockStage {
  level: number;
  name: string;
  description: string;
  blur: number;
  opacity: number;
}

export interface RarityStyle {
  bg: string;
  text: string;
  glow: string;
}

// 問答系統類型
export type QuestionType =
  | 'desire_help'        // 完整親密模式
  | 'climax_request'     // 高潮按鈕
  | 'ice_zone'           // 禁止令
  | 'blindfold'          // 盲眼模式
  | 'moan_detection'     // 呻吟檢測
  | 'haptic'             // 觸覺節拍器
  | 'selfie'             // 自拍請求
  | 'intimate_photo'     // 私密照請求
  | 'specific_photo'     // 特定照片請求
  | 'voice'              // 語音請求
  | 'confession'         // 告白請求
  | 'rival_check'        // 情敵檢查
  | 'conversation_check' // 對話檢查
  | 'redemption'         // 贖罪
  | 'preference_position'      // 性癖：體位偏好
  | 'preference_masturbation'  // 性癖：自慰習慣
  | 'preference_toys'          // 性癖：玩具使用
  | 'preference_experience'    // 性癖：性經驗
  | 'preference_fantasy'       // 性癖：性幻想
  | 'preference_body'          // 性癖：身體敏感帶
  | 'preference_bdsm_role'     // 性癖：BDSM 角色偏好
  | 'preference_bondage'       // 性癖：束縛偏好
  | 'preference_discipline'    // 性癖：調教/懲罰
  | 'preference_domination'    // 性癖：支配/控制
  | 'preference_submission'    // 性癖：服從/臣服
  | 'preference_pain'          // 性癖：疼痛遊戲
  | 'preference_humiliation'   // 性癖：羞辱/羞恥
  | 'preference_roleplay'      // 性癖：角色扮演
  | 'preference_voyeur'        // 性癖：觀看癖
  | 'preference_exhibitionist' // 性癖：暴露癖
  | 'preference_fetish'        // 性癖：戀物癖
  | 'preference_public'        // 性癖：公共場所
  | 'preference_group'         // 性癖：群交/多人
  | 'preference_taboo'         // 性癖：禁忌幻想
  | 'preference_verbal'        // 性癖：語言調教
  | 'preference_control'       // 性癖：控制遊戲
  | 'preference_impact'        // 性癖：打擊遊戲（打屁股等）
  | 'preference_sensory'       // 性癖：感官剝奪/刺激
  | 'preference_oral'          // 性癖：口交偏好
  | 'preference_anal'          // 性癖：肛交偏好
  | 'preference_intensity'     // 性癖：強度偏好
  | 'preference_foreplay'      // 性癖：前戲偏好
  | 'preference_aftercare'     // 性癖：後戲親密
  | 'preference_lingerie'      // 性癖：內衣偏好
  | 'preference_atmosphere'    // 性癖：氛圍偏好
  | 'preference_frequency'     // 性癖：頻率偏好
  | 'preference_timing'        // 性癖：時間偏好
  | 'preference_location'      // 性癖：地點偏好
  | 'preference_kiss'          // 性癖：接吻方式
  | 'preference_touch'         // 性癖：撫摸方式
  | 'preference_dirty_talk'    // 性癖：髒話偏好
  | 'preference_preparation'   // 性癖：準備工作
  | 'preference_lingerie_photo' // 性癖：內衣褲照片（色色）
  | 'preference_toys_photo';    // 性癖：情趣用品照片（色色）

export interface QuestionOption {
  label: string;   // 按鈕文字
  value: string;   // 選項值
  emoji?: string;  // 可選 emoji
}

export interface MuseQuestion {
  type: QuestionType;
  text: string;              // 問題文字
  options: QuestionOption[]; // 按鈕選項
}
