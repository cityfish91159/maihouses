import { useEffect, useCallback, useRef } from 'react';

const DRAFT_KEY_PREFIX = 'mh_draft_upload';
const AUTO_SAVE_DELAY_MS = 1000;

/**
 * 草稿自動存取 Interface
 * 僅包含文字欄位，不含圖片 (blob URL 無法序列化)
 */
export interface DraftFormData {
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
  const DRAFT_KEY = userId ? `${DRAFT_KEY_PREFIX}_${userId}` : DRAFT_KEY_PREFIX;
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

    saveTimeoutRef.current = setTimeout(() => {
      try {
        // 只存文字欄位，排除 images (blob URL)
        const draftData: DraftFormData = {
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
        };

        const serialized = JSON.stringify(draftData);
        
        // 避免重複存檔相同內容
        if (serialized !== lastSavedRef.current) {
          localStorage.setItem(DRAFT_KEY, serialized);
          lastSavedRef.current = serialized;
        }
      } catch (e) {
        console.warn('草稿自動存檔失敗:', e);
      }
    }, AUTO_SAVE_DELAY_MS);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [form, DRAFT_KEY]);

  // 檢查是否有草稿
  const hasDraft = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (!saved) return false;
      const parsed = JSON.parse(saved) as DraftFormData;
      // 確認草稿有實質內容
      return !!(parsed.title || parsed.price || parsed.address || 
                parsed.advantage1 || parsed.advantage2);
    } catch {
      return false;
    }
  }, [DRAFT_KEY]);

  // 還原草稿 - 返回草稿數據而不是設置表單
  const restoreDraft = useCallback((): DraftFormData | null => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (!saved) return null;
      
      const parsed = JSON.parse(saved) as DraftFormData;
      lastSavedRef.current = saved; // 避免立即重新存檔
      return parsed;
    } catch (e) {
      console.error('草稿還原失敗:', e);
      return null;
    }
  }, [DRAFT_KEY]);

  // 清除草稿
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_KEY);
      lastSavedRef.current = '';
    } catch (e) {
      console.warn('草稿清除失敗:', e);
    }
  }, [DRAFT_KEY]);

  // 取得草稿預覽 (用於顯示提示)
  const getDraftPreview = useCallback((): { title: string; savedAt: string } | null => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (!saved) return null;
      const parsed = JSON.parse(saved) as DraftFormData;
      return {
        title: parsed.title || '未命名物件',
        savedAt: '剛才', // 簡化版，未存時間戳
      };
    } catch {
      return null;
    }
  }, [DRAFT_KEY]);

  return {
    hasDraft,
    restoreDraft,
    clearDraft,
    getDraftPreview,
  };
}
