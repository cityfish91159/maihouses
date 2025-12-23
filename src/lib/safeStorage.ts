/**
 * Safe Storage Wrapper (v2 - True Safety)
 * 
 * iOS Safari in Private Mode (and other restrictive environments)
 * throws "SecurityError" when accessing localStorage/sessionStorage.
 * 
 * This wrapper catches errors on EVERY operation, not just at init time.
 * This prevents crashes even if the browser behavior is inconsistent.
 */

type StorageType = 'localStorage' | 'sessionStorage';

interface SafeStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    clear(): void;
    readonly length: number;
    key(index: number): string | null;
}

function createSafeStorage(type: StorageType): SafeStorage {
    // Check if we can even access the storage at all
    const canAccess = (): Storage | null => {
        if (typeof window === 'undefined') return null;
        try {
            return window[type];
        } catch {
            return null;
        }
    };

    return {
        getItem(key: string): string | null {
            try {
                const storage = canAccess();
                return storage ? storage.getItem(key) : null;
            } catch {
                return null;
            }
        },

        setItem(key: string, value: string): void {
            try {
                const storage = canAccess();
                if (storage) storage.setItem(key, value);
            } catch {
                // Silently fail - this is expected in private mode
            }
        },

        removeItem(key: string): void {
            try {
                const storage = canAccess();
                if (storage) storage.removeItem(key);
            } catch {
                // Silently fail
            }
        },

        clear(): void {
            try {
                const storage = canAccess();
                if (storage) storage.clear();
            } catch {
                // Silently fail
            }
        },

        get length(): number {
            try {
                const storage = canAccess();
                return storage ? storage.length : 0;
            } catch {
                return 0;
            }
        },

        key(index: number): string | null {
            try {
                const storage = canAccess();
                return storage ? storage.key(index) : null;
            } catch {
                return null;
            }
        }
    };
}

export const safeLocalStorage = createSafeStorage('localStorage');
export const safeSessionStorage = createSafeStorage('sessionStorage');

// Helper for type-safe usage (optional)
export const storage = {
    get: (key: string) => safeLocalStorage.getItem(key),
    set: (key: string, value: string) => safeLocalStorage.setItem(key, value),
    remove: (key: string) => safeLocalStorage.removeItem(key),
};
