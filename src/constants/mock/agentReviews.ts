import type { AgentReviewListData } from '../../types/agent-review';
import { deepFreeze } from '../../lib/deepFreeze';

export const AGENT_REVIEW_LIST_MOCK_DATA: AgentReviewListData = deepFreeze({
  reviews: [
    {
      id: 'mock-1',
      rating: 5,
      comment: '帶看很仔細，解說清楚，推薦！',
      createdAt: '2026-01-15T10:00:00Z',
      reviewerName: '林*',
    },
    {
      id: 'mock-2',
      rating: 5,
      comment: '回覆很快，態度親切。',
      createdAt: '2026-01-10T14:30:00Z',
      reviewerName: '王*',
    },
    {
      id: 'mock-3',
      rating: 4,
      comment: '專業度不錯，但文件準備稍微等了一下。',
      createdAt: '2026-01-05T09:15:00Z',
      reviewerName: '陳*',
    },
  ],
  total: 32,
  avgRating: 4.8,
  distribution: {
    '1': 0,
    '2': 0,
    '3': 2,
    '4': 6,
    '5': 24,
  },
});
