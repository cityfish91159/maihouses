import {
  getTrustAssureCopy,
  getTrustScenario,
  shouldAttachTrustAssureLeadNote,
} from '../trustAssure';

describe('trustAssure helpers', () => {
  it('應正確回傳四種情境代碼', () => {
    expect(getTrustScenario(true, true)).toBe('A');
    expect(getTrustScenario(true, false)).toBe('B');
    expect(getTrustScenario(false, true)).toBe('C');
    expect(getTrustScenario(false, false)).toBe('D');
  });

  it('每種情境都應回傳對應文案與 tone', () => {
    expect(getTrustAssureCopy('A')).toMatchObject({
      label: '同時建立安心留痕案件',
      tone: 'brand',
    });
    expect(getTrustAssureCopy('B')).toMatchObject({
      label: '同時要求經紀人開啟安心留痕',
      tone: 'amber',
    });
    expect(getTrustAssureCopy('C')).toMatchObject({
      label: '同時建立安心留痕案件',
      tone: 'brand',
    });
    expect(getTrustAssureCopy('D')).toMatchObject({
      label: '請經紀人開啟安心留痕',
      tone: 'amber',
    });
  });

  it('僅 B / D 且勾選時應附帶安心留痕 lead 備註', () => {
    expect(shouldAttachTrustAssureLeadNote('A', true)).toBe(false);
    expect(shouldAttachTrustAssureLeadNote('B', false)).toBe(false);
    expect(shouldAttachTrustAssureLeadNote('B', true)).toBe(true);
    expect(shouldAttachTrustAssureLeadNote('C', true)).toBe(false);
    expect(shouldAttachTrustAssureLeadNote('D', true)).toBe(true);
  });
});
