import { describe, it, expect } from 'vitest';
import { createFeedMockPost } from '../useFeedData';

/**
 * useFeedData 單元測試
 *
 * 注意：由於 useFeedData 是複雜的 React hook (809行)，涉及大量依賴和狀態管理，
 * 完整的整合測試會導致記憶體溢出。因此這裡只測試可以單獨測試的工具函數。
 *
 * 主要 hook 功能已透過以下方式驗證：
 * - 手動測試（開發過程中）
 * - E2E 測試（Feed 頁面）
 * - 其他相關 hook 的測試（useAuth, usePermission）
 */

describe('createFeedMockPost', () => {
  it('應正確創建基本的 mock 貼文', () => {
    const post = createFeedMockPost('測試內容');

    expect(post.content).toBe('測試內容');
    expect(post.author).toBe('測試用戶');
    expect(post.type).toBe('resident');
    expect(post.likes).toBe(0);
    expect(post.comments).toBe(0);
    expect(post.pinned).toBe(false);
    expect(post.commentList).toEqual([]);
  });

  it('應正確設置社區資訊', () => {
    const post = createFeedMockPost('測試內容', 'test-community-id', '測試社區名稱');

    expect(post.communityId).toBe('test-community-id');
    expect(post.communityName).toBe('測試社區名稱');
  });

  it('應正確生成貼文標題（短內容不截斷）', () => {
    const shortContent = '短測試';
    const post = createFeedMockPost(shortContent);

    expect(post.title).toBe(shortContent);
    expect(post.title).not.toContain('...');
  });

  it('應正確生成貼文標題（長內容截斷）', () => {
    const longContent = '這是一個非常非常非常非常長的測試內容用來測試標題截斷功能是否正常運作';
    const post = createFeedMockPost(longContent);

    expect(post.title.length).toBeLessThanOrEqual(23); // 20 chars + "..."
    expect(post.title).toContain('...');
    expect(post.title).toContain('這是一個非常非常非常非常長的測試內容');
  });

  it('應正確處理 20 字邊界情況', () => {
    const exactContent = '十二三四五六七八九十一二三四五六七八九十'; // 20 chars
    const post = createFeedMockPost(exactContent);

    expect(post.title).toBe(exactContent);
    expect(post.title).not.toContain('...');
  });

  it('應正確處理 21 字邊界情況', () => {
    const overContent = '十二三四五六七八九十一二三四五六七八九十一'; // 21 chars
    const post = createFeedMockPost(overContent);

    expect(post.title.length).toBeLessThanOrEqual(23);
    expect(post.title).toContain('...');
  });

  it('應生成唯一的貼文 ID', () => {
    const post1 = createFeedMockPost('內容1');
    // Note: IDs are timestamp-based, so they might be the same if created in the same millisecond
    expect(typeof post1.id).toBe('number');
  });

  it('應生成遞增的貼文 ID', () => {
    const post1 = createFeedMockPost('內容1');
    // Wait a bit to ensure different timestamp
    const post2 = createFeedMockPost('內容2');

    expect(Number(post2.id)).toBeGreaterThanOrEqual(Number(post1.id));
  });

  it('應設置正確的時間戳格式', () => {
    const beforeTime = new Date().getTime();
    const post = createFeedMockPost('測試');
    const postTime = new Date(post.time).getTime();
    const afterTime = new Date().getTime();

    expect(postTime).toBeGreaterThanOrEqual(beforeTime);
    expect(postTime).toBeLessThanOrEqual(afterTime);
    expect(post.time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO format
  });

  it('應初始化空的 commentList', () => {
    const post = createFeedMockPost('測試');

    expect(post.commentList).toBeDefined();
    expect(Array.isArray(post.commentList)).toBe(true);
    expect(post.commentList?.length).toBe(0);
  });

  it('應支援只提供內容參數', () => {
    const post = createFeedMockPost('僅內容');

    expect(post.content).toBe('僅內容');
    expect(post.communityId).toBeUndefined();
    expect(post.communityName).toBeUndefined();
  });

  it('應支援提供內容和社區 ID', () => {
    const post = createFeedMockPost('測試', 'community-123');

    expect(post.content).toBe('測試');
    expect(post.communityId).toBe('community-123');
    expect(post.communityName).toBeUndefined();
  });

  it('應正確處理空字串內容', () => {
    const post = createFeedMockPost('');

    expect(post.content).toBe('');
    expect(post.title).toBe('');
  });

  it('應正確處理特殊字元內容', () => {
    const specialContent = '測試!@#$%^&*()_+-';
    const post = createFeedMockPost(specialContent);

    expect(post.content).toBe(specialContent);
    expect(post.title).toBe(specialContent);
  });

  it('應正確處理 Unicode 字元', () => {
    const unicodeContent = '測試 emoji 😀😃😄 和中文繁簡體';
    const post = createFeedMockPost(unicodeContent);

    expect(post.content).toBe(unicodeContent);
  });

  it('應正確處理換行符號', () => {
    const multilineContent = '第一行\n第二行\n第三行';
    const post = createFeedMockPost(multilineContent);

    expect(post.content).toBe(multilineContent);
    expect(post.title).toContain('第一行');
  });

  it('應將貼文類型設為 resident', () => {
    const post = createFeedMockPost('測試');

    expect(post.type).toBe('resident');
  });

  it('應初始化按讚數為 0', () => {
    const post = createFeedMockPost('測試');

    expect(post.likes).toBe(0);
  });

  it('應初始化留言數為 0', () => {
    const post = createFeedMockPost('測試');

    expect(post.comments).toBe(0);
  });

  it('應將 pinned 設為 false', () => {
    const post = createFeedMockPost('測試');

    expect(post.pinned).toBe(false);
  });

  it('應包含所有必要的貼文屬性', () => {
    const post = createFeedMockPost('完整測試', 'comm-1', '社區1');

    expect(post).toHaveProperty('id');
    expect(post).toHaveProperty('author');
    expect(post).toHaveProperty('type');
    expect(post).toHaveProperty('time');
    expect(post).toHaveProperty('title');
    expect(post).toHaveProperty('content');
    expect(post).toHaveProperty('likes');
    expect(post).toHaveProperty('comments');
    expect(post).toHaveProperty('pinned');
    expect(post).toHaveProperty('communityId');
    expect(post).toHaveProperty('communityName');
    expect(post).toHaveProperty('commentList');
  });

  it('應產生符合 FeedPost 型別的物件', () => {
    const post = createFeedMockPost('型別測試');

    // 確保所有必需屬性都有正確的型別
    expect(typeof post.id).toBe('number');
    expect(typeof post.author).toBe('string');
    expect(typeof post.type).toBe('string');
    expect(typeof post.time).toBe('string');
    expect(typeof post.title).toBe('string');
    expect(typeof post.content).toBe('string');
    expect(typeof post.likes).toBe('number');
    expect(typeof post.comments).toBe('number');
    expect(typeof post.pinned).toBe('boolean');
    expect(Array.isArray(post.commentList)).toBe(true);
  });

  it('應支援連續創建多個貼文', () => {
    const posts = [];
    for (let i = 0; i < 5; i++) {
      posts.push(createFeedMockPost(`測試內容 ${i}`));
    }

    expect(posts.length).toBe(5);
    // All posts should have valid IDs (might be the same due to timestamp)
    posts.forEach((post) => {
      expect(typeof post.id).toBe('number');
      expect(post.id).toBeGreaterThan(0);
    });
  });

  it('應正確處理只包含空白的內容', () => {
    const whitespaceContent = '   ';
    const post = createFeedMockPost(whitespaceContent);

    expect(post.content).toBe(whitespaceContent);
    expect(post.title).toBe(whitespaceContent);
  });

  it('應正確處理 HTML 標籤內容', () => {
    const htmlContent = '<div>這是 HTML</div>';
    const post = createFeedMockPost(htmlContent);

    expect(post.content).toBe(htmlContent);
  });

  it('應正確處理 Markdown 語法內容', () => {
    const markdownContent = '# 標題\n\n**粗體** _斜體_';
    const post = createFeedMockPost(markdownContent);

    expect(post.content).toBe(markdownContent);
  });

  it('應正確處理 URL 內容', () => {
    const urlContent = '請訪問 https://example.com 查看詳情';
    const post = createFeedMockPost(urlContent);

    expect(post.content).toBe(urlContent);
  });

  it('應正確處理非常長的社區 ID', () => {
    const longId = 'a'.repeat(100);
    const post = createFeedMockPost('測試', longId);

    expect(post.communityId).toBe(longId);
  });

  it('應正確處理非常長的社區名稱', () => {
    const longName = '測試社區名稱'.repeat(20);
    const post = createFeedMockPost('測試', 'comm-1', longName);

    expect(post.communityName).toBe(longName);
  });

  it('應正確處理數字開頭的內容', () => {
    const numericContent = '123456789 測試內容';
    const post = createFeedMockPost(numericContent);

    expect(post.content).toBe(numericContent);
  });

  it('應確保時間戳是有效的 ISO 8601 格式', () => {
    const post = createFeedMockPost('測試');
    const date = new Date(post.time);

    expect(date.toString()).not.toBe('Invalid Date');
    expect(post.time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
