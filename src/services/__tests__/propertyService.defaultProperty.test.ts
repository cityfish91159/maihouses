import { describe, it, expect } from 'vitest';
import { LINE_ID_PATTERN } from '../../components/PropertyDetail/constants';
import { isValidPhone } from '../../components/PropertyDetail/contactUtils';
import { DEFAULT_PROPERTY } from '../propertyService';

describe('#5 DEFAULT_PROPERTY mock agent 資料完整性', () => {
  it('DEFAULT_PROPERTY.agent 應填入完整 mock 資料', () => {
    expect(DEFAULT_PROPERTY.agent).toMatchObject({
      id: 'mock-agent-001',
      internalCode: 88001,
      name: '游杰倫',
      company: '邁房子',
      trustScore: 87,
      encouragementCount: 23,
      phone: '0912345678',
      lineId: 'maihouses_demo',
      serviceRating: 4.8,
      reviewCount: 32,
      completedCases: 45,
      serviceYears: 4,
    });
  });

  it('mock agent 的 LINE ID 與電話應符合面板直連格式（不走 fallback）', () => {
    const lineId = DEFAULT_PROPERTY.agent.lineId ?? '';
    const phone = DEFAULT_PROPERTY.agent.phone ?? '';

    expect(LINE_ID_PATTERN.test(lineId)).toBe(true);
    expect(isValidPhone(phone)).toBe(true);
  });
});
