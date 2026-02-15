import type { PageMode } from '../../../hooks/usePageMode';

export const UAG_QUERY_KEY = 'uagData';

type UAGDataQueryKey = readonly [typeof UAG_QUERY_KEY, PageMode, string | undefined];
type UAGAgentProfileQueryKey = readonly ['agentProfile', PageMode, string | undefined];

export const uagDataQueryKey = (mode: PageMode, userId: string | undefined): UAGDataQueryKey => [
  UAG_QUERY_KEY,
  mode,
  userId,
];

export const uagAgentProfileQueryKey = (
  mode: PageMode,
  userId: string | undefined
): UAGAgentProfileQueryKey => ['agentProfile', mode, userId];
