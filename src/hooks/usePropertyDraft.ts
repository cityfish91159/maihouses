import { useEffect, useCallback, useMemo, useRef, MutableRefObject } from 'react';
import { notify } from '../lib/notify';
import { safeLocalStorage } from '../lib/safeStorage';

const DRAFT_KEY_PREFIX = 'mh_draft_upload';
const AUTO_SAVE_DELAY_MS = 1000;
const DRAFT_VERSION = 1;
const DRAFT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * 草稿自動存取 Interface
 * 僅包含文字欄位，不含圖片 (blob URL 無法序列化)
 */
export interface DraftFormData {
  // ... existing imports ...

  title: string;
  price: string;
  address: string;
  communityName: string;
  size: string;
  age: string;
  floorCurrent: string;
  floorTotal: string;
  rooms: string;
  halls: string;
  bathrooms: string;
  type: string;
  description: string;
  advantage1: string;
  advantage2: string;
  disadvantage: string;
  highlights: string[];
  sourceExternalId: string;
}

type DraftStorage = DraftFormData & {
  _version: number;
  _savedAt: number;
  _tabId: string;
};

/**
 * 表單自動快照 Hook (UP-1)
 * - 每 1000ms 自動存入 localStorage
 * - 支援一鍵還原
 * - 發布成功後清除
 */
export function usePropertyDraft(
  form: DraftFormData,
  userId?: string
) {
  const tabIdRef = useRef<string>('');
  const autoSaveWarnedRef = useRef(false);
  const restoreWarnedRef = useRef(false);
  const clearWarnedRef = useRef(false);
  const migrateWarnedRef = useRef(false);

  const showWarningOnce = useCallback((flag: MutableRefObject<boolean>, title: string, description: string) => {
    if (flag.current) return;
    flag.current = true;
    notify.warning(title, description);
  }, []);

  // 初始化 tabId（使用 useEffect 避免在 render 期間調用不純函數）
  useEffect(() => {
    if (!tabIdRef.current) {
      const hasCrypto = typeof globalThis !== 'undefined' && typeof globalThis.crypto !== 'undefined';
      tabIdRef.current = hasCrypto && globalThis.crypto.randomUUID
        ? globalThis.crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    }
  }, []);

  const draftKey = useMemo(() => {
    const keyUser = userId ? userId : 'anonymous';
    return `${DRAFT_KEY_PREFIX}_${keyUser}`;
  }, [userId]);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>('');

  // 自動存檔 (debounced)
  useEffect(() => {
    // 只有當表單有內容時才存檔
    const hasContent = form.title || form.price || form.address ||
      form.advantage1 || form.advantage2 || form.disadvantage;

    if (!hasContent) return;

    // 清除前一個 timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // ...

    saveTimeoutRef.current = setTimeout(() => {
      try {
        const draftData: DraftStorage = {
          title: form.title,
          price: form.price,
          address: form.address,
          communityName: form.communityName,
          size: form.size,
          age: form.age,
          floorCurrent: form.floorCurrent,
          floorTotal: form.floorTotal,
          rooms: form.rooms,
          halls: form.halls,
          bathrooms: form.bathrooms,
          type: form.type,
          description: form.description,
          advantage1: form.advantage1,
          advantage2: form.advantage2,
          disadvantage: form.disadvantage,
          highlights: form.highlights ?? [],
          sourceExternalId: form.sourceExternalId,
          _version: DRAFT_VERSION,
          _savedAt: Date.now(),
          _tabId: tabIdRef.current,
        };

        const serialized = JSON.stringify(draftData);

        // 避免重複存檔相同內容
        if (serialized !== lastSavedRef.current) {
          safeLocalStorage.setItem(draftKey, serialized);
          lastSavedRef.current = serialized;
        }
      } catch (e) {
        showWarningOnce(
          autoSaveWarnedRef,
          '草稿自動存檔失敗',
          '瀏覽器儲存空間或隱私設定可能阻擋自動存檔，請稍後重試'
        );
      }
    }, AUTO_SAVE_DELAY_MS);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [form, draftKey, showWarningOnce]);

  // 檢查是否有草稿
  const hasDraft = useCallback((): boolean => {
    // safeLocalStorage handles window check
    try {
      const saved = safeLocalStorage.getItem(draftKey);
      if (!saved) return false;
      const parsed = JSON.parse(saved) as DraftStorage;
      if (parsed._version !== DRAFT_VERSION) {
        safeLocalStorage.removeItem(draftKey);
        return false;
      }
      if (Date.now() - parsed._savedAt > DRAFT_EXPIRY_MS) {
        safeLocalStorage.removeItem(draftKey);
        return false;
      }
      return !!(parsed.title || parsed.price || parsed.address ||
        parsed.advantage1 || parsed.advantage2);
    } catch {
      return false;
    }
  }, [draftKey]);

  // 還原草稿 - 返回草稿數據而不是設置表單
  const restoreDraft = useCallback((): DraftFormData | null => {
    try {
      const saved = safeLocalStorage.getItem(draftKey);
      if (!saved) return null;

      const parsed = JSON.parse(saved) as DraftStorage;
      if (parsed._version !== DRAFT_VERSION) {
        safeLocalStorage.removeItem(draftKey);
        return null;
      }
      if (Date.now() - parsed._savedAt > DRAFT_EXPIRY_MS) {
        safeLocalStorage.removeItem(draftKey);
        return null;
      }
      lastSavedRef.current = saved; // 避免立即重新存檔
      const { _version, _savedAt, _tabId, ...rest } = parsed;
      return rest;
    } catch (e) {
      showWarningOnce(
        restoreWarnedRef,
        '草稿還原失敗',
        '草稿檔案可能已損壞或版本不符，已取消還原'
      );
      return null;
    }
  }, [draftKey, showWarningOnce]);

  // 清除草稿
  const clearDraft = useCallback(() => {
    try {
      safeLocalStorage.removeItem(draftKey);
      lastSavedRef.current = '';
    } catch (e) {
      showWarningOnce(
        clearWarnedRef,
        '草稿清除失敗',
        '請檢查瀏覽器儲存空間或權限設定，草稿可能尚未移除'
      );
    }
  }, [draftKey, showWarningOnce]);

  // 遷移草稿 (anonymous -> userId)
  const migrateDraft = useCallback((fromUserId: string | undefined, toUserId: string | undefined) => {
    const fromKey = `${DRAFT_KEY_PREFIX}_${fromUserId ?? 'anonymous'}`;
    const toKey = `${DRAFT_KEY_PREFIX}_${toUserId ?? 'anonymous'}`;
    if (fromKey === toKey) return;
    try {
      const saved = safeLocalStorage.getItem(fromKey);
      if (!saved) return;
      safeLocalStorage.setItem(toKey, saved);
      safeLocalStorage.removeItem(fromKey);
    } catch (e) {
      showWarningOnce(
        migrateWarnedRef,
        '草稿遷移失敗',
        '匿名草稿未能移轉到登入帳號，請重新登入後再試'
      );
    }
  }, [showWarningOnce]);

  // 取得草稿預覽 (用於顯示提示)
  const getDraftPreview = useCallback((): { title: string; savedAt: string } | null => {
    try {
      const saved = safeLocalStorage.getItem(draftKey);
      if (!saved) return null;
      const parsed = JSON.parse(saved) as DraftStorage;
      if (parsed._version !== DRAFT_VERSION) return null;
      return {
        title: parsed.title || '未命名物件',
        savedAt: formatRelative(parsed._savedAt),
      };
    } catch {
      return null;
    }
  }, [draftKey]);

  return {
    hasDraft,
    restoreDraft,
    clearDraft,
    getDraftPreview,
    migrateDraft,
  };
}

function formatRelative(time: number): string {
  const diff = Date.now() - time;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return '剛剛';
  if (diff < hour) return `${Math.floor(diff / minute)} 分鐘前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小時前`;
  return `${Math.floor(diff / day)} 天前`;
}
