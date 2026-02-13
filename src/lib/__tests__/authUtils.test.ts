import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getAuthUrl,
  getCurrentPath,
  getLoginUrl,
  getSignupUrl,
  navigateToAuth,
  type AuthMode,
  type AuthRole,
} from '../authUtils';

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('authUtils (#15)', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
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
      const calledUrl = mockHref.mock.calls[0]?.[0] as string;
      expect(calledUrl).toContain('mode=login');
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

    it('should fallback to default return path for protocol-relative URL (//)', async () => {
      const { logger } = await import('../logger');
      const url = getAuthUrl('login', '//malicious.example.com');

      expect(url).toContain('mode=login');
      expect(url).toContain('return=%2Fmaihouses%2F');
      expect(logger.warn).toHaveBeenCalledWith(
        '[authUtils] Invalid returnPath, fallback to default',
        expect.objectContaining({ returnPath: '//malicious.example.com' })
      );
    });

    it('should log warning when returnPath does not start with /', async () => {
      const { logger } = await import('../logger');
      getAuthUrl('login', 'relative/path');

      expect(logger.warn).toHaveBeenCalledWith(
        '[authUtils] Invalid returnPath, fallback to default',
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
      expect(() => getAuthUrl('invalid' as AuthMode)).toThrow('[authUtils] Invalid auth mode');
    });

    it('should throw on invalid AuthRole at runtime', () => {
      expect(() => getAuthUrl('signup', '/test', 'invalid' as AuthRole)).toThrow(
        '[authUtils] Invalid auth role'
      );
    });
  });
});
