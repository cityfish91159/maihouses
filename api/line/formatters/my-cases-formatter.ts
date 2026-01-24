/**
 * LINE「我的交易」訊息格式化器
 *
 * 將業務邏輯層的案件資料格式化為 LINE Flex Message
 *
 * 設計原則：
 * - 只負責 LINE 專用的展示格式
 * - 不包含業務邏輯
 * - 處理邊界情況（無案件、過多案件、錯誤）
 * - 使用 Flex Message 提供「查看詳情」按鈕
 */

import type { FlexMessage, FlexBubble, FlexBox, FlexComponent } from "@line/bot-sdk";
import type { CaseData } from "../../trust/services/case-query";
import {
  getStepName,
  generateTrustRoomUrl,
} from "../../trust/services/case-query";
import {
  MY_CASES_KEYWORDS,
  MAX_DISPLAY_CASES,
  NUMBER_MARKERS,
  MSG_NO_CASES,
  MSG_ERROR,
  MSG_ERROR_CONTACT,
  getMsgMoreCases,
} from "../constants/my-cases";

// ============================================================================
// Types
// ============================================================================

/**
 * LINE 訊息回傳類型（Flex Message 或純文字）
 */
export type LineMessageResponse = FlexMessage | { type: "text"; text: string };

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 取得數字列表符號
 */
function getNumberMarker(n: number): string {
  if (n >= 1 && n <= 10) {
    return NUMBER_MARKERS[n - 1] ?? `${n}.`;
  }
  return `${n}.`;
}

/**
 * 建立單一案件的 Flex Bubble
 */
function createCaseBubble(c: CaseData, index: number): FlexBubble {
  const num = getNumberMarker(index + 1);
  const stepName = getStepName(c.currentStep);
  const trustRoomUrl = generateTrustRoomUrl(c.id);

  return {
    type: "bubble",
    size: "kilo",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: `${num} ${c.propertyTitle}`,
          weight: "bold",
          size: "md",
          wrap: true,
        },
        {
          type: "box",
          layout: "vertical",
          margin: "md",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: `房仲：${c.agentName}`,
              size: "sm",
              color: "#666666",
            },
            {
              type: "text",
              text: `進度：${stepName}`,
              size: "sm",
              color: "#666666",
            },
          ],
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          action: {
            type: "uri",
            label: "查看詳情",
            uri: trustRoomUrl,
          },
          style: "primary",
          height: "sm",
        },
      ],
    },
  };
}

/**
 * 建立「還有 N 筆」提示的 Bubble
 */
function createMoreCasesBubble(moreCount: number): FlexBubble {
  return {
    type: "bubble",
    size: "kilo",
    body: {
      type: "box",
      layout: "vertical",
      justifyContent: "center",
      contents: [
        {
          type: "text",
          text: getMsgMoreCases(moreCount),
          size: "sm",
          color: "#666666",
          wrap: true,
          align: "center",
        },
      ],
    },
  };
}

// ============================================================================
// Main Formatter Functions
// ============================================================================

/**
 * 格式化「我的交易」回覆訊息（Flex Message）
 *
 * @param cases - 案件列表
 * @returns LINE Flex Message 物件
 *
 * @example
 * // 有案件時 - 回傳 Flex Carousel
 * formatMyCasesReply([{ id: "...", propertyTitle: "信義區三房", ... }])
 *
 * @example
 * // 無案件時 - 回傳純文字訊息
 * formatMyCasesReply([])
 */
export function formatMyCasesReply(cases: CaseData[]): LineMessageResponse {
  // 無案件 - 回傳純文字
  if (cases.length === 0) {
    return {
      type: "text",
      text: MSG_NO_CASES,
    };
  }

  // 決定顯示數量
  const displayCases = cases.slice(0, MAX_DISPLAY_CASES);
  const hasMore = cases.length > MAX_DISPLAY_CASES;
  const moreCount = cases.length - MAX_DISPLAY_CASES;

  // 建立案件 Bubbles
  const caseBubbles = displayCases.map((c, i) => createCaseBubble(c, i));

  // 如果有更多案件，加入提示 Bubble
  const contents: FlexBubble[] = hasMore
    ? [...caseBubbles, createMoreCasesBubble(moreCount)]
    : caseBubbles;

  // 建立 Flex Message（Carousel 格式）
  const flexMessage: FlexMessage = {
    type: "flex",
    altText: `您目前有 ${cases.length} 筆進行中的交易`,
    contents: {
      type: "carousel",
      contents,
    },
  };

  return flexMessage;
}

/**
 * 格式化「我的交易」回覆訊息（純文字版本）
 *
 * 用於不支援 Flex Message 的情況，或測試用途
 *
 * @param cases - 案件列表
 * @returns 純文字訊息
 */
export function formatMyCasesReplyText(cases: CaseData[]): string {
  // 無案件
  if (cases.length === 0) {
    return MSG_NO_CASES;
  }

  // 決定顯示數量
  const displayCases = cases.slice(0, MAX_DISPLAY_CASES);
  const hasMore = cases.length > MAX_DISPLAY_CASES;
  const moreCount = cases.length - MAX_DISPLAY_CASES;

  // 標題
  const header = `您目前有 ${cases.length} 筆進行中的交易：`;

  // 案件列表
  const caseLines = displayCases.map((c, i) => {
    const num = getNumberMarker(i + 1);
    const stepName = getStepName(c.currentStep);
    const trustRoomUrl = generateTrustRoomUrl(c.id);

    return `${num} ${c.propertyTitle}
   房仲：${c.agentName}
   進度：${stepName}
   ${trustRoomUrl}`;
  }).join("\n\n");

  // 超出提示
  const footer = hasMore ? `\n\n${getMsgMoreCases(moreCount)}` : "";

  return `${header}\n\n${caseLines}${footer}`;
}

/**
 * 格式化錯誤訊息
 *
 * @returns LINE 純文字錯誤訊息
 */
export function formatErrorReply(): { type: "text"; text: string } {
  return {
    type: "text",
    text: `${MSG_ERROR}\n\n${MSG_ERROR_CONTACT}`,
  };
}

/**
 * 檢查訊息是否為「我的交易」查詢
 *
 * @param text - 使用者輸入的訊息
 * @returns 是否為查詢關鍵字
 */
export function isMyTransactionQuery(text: string | null | undefined): boolean {
  if (!text) return false;

  const normalizedText = text.trim();

  // 使用共用常數，確保實作與測試同步
  return MY_CASES_KEYWORDS.includes(normalizedText as typeof MY_CASES_KEYWORDS[number]);
}
