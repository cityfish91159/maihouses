import type { UagSummary, PerformanceStats, TodoItem } from "../../types/agent";

export const MOCK_UAG_SUMMARY: UagSummary = {
  grade: "S",
  score: 92,
  growth: 15,
  tags: ["回覆迅速", "市場觀點獨到", "親和力高"],
};

export const MOCK_PERFORMANCE_STATS: PerformanceStats = {
  score: 2560,
  days: 128,
  liked: 73,
  views: 1250,
  replies: 45,
  contacts: 8,
};

export const MOCK_TODO_LIST: TodoItem[] = [
  {
    id: "t1",
    type: "reply",
    content: "回覆陳小姐關於「惠宇上晴」的詢問",
    isDone: false,
    time: "10:00",
  },
  {
    id: "t2",
    type: "contact",
    content: "聯繫李先生安排看房",
    isDone: false,
    time: "14:30",
  },
  {
    id: "t3",
    type: "system",
    content: "更新個人簡介以提升信任度",
    isDone: true,
    time: "Yesterday",
  },
];
