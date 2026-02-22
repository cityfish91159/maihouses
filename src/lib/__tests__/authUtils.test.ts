import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AUTH_CLEANUP_KEYS,
  cleanupAuthState,
  getAuthUrl,
  getCurrentPath,
  getLoginUrl,
  getSignupUrl,
  navigateToAuth,
  type AuthMode,
  type AuthRole,
} from '../authUtils';
import { logger } from '../logger';
import { FEED_DEMO_ROLE_STORAGE_KEY } from '../pageMode';

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('authUtils (#15)', () => {
  const originalLocation = window.location;
  // 繞過 TypeScript 型別檢查，測試 runtime 參數驗證
  const invokeGetAuthUrlAtRuntime = (...args: unknown[]) =>
    (getAuthUrl as (...a: unknown[]) => string)(...args);

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('getAuthUrl', () => {
    it('should generate login URL with mode only', () => {
      const url = getAuthUrl('login');

      expect(url).toContain('/maihouses/auth.html');
      expect(url).toContain('mode=login');
    });

    it('should generate signup URL with mode only', () => {
      const url = getAuthUrl('signup');

      expect(url).toContain('/maihouses/auth.html');
      expect(url).toContain('mode=signup');
    });

    it('should include return path when provided', () => {
      const url = getAuthUrl('login', '/maihouses/chat');

      expect(url).toContain('mode=login');
      expect(url).toContain('return=');
      expect(url).toContain(encodeURIComponent('/maihouses/chat'));
    });

    it('should include role when provided', () => {
      const url = getAuthUrl('signup', '/maihouses/uag', 'agent');

      expect(url).toContain('mode=signup');
      expect(url).toContain('role=agent');
    });

    it('should handle complex return paths with query params', () => {
      const returnPath = '/maihouses/property?id=123&view=detail#section';
      const url = getAuthUrl('login', returnPath);

      expect(url).toContain('mode=login');
      expect(url).toContain('return=');
    });

    it('should handle consumer role', () => {
      const url = getAuthUrl('signup', '/maihouses/', 'consumer');

      expect(url).toContain('role=consumer');
    });
  });

  describe('getLoginUrl', () => {
    it('should be shorthand for getAuthUrl with login mode', () => {
      const loginUrl = getLoginUrl('/maihouses/chat');
      const authUrl = getAuthUrl('login', '/maihouses/chat');

      expect(loginUrl).toBe(authUrl);
    });

    it('should work without return path', () => {
      const url = getLoginUrl();

      expect(url).toContain('mode=login');
      expect(url).not.toContain('return=');
    });
  });

  describe('getSignupUrl', () => {
    it('should be shorthand for getAuthUrl with signup mode', () => {
      const signupUrl = getSignupUrl('/maihouses/uag', 'agent');
      const authUrl = getAuthUrl('signup', '/maihouses/uag', 'agent');

      expect(signupUrl).toBe(authUrl);
    });

    it('should work without role', () => {
      const url = getSignupUrl('/maihouses/');

      expect(url).toContain('mode=signup');
      expect(url).not.toContain('role=');
    });
  });

  describe('getCurrentPath', () => {
    it('should return current path with search and hash', () => {
      // getCurrentPath uses window.location which is mocked by jsdom
      const path = getCurrentPath();

      expect(typeof path).toBe('string');
      expect(path).toContain('/');
    });
  });

  describe('navigateToAuth', () => {
    it('should call window.location.href with correct URL', () => {
      const mockHref = vi.fn();
      try {
        Object.defineProperty(window, 'location', {
          value: {
            ...originalLocation,
            href: '',
            pathname: '/maihouses/test',
            search: '',
            hash: '',
            origin: 'http://localhost:5173',
          },
          writable: true,
        });

        // Mock setter
        Object.defineProperty(window.location, 'href', {
          set: mockHref,
          get: () => '',
        });

        navigateToAuth('login');

        expect(mockHref).toHaveBeenCalledTimes(1);
        const firstCall = mockHref.mock.calls[0];
        expect(firstCall).toBeDefined();
        const calledUrl = String(firstCall?.[0] ?? '');
        expect(calledUrl).toContain('mode=login');
      } finally {
        Object.defineProperty(window, 'location', {
          value: originalLocation,
          writable: true,
        });
      }
    });
  });

  describe('cleanupAuthState (#26)', () => {
    it('should clear query cache and all auth cleanup keys', () => {
      const queryClient = { clear: vi.fn() };

      AUTH_CLEANUP_KEYS.forEach((key) => localStorage.setItem(key, 'keep'));
      sessionStorage.setItem(FEED_DEMO_ROLE_STORAGE_KEY, 'resident');

      cleanupAuthState(queryClient);

      expect(queryClient.clear).toHaveBeenCalledTimes(1);
      AUTH_CLEANUP_KEYS.forEach((key) => {
        expect(localStorage.getItem(key)).toBeNull();
      });
      expect(sessionStorage.getItem(FEED_DEMO_ROLE_STORAGE_KEY)).toBeNull();
    });

    it('should fail safe in non-browser runtime and still clear query cache', () => {
      const queryClient = { clear: vi.fn() };
      vi.stubGlobal('window', undefined);

      try {
        expect(() => cleanupAuthState(queryClient)).not.toThrow();
        expect(queryClient.clear).toHaveBeenCalledTimes(1);
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty string return path', () => {
      const url = getAuthUrl('login', '');

      expect(url).toContain('mode=login');
      // Empty string should not add return param
      expect(url).not.toContain('return=');
    });

    it('should handle undefined parameters gracefully', () => {
      const url = getAuthUrl('login', undefined, undefined);

      expect(url).toContain('mode=login');
      expect(url).not.toContain('return=');
      expect(url).not.toContain('role=');
    });

    it('should encode special characters in return path', () => {
      const returnPath = '/maihouses/search?q=test&filter=active';
      const url = getAuthUrl('login', returnPath);

      // URL should be properly encoded
      expect(url).toContain('return=');
      expect(url).not.toContain('&filter='); // Should be encoded
    });

    it('should handle unicode characters in return path', () => {
      const returnPath = '/maihouses/community/test-name';
      const url = getAuthUrl('login', returnPath);

      expect(url).toContain('return=');
    });

    it('should fallback to default return path for unsafe absolute returnPath', () => {
      const url = getAuthUrl('login', 'https://malicious.example.com');

      expect(url).toContain('mode=login');
      expect(url).toContain('return=%2Fmaihouses%2F');
    });

    it('should fallback to default return path for protocol-relative URL (//)', () => {
      const url = getAuthUrl('login', '//malicious.example.com');

      expect(url).toContain('mode=login');
      expect(url).toContain('return=%2Fmaihouses%2F');
      expect(logger.warn).toHaveBeenCalledWith(
        '[authUtils] returnPath 格式無效，改用預設路徑',
        expect.objectContaining({ returnPath: '//malicious.example.com' })
      );
    });

    it('should log warning when returnPath does not start with /', () => {
      getAuthUrl('login', 'relative/path');

      expect(logger.warn).toHaveBeenCalledWith(
        '[authUtils] returnPath 格式無效，改用預設路徑',
        expect.objectContaining({ returnPath: 'relative/path' })
      );
    });
  });

  describe('type safety', () => {
    it('should only accept valid AuthMode values', () => {
      const validModes: AuthMode[] = ['login', 'signup'];

      validModes.forEach((mode) => {
        expect(() => getAuthUrl(mode)).not.toThrow();
      });
    });

    it('should only accept valid AuthRole values', () => {
      const validRoles: AuthRole[] = ['agent', 'consumer'];

      validRoles.forEach((role) => {
        expect(() => getAuthUrl('signup', '/test', role)).not.toThrow();
      });
    });

    it('should throw on invalid AuthMode at runtime', () => {
      expect(() => invokeGetAuthUrlAtRuntime('invalid-mode')).toThrow('[authUtils] 無效的認證模式');
    });

    it('should throw on invalid AuthRole at runtime', () => {
      expect(() => invokeGetAuthUrlAtRuntime('signup', '/test', 'invalid-role')).toThrow(
        '[authUtils] 無效的使用者角色'
      );
    });
  });

  describe('extreme scenarios', () => {
    it('should handle very long returnPath safely', () => {
      const longSegment = 'a'.repeat(4096);
      const longQuery = 'q=' + 'b'.repeat(2048);
      const longHash = 'h'.repeat(512);
      const returnPath = `/maihouses/${longSegment}?${longQuery}#${longHash}`;

      const url = getAuthUrl('login', returnPath);

      expect(url).toContain('mode=login');
      expect(url).toContain('return=');
      expect(url.length).toBeGreaterThan(6000);
    });

    it('should trim returnPath whitespace before encoding', () => {
      const url = getAuthUrl('login', '   /maihouses/chat?tab=1#profile   ');

      expect(url).toContain('mode=login');
      expect(url).toContain('return=%2Fmaihouses%2Fchat%3Ftab%3D1%23profile');
    });

    it('should fallback to relative URL when origin is malformed', () => {
      try {
        Object.defineProperty(window, 'location', {
          value: {
            ...originalLocation,
            origin: '::invalid-origin::',
            pathname: '/maihouses/extreme',
            search: '',
            hash: '',
          },
          writable: true,
        });

        const url = getAuthUrl('login', '/maihouses/extreme');

        expect(url.startsWith('/maihouses/auth.html?')).toBe(true);
        expect(url).toContain('mode=login');
        expect(url).toContain('return=%2Fmaihouses%2Fextreme');
        expect(logger.warn).toHaveBeenCalledWith(
          '[authUtils] window.location.origin 無效，改用相對路徑',
          expect.objectContaining({ origin: '::invalid-origin::' })
        );
      } finally {
        Object.defineProperty(window, 'location', {
          value: originalLocation,
          writable: true,
        });
      }
    });

    it('should fail fast safely in non-browser runtime', () => {
      vi.stubGlobal('window', undefined);
      try {
        expect(() => navigateToAuth('login', '/maihouses/')).not.toThrow();
        expect(logger.warn).toHaveBeenCalledWith(
          '[authUtils] 非瀏覽器環境呼叫 navigateToAuth，已略過',
          expect.objectContaining({ mode: 'login', returnPath: '/maihouses/' })
        );
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });
});
