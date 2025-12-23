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
    // 1. 先檢查 window 是否存在（SSR 安全）
    if (typeof window === 'undefined') {
        return noopStorage;
    }
    
    try {
        // 2. 使用 Object.prototype.hasOwnProperty 檢查，避免直接存取時拋錯
        if (!(type in window)) {
            return noopStorage;
        }
        
        // 3. 用 try-catch 包裝存取，因為某些 iOS Safari 在這一步就會拋 SecurityError
        let storage: Storage;
        try {
            storage = window[type];
        } catch {
            return noopStorage;
        }
        
        if (!storage) {
            return noopStorage;
        }
        
        // 4. Test storage to verify it actually works
        const x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return storage;
    } catch (e) {
        // 靜默失敗，不要 console.warn 因為這可能在模組初始化時執行
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
