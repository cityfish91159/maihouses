/**
 * TrustFlow Types - 安心流程組件類型定義
 *
 * [code-simplifier] 抽取共用類型到獨立檔案
 * [agentic_architecture] 模組邊界清晰化
 */

import type { LegacyTrustCase, LegacyTrustEvent } from "../../../../types/trust-flow.types";

// 重新匯出給子組件使用
export type TrustCase = LegacyTrustCase;
export type TrustEvent = LegacyTrustEvent;

/** 步驟定義 - 使用 LucideIcon 類型 */
import type { LucideIcon } from "lucide-react";

export interface StepDefinition {
  key: number;
  name: string;
  icon: LucideIcon;
}

/** 狀態標籤 */
export interface StatusBadge {
  text: string;
  bg: string;
  color: string;
}
