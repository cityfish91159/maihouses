import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
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

export const STEP_ICONS_SVG: Record<number, ComponentType<LucideProps>> = {
  1: Phone,
  2: Home,
  3: Banknote,
  4: FileText,
  5: Handshake,
  6: Key,
};

export const STEP_NAMES: Record<number, string> = {
  1: '打過電話',
  2: '看過房子',
  3: '出價',
  4: '談價',
  5: '成交',
  6: '交屋',
};

export const STEP_DESCRIPTIONS: Record<number, string> = {
  1: '房仲打來了',
  2: '看過房子了',
  3: '出價了',
  4: '在談價中',
  5: '成交了',
  6: '拿到鑰匙',
};
