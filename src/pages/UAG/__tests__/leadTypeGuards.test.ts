/**
 * AUDIT-01 Phase 5: Lead 類型守衛測試
 *
 * 測試 isPurchasedLead 和 isUnpurchasedLead 類型守衛
 */

import { describe, it, expect } from 'vitest';
import {
  isPurchasedLead,
  isUnpurchasedLead,
  assertNeverLeadStatus,
  type Lead,
  type PurchasedLead,
  type UnpurchasedLead,
} from '../types/uag.types';

describe('Lead Type Guards', () => {
  // 測試資料：未購買 Lead
  const newLead: Lead = {
    id: 'sess-B218-mno345',
    name: '訪客-O345',
    grade: 'B',
    intent: 55,
    prop: 'MH-100001',
    visit: 3,
    price: 3,
    ai: '中度興趣，可發送物件資訊',
    session_id: 'sess-B218-mno345',
    status: 'new',
  };

  // 測試資料：已購買 Lead
  const purchasedLead: Lead = {
    id: '57a4097a-7710-4666-927d-5275a74e4437',
    name: '訪客-5566',
    grade: 'S',
    intent: 95,
    prop: 'MH-100002',
    visit: 5,
    price: 20,
    ai: '🔥 強烈建議立即發送訊息！',
    session_id: 'sess-S5566-abc123',
    status: 'purchased',
    purchased_at: '2026-01-14T10:00:00Z',
    remainingHours: 115.5,
    notification_status: 'sent',
    conversation_id: 'conv-123-abc',
  };

  describe('isPurchasedLead', () => {
    it('應該對已購買 Lead 返回 true', () => {
      expect(isPurchasedLead(purchasedLead)).toBe(true);
    });

    it('應該對未購買 Lead 返回 false', () => {
      expect(isPurchasedLead(newLead)).toBe(false);
    });

    it('類型守衛應正確縮小類型範圍', () => {
      const lead: Lead = purchasedLead;

      if (isPurchasedLead(lead)) {
        // TypeScript 應該知道 lead 是 PurchasedLead
        // 這些屬性在 PurchasedLead 類型中存在
        expect(lead.status).toBe('purchased');
        expect(lead.notification_status).toBeDefined();
        expect(lead.conversation_id).toBeDefined();

        // id 在語義上是 purchase UUID（嚴格 UUID v4 格式）
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        expect(lead.id).toMatch(uuidRegex);
      }
    });
  });

  describe('isUnpurchasedLead', () => {
    it('應該對未購買 Lead 返回 true', () => {
      expect(isUnpurchasedLead(newLead)).toBe(true);
    });

    it('應該對已購買 Lead 返回 false', () => {
      expect(isUnpurchasedLead(purchasedLead)).toBe(false);
    });

    it('類型守衛應正確縮小類型範圍', () => {
      const lead: Lead = newLead;

      if (isUnpurchasedLead(lead)) {
        // TypeScript 應該知道 lead 是 UnpurchasedLead
        expect(lead.status).toBe('new');

        // id 在語義上是 session_id
        expect(lead.id).toMatch(/^sess-/);
        expect(lead.id).toBe(lead.session_id);
      }
    });
  });

  describe('類型互斥性', () => {
    it('Lead 只能是 new 或 purchased 其中之一', () => {
      // 一個 Lead 不能同時滿足兩個類型守衛
      expect(isPurchasedLead(newLead)).not.toBe(isUnpurchasedLead(newLead));
      expect(isPurchasedLead(purchasedLead)).not.toBe(isUnpurchasedLead(purchasedLead));
    });

    it('每個 Lead 都應該滿足其中一個類型守衛', () => {
      const leads: Lead[] = [newLead, purchasedLead];

      for (const lead of leads) {
        // 每個 lead 必須是 purchased 或 unpurchased 其中之一
        const isPurchased = isPurchasedLead(lead);
        const isUnpurchased = isUnpurchasedLead(lead);
        expect(isPurchased || isUnpurchased).toBe(true);
        expect(isPurchased && isUnpurchased).toBe(false);
      }
    });
  });

  describe('ID 語義驗證', () => {
    it('未購買 Lead 的 id 應該等於 session_id', () => {
      if (isUnpurchasedLead(newLead)) {
        // 未購買時 id = session_id
        expect(newLead.id).toBe(newLead.session_id);
      }
    });

    it('已購買 Lead 的 id 應該是 UUID 格式', () => {
      if (isPurchasedLead(purchasedLead)) {
        // 已購買時 id = purchase UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        expect(purchasedLead.id).toMatch(uuidRegex);
      }
    });

    it('session_id 不隨購買狀態改變', () => {
      // session_id 永遠保持不變
      expect(newLead.session_id).toMatch(/^sess-/);
      expect(purchasedLead.session_id).toMatch(/^sess-/);
    });
  });

  describe('邊界案例', () => {
    it('應該處理缺少可選欄位的 Lead', () => {
      const minimalNewLead: Lead = {
        id: 'sess-TEST-000',
        name: '測試訪客',
        grade: 'C',
        intent: 35,
        prop: '物件瀏覽',
        visit: 1,
        price: 1,
        ai: '輕度興趣',
        session_id: 'sess-TEST-000',
        status: 'new',
      };

      expect(isUnpurchasedLead(minimalNewLead)).toBe(true);
      expect(isPurchasedLead(minimalNewLead)).toBe(false);
    });

    it('應該處理所有等級的 Lead', () => {
      const grades = ['S', 'A', 'B', 'C', 'F'] as const;

      for (const grade of grades) {
        const lead: Lead = {
          ...newLead,
          id: `sess-${grade}-test`,
          session_id: `sess-${grade}-test`,
          grade,
        };

        expect(isUnpurchasedLead(lead)).toBe(true);
      }
    });
  });

  describe('assertNeverLeadStatus', () => {
    it('應該在遇到未知狀態時拋出錯誤', () => {
      // 模擬意外狀態（類型系統會阻止，但運行時可能發生）
      const unexpectedStatus = 'unknown' as never;

      expect(() => {
        assertNeverLeadStatus(unexpectedStatus);
      }).toThrow('Unexpected LeadStatus: unknown');
    });
  });

  describe('購買流程 ID 變化整合測試', () => {
    it('購買前後 ID 語義應正確變化', () => {
      // 1. 購買前：id === session_id
      const beforePurchase: Lead = {
        ...newLead,
        id: 'sess-MOCK-1234',
        session_id: 'sess-MOCK-1234',
        status: 'new',
      };

      expect(isUnpurchasedLead(beforePurchase)).toBe(true);
      expect(beforePurchase.id).toBe(beforePurchase.session_id);

      // 2. 購買後：id 變為 UUID，session_id 不變
      const afterPurchase: Lead = {
        ...beforePurchase,
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        status: 'purchased',
        purchased_at: '2026-01-15T12:00:00Z',
        notification_status: 'pending',
      };

      expect(isPurchasedLead(afterPurchase)).toBe(true);
      expect(afterPurchase.id).not.toBe(afterPurchase.session_id);
      expect(afterPurchase.session_id).toBe('sess-MOCK-1234'); // 不變
    });

    it('空 leads 陣列應正確處理', () => {
      const leads: Lead[] = [];

      const purchased = leads.filter(isPurchasedLead);
      const unpurchased = leads.filter(isUnpurchasedLead);

      expect(purchased).toHaveLength(0);
      expect(unpurchased).toHaveLength(0);
    });

    it('混合狀態陣列應正確過濾', () => {
      const mixedLeads: Lead[] = [
        newLead,
        purchasedLead,
        { ...newLead, id: 'sess-NEW-002', session_id: 'sess-NEW-002' },
      ];

      const purchased = mixedLeads.filter(isPurchasedLead);
      const unpurchased = mixedLeads.filter(isUnpurchasedLead);

      expect(purchased).toHaveLength(1);
      expect(unpurchased).toHaveLength(2);
      expect(purchased[0]?.id).toBe(purchasedLead.id);
    });
  });
});
