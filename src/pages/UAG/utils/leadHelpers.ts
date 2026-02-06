/**
 * Lead 相關工具函數
 * 提取各組件共用的 Lead 驗證和計算邏輯
 */

import type { Lead, Grade } from '../types/uag.types';
import { GRADE_PROTECTION_HOURS } from '../uag-config';

/**
 * 檢查 Lead 是否為獨家等級（S 或 A 級）
 * S/A 級有較長的保護期，顯示小時；B/C 級顯示天數
 */
export function isExclusiveLead(lead: Lead): boolean {
  return lead.grade === 'S' || lead.grade === 'A';
}

/**
 * 檢查 Grade 是否為獨家等級
 */
export function isExclusiveGrade(grade: Grade): boolean {
  return grade === 'S' || grade === 'A';
}

/**
 * 計算保護期相關資訊
 */
export interface ProtectionInfo {
  /** 總保護時間（小時） */
  total: number;
  /** 剩餘保護時間（小時） */
  remaining: number;
  /** 保護進度百分比（0-100） */
  percent: number;
  /** 是否為獨家等級 */
  isExclusive: boolean;
  /** 時間顯示文字（如 "24.0 小時" 或 "1.0 天"） */
  timeDisplay: string;
}

/**
 * 計算 Lead 的保護期資訊
 */
export function calculateProtectionInfo(lead: Lead): ProtectionInfo {
  const total = GRADE_PROTECTION_HOURS[lead.grade] ?? 336;
  const remaining = lead.remainingHours ?? total;
  const percent = Math.max(0, Math.min(100, (remaining / total) * 100));
  const isExclusive = isExclusiveLead(lead);

  let timeDisplay: string;
  if (isExclusive) {
    timeDisplay = `${remaining.toFixed(1)} 小時`;
  } else {
    const days = (remaining / 24).toFixed(1);
    timeDisplay = `${days} 天`;
  }

  return { total, remaining, percent, isExclusive, timeDisplay };
}

/**
 * 獲取等級對應的顏色
 */
export function getGradeColor(grade: Grade): string {
  switch (grade) {
    case 'S':
      return 'var(--grade-s, #dc2626)'; // 紅色
    case 'A':
      return 'var(--grade-a, #f59e0b)'; // 橙色
    case 'B':
      return 'var(--grade-b, #3b82f6)'; // 藍色
    case 'C':
      return 'var(--grade-c, #6b7280)'; // 灰色
    case 'F':
    default:
      return 'var(--grade-f, #9ca3af)'; // 淺灰
  }
}

/**
 * 獲取等級的保護期文字描述
 */
export function getProtectionText(lead: Lead): string {
  if (isExclusiveLead(lead)) {
    return '獨家鎖定中';
  }
  return '去重保護中';
}
