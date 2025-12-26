// MUSE Night Mode - Utility Functions

// 獲取台灣時間（UTC+8）的小時數
export function getTaiwanHour(): number {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const taiwanTime = new Date(utc + (8 * 3600000));
  return taiwanTime.getHours();
}

// Helper to trigger haptic feedback (only works after user interaction)
let hasUserInteracted = false;

export const markUserInteraction = (): void => {
  hasUserInteracted = true;
};

export const triggerHeartbeat = (pattern = [50, 100, 50, 100]): void => {
  if (hasUserInteracted && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Vibration not supported or blocked
    }
  }
};

// 獲取或創建 Session ID
export const getSessionId = (): string => {
  let sessionId = localStorage.getItem('muse_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('muse_session_id', sessionId);
  }
  return sessionId;
};

// 判斷是否在色色限制時段 (8:00-17:00) - 使用台灣時間
export const isInSexyLockedHours = (): boolean => {
  const hour = getTaiwanHour();
  return hour >= 8 && hour < 17;
};

// 檢查今天是否已解鎖
export const isSexyUnlockedToday = (): boolean => {
  const unlockedDate = localStorage.getItem('sexy_unlocked_today');
  return unlockedDate === new Date().toDateString();
};

// 設定今天已解鎖
export const setSexyUnlockedToday = (): void => {
  localStorage.setItem('sexy_unlocked_today', new Date().toDateString());
};

// 判斷時段模式 - 使用台灣時間
export type TimeMode = 'morning' | 'afternoon' | 'evening' | 'night';

export const getTimeMode = (): TimeMode => {
  const hour = getTaiwanHour();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 23) return 'evening';
  return 'night';
};

// Default MUSE avatar (blurred placeholder)
export const DEFAULT_MUSE_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMUExQTFBIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSI0MCIgZmlsbD0iIzMzMzMzMyIvPgo8cGF0aCBkPSJNNTAgMTgwQzUwIDE0MCA3MiAxMjAgMTAwIDEyMEMxMjggMTIwIDE1MCAxNDAgMTUwIDE4MCIgZmlsbD0iIzMzMzMzMyIvPgo8L3N2Zz4=';
