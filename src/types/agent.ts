export interface UagSummary {
  grade: "S" | "A" | "B" | "C";
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
}

export interface TodoItem {
  id: string;
  type: "reply" | "contact" | "system";
  content: string;
  isDone: boolean;
  time: string;
}
