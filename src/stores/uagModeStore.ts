/**
 * UAG Mock/Live 模式狀態管理
 *
 * 統一管理 UAG 系統的 Mock/Live 模式切換
 * 所有組件應從此 store 讀取模式狀態，而非各自管理
 */

import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';
import { safeLocalStorage } from '../lib/safeStorage';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'uag-mode';
const URL_PARAM_KEY = 'mock';
const STORE_NAME = 'UAGModeStore';

// ============================================================================
// Types
// ============================================================================

interface UAGModeState {
  /** 是否使用 Mock 模式 */
  useMock: boolean;

  /** 設置模式 */
  setUseMock: (value: boolean) => void;

  /** 切換模式 */
  toggleMode: () => void;

  /** 初始化模式（根據 URL 參數和 localStorage） */
  initializeMode: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * 從 URL 參數獲取初始模式
 * ?mock=1 或 ?mock=true 表示強制使用 Mock 模式
 * ?mock=0 或 ?mock=false 表示強制使用 Live 模式
 */
function getInitialModeFromUrl(): boolean | null {
  if (typeof window === 'undefined') return null;

  const urlParams = new URLSearchParams(window.location.search);
  const mockParam = urlParams.get(URL_PARAM_KEY);

  if (mockParam === null) return null;

  return mockParam === '1' || mockParam === 'true';
}

/**
 * 從 localStorage 獲取模式
 */
function getStoredMode(): boolean {
  try {
    const stored = safeLocalStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // 兼容舊格式 "mock" / "live"
      if (typeof parsed === 'string') {
        return parsed === 'mock';
      }
      // 新格式 { state: { useMock: boolean } }
      if (parsed?.state?.useMock !== undefined) {
        return parsed.state.useMock;
      }
    }
  } catch {
    // ignore
  }
  // 默認 Mock 模式（安全）
  return true;
}

// ============================================================================
// Store
// ============================================================================

export const useUAGModeStore = create<UAGModeState>()(
  devtools(
    persist(
      (set) => ({
        useMock: getStoredMode(),

        setUseMock: (value) => set({ useMock: value }, false, 'setUseMock'),

        toggleMode: () => set((state) => ({ useMock: !state.useMock }), false, 'toggleMode'),

        initializeMode: () => {
          // URL 參數優先級最高
          const urlMode = getInitialModeFromUrl();
          if (urlMode !== null) {
            set({ useMock: urlMode }, false, 'initializeMode/fromUrl');
            return;
          }

          // 否則使用 localStorage 的值（已在初始狀態處理）
        },
      }),
      {
        name: STORAGE_KEY,
        storage: createJSONStorage(() => ({
          getItem: (name) => safeLocalStorage.getItem(name),
          setItem: (name, value) => safeLocalStorage.setItem(name, value),
          removeItem: (name) => safeLocalStorage.removeItem(name),
        })),
        partialize: (state) => ({ useMock: state.useMock }),
      }
    ),
    {
      name: STORE_NAME,
      enabled: import.meta.env.DEV,
      // 序列化配置：支援 Map/Set 等特殊資料結構（雖然本 store 未使用，但為未來擴展預留）
      serialize: {
        options: {
          map: true,
          set: true,
          date: true,
        },
      },
    }
  )
);

// ============================================================================
// Selectors (Performance Optimization)
// ============================================================================

/**
 * 選擇器：只訂閱 useMock 狀態
 * 避免不必要的重新渲染
 *
 * 注意：函數引用（setUseMock, toggleMode, initializeMode）不需要 selector
 * 因為它們是穩定引用，不會觸發 re-render，應使用 getState() 取得
 */
export const selectUseMock = (state: UAGModeState) => state.useMock;

// ============================================================================
// Legacy Helpers
// ============================================================================

/**
 * 向後兼容的輔助函數
 * 讓舊代碼可以逐步遷移
 */
export function getUAGMode(): 'mock' | 'live' {
  return useUAGModeStore.getState().useMock ? 'mock' : 'live';
}

/**
 * 向後兼容的輔助函數
 * 讓舊代碼可以逐步遷移
 */
export function setUAGMode(mode: 'mock' | 'live'): void {
  useUAGModeStore.getState().setUseMock(mode === 'mock');
}
