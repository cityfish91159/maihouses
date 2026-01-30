import { Banknote, FileText, Handshake, Home, Key, Phone } from 'lucide-react';

export interface TrustStep {
  step: number;
  name: string;
  done: boolean;
  confirmed: boolean;
  date: string | null;
  note: string;
  confirmedAt?: string;
}

export interface TrustTransaction {
  id: string;
  created_at: string;
  updated_at: string;
  case_name: string;
  agent_id: string;
  agent_name: string | null;
  guest_token: string;
  token_expires_at: string;
  current_step: number;
  steps_data: TrustStep[];
  status: 'active' | 'completed' | 'cancelled';
}

export interface TrustRoomView {
  id: string;
  case_name: string;
  agent_name: string | null;
  current_step: number;
  steps_data: TrustStep[];
  status: string;
  created_at: string;
  token_expires_at: string;
}

export interface ConfirmResult {
  success: boolean;
  error?: string;
}

/**
 * 步驟 SVG 圖示映射
 * 用於 TrustRoom / Assure 頁面的步驟列表圖示
 */
export const STEP_ICONS_SVG: Record<number, typeof Phone> = {
  1: Phone,
  2: Home,
  3: Banknote,
  4: FileText,
  5: Handshake,
  6: Key,
};

/** 步驟名稱（用於標題顯示） */
export const STEP_NAMES: Record<number, string> = {
  1: '電話聯繫',
  2: '實地看屋',
  3: '出價',
  4: '斡旋談價',
  5: '成交',
  6: '交屋',
};

/** 步驟描述（買方視角，統一「已完成」語態） */
export const STEP_DESCRIPTIONS: Record<number, string> = {
  1: '已接到房仲電話',
  2: '已實地看過房子',
  3: '已提出購買價格',
  4: '雙方議價中',
  5: '已簽約成交',
  6: '已取得鑰匙',
};
