import { Banknote, FileText, Handshake, Home, Key, Phone } from 'lucide-react';

/**
 * 交易步驟資料結構
 * 用於記錄買方在交易流程中的每個步驟狀態
 */
export interface TrustStep {
  /** 步驟編號 (1-6) */
  step: number;
  /** 步驟名稱 */
  name: string;
  /** 是否已完成 */
  done: boolean;
  /** 是否已確認 */
  confirmed: boolean;
  /** 完成日期 (ISO 8601 格式) */
  date: string | null;
  /** 備註說明 */
  note: string;
  /** 確認時間 (ISO 8601 格式) */
  confirmedAt?: string;
}

/**
 * 信任交易完整資料結構
 * 對應 Supabase trust_transactions 資料表
 */
export interface TrustTransaction {
  /** 交易案件 UUID */
  id: string;
  /** 建立時間 (ISO 8601 格式) */
  created_at: string;
  /** 更新時間 (ISO 8601 格式) */
  updated_at: string;
  /** 案件名稱 */
  case_name: string;
  /** 業務 UUID */
  agent_id: string;
  /** 業務姓名 */
  agent_name: string | null;
  /** 買方存取 token */
  guest_token: string;
  /** token 過期時間 (ISO 8601 格式) */
  token_expires_at: string;
  /** 當前步驟 (1-6) */
  current_step: number;
  /** 步驟資料陣列 */
  steps_data: TrustStep[];
  /** 交易狀態 */
  status: 'active' | 'completed' | 'cancelled';
}

/**
 * 買方視角的信任交易資料
 * 用於 TrustRoom 頁面顯示，欄位已脫敏
 */
export interface TrustRoomView {
  /** 交易案件 UUID */
  id: string;
  /** 案件名稱 */
  case_name: string;
  /** 業務姓名 */
  agent_name: string | null;
  /** 當前步驟 (1-6) */
  current_step: number;
  /** 步驟資料陣列 */
  steps_data: TrustStep[];
  /** 交易狀態 */
  status: 'active' | 'completed' | 'cancelled';
  /** 建立時間 (ISO 8601 格式) */
  created_at: string;
  /** token 過期時間 (ISO 8601 格式) */
  token_expires_at: string;
}

/**
 * 步驟確認操作回傳結果
 * 用於 useTrustActions hook 的確認邏輯
 */
export interface ConfirmResult {
  /** 操作是否成功 */
  success: boolean;
  /** 錯誤訊息 (失敗時) */
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

/**
 * 步驟描述（買方視角，統一「已完成」語態）
 * 注意: 步驟 4「雙方議價中」為進行中狀態，與其他「已...」語態不同
 */
export const STEP_DESCRIPTIONS: Record<number, string> = {
  1: '已接到房仲電話',
  2: '已實地看過房子',
  3: '已提出購買價格',
  4: '雙方議價中', // 進行中狀態，語態與其他步驟不同
  5: '已簽約成交',
  6: '已取得鑰匙',
};
