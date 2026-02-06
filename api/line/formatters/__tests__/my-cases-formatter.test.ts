/**
 * my-cases-formatter.ts 單元測試
 *
 * 測試 LINE 訊息格式化邏輯（Flex Message + 純文字）
 */
import { describe, it, expect, vi } from 'vitest';
import type { FlexMessage } from '@line/bot-sdk';
import type { CaseData } from '../../../trust/services/case-query';

// 3.1-3.2: 使用共用常數
import {
  TEST_CASE_ID,
  TEST_CASE_ID_2,
  TEST_AGENT_ID,
  MY_CASES_KEYWORDS,
  MSG_NO_CASES,
  MSG_ERROR,
  MAX_DISPLAY_CASES,
} from '../../constants/my-cases';

// Mock case-query 模組
vi.mock('../../../trust/services/case-query', () => ({
  getStepName: (step: number) => {
    const names: Record<number, string> = {
      1: 'M1 接洽',
      2: 'M2 帶看',
      3: 'M3 出價',
      4: 'M4 斡旋',
      5: 'M5 成交',
      6: 'M6 交屋',
    };
    return names[step] ?? `步驟 ${step}`;
  },
  generateTrustRoomUrl: (caseId: string) =>
    `https://maihouses.vercel.app/maihouses/#/trust-room/${caseId}`,
}));

import {
  formatMyCasesReply,
  formatMyCasesReplyText,
  formatErrorReply,
  isMyTransactionQuery,
} from '../my-cases-formatter';

// ============================================================================
// Test Data - 使用共用常數
// ============================================================================

// 3.1: 使用 TEST_CASE_ID 完整 36 字元 UUID
const sampleCase: CaseData = {
  id: TEST_CASE_ID,
  propertyTitle: '信義區三房',
  agentName: '王小明',
  currentStep: 3,
  status: 'active',
};

// 3.2: 使用 TEST_CASE_ID_2
const sampleCase2: CaseData = {
  id: TEST_CASE_ID_2,
  propertyTitle: '大安區兩房',
  agentName: '李小華',
  currentStep: 2,
  status: 'dormant',
};

// ============================================================================
// Tests: formatMyCasesReply (Flex Message)
// ============================================================================

describe('formatMyCasesReply (Flex Message)', () => {
  it('無案件時回傳純文字訊息', () => {
    const result = formatMyCasesReply([]);

    expect(result.type).toBe('text');
    if (result.type === 'text') {
      expect(result.text).toBe(MSG_NO_CASES);
    }
  });

  // 3.10: Flex Message 結構驗證測試
  it('單一案件時回傳 Flex Message', () => {
    const result = formatMyCasesReply([sampleCase]);

    expect(result.type).toBe('flex');
    if (result.type === 'flex') {
      const flexMsg = result as FlexMessage;
      expect(flexMsg.altText).toContain('1 筆進行中的交易');
      expect(flexMsg.contents.type).toBe('carousel');
    }
  });

  // 3.11: Flex Message 按鈕 action URI 驗證
  it('Flex Message 包含正確的查看詳情按鈕', () => {
    const result = formatMyCasesReply([sampleCase]);

    expect(result.type).toBe('flex');
    if (result.type === 'flex') {
      const flexMsg = result as FlexMessage;
      const carousel = flexMsg.contents;

      if (carousel.type === 'carousel') {
        const firstBubble = carousel.contents[0];
        expect(firstBubble).toBeDefined();

        // 驗證 footer 存在且有按鈕
        if (firstBubble?.type === 'bubble' && firstBubble.footer) {
          const footer = firstBubble.footer;
          if (footer.type === 'box') {
            const button = footer.contents[0];
            if (button?.type === 'button' && button.action?.type === 'uri') {
              // 3.3: URL 斷言檢查完整 UUID（36 字元）
              expect(button.action.uri).toContain(TEST_CASE_ID);
              expect(button.action.label).toBe('查看詳情');
            }
          }
        }
      }
    }
  });

  it('多案件時 Carousel 包含正確數量的 Bubble', () => {
    const result = formatMyCasesReply([sampleCase, sampleCase2]);

    expect(result.type).toBe('flex');
    if (result.type === 'flex') {
      const flexMsg = result as FlexMessage;
      if (flexMsg.contents.type === 'carousel') {
        expect(flexMsg.contents.contents).toHaveLength(2);
      }
    }
  });

  it('超過 10 筆時加入提示 Bubble', () => {
    const manyCases: CaseData[] = Array.from({ length: 12 }, (_, i) => ({
      id: `case-${i}-0000-0000-0000-000000000000`,
      propertyTitle: `物件 ${i + 1}`,
      agentName: `房仲 ${i + 1}`,
      currentStep: (i % 6) + 1,
      status: 'active' as const,
    }));

    const result = formatMyCasesReply(manyCases);

    expect(result.type).toBe('flex');
    if (result.type === 'flex') {
      const flexMsg = result as FlexMessage;
      expect(flexMsg.altText).toContain('12 筆進行中的交易');

      if (flexMsg.contents.type === 'carousel') {
        // 10 個案件 + 1 個提示 = 11 個 Bubble
        expect(flexMsg.contents.contents).toHaveLength(MAX_DISPLAY_CASES + 1);
      }
    }
  });
});

// ============================================================================
// Tests: formatMyCasesReplyText (純文字版本)
// ============================================================================

describe('formatMyCasesReplyText (純文字)', () => {
  it('無案件時回傳正確訊息', () => {
    const result = formatMyCasesReplyText([]);
    expect(result).toBe(MSG_NO_CASES);
  });

  it('單一案件時格式正確', () => {
    const result = formatMyCasesReplyText([sampleCase]);

    expect(result).toContain('您目前有 1 筆進行中的交易：');
    expect(result).toContain('1. 信義區三房');
    expect(result).toContain('房仲：王小明');
    expect(result).toContain('進度：M3 出價');
    // 3.3: 檢查完整 UUID
    expect(result).toContain(`/trust-room/${TEST_CASE_ID}`);
  });

  it('多案件時格式正確', () => {
    const result = formatMyCasesReplyText([sampleCase, sampleCase2]);

    expect(result).toContain('您目前有 2 筆進行中的交易：');
    expect(result).toContain('1. 信義區三房');
    expect(result).toContain('2. 大安區兩房');
    // 3.3: 檢查兩個完整 UUID
    expect(result).toContain(TEST_CASE_ID);
    expect(result).toContain(TEST_CASE_ID_2);
  });

  it('超過 10 筆時顯示提示', () => {
    const manyCases: CaseData[] = Array.from({ length: 12 }, (_, i) => ({
      id: `case-${i}-0000-0000-0000-000000000000`,
      propertyTitle: `物件 ${i + 1}`,
      agentName: `房仲 ${i + 1}`,
      currentStep: (i % 6) + 1,
      status: 'active' as const,
    }));

    const result = formatMyCasesReplyText(manyCases);

    expect(result).toContain('您目前有 12 筆進行中的交易：');
    expect(result).toContain('1. 物件 1');
    expect(result).toContain('10. 物件 10');
    expect(result).not.toContain('物件 11');
    expect(result).toContain('還有 2 筆交易，請上網查看完整列表。');
  });

  it('數字列表符號正確顯示 1-10', () => {
    const tenCases: CaseData[] = Array.from({ length: 10 }, (_, i) => ({
      id: `case-${i}-0000-0000-0000-000000000000`,
      propertyTitle: `物件 ${i + 1}`,
      agentName: `房仲`,
      currentStep: 1,
      status: 'active' as const,
    }));

    const result = formatMyCasesReplyText(tenCases);

    expect(result).toContain('1.');
    expect(result).toContain('2.');
    expect(result).toContain('3.');
    expect(result).toContain('9.');
    expect(result).toContain('10.');
  });
});

// ============================================================================
// Tests: formatErrorReply
// ============================================================================

describe('formatErrorReply', () => {
  it('回傳純文字錯誤訊息物件', () => {
    const result = formatErrorReply();

    expect(result.type).toBe('text');
    expect(result.text).toContain(MSG_ERROR);
    expect(result.text).toContain('請稍後再試');
  });
});

// ============================================================================
// Tests: isMyTransactionQuery
// ============================================================================

describe('isMyTransactionQuery', () => {
  // 3.4: 使用共用常數測試所有 5 個關鍵字
  it.each(MY_CASES_KEYWORDS)('關鍵字「%s」回傳 true', (keyword) => {
    expect(isMyTransactionQuery(keyword)).toBe(true);
  });

  it('前後空白會被 trim', () => {
    expect(isMyTransactionQuery('  我的交易  ')).toBe(true);
  });

  it('其他訊息回傳 false', () => {
    expect(isMyTransactionQuery('你好')).toBe(false);
    expect(isMyTransactionQuery('交易')).toBe(false);
    expect(isMyTransactionQuery('我的')).toBe(false);
    expect(isMyTransactionQuery('')).toBe(false);
  });

  it('null/undefined 回傳 false', () => {
    expect(isMyTransactionQuery(null)).toBe(false);
    expect(isMyTransactionQuery(undefined)).toBe(false);
  });
});
