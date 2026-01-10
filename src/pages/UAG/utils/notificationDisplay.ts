/**
 * 通知狀態顯示配置
 * 用於統一各組件中的通知狀態顯示
 */

import type { NotificationStatus } from "../types/uag.types";

export interface NotificationDisplay {
  text: string;
  bgColor: string;
  textColor: string;
}

/**
 * 根據通知狀態返回顯示配置
 * @param status - 通知狀態
 * @returns 顯示配置（文字、背景色、文字顏色）
 */
export function getNotificationDisplay(
  status: NotificationStatus | undefined,
): NotificationDisplay {
  switch (status) {
    case "sent":
      return {
        text: "LINE + 站內信",
        bgColor: "var(--notif-success-bg)",
        textColor: "var(--notif-success-text)",
      };
    case "no_line":
      return {
        text: "僅站內信",
        bgColor: "var(--bg-alt)",
        textColor: "var(--ink-300)",
      };
    case "unreachable":
      return {
        text: "LINE 無法送達",
        bgColor: "var(--notif-warning-bg)",
        textColor: "var(--notif-warning-text)",
      };
    case "pending":
      return {
        text: "待發送",
        bgColor: "var(--notif-pending-bg)",
        textColor: "var(--notif-pending-text)",
      };
    case "failed":
      return {
        text: "LINE 發送失敗",
        bgColor: "var(--notif-error-bg)",
        textColor: "var(--notif-error-text)",
      };
    case "skipped":
      return {
        text: "僅站內信",
        bgColor: "var(--bg-alt)",
        textColor: "var(--ink-300)",
      };
    default:
      // 未知狀態或 undefined：已購買但尚無通知狀態，視為站內信已發送
      return {
        text: "站內信已發送",
        bgColor: "var(--bg-alt)",
        textColor: "var(--ink-300)",
      };
  }
}
