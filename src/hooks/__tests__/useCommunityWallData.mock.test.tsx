import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useCommunityWallData } from '../useCommunityWallData';
import type { UnifiedWallData } from '../useCommunityWallData';
import type { UseCommunityWallReturn } from '../useCommunityWallQuery';

vi.mock('../useCommunityWallQuery', () => ({
  useCommunityWall: () => ({
    data: undefined,
    isLoading: false,
    isFetching: false,
    error: null,
    refresh: vi.fn(),
    toggleLike: vi.fn(),
    createPost: vi.fn(),
    askQuestion: vi.fn(),
    answerQuestion: vi.fn(),
    isOptimisticUpdating: false,
  }) as UseCommunityWallReturn,
}));

const mockDataWithoutLikes: UnifiedWallData = {
  communityInfo: {
    name: '測試社區',
    year: 2020,
    units: 100,
    managementFee: 60,
    builder: '測試建商',
    members: 10,
    avgRating: 4,
    monthlyInteractions: 20,
    forSale: 1,
  },
  posts: {
    public: [
      {
        id: 'post-without-likes',
        author: '沒有讚數的住戶',
        type: 'resident',
        time: '剛剛',
        title: '這裡沒有 likes 欄位',
        content: '用來驗證 fallback 邏輯',
        comments: 0,
      },
    ],
    private: [],
    publicTotal: 1,
    privateTotal: 0,
  },
  reviews: {
    items: [],
    total: 0,
  },
  questions: {
    items: [],
    total: 0,
  },
};

describe('useCommunityWallData - Mock mode interactions', () => {
  const ensurePost = <T extends { id: string | number }>(post: T | undefined, message: string): T => {
    expect(post, message).toBeDefined();
    if (!post) {
      throw new Error(message);
    }
    return post;
  };

  const renderDefaultHook = () => renderHook(() => useCommunityWallData(undefined, { persistMockState: false }));

  it('increments and decrements likes per user intent instead of total likes', async () => {
    const { result } = renderDefaultHook();
    const targetPost = ensurePost(result.current.data.posts.public[0], 'Mock data must include at least one public post');
    const postId = targetPost.id;
    const initialLikes = targetPost.likes ?? 0;

    await act(async () => {
      await result.current.toggleLike(postId);
    });
    expect(ensurePost(result.current.data.posts.public[0], 'Post should still exist').likes).toBe(initialLikes + 1);

    await act(async () => {
      await result.current.toggleLike(postId);
    });
    expect(ensurePost(result.current.data.posts.public[0], 'Post should still exist').likes).toBe(initialLikes);
  });

  it('creates posts in correct visibility lists', async () => {
    const { result } = renderDefaultHook();
    const prevPublicCount = result.current.data.posts.public.length;
    const prevPrivateCount = result.current.data.posts.private.length;
    const prevPublicTotal = result.current.data.posts.publicTotal;
    const prevPrivateTotal = result.current.data.posts.privateTotal;

    await act(async () => {
      await result.current.createPost('測試公開貼文內容', 'public');
    });
    expect(result.current.data.posts.public.length).toBe(prevPublicCount + 1);
    expect(result.current.data.posts.publicTotal).toBe(prevPublicTotal + 1);
    expect(
      result.current.data.posts.public.some(post => post.content === '測試公開貼文內容')
    ).toBe(true);

    await act(async () => {
      await result.current.createPost('測試私密貼文內容', 'private');
    });
    expect(result.current.data.posts.private.length).toBe(prevPrivateCount + 1);
    expect(result.current.data.posts.privateTotal).toBe(prevPrivateTotal + 1);
    expect(
      result.current.data.posts.private.some(post => post.content === '測試私密貼文內容')
    ).toBe(true);
  });

  it('adds questions and answers with accurate counters', async () => {
    const { result } = renderDefaultHook();
    const prevTotal = result.current.data.questions.total;

    await act(async () => {
      await result.current.askQuestion('這是一個測試問題嗎？');
    });
    const createdQuestion = ensurePost(result.current.data.questions.items[0], '應該要新增第一筆問題');
    expect(createdQuestion.question).toBe('這是一個測試問題嗎？');
    expect(createdQuestion.answersCount).toBe(0);
    expect(result.current.data.questions.total).toBe(prevTotal + 1);

    const existingQuestion =
      result.current.data.questions.items.find(q => q.answersCount > 0) ?? result.current.data.questions.items[1];
    const safeQuestion = ensurePost(existingQuestion, 'Mock data 應至少存在一筆有回答或第二筆問題');
    const questionId = String(safeQuestion.id);
    const prevAnswers = safeQuestion.answersCount;

    await act(async () => {
      await result.current.answerQuestion(questionId, '這是測試回答');
    });
    const answeredQuestion = result.current.data.questions.items.find(q => String(q.id) === questionId);
    expect(answeredQuestion?.answersCount).toBe(prevAnswers + 1);
    expect(answeredQuestion?.answers.some(answer => answer.content === '這是測試回答')).toBe(true);
  });

  it('resets likedPosts intent when switching between mock and API modes', async () => {
    const { result } = renderDefaultHook();
    const targetPost = ensurePost(result.current.data.posts.public.find(post => typeof post.likes === 'number'), '需要一筆具有 likes 的貼文');
    const postId = targetPost.id;
    const initialLikes = targetPost.likes ?? 0;

    await act(async () => {
      await result.current.toggleLike(postId);
    });
    expect(ensurePost(result.current.data.posts.public.find(post => post.id === postId), '貼文不存在').likes).toBe(initialLikes + 1);

    await act(async () => {
      result.current.setUseMock(false);
    });

    await act(async () => {
      result.current.setUseMock(true);
    });

    await act(async () => {
      await result.current.toggleLike(postId);
    });

    expect(ensurePost(result.current.data.posts.public.find(post => post.id === postId), '貼文不存在').likes).toBe(initialLikes + 2);
  });

  it('handles toggling likes for posts without initial likes value', async () => {
    const { result } = renderHook(() =>
      useCommunityWallData(undefined, { initialMockData: mockDataWithoutLikes, persistMockState: false })
    );
    const postWithoutLikes = ensurePost(result.current.data.posts.public[0], '測試資料應提供一筆沒有 likes 的貼文');
    const postId = postWithoutLikes.id;

    await act(async () => {
      await result.current.toggleLike(postId);
    });

    const updated = ensurePost(result.current.data.posts.public.find(post => post.id === postId), '貼文不存在');
    expect(updated.likes).toBe(1);
  });
});
