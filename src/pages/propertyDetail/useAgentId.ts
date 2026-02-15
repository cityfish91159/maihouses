/** Agent ID 正規化 Hook：URL params > localStorage > property.agent.id */
import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { safeLocalStorage } from '../../lib/safeStorage';

function normalizeAgentId(aid: string | null | undefined): string | null {
  if (!aid) return null;
  const trimmed = aid.trim();
  if (trimmed === '' || trimmed === 'unknown') return null;
  const isValid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed) ||
    /^agent-[a-z0-9_-]+$/i.test(trimmed) ||
    /^mock-agent-[a-z0-9_-]+$/i.test(trimmed);
  return isValid ? trimmed : null;
}

export function useAgentId(propertyAgentId: string | null | undefined) {
  const [searchParams] = useSearchParams();

  const agentId = useMemo(() => {
    let aid = normalizeAgentId(searchParams.get('aid'));
    if (!aid) aid = normalizeAgentId(safeLocalStorage.getItem('uag_last_aid'));
    if (!aid) aid = normalizeAgentId(propertyAgentId);
    return aid || 'unknown';
  }, [searchParams, propertyAgentId]);

  const leadAgentId = useMemo(() => {
    if (agentId !== 'unknown') return agentId;
    const rawId = propertyAgentId?.trim();
    if (rawId && rawId.toLowerCase() !== 'unknown') return rawId;
    return 'unknown';
  }, [agentId, propertyAgentId]);

  useEffect(() => {
    if (agentId && agentId !== 'unknown') {
      safeLocalStorage.setItem('uag_last_aid', agentId);
    }
  }, [agentId]);

  return { agentId, leadAgentId };
}
