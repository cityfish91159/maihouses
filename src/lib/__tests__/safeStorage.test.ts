import { afterEach, describe, expect, it, vi } from 'vitest';

type MinimalStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  key: (index: number) => string | null;
  length: number;
};

function createMemoryStorage(): MinimalStorage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    clear: () => {
      map.clear();
    },
  };
}

describe('safeStorage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('SSR（window 不存在）時回傳 noop storage', async () => {
    vi.stubGlobal('window', undefined);

    const { safeLocalStorage, safeSessionStorage, storage } = await import('../safeStorage');

    expect(safeLocalStorage.getItem('x')).toBeNull();
    expect(safeSessionStorage.getItem('x')).toBeNull();
    expect(storage.get('x')).toBeNull();

    expect(() => safeLocalStorage.setItem('x', '1')).not.toThrow();
    expect(() => safeSessionStorage.setItem('x', '1')).not.toThrow();
    expect(() => storage.set('x', '1')).not.toThrow();
  });

  it('Storage 探測失敗時回退 noop storage（不拋錯）', async () => {
    const throwingStorage: MinimalStorage = {
      length: 0,
      key: () => null,
      getItem: () => null,
      setItem: () => {
        throw new Error('SecurityError');
      },
      removeItem: () => {},
      clear: () => {},
    };

    vi.stubGlobal('window', {
      localStorage: throwingStorage,
      sessionStorage: throwingStorage,
    });

    const { safeLocalStorage, storage } = await import('../safeStorage');

    expect(safeLocalStorage.getItem('x')).toBeNull();
    expect(() => safeLocalStorage.setItem('x', '1')).not.toThrow();
    expect(storage.get('x')).toBeNull();
  });

  it('Storage 可用時應正常讀寫', async () => {
    const localStorageMock = createMemoryStorage();
    const sessionStorageMock = createMemoryStorage();

    vi.stubGlobal('window', {
      localStorage: localStorageMock,
      sessionStorage: sessionStorageMock,
    });

    const { safeLocalStorage, safeSessionStorage, storage } = await import('../safeStorage');

    safeLocalStorage.setItem('foo', 'bar');
    safeSessionStorage.setItem('hello', 'world');
    storage.set('biz', 'baz');

    expect(safeLocalStorage.getItem('foo')).toBe('bar');
    expect(safeSessionStorage.getItem('hello')).toBe('world');
    expect(storage.get('biz')).toBe('baz');
  });
});
