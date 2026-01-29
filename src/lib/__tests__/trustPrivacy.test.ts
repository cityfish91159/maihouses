/**
 * Trust Privacy 隱私保護邏輯測試
 *
 * Skills Applied:
 * - [rigorous_testing] 完整的測試覆蓋
 * - [NASA TypeScript Safety] 類型安全測試
 */

import { describe, it, expect } from 'vitest';
import { getBuyerDisplayName, getAgentDisplayInfo, shouldShowSensitiveInfo } from '../trustPrivacy';
import type { LegacyTrustCase } from '../../types/trust-flow.types';

type TrustCase = LegacyTrustCase;

describe('trustPrivacy', () => {
  describe('getBuyerDisplayName', () => {
    const mockCase: Pick<TrustCase, 'id' | 'buyerName' | 'buyerId'> = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      buyerName: '王小明',
      buyerId: 'ABCD1234',
    };

    it('買方視角應顯示真實姓名', () => {
      const result = getBuyerDisplayName(mockCase, 'buyer');
      expect(result.name).toBe('王小明');
      expect(result.isAnonymous).toBe(false);
      expect(result.fullText).toBe('王小明');
    });

    it('房仲視角應顯示買方代號', () => {
      const result = getBuyerDisplayName(mockCase, 'agent');
      expect(result.name).toBe('買方-ABCD');
      expect(result.isAnonymous).toBe(true);
      expect(result.fullText).toBe('買方: 買方-ABCD');
    });

    it('系統視角應顯示完整資訊', () => {
      const result = getBuyerDisplayName(mockCase, 'system');
      expect(result.name).toBe('王小明');
      expect(result.isAnonymous).toBe(false);
      expect(result.fullText).toContain('王小明');
      expect(result.fullText).toContain('ABCD1234');
    });

    it('應處理缺少 buyerId 的情況', () => {
      const caseWithoutBuyerId: Pick<TrustCase, 'id' | 'buyerName' | 'buyerId'> = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        buyerName: '王小明',
        buyerId: '',
      };
      const result = getBuyerDisplayName(caseWithoutBuyerId, 'agent');
      expect(result.name).toBe('買方-550E');
    });

    it('應處理缺少 buyerName 的情況', () => {
      const caseWithoutName: Pick<TrustCase, 'id' | 'buyerName' | 'buyerId'> = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        buyerName: '',
        buyerId: 'ABCD1234',
      };
      const result = getBuyerDisplayName(caseWithoutName, 'agent');
      expect(result.name).toBe('買方資訊未提供');
      expect(result.isAnonymous).toBe(true);
    });
  });

  describe('getAgentDisplayInfo', () => {
    it('買方視角應顯示完整房仲資訊（含公司）', () => {
      const result = getAgentDisplayInfo('張三', '信義房屋', 'buyer');
      expect(result.name).toBe('張三');
      expect(result.company).toBe('信義房屋');
      expect(result.fullText).toBe('對接房仲: 張三 (信義房屋)');
    });

    it('買方視角應顯示完整房仲資訊（無公司）', () => {
      const result = getAgentDisplayInfo('張三', null, 'buyer');
      expect(result.name).toBe('張三');
      expect(result.company).toBeUndefined();
      expect(result.fullText).toBe('對接房仲: 張三');
    });

    it('房仲視角應顯示自己', () => {
      const result = getAgentDisplayInfo('張三', '信義房屋', 'agent');
      expect(result.name).toBe('您');
      expect(result.company).toBe('信義房屋');
      expect(result.fullText).toBe('您 (信義房屋)');
    });

    it('系統視角應顯示完整資訊', () => {
      const result = getAgentDisplayInfo('張三', '信義房屋', 'system');
      expect(result.name).toBe('張三');
      expect(result.company).toBe('信義房屋');
      expect(result.fullText).toBe('房仲: 張三 (信義房屋)');
    });

    it('應處理 null/undefined 房仲姓名', () => {
      const result = getAgentDisplayInfo(null, '信義房屋', 'buyer');
      expect(result.name).toBe('房仲');
      expect(result.fullText).toBe('對接房仲: 房仲 (信義房屋)');
    });
  });

  describe('shouldShowSensitiveInfo', () => {
    it('檢視自己的資料應顯示敏感資訊', () => {
      expect(shouldShowSensitiveInfo('agent', 'agent')).toBe(true);
      expect(shouldShowSensitiveInfo('buyer', 'buyer')).toBe(true);
    });

    it('系統視角應顯示所有敏感資訊', () => {
      expect(shouldShowSensitiveInfo('system', 'agent')).toBe(true);
      expect(shouldShowSensitiveInfo('system', 'buyer')).toBe(true);
    });

    it('檢視他人資料不應顯示敏感資訊', () => {
      expect(shouldShowSensitiveInfo('agent', 'buyer')).toBe(false);
      expect(shouldShowSensitiveInfo('buyer', 'agent')).toBe(false);
    });
  });

  describe('邊界測試', () => {
    it('應處理極短的 ID', () => {
      const shortCase: Pick<TrustCase, 'id' | 'buyerName' | 'buyerId'> = {
        id: '123',
        buyerName: '測試',
        buyerId: 'AB',
      };
      const result = getBuyerDisplayName(shortCase, 'agent');
      expect(result.name).toBeTruthy();
    });

    it('應處理空字串公司名稱', () => {
      const result = getAgentDisplayInfo('張三', '', 'buyer');
      expect(result.company).toBeUndefined();
      expect(result.fullText).toBe('對接房仲: 張三');
    });

    it('應處理 undefined 公司名稱', () => {
      const result = getAgentDisplayInfo('張三', undefined, 'buyer');
      expect(result.company).toBeUndefined();
      expect(result.fullText).toBe('對接房仲: 張三');
    });
  });
});
