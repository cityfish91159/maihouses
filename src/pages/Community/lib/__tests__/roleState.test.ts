import { describe, expect, it } from 'vitest';
import { parseWallRoleParam, resolveInitialWallRole } from '../roleState';

describe('roleState', () => {
  it('parseWallRoleParam 解析有效角色', () => {
    expect(parseWallRoleParam('guest')).toBe('guest');
    expect(parseWallRoleParam('member')).toBe('member');
    expect(parseWallRoleParam('resident')).toBe('resident');
    expect(parseWallRoleParam('agent')).toBe('agent');
  });

  it('parseWallRoleParam 遇到無效值回傳 null', () => {
    expect(parseWallRoleParam(null)).toBeNull();
    expect(parseWallRoleParam('admin')).toBeNull();
    expect(parseWallRoleParam('')).toBeNull();
  });

  it('prod 模式固定回傳 guest', () => {
    const result = resolveInitialWallRole({
      isDev: false,
      urlRoleParam: 'agent',
      storedRole: 'resident',
    });

    expect(result).toBe('guest');
  });

  it('dev 模式優先使用 URL role', () => {
    const result = resolveInitialWallRole({
      isDev: true,
      urlRoleParam: 'agent',
      storedRole: 'member',
    });

    expect(result).toBe('agent');
  });

  it('dev 模式在 URL 無效時回退 storage role', () => {
    const result = resolveInitialWallRole({
      isDev: true,
      urlRoleParam: 'admin',
      storedRole: 'resident',
    });

    expect(result).toBe('resident');
  });

  it('dev 模式 URL / storage 皆無效時回傳 guest', () => {
    const result = resolveInitialWallRole({
      isDev: true,
      urlRoleParam: null,
      storedRole: 'admin',
    });

    expect(result).toBe('guest');
  });
});
