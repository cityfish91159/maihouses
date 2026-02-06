const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

export const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

export const normalizeStringArray = (value: string[] | null | undefined): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => item.trim()).filter((item) => item.length > 0);
};

export const calcServiceYears = (joinedAt?: string | null, createdAt?: string | null): number => {
  const source = joinedAt || createdAt;
  if (!source) return 0;
  const ts = Date.parse(source);
  if (!Number.isFinite(ts)) return 0;
  return Math.max(0, Math.floor((Date.now() - ts) / MS_PER_YEAR));
};
