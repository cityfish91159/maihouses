/**
 * useGuestVisibleItems Hook
 *
 * 統一處理訪客可見項目的邏輯
 * 用於 ReviewsSection、PostsSection、QASection 的 slice/hiddenCount 計算
 */

import { useMemo } from "react";
import { GUEST_VISIBLE_COUNT } from "../pages/Community/types";

export interface GuestVisibleItemsResult<T> {
  /** 可見的項目（登入者看全部，訪客看有限數量） */
  visible: T[];
  /** 被隱藏的項目數量 */
  hiddenCount: number;
  /** 下一個被隱藏的項目（用於 LockedOverlay 預覽） */
  nextHidden: T | null;
}

/**
 * 根據使用者是否能看全部來計算可見項目
 *
 * @param items - 完整的項目陣列
 * @param canSeeAll - 是否能看全部（通常是 perm.canSeeAllXxx）
 * @param visibleCount - 訪客可見數量，預設使用 GUEST_VISIBLE_COUNT
 * @returns { visible, hiddenCount, nextHidden }
 *
 * @example
 * // ReviewsSection
 * const { visible, hiddenCount, nextHidden } = useGuestVisibleItems(reviews, perm.canSeeAllReviews);
 *
 * // PostsSection
 * const { visible, hiddenCount, nextHidden } = useGuestVisibleItems(publicPosts, perm.canSeeAllPosts);
 *
 * // QASection
 * const { visible, hiddenCount, nextHidden } = useGuestVisibleItems(answeredQuestions, perm.isLoggedIn);
 */
export function useGuestVisibleItems<T>(
  items: T[],
  canSeeAll: boolean,
  visibleCount: number = GUEST_VISIBLE_COUNT,
): GuestVisibleItemsResult<T> {
  return useMemo(() => {
    if (canSeeAll) {
      return {
        visible: items,
        hiddenCount: 0,
        nextHidden: null,
      };
    }

    const visible = items.slice(0, visibleCount);
    const hiddenCount = Math.max(0, items.length - visibleCount);
    const nextHidden = hiddenCount > 0 ? (items[visibleCount] ?? null) : null;

    return {
      visible,
      hiddenCount,
      nextHidden,
    };
  }, [items, canSeeAll, visibleCount]);
}
