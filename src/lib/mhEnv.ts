import { safeLocalStorage } from "./safeStorage";

const MOCK_PARAM = "mock";
const MOCK_STORAGE_KEY = "mh_mock_mode";

const parseBool = (value: string | null | undefined): boolean | null => {
  if (value === null || value === undefined) return null;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  return null;
};

const readFromUrl = (): boolean | null => {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return parseBool(params.get(MOCK_PARAM));
};

const readFromStorage = (): boolean | null => {
  return parseBool(safeLocalStorage.getItem(MOCK_STORAGE_KEY));
};

const persistToStorage = (value: boolean) => {
  safeLocalStorage.setItem(MOCK_STORAGE_KEY, String(value));
};

const persistToUrl = (value: boolean) => {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set(MOCK_PARAM, "true");
    } else {
      url.searchParams.delete(MOCK_PARAM);
    }
    window.history.replaceState(null, "", url.toString());
  } catch {
    // ignore URL failures; keep current state
  }
};

export interface MhEnv {
  isMockEnabled(): boolean;
  setMock(
    next: boolean,
    opts?: { persist?: boolean; updateUrl?: boolean },
  ): boolean;
  subscribe(onChange: (value: boolean) => void): () => void;
}

export const mhEnv: MhEnv = {
  /** 讀取 Mock 開關：URL > localStorage > fallback(DEV=true, PROD=false) */
  isMockEnabled(): boolean {
    const urlValue = readFromUrl();
    if (urlValue !== null) return urlValue;
    const stored = readFromStorage();
    if (stored !== null) return stored;
    return import.meta.env.DEV;
  },

  /** 設定 Mock 開關並同步 URL/localStorage */
  setMock(
    next: boolean,
    opts?: { persist?: boolean; updateUrl?: boolean },
  ): boolean {
    if (opts?.persist !== false) {
      persistToStorage(next);
    }
    if (opts?.updateUrl !== false) {
      persistToUrl(next);
    }
    return next;
  },

  /** 監聽其他頁面的 mock 變更（storage event） */
  subscribe(onChange: (value: boolean) => void): () => void {
    if (typeof window === "undefined") return () => {};
    const handler = (event: StorageEvent) => {
      // Accessing window.localStorage might throw SecurityError in restricted environments.
      // We wrap it in a try-catch block or skip strict equality check if unsafe.
      try {
        if (event.storageArea !== window.localStorage) return;
      } catch {
        // If we can't access localStorage, we assume it's not relevant or we can't track it.
        return;
      }

      if (event.key !== MOCK_STORAGE_KEY) return;
      const parsed = parseBool(event.newValue);
      if (parsed !== null) {
        onChange(parsed);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  },
};
