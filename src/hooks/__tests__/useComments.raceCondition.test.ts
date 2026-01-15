/**
 * AUDIT-01 Phase 6: 留言按讚競態條件測試
 *
 * 測試目標：
 * 1. 快速連擊多個留言按讚時，狀態應正確維護
 * 2. API 失敗時，回滾應只影響該特定操作
 * 3. 並發操作不會丟失中間狀態
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// 模擬 applyLikeToggle 純函數行為
// 這是 useComments.ts 中 toggleLike 使用的核心邏輯
interface MockComment {
  id: string;
  isLiked: boolean;
  likesCount: number;
  replies?: MockComment[];
}

/**
 * 純函數：套用按讚切換
 * 這是從 useComments.ts 抽取的核心邏輯，用於測試
 * 注意：likesCount 使用 Math.max(0, ...) 防止負數
 */
function applyLikeToggle(
  comments: MockComment[],
  commentId: string,
): MockComment[] {
  return comments.map((c) => {
    if (c.id === commentId) {
      const newIsLiked = !c.isLiked;
      return {
        ...c,
        isLiked: newIsLiked,
        likesCount: newIsLiked ? c.likesCount + 1 : Math.max(0, c.likesCount - 1),
      };
    }
    // 檢查 replies
    if (c.replies?.length) {
      return {
        ...c,
        replies: c.replies.map((r) => {
          if (r.id === commentId) {
            const newIsLiked = !r.isLiked;
            return {
              ...r,
              isLiked: newIsLiked,
              likesCount: newIsLiked ? r.likesCount + 1 : Math.max(0, r.likesCount - 1),
            };
          }
          return r;
        }),
      };
    }
    return c;
  });
}

describe("留言按讚競態條件測試", () => {
  describe("applyLikeToggle 純函數", () => {
    it("應該正確切換頂層留言的按讚狀態", () => {
      const comments: MockComment[] = [
        { id: "c1", isLiked: false, likesCount: 0 },
        { id: "c2", isLiked: true, likesCount: 5 },
      ];

      const result = applyLikeToggle(comments, "c1");

      expect(result[0]?.isLiked).toBe(true);
      expect(result[0]?.likesCount).toBe(1);
      expect(result[1]?.isLiked).toBe(true); // 未變
      expect(result[1]?.likesCount).toBe(5); // 未變
    });

    it("應該正確切換回覆留言的按讚狀態", () => {
      const comments: MockComment[] = [
        {
          id: "c1",
          isLiked: false,
          likesCount: 0,
          replies: [
            { id: "r1", isLiked: false, likesCount: 2 },
            { id: "r2", isLiked: true, likesCount: 3 },
          ],
        },
      ];

      const result = applyLikeToggle(comments, "r1");

      expect(result[0]?.replies?.[0]?.isLiked).toBe(true);
      expect(result[0]?.replies?.[0]?.likesCount).toBe(3);
      expect(result[0]?.replies?.[1]?.isLiked).toBe(true); // 未變
    });

    it("反向操作應還原狀態", () => {
      const original: MockComment[] = [
        { id: "c1", isLiked: false, likesCount: 5 },
      ];

      // 第一次 toggle
      const afterToggle = applyLikeToggle(original, "c1");
      expect(afterToggle[0]?.isLiked).toBe(true);
      expect(afterToggle[0]?.likesCount).toBe(6);

      // 第二次 toggle = 反向操作 = 還原
      const afterRollback = applyLikeToggle(afterToggle, "c1");
      expect(afterRollback[0]?.isLiked).toBe(false);
      expect(afterRollback[0]?.likesCount).toBe(5);
    });
  });

  describe("快速連擊競態場景", () => {
    it("連續 toggle 同一留言應正確維護狀態", () => {
      let state: MockComment[] = [{ id: "c1", isLiked: false, likesCount: 0 }];

      // 模擬快速連擊 5 次
      for (let i = 0; i < 5; i++) {
        state = applyLikeToggle(state, "c1");
      }

      // 5 次奇數次 toggle = 最終為 liked
      expect(state[0]?.isLiked).toBe(true);
      expect(state[0]?.likesCount).toBe(1);
    });

    it("連續 toggle 不同留言應各自獨立", () => {
      let state: MockComment[] = [
        { id: "c1", isLiked: false, likesCount: 0 },
        { id: "c2", isLiked: false, likesCount: 0 },
        { id: "c3", isLiked: false, likesCount: 0 },
      ];

      // 快速連擊不同留言
      state = applyLikeToggle(state, "c1");
      state = applyLikeToggle(state, "c2");
      state = applyLikeToggle(state, "c3");
      state = applyLikeToggle(state, "c1"); // c1 取消讚

      expect(state[0]?.isLiked).toBe(false); // c1: toggle 兩次 = 還原
      expect(state[0]?.likesCount).toBe(0);
      expect(state[1]?.isLiked).toBe(true); // c2: toggle 一次
      expect(state[1]?.likesCount).toBe(1);
      expect(state[2]?.isLiked).toBe(true); // c3: toggle 一次
      expect(state[2]?.likesCount).toBe(1);
    });

    it("並發操作後部分失敗的回滾應不影響其他操作", () => {
      let state: MockComment[] = [
        { id: "c1", isLiked: false, likesCount: 0 },
        { id: "c2", isLiked: false, likesCount: 0 },
      ];

      // 模擬：
      // 1. c1 樂觀更新成功
      // 2. c2 樂觀更新成功
      // 3. c1 API 失敗，需要回滾
      // 期望：c2 的狀態應保持

      // Step 1: c1 樂觀更新
      state = applyLikeToggle(state, "c1");
      expect(state[0]?.isLiked).toBe(true);

      // Step 2: c2 樂觀更新
      state = applyLikeToggle(state, "c2");
      expect(state[1]?.isLiked).toBe(true);

      // Step 3: c1 API 失敗，使用反向操作回滾
      state = applyLikeToggle(state, "c1");
      expect(state[0]?.isLiked).toBe(false); // c1 回滾成功
      expect(state[1]?.isLiked).toBe(true); // c2 不受影響！
    });
  });

  describe("邊界案例", () => {
    it("空陣列應安全處理", () => {
      const result = applyLikeToggle([], "c1");
      expect(result).toEqual([]);
    });

    it("不存在的 commentId 應不影響狀態", () => {
      const comments: MockComment[] = [
        { id: "c1", isLiked: false, likesCount: 0 },
      ];

      const result = applyLikeToggle(comments, "not-exist");
      expect(result).toEqual(comments);
    });

    it("likesCount 不應為負數（Math.max 保護）", () => {
      const comments: MockComment[] = [
        { id: "c1", isLiked: true, likesCount: 0 },
      ];

      const result = applyLikeToggle(comments, "c1");
      // 取消讚：Math.max(0, 0 - 1) = 0，不會變成負數
      expect(result[0]?.likesCount).toBe(0);
      expect(result[0]?.isLiked).toBe(false);
    });
  });
});

describe("模擬並發 API 請求", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("模擬多個並發請求的執行順序", async () => {
    const executionOrder: string[] = [];
    let state: MockComment[] = [
      { id: "c1", isLiked: false, likesCount: 10 },
      { id: "c2", isLiked: false, likesCount: 20 },
    ];

    // 模擬 API 請求
    const mockApiCall = async (
      commentId: string,
      delay: number,
      shouldFail = false,
    ) => {
      // 樂觀更新
      state = applyLikeToggle(state, commentId);
      executionOrder.push(`optimistic-${commentId}`);

      // 模擬網路延遲
      await new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          if (shouldFail) {
            // 回滾
            state = applyLikeToggle(state, commentId);
            executionOrder.push(`rollback-${commentId}`);
            reject(new Error("API Error"));
          } else {
            executionOrder.push(`success-${commentId}`);
            resolve();
          }
        }, delay);
      });
    };

    // 發起兩個並發請求
    const p1 = mockApiCall("c1", 100).catch(() => {}); // c1: 100ms 後成功
    const p2 = mockApiCall("c2", 50, true).catch(() => {}); // c2: 50ms 後失敗

    // 執行所有定時器
    await vi.runAllTimersAsync();
    await Promise.allSettled([p1, p2]);

    // 驗證執行順序
    expect(executionOrder).toEqual([
      "optimistic-c1",
      "optimistic-c2",
      "rollback-c2", // c2 先完成（50ms）但失敗，回滾
      "success-c1", // c1 後完成（100ms）成功
    ]);

    // 驗證最終狀態
    expect(state[0]?.isLiked).toBe(true); // c1 成功
    expect(state[0]?.likesCount).toBe(11);
    expect(state[1]?.isLiked).toBe(false); // c2 回滾
    expect(state[1]?.likesCount).toBe(20);
  });
});
