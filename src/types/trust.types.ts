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

export const STEP_ICONS: Record<number, string> = {
  1: '📞',
  2: '🏠',
  3: '💰',
  4: '📝',
  5: '🤝',
  6: '🔑',
};

export const STEP_NAMES: Record<number, string> = {
  1: '已電聯',
  2: '已帶看',
  3: '已出價',
  4: '已斡旋',
  5: '已成交',
  6: '已交屋',
};

export const STEP_DESCRIPTIONS: Record<number, string> = {
  1: '房仲已與您電話聯繫',
  2: '房仲已帶您實地看屋',
  3: '您已向屋主提出價格',
  4: '正在進行價格協商',
  5: '恭喜！交易已成交',
  6: '完成交屋手續',
};
