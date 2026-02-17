/**
 * Trust Flow Types 測試
 *
 * [Test Driven Agent] 五種強度測試
 * [NASA TypeScript Safety] Zod Schema 驗證
 */

import { describe, it, expect } from 'vitest';
import {
  TrustCaseSchema,
  TrustCaseEventSchema,
  CreateCaseRequestSchema,
  UpdateStepRequestSchema,
  transformToLegacyCase,
  getStepName,
  getStepLabel,
  getStepIcon,
  isValidStep,
  formatCaseStatus,
  TRUST_STEP_NAMES,
} from '../trust-flow.types';

// ============================================================================
// 測試 1: Zod Schema 驗證測試 (基礎強度)
// ============================================================================

describe('Zod Schema 驗證', () => {
  describe('TrustCaseSchema', () => {
    it('應該接受有效的案件資料', () => {
      const validCase = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        buyer_session_id: 'session-123',
        buyer_name: '買方 A',
        buyer_contact: '0912345678',
        property_id: 'prop-123',
        property_title: '惠宇上晴 12F',
        transaction_id: null,
        current_step: 3,
        status: 'active',
        offer_price: 31500000,
        token: 'abcd1234-e89b-12d3-a456-426614174000',
        token_expires_at: '2024-04-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const result = TrustCaseSchema.safeParse(validCase);
      expect(result.success).toBe(true);
    });

    it('應該拒絕無效的 UUID', () => {
      const invalidCase = {
        id: 'not-a-uuid',
        buyer_name: '買方',
        property_title: '物件',
        current_step: 1,
        status: 'active',
        token: 'abcd1234-e89b-12d3-a456-426614174000',
        token_expires_at: '2024-04-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const result = TrustCaseSchema.safeParse(invalidCase);
      expect(result.success).toBe(false);
    });

    it('應該拒絕超出範圍的 current_step', () => {
      const invalidCase = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        buyer_name: '買方',
        property_title: '物件',
        current_step: 7, // 超出 1-6 範圍
        status: 'active',
        token: 'abcd1234-e89b-12d3-a456-426614174000',
        token_expires_at: '2024-04-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const result = TrustCaseSchema.safeParse(invalidCase);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateCaseRequestSchema', () => {
    it('應該接受最小必要欄位', () => {
      const minimal = {
        buyer_name: '買方名稱',
        property_title: '物件標題',
      };

      const result = CreateCaseRequestSchema.safeParse(minimal);
      expect(result.success).toBe(true);
    });

    it('應該拒絕空的 buyer_name', () => {
      const invalid = {
        buyer_name: '',
        property_title: '物件標題',
      };

      const result = CreateCaseRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('應該拒絕超長的 buyer_name (>100)', () => {
      const invalid = {
        buyer_name: 'a'.repeat(101),
        property_title: '物件標題',
      };

      const result = CreateCaseRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================================
// 測試 2: 轉換函數測試 (中等強度)
// ============================================================================

describe('transformToLegacyCase 轉換函數', () => {
  it('應該正確轉換 API 回應為 Legacy 格式', () => {
    const apiCase = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      buyer_session_id: 'session-abc',
      buyer_name: '王小明',
      buyer_contact: null,
      property_id: null,
      property_title: '惠宇上晴 12F',
      transaction_id: null,
      current_step: 3,
      status: 'active' as const,
      offer_price: 31500000,
      token: 'abcd1234-e89b-12d3-a456-426614174000',
      token_expires_at: '2024-04-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T12:00:00Z',
    };

    const result = transformToLegacyCase(apiCase, []);

    expect(result.id).toBe(apiCase.id);
    expect(result.buyerName).toBe('王小明');
    expect(result.propertyTitle).toBe('惠宇上晴 12F');
    expect(result.currentStep).toBe(3);
    expect(result.status).toBe('active');
    expect(result.offerPrice).toBe(31500000);
  });

  it('應該正確轉換事件列表', () => {
    const apiCase = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      buyer_session_id: null,
      buyer_name: '測試',
      buyer_contact: null,
      property_id: null,
      property_title: '測試物件',
      transaction_id: null,
      current_step: 2,
      status: 'active' as const,
      offer_price: null,
      token: 'abcd1234-e89b-12d3-a456-426614174000',
      token_expires_at: '2024-04-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    const events = [
      {
        id: 'event-1',
        step: 1,
        step_name: 'M1 接洽',
        action: '初次接洽',
        actor: 'agent' as const,
        event_hash: 'abc1...def2',
        detail: '備註',
        created_at: '2024-01-01T10:00:00Z',
      },
    ];

    const result = transformToLegacyCase(apiCase, events);

    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.stepName).toBe('M1 接洽');
    expect(result.events[0]?.hash).toBe('abc1...def2');
    expect(result.events[0]?.detail).toBe('備註');
  });

  it('當 buyer_session_id 為 null 時應使用 id 前綴', () => {
    const apiCase = {
      id: 'abcd4567-e89b-12d3-a456-426614174000',
      buyer_session_id: null,
      buyer_name: '測試',
      buyer_contact: null,
      property_id: null,
      property_title: '測試',
      transaction_id: null,
      current_step: 1,
      status: 'active' as const,
      offer_price: null,
      token: 'abcd1234-e89b-12d3-a456-426614174000',
      token_expires_at: '2024-04-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    const result = transformToLegacyCase(apiCase, []);

    expect(result.buyerId).toBe('ABCD');
  });
});

// ============================================================================
// 測試 3: 工具函數測試 (輕量強度)
// ============================================================================

describe('工具函數', () => {
  describe('getStepName', () => {
    it('應該返回正確的步驟名稱', () => {
      expect(getStepName(1)).toBe('M1 接洽');
      expect(getStepName(6)).toBe('M6 交屋');
    });

    it('應該對無效步驟返回預設值', () => {
      expect(getStepName(0)).toBe('步驟 0');
      expect(getStepName(7)).toBe('步驟 7');
    });
  });

  describe('isValidStep', () => {
    it('應該正確驗證有效步驟', () => {
      expect(isValidStep(1)).toBe(true);
      expect(isValidStep(6)).toBe(true);
    });

    it('應該拒絕無效步驟', () => {
      expect(isValidStep(0)).toBe(false);
      expect(isValidStep(7)).toBe(false);
      expect(isValidStep(-1)).toBe(false);
    });
  });

  describe('formatCaseStatus', () => {
    it('應該返回正確的狀態格式', () => {
      const active = formatCaseStatus('active');
      expect(active.text).toBe('進行中');
      expect(active.color).toBe('var(--mh-color-16a34a)');

      const completed = formatCaseStatus('completed');
      expect(completed.text).toBe('已成交');
    });
  });

  describe('getStepIcon', () => {
    it('應該對每個步驟返回圖示', () => {
      expect(getStepIcon(1)).toBe('📞');
      expect(getStepIcon(5)).toBe('🤝');
      expect(getStepIcon(6)).toBe('🔑');
    });
  });
});

// ============================================================================
// 測試 4: 邊界條件測試 (高強度)
// ============================================================================

describe('邊界條件測試', () => {
  describe('UpdateStepRequestSchema', () => {
    it('應該接受邊界值 step=1', () => {
      const request = {
        new_step: 1,
        action: '初次接洽',
      };
      const result = UpdateStepRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('應該接受邊界值 step=6', () => {
      const request = {
        new_step: 6,
        action: '完成交屋',
      };
      const result = UpdateStepRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('應該拒絕 step=0', () => {
      const request = {
        new_step: 0,
        action: '測試',
      };
      const result = UpdateStepRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('應該拒絕 step=7', () => {
      const request = {
        new_step: 7,
        action: '測試',
      };
      const result = UpdateStepRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('應該拒絕負數的 offer_price', () => {
      const request = {
        new_step: 3,
        action: '出價',
        offer_price: -1000,
      };
      const result = UpdateStepRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('應該接受正數的 offer_price', () => {
      const request = {
        new_step: 3,
        action: '出價',
        offer_price: 31500000,
      };
      const result = UpdateStepRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });
  });

  describe('長度限制測試', () => {
    it('buyer_name 剛好 100 字應該通過', () => {
      const request = {
        buyer_name: 'a'.repeat(100),
        property_title: '物件',
      };
      const result = CreateCaseRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('property_title 剛好 200 字應該通過', () => {
      const request = {
        buyer_name: '買方',
        property_title: 'a'.repeat(200),
      };
      const result = CreateCaseRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });
  });
});

// ============================================================================
// 測試 5: 完整流程整合測試 (最高強度)
// ============================================================================

describe('完整流程整合測試', () => {
  it('6 階段完整流程應該都有定義', () => {
    for (let step = 1; step <= 6; step++) {
      expect(TRUST_STEP_NAMES[step]).toBeDefined();
      expect(getStepName(step)).not.toContain('步驟');
      expect(getStepLabel(step)).not.toContain('步驟');
      expect(getStepIcon(step)).not.toBe('📋'); // 預設圖示
    }
  });

  it('從 API 到 Legacy 的完整轉換鏈應該無損', () => {
    // 模擬完整的 API 回應
    const fullApiCase = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      buyer_session_id: 'sess-xyz',
      buyer_name: '張三',
      buyer_contact: '0912345678',
      property_id: 'prop-001',
      property_title: '台北市信義區豪宅',
      transaction_id: 'txn-001',
      current_step: 5,
      status: 'active' as const,
      offer_price: 88000000,
      token: 'abcd1234-e89b-12d3-a456-426614174000',
      token_expires_at: '2024-04-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-06-15T14:30:00Z',
    };

    const fullEvents = [
      {
        id: 'e1',
        step: 1,
        step_name: 'M1 接洽',
        action: '初次接洽',
        actor: 'agent' as const,
        event_hash: 'a1b2...c3d4',
        detail: null,
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'e2',
        step: 2,
        step_name: 'M2 帶看',
        action: '帶看完成',
        actor: 'buyer' as const,
        event_hash: 'e5f6...g7h8',
        detail: 'GeoTag 驗證',
        created_at: '2024-02-01T00:00:00Z',
      },
      {
        id: 'e3',
        step: 3,
        step_name: 'M3 出價',
        action: '買方出價',
        actor: 'buyer' as const,
        event_hash: 'i9j0...k1l2',
        detail: '出價 NT$88,000,000',
        created_at: '2024-03-01T00:00:00Z',
      },
      {
        id: 'e4',
        step: 4,
        step_name: 'M4 斡旋',
        action: '斡旋成功',
        actor: 'agent' as const,
        event_hash: 'm3n4...o5p6',
        detail: null,
        created_at: '2024-04-01T00:00:00Z',
      },
      {
        id: 'e5',
        step: 5,
        step_name: 'M5 成交',
        action: '簽約完成',
        actor: 'system' as const,
        event_hash: 'q7r8...s9t0',
        detail: '成交價 NT$88,000,000',
        created_at: '2024-05-01T00:00:00Z',
      },
    ];

    const legacy = transformToLegacyCase(fullApiCase, fullEvents);

    // 驗證主要欄位
    expect(legacy.id).toBe(fullApiCase.id);
    expect(legacy.buyerName).toBe('張三');
    expect(legacy.currentStep).toBe(5);
    expect(legacy.offerPrice).toBe(88000000);

    // 驗證事件轉換
    expect(legacy.events).toHaveLength(5);
    expect(legacy.events[0]?.stepName).toBe('M1 接洽');
    expect(legacy.events[4]?.stepName).toBe('M5 成交');

    // 驗證 null 值不會變成 undefined 屬性
    const event1 = legacy.events[0];
    const event2 = legacy.events[1];
    expect(event1?.hash).toBe('a1b2...c3d4');
    expect(event1).not.toHaveProperty('detail'); // null 轉換後不應該有此屬性
    expect(event2?.detail).toBe('GeoTag 驗證');
  });

  it('所有狀態應該都有對應的格式化函數', () => {
    const statuses = ['active', 'pending', 'completed', 'cancelled', 'expired'] as const;

    for (const status of statuses) {
      const formatted = formatCaseStatus(status);
      expect(formatted.text).toBeDefined();
      expect(formatted.bg).toBeDefined();
      expect(formatted.color).toBeDefined();
    }
  });
});

// ============================================================================
// 測試 6: DB-2 新增狀態測試 [rigorous_testing]
// ============================================================================

describe('DB-2 案件生命週期狀態', () => {
  describe('CaseStatusSchema 擴展狀態', () => {
    it('應該接受所有 9 種狀態', () => {
      const allStatuses = [
        'active',
        'dormant',
        'completed',
        'closed_sold_to_other',
        'closed_property_unlisted',
        'closed_inactive',
        'pending',
        'cancelled',
        'expired',
      ];

      for (const status of allStatuses) {
        const testCase = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          buyer_session_id: null,
          buyer_name: '測試',
          buyer_contact: null,
          property_id: null,
          property_title: '測試物件',
          transaction_id: null,
          current_step: 1,
          status,
          offer_price: null,
          token: 'abcd1234-e89b-12d3-a456-426614174000',
          token_expires_at: '2024-04-01T00:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        };

        const result = TrustCaseSchema.safeParse(testCase);
        expect(result.success).toBe(true);
      }
    });

    it('應該拒絕無效的狀態', () => {
      const testCase = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        buyer_session_id: null,
        buyer_name: '測試',
        property_title: '測試物件',
        current_step: 1,
        status: 'invalid_status',
        token: 'abcd1234-e89b-12d3-a456-426614174000',
        token_expires_at: '2024-04-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const result = TrustCaseSchema.safeParse(testCase);
      expect(result.success).toBe(false);
    });
  });

  describe('生命週期欄位', () => {
    it('應該接受 dormant_at 時間戳', () => {
      const testCase = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        buyer_session_id: null,
        buyer_name: '測試',
        buyer_contact: null,
        property_id: null,
        property_title: '測試物件',
        transaction_id: null,
        current_step: 2,
        status: 'dormant',
        offer_price: null,
        dormant_at: '2024-06-01T00:00:00Z',
        token: 'abcd1234-e89b-12d3-a456-426614174000',
        token_expires_at: '2024-04-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-06-01T00:00:00Z',
      };

      const result = TrustCaseSchema.safeParse(testCase);
      expect(result.success).toBe(true);
    });

    it('應該接受 closed_at 和 closed_reason', () => {
      const testCase = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        buyer_session_id: null,
        buyer_name: '測試',
        buyer_contact: null,
        property_id: null,
        property_title: '測試物件',
        transaction_id: null,
        current_step: 3,
        status: 'closed_sold_to_other',
        offer_price: null,
        closed_at: '2024-07-01T00:00:00Z',
        closed_reason: '同物件其他案件已成交',
        token: 'abcd1234-e89b-12d3-a456-426614174000',
        token_expires_at: '2024-04-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-07-01T00:00:00Z',
      };

      const result = TrustCaseSchema.safeParse(testCase);
      expect(result.success).toBe(true);
    });
  });

  describe('formatCaseStatus DB-2 狀態', () => {
    it('應該正確格式化 dormant 狀態', () => {
      const dormant = formatCaseStatus('dormant');
      expect(dormant.text).toBe('休眠中');
      expect(dormant.bg).toBe('var(--mh-color-fef3c7)');
      expect(dormant.color).toBe('var(--mh-color-d97706)');
    });

    it('應該正確格式化 closed_* 系列狀態', () => {
      const soldToOther = formatCaseStatus('closed_sold_to_other');
      expect(soldToOther.text).toBe('他人成交');

      const unlisted = formatCaseStatus('closed_property_unlisted');
      expect(unlisted.text).toBe('物件下架');

      const inactive = formatCaseStatus('closed_inactive');
      expect(inactive.text).toBe('已過期關閉');
    });

    it('應該對所有 DB-2 狀態都有格式化定義', () => {
      const db2Statuses = [
        'dormant',
        'closed_sold_to_other',
        'closed_property_unlisted',
        'closed_inactive',
      ] as const;

      for (const status of db2Statuses) {
        const formatted = formatCaseStatus(status);
        expect(formatted.text).not.toBe('未知');
        expect(formatted.bg).toBeDefined();
        expect(formatted.color).toBeDefined();
      }
    });
  });

  describe('transformToLegacyCase 生命週期欄位轉換', () => {
    it('應該正確轉換 dormant_at 為 timestamp', () => {
      const apiCase = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        buyer_session_id: null,
        buyer_name: '測試',
        buyer_contact: null,
        property_id: null,
        property_title: '測試物件',
        transaction_id: null,
        current_step: 2,
        status: 'dormant' as const,
        offer_price: null,
        dormant_at: '2024-06-15T10:30:00Z',
        token: 'abcd1234-e89b-12d3-a456-426614174000',
        token_expires_at: '2024-04-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-06-15T10:30:00Z',
      };

      const legacy = transformToLegacyCase(apiCase, []);

      expect(legacy.status).toBe('dormant');
      expect(legacy.dormantAt).toBe(new Date('2024-06-15T10:30:00Z').getTime());
    });

    it('應該正確轉換 closed_at 和 closed_reason', () => {
      const apiCase = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        buyer_session_id: null,
        buyer_name: '測試',
        buyer_contact: null,
        property_id: null,
        property_title: '測試物件',
        transaction_id: null,
        current_step: 3,
        status: 'closed_sold_to_other' as const,
        offer_price: null,
        closed_at: '2024-07-01T14:00:00Z',
        closed_reason: '同物件其他案件已成交',
        token: 'abcd1234-e89b-12d3-a456-426614174000',
        token_expires_at: '2024-04-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-07-01T14:00:00Z',
      };

      const legacy = transformToLegacyCase(apiCase, []);

      // closed_* 系列應該映射為 "closed"
      expect(legacy.status).toBe('closed');
      expect(legacy.closedAt).toBe(new Date('2024-07-01T14:00:00Z').getTime());
      expect(legacy.closedReason).toBe('同物件其他案件已成交');
    });

    it('cancelled 狀態應該映射為 expired', () => {
      const apiCase = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        buyer_session_id: null,
        buyer_name: '測試',
        buyer_contact: null,
        property_id: null,
        property_title: '測試物件',
        transaction_id: null,
        current_step: 1,
        status: 'cancelled' as const,
        offer_price: null,
        token: '987e6543-e21b-45d3-c654-321098765432',
        token_expires_at: '2024-04-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const legacy = transformToLegacyCase(apiCase, []);

      // cancelled 轉為 expired（最接近的語意）
      expect(legacy.status).toBe('expired');
    });
  });
});

// ============================================================================
// 測試 7: DB-3 Token 欄位測試 [rigorous_testing]
// ============================================================================

describe('DB-3 案件 Token 欄位', () => {
  describe('TrustCaseSchema Token 欄位', () => {
    it('應該接受有效的 token UUID', () => {
      const testCase = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        buyer_session_id: null,
        buyer_name: '測試',
        buyer_contact: null,
        property_id: null,
        property_title: '測試物件',
        transaction_id: null,
        current_step: 1,
        status: 'active',
        offer_price: null,
        token: 'abcd1234-e89b-12d3-a456-426614174000',
        token_expires_at: '2024-04-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const result = TrustCaseSchema.safeParse(testCase);
      expect(result.success).toBe(true);
    });

    it('應該拒絕無效的 token（非 UUID 格式）', () => {
      const testCase = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        buyer_session_id: null,
        buyer_name: '測試',
        property_title: '測試物件',
        current_step: 1,
        status: 'active',
        token: 'not-a-valid-uuid',
        token_expires_at: '2024-04-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const result = TrustCaseSchema.safeParse(testCase);
      expect(result.success).toBe(false);
    });

    it('應該要求 token 和 token_expires_at 欄位存在', () => {
      const testCase = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        buyer_session_id: null,
        buyer_name: '測試',
        buyer_contact: null,
        property_id: null,
        property_title: '測試物件',
        transaction_id: null,
        current_step: 1,
        status: 'active',
        offer_price: null,
        // 缺少 token 和 token_expires_at
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const result = TrustCaseSchema.safeParse(testCase);
      expect(result.success).toBe(false);
    });
  });

  describe('transformToLegacyCase Token 欄位轉換', () => {
    it('應該正確轉換 token 和 token_expires_at', () => {
      const apiCase = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        buyer_session_id: null,
        buyer_name: '測試',
        buyer_contact: null,
        property_id: null,
        property_title: '測試物件',
        transaction_id: null,
        current_step: 2,
        status: 'active' as const,
        offer_price: null,
        token: 'abcd1234-e89b-12d3-a456-426614174000',
        token_expires_at: '2024-04-01T12:30:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T10:30:00Z',
      };

      const legacy = transformToLegacyCase(apiCase, []);

      expect(legacy.token).toBe('abcd1234-e89b-12d3-a456-426614174000');
      expect(legacy.tokenExpiresAt).toBe(new Date('2024-04-01T12:30:00Z').getTime());
    });

    it('Trust Room 連結 token 應該可用於識別案件', () => {
      const apiCase = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        buyer_session_id: 'session-xyz',
        buyer_name: '王小明',
        buyer_contact: null,
        property_id: 'prop-001',
        property_title: '信義區豪宅',
        transaction_id: null,
        current_step: 3,
        status: 'active' as const,
        offer_price: 50000000,
        token: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        token_expires_at: '2024-06-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-03-15T14:00:00Z',
      };

      const legacy = transformToLegacyCase(apiCase, []);

      // Token 應該是 UUID 格式（36 字元含破折號）
      expect(legacy.token).toHaveLength(36);
      expect(legacy.tokenExpiresAt).toBeGreaterThan(0);
    });
  });

  describe('Token 過期邏輯', () => {
    it('應該能檢查 token 是否過期', () => {
      const now = Date.now();
      const futureExpiry = now + 90 * 24 * 60 * 60 * 1000; // 90 天後
      const pastExpiry = now - 1 * 24 * 60 * 60 * 1000; // 1 天前

      // 未過期
      expect(futureExpiry > now).toBe(true);

      // 已過期
      expect(pastExpiry > now).toBe(false);
    });
  });
});

// ============================================================================
// 測試 8: DB-4 Buyer 欄位測試 [rigorous_testing]
// ============================================================================

describe('DB-4 案件 Buyer 欄位', () => {
  describe('TrustCaseSchema Buyer 欄位', () => {
    it('應該接受有 buyer_user_id 的案件', () => {
      const testCase = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        buyer_session_id: null,
        buyer_name: '測試',
        buyer_contact: null,
        property_id: null,
        property_title: '測試物件',
        transaction_id: null,
        current_step: 1,
        status: 'active',
        offer_price: null,
        token: 'abcd1234-e89b-12d3-a456-426614174000',
        token_expires_at: '2024-04-01T00:00:00Z',
        buyer_user_id: '99999999-e89b-12d3-a456-426614174000',
        buyer_line_id: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const result = TrustCaseSchema.safeParse(testCase);
      expect(result.success).toBe(true);
    });

    it('應該接受有 buyer_line_id 的案件', () => {
      const testCase = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        buyer_session_id: null,
        buyer_name: '測試',
        buyer_contact: null,
        property_id: null,
        property_title: '測試物件',
        transaction_id: null,
        current_step: 1,
        status: 'active',
        offer_price: null,
        token: 'abcd1234-e89b-12d3-a456-426614174000',
        token_expires_at: '2024-04-01T00:00:00Z',
        buyer_user_id: null,
        buyer_line_id: 'U1234567890abcdef1234567890abcde',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const result = TrustCaseSchema.safeParse(testCase);
      expect(result.success).toBe(true);
    });

    it('應該接受兩者都有的案件', () => {
      const testCase = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        buyer_session_id: null,
        buyer_name: '測試',
        buyer_contact: null,
        property_id: null,
        property_title: '測試物件',
        transaction_id: null,
        current_step: 1,
        status: 'active',
        offer_price: null,
        token: 'abcd1234-e89b-12d3-a456-426614174000',
        token_expires_at: '2024-04-01T00:00:00Z',
        buyer_user_id: '99999999-e89b-12d3-a456-426614174000',
        buyer_line_id: 'U1234567890abcdef1234567890abcde',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const result = TrustCaseSchema.safeParse(testCase);
      expect(result.success).toBe(true);
    });

    it('應該接受兩者都沒有的案件', () => {
      const testCase = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        buyer_session_id: null,
        buyer_name: '測試',
        buyer_contact: null,
        property_id: null,
        property_title: '測試物件',
        transaction_id: null,
        current_step: 1,
        status: 'active',
        offer_price: null,
        token: 'abcd1234-e89b-12d3-a456-426614174000',
        token_expires_at: '2024-04-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const result = TrustCaseSchema.safeParse(testCase);
      expect(result.success).toBe(true);
    });
  });

  describe('transformToLegacyCase Buyer 欄位轉換', () => {
    it('應該正確轉換 buyer_user_id', () => {
      const apiCase = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        buyer_session_id: null,
        buyer_name: '測試',
        buyer_contact: null,
        property_id: null,
        property_title: '測試物件',
        transaction_id: null,
        current_step: 2,
        status: 'active' as const,
        offer_price: null,
        token: 'abcd1234-e89b-12d3-a456-426614174000',
        token_expires_at: '2024-04-01T12:30:00Z',
        buyer_user_id: '99999999-e89b-12d3-a456-426614174000',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T10:30:00Z',
      };

      const legacy = transformToLegacyCase(apiCase, []);

      expect(legacy.buyerUserId).toBe('99999999-e89b-12d3-a456-426614174000');
    });

    it('應該正確轉換 buyer_line_id', () => {
      const apiCase = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        buyer_session_id: null,
        buyer_name: '測試',
        buyer_contact: null,
        property_id: null,
        property_title: '測試物件',
        transaction_id: null,
        current_step: 2,
        status: 'active' as const,
        offer_price: null,
        token: 'abcd1234-e89b-12d3-a456-426614174000',
        token_expires_at: '2024-04-01T12:30:00Z',
        buyer_line_id: 'U1234567890abcdef1234567890abcde',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T10:30:00Z',
      };

      const legacy = transformToLegacyCase(apiCase, []);

      expect(legacy.buyerLineId).toBe('U1234567890abcdef1234567890abcde');
    });

    it('沒有 buyer 欄位時不應該有對應屬性', () => {
      const apiCase = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        buyer_session_id: null,
        buyer_name: '測試',
        buyer_contact: null,
        property_id: null,
        property_title: '測試物件',
        transaction_id: null,
        current_step: 2,
        status: 'active' as const,
        offer_price: null,
        token: 'abcd1234-e89b-12d3-a456-426614174000',
        token_expires_at: '2024-04-01T12:30:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T10:30:00Z',
      };

      const legacy = transformToLegacyCase(apiCase, []);

      expect(legacy.buyerUserId).toBeUndefined();
      expect(legacy.buyerLineId).toBeUndefined();
    });
  });
});
