import type { PageMode } from '../../../hooks/usePageMode';

export const UAG_QUERY_KEY = 'uagData' as const;

export function resolveUAGQueryMode(useMock: boolean, userId: string | undefined): PageMode {
  if (userId) {
    return 'live';
  }

  if (useMock) {
    return 'demo';
  }

  return 'visitor';
}

export const uagDataQueryKey = (mode: PageMode, userId: string | undefined) =>
  [UAG_QUERY_KEY, mode, userId] as const;

export const uagAgentProfileQueryKey = (mode: PageMode, userId: string | undefined) =>
  ['agentProfile', mode, userId] as const;
