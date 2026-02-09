export type TrustScenario = 'A' | 'B' | 'C' | 'D';

export function getTrustScenario(isLoggedIn: boolean, trustEnabled: boolean): TrustScenario {
  if (isLoggedIn && trustEnabled) return 'A';
  if (isLoggedIn && !trustEnabled) return 'B';
  if (!isLoggedIn && trustEnabled) return 'C';
  return 'D';
}

interface TrustAssureCopy {
  label: string;
  description: string;
  tone: 'brand' | 'amber';
}

const TRUST_ASSURE_COPY: Record<TrustScenario, TrustAssureCopy> = {
  A: {
    label: '同時建立安心留痕案件',
    description: '交易紀錄會自動建立，幫你記錄每一步。',
    tone: 'brand',
  },
  B: {
    label: '同時要求經紀人開啟安心留痕',
    description: '我們會在聯絡內容中附帶你的開啟要求。',
    tone: 'amber',
  },
  C: {
    label: '同時建立安心留痕案件',
    description: '不登入也可建立，後續可再綁定手機。',
    tone: 'brand',
  },
  D: {
    label: '請經紀人開啟安心留痕',
    description: '我們會在聯絡內容中附帶你的要求。',
    tone: 'amber',
  },
};

export function getTrustAssureCopy(scenario: TrustScenario): TrustAssureCopy {
  return TRUST_ASSURE_COPY[scenario];
}

export function shouldAttachTrustAssureLeadNote(
  scenario: TrustScenario,
  checked: boolean
): boolean {
  return (scenario === 'B' || scenario === 'D') && checked;
}
