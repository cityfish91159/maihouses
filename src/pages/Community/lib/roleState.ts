import type { Role } from '../types';

export const COMMUNITY_WALL_ROLE_PARAM = 'role';
export const COMMUNITY_WALL_ROLE_STORAGE_KEY = 'community-wall-dev-role';

function isWallDevRole(value: unknown): value is Role {
  return value === 'guest' || value === 'member' || value === 'resident' || value === 'agent';
}

export function parseWallRoleParam(value: string | null): Role | null {
  if (!value) return null;
  return isWallDevRole(value) ? value : null;
}

interface ResolveInitialWallRoleOptions {
  isDev: boolean;
  urlRoleParam: string | null;
  storedRole: string | null;
}

export function resolveInitialWallRole({
  isDev,
  urlRoleParam,
  storedRole,
}: ResolveInitialWallRoleOptions): Role {
  if (!isDev) return 'guest';

  const urlRole = parseWallRoleParam(urlRoleParam);
  if (urlRole) return urlRole;

  if (isWallDevRole(storedRole)) return storedRole;

  return 'guest';
}
