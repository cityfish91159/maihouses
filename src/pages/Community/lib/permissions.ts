/**
 * Community Permission Utilities
 *
 * AUDIT-01 Phase 7: 統一權限檢查函數
 * 集中管理社區牆所有權限檢查邏輯，避免分散於多個組件
 */

import type { Permissions } from "../types";
import { STRINGS } from "../../../constants/strings";

// 解構 COMMUNITY 命名空間以簡化引用
const { COMMUNITY: S } = STRINGS;

/**
 * 社區動作類型
 * 定義所有需要權限檢查的動作
 */
export type CommunityAction =
  | "view_public"
  | "view_private"
  | "post_public"
  | "post_private"
  | "like"
  | "comment"
  | "ask_question"
  | "answer_question";

/**
 * 統一權限檢查函數
 * 根據用戶權限判斷是否可執行指定動作
 *
 * @param perm - 用戶權限物件
 * @param action - 要執行的動作
 * @returns 是否允許執行
 */
export function canPerformAction(
  perm: Permissions,
  action: CommunityAction,
): boolean {
  switch (action) {
    case "view_public":
      return true;
    case "view_private":
      return perm.canAccessPrivate;
    case "post_public":
      return perm.canPostPublic;
    case "post_private":
      return perm.canPostPrivate;
    case "like":
    case "comment":
      return perm.isLoggedIn;
    case "ask_question":
      return perm.canAskQuestion;
    case "answer_question":
      return perm.canAnswer;
    default: {
      // exhaustive check
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

/**
 * 權限拒絕錯誤訊息結構
 * 支援 title + description 格式，與 notify.error 保持一致
 */
interface PermissionDeniedMessage {
  title: string;
  description?: string;
}

/**
 * 權限拒絕錯誤訊息
 * 統一管理所有權限相關的錯誤訊息
 * 使用 strings.ts 中定義的原始訊息以保持一致性
 */
const PERMISSION_DENIED_MESSAGES: Record<
  CommunityAction,
  PermissionDeniedMessage
> = {
  view_public: { title: "" },
  view_private: {
    title: S.NOTIFY_PRIVATE_ACCESS_DENIED,
    description: S.NOTIFY_PRIVATE_ACCESS_DENIED_DESC,
  },
  post_public: { title: S.NOTIFY_PERM_ERROR, description: S.NOTIFY_PERM_CHECK },
  post_private: { title: S.NOTIFY_PRIVATE_ONLY },
  like: { title: "請先登入", description: "登入後才能按讚" },
  comment: { title: "請先登入", description: "登入後才能留言" },
  ask_question: { title: "請先登入", description: "登入後才能發問" },
  answer_question: {
    title: S.NOTIFY_VERIFY_REQUIRED,
    description: "只有住戶或房仲可以回答問題",
  },
};

/**
 * 取得權限拒絕的錯誤訊息
 *
 * @param action - 被拒絕的動作
 * @returns 錯誤訊息物件（包含 title 和可選的 description）
 */
export function getPermissionDeniedMessage(
  action: CommunityAction,
): PermissionDeniedMessage {
  return PERMISSION_DENIED_MESSAGES[action];
}
