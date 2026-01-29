export interface UagSummary {
  grade: 'S' | 'A' | 'B' | 'C';
  score: number;
  growth: number;
  tags: string[];
}

export interface PerformanceStats {
  score: number;
  days: number;
  liked: number;
  views: number;
  replies: number;
  contacts: number;
  // 業務績效指標
  deals: number; // 本月成交件數
  amount: number; // 成交金額（萬元）
  clients: number; // 服務中客戶數
}

export interface TodoItem {
  id: string;
  type: 'reply' | 'contact' | 'system';
  content: string;
  isDone: boolean;
  time: string;
}
