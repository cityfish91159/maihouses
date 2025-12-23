/**
 * Safe Storage Wrapper
 * 
 * iOS Safari in Private Mode (and some other restrictive environments) 
 * throws a "SecurityError" when accessing localStorage/sessionStorage.
 * This wrapper catches these errors to prevent the app from crashing.
 */

const noopStorage = {
    getItem: (_key: string) => null,
    setItem: (_key: string, _value: string) => { },
    removeItem: (_key: string) => { },
    clear: () => { },
    length: 0,
    key: (_index: number) => null,
};

function getStorage(type: 'localStorage' | 'sessionStorage') {
    try {
        const storage = window[type];
        // Test storage to verify it actually works
        const x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return storage;
    } catch (e) {
        console.warn(`[SafeStorage] ${type} is not available (SecurityError or unsupported). Using in-memory fallback.`);
        return noopStorage;
    }
}

export const safeLocalStorage = getStorage('localStorage');
export const safeSessionStorage = getStorage('sessionStorage');

// Helper for type-safe usage (optional)
export const storage = {
    get: (key: string) => safeLocalStorage.getItem(key),
    set: (key: string, value: string) => {
        try {
            safeLocalStorage.setItem(key, value);
        } catch (e) {
            console.warn('Storage setItem failed:', e);
        }
    },
    remove: (key: string) => safeLocalStorage.removeItem(key),
};
