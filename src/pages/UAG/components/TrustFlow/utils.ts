/**
 * TrustFlow Utils - 安心流程工具函數
 *
 * [code-simplifier] 抽取 helper 函數到獨立檔案
 */

import type { TrustCase, StatusBadge } from './types';

/**
 * 格式化時間戳為 MM/DD HH:mm 格式
 */
export function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

/**
 * 格式化相對時間（如：「剛剛」、「5 分鐘前」）
 */
export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return '剛剛';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分鐘前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小時前`;
  return `${Math.floor(diff / 86400000)} 天前`;
}

/**
 * 取得案件狀態的顯示樣式
 *
 * [DB-2] 新增 dormant 和 closed 狀態支援
 *
 * 注意：此函數處理 LegacyTrustCase 的 6 種狀態
 * closed_* 系列已由 toSafeLegacyStatus 統一映射為 "closed"
 */
export function getStatusBadge(status: TrustCase['status']): StatusBadge {
  switch (status) {
    case 'active':
      return { text: '進行中', bg: 'var(--mh-color-dcfce7)', color: 'var(--mh-color-16a34a)' };
    case 'dormant':
      return { text: '休眠中', bg: 'var(--mh-color-fef3c7)', color: 'var(--mh-color-d97706)' };
    case 'completed':
      return { text: '已成交', bg: 'var(--mh-color-dbeafe)', color: 'var(--mh-color-2563eb)' };
    case 'closed':
      return { text: '已關閉', bg: 'var(--mh-color-f3f4f6)', color: 'var(--mh-color-6b7280)' };
    case 'pending':
      return { text: '待處理', bg: 'var(--mh-color-fef3c7)', color: 'var(--mh-color-d97706)' };
    case 'expired':
      return { text: '已過期', bg: 'var(--mh-color-fee2e2)', color: 'var(--mh-color-dc2626)' };
    default:
      return { text: '未知', bg: 'var(--mh-color-f3f4f6)', color: 'var(--mh-color-6b7280)' };
  }
}
