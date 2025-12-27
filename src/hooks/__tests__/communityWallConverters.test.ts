import { describe, it, expect } from 'vitest';
import {
  resolveAuthorDisplay,
  convertApiPost,
  convertApiReview,
  convertApiQuestion,
  formatTimeAgo,
  sortPostsWithPinned,
  convertApiData,
} from '../communityWallConverters';
import type { CommunityPost, CommunityReview, CommunityQuestion } from '../../services/communityService';

describe('resolveAuthorDisplay', () => {
  it('優先使用作者姓名，保留樓層資訊', () => {
    const result = resolveAuthorDisplay('123456789', { name: '王小明', role: 'resident', floor: '12F' });
    expect(result).toEqual({ name: '王小明', role: 'resident', floor: '12F' });
  });

  it('member 角色使用會員前綴並安全截斷 ID', () => {
    const result = resolveAuthorDisplay('abc', { role: 'member' });
    expect(result).toEqual({ name: '會員-abc', role: 'member' });
  });

  it('官方角色無姓名時使用官方前綴與切片', () => {
    const result = resolveAuthorDisplay('123456789', { role: 'official', name: '' });
    expect(result).toEqual({ name: '官方-123456', role: 'official' });
  });
});

describe('convertApiPost', () => {
  const basePost: CommunityPost = {
    id: 'post-1',
    community_id: 'c1',
    author_id: '123456789',
    content: '這是一段測試內容，用來檢查標題截斷與作者解析',
    visibility: 'public',
    likes_count: 3,
    liked_by: [],
    created_at: new Date().toISOString(),
    comments_count: 1,
    is_pinned: false,
  };

  it('使用作者姓名與樓層，並維持 resident 角色', () => {
    const converted = convertApiPost({
      ...basePost,
      author: { name: '林小林', role: 'resident', floor: '8F' },
    });

    expect(converted.author).toBe('林小林');
    expect(converted.floor).toBe('8F');
    expect(converted.type).toBe('resident');
  });

  it('官方角色無姓名時使用官方前綴與安全切片', () => {
    const converted = convertApiPost({
      ...basePost,
      id: 'post-2',
      author_id: '98765',
      author: { role: 'official', name: '' },
    });

    expect(converted.author).toBe('官方-98765');
    expect(converted.type).toBe('official');
  });
});

describe('convertApiReview', () => {
  const baseReview: CommunityReview = {
    id: 'review-1',
    community_id: 'c1',
    author_id: 'rev-123456',
    content: { pros: ['專業'], cons: '尚可' },
    created_at: new Date().toISOString(),
  };

  it('房仲缺姓名時使用房仲前綴與切片', () => {
    const converted = convertApiReview({ ...baseReview, agent: { name: '' } });
    expect(converted.author).toBe('房仲-rev-12');
  });

  it('房仲有姓名時直接使用', () => {
    const converted = convertApiReview({ ...baseReview, agent: { name: '張房仲' } });
    expect(converted.author).toBe('張房仲');
  });
});

describe('convertApiQuestion', () => {
  const baseQuestion: CommunityQuestion = {
    id: 'q1',
    community_id: 'c1',
    author_id: 'asker-1',
    question: '公設比是多少？',
    answers: [],
    created_at: new Date().toISOString(),
  };

  it('回答者 member 角色顯示會員並安全切片', () => {
    const converted = convertApiQuestion({
      ...baseQuestion,
      answers: [
        {
          id: 'ans-1',
          author_id: 'abcd',
          content: '大約 32%',
          is_expert: false,
          created_at: new Date().toISOString(),
          author: { role: 'member', name: '' },
        },
      ],
    });

    expect(converted.answers[0]).toMatchObject({
      author: '會員-abcd',
      type: 'member',
    });
  });
});

describe('formatTimeAgo', () => {
  it('handles key time windows', () => {
    const now = Date.now();
    expect(formatTimeAgo(new Date(now - 30 * 1000).toISOString())).toBe('剛剛');
    expect(formatTimeAgo(new Date(now - 30 * 60 * 1000).toISOString())).toContain('分鐘前');
    expect(formatTimeAgo(new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString())).toContain('天前');
    expect(formatTimeAgo(new Date(now - 2 * 7 * 24 * 60 * 60 * 1000).toISOString())).toContain('週前');
  });
});

describe('sortPostsWithPinned', () => {
  it('keeps pinned first and preserves relative order', () => {
    const sorted = sortPostsWithPinned([
      { id: 'b', author: 'B', type: 'resident', time: '', title: '', content: '', comments: 0, pinned: false },
      { id: 'a', author: 'A', type: 'resident', time: '', title: '', content: '', comments: 0, pinned: true },
      { id: 'c', author: 'C', type: 'resident', time: '', title: '', content: '', comments: 0, pinned: false },
    ]);

    expect(sorted.map(p => p.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('convertApiData', () => {
  it('returns neutral placeholders when posts/reviews/questions missing', () => {
    const converted = convertApiData({
      // 故意省略 communityInfo，模擬後端缺資料
      posts: { public: null as unknown as CommunityPost[], private: null as unknown as CommunityPost[], publicTotal: 0, privateTotal: 0 },
      reviews: { items: null as unknown as CommunityReview[], total: 0 },
      questions: { items: null as unknown as CommunityQuestion[], total: 0 },
    } as any);

    expect(converted.communityInfo.name).toBe('未知社區');
    expect(converted.posts.public).toEqual([]);
    expect(converted.reviews.items).toEqual([]);
    expect(converted.questions.items).toEqual([]);
  });
});
