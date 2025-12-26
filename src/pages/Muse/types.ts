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
