import React, {
  createContext,
  useContext,
  useReducer,
  useRef,
  ReactNode,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  usePropertyFormValidation,
  validateImagesAsync,
  VALIDATION_RULES,
  ValidationState,
} from '../../hooks/usePropertyFormValidation';
import { usePropertyDraft, DraftFormData } from '../../hooks/usePropertyDraft';
import { propertyService, PropertyFormInput } from '../../services/propertyService';
import { notify } from '../../lib/notify';
import { supabase } from '../../lib/supabase';
import { optimizeImages } from '../../services/imageService';
import { safeLocalStorage } from '../../lib/safeStorage';
import { logger } from '../../lib/logger';
import {
  uploadReducer,
  createInitialState,
  createManagedImage,
  getSortedImages,
} from './uploadReducer';
import { UploadError, UploadResult, ManagedImage } from '../../types/upload';

const MAX_COMPRESSED_SIZE_BYTES = 1.5 * 1024 * 1024;

interface UploadContextType {
  // State
  form: PropertyFormInput;
  setForm: React.Dispatch<React.SetStateAction<PropertyFormInput>>;
  validation: ValidationState;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  validating: boolean;
  compressing: boolean;
  compressionProgress: number | null;
  uploadProgress: { current: number; total: number } | null;
  selectedCommunityId: string | undefined;
  setSelectedCommunityId: (id: string | undefined) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeImage: (id: string) => void; // UP-3: 改用 id
  setCover: (id: string) => void; // UP-3.3: 設為封面
  handleSubmit: () => Promise<void>;
  uploadResult: UploadResult | null;
  showConfirmation: boolean;
  userId: string | undefined;
  // UP-3: 圖片管理
  managedImages: ManagedImage[];
  // Draft 功能
  hasDraft: () => boolean;
  restoreDraft: () => DraftFormData | null;
  clearDraft: () => void;
  getDraftPreview: () => { title: string; savedAt: string } | null;
  // Error Handling
  lastError: UploadError | null;
  clearError: () => void;
  retryWithOriginal: () => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const UploadFormProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(uploadReducer, undefined, createInitialState);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pending files for fallback retry
  const pendingFilesRef = useRef<File[]>([]);

  // ============================================================
  // Auth: 取得 userId 並監聽登入事件
  // ============================================================
  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      dispatch({ type: 'SET_USER_ID', payload: data.user?.id });
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      dispatch({ type: 'SET_USER_ID', payload: session?.user?.id });
    });
    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  // ============================================================
  // Draft 功能整合
  // ============================================================
  const draftFormData = useMemo<DraftFormData>(
    () => ({
      title: state.form.title,
      price: state.form.price,
      address: state.form.address,
      communityName: state.form.communityName,
      size: state.form.size,
      age: state.form.age,
      floorCurrent: state.form.floorCurrent,
      floorTotal: state.form.floorTotal,
      rooms: state.form.rooms,
      halls: state.form.halls,
      bathrooms: state.form.bathrooms,
      type: state.form.type,
      description: state.form.description,
      advantage1: state.form.advantage1,
      advantage2: state.form.advantage2,
      disadvantage: state.form.disadvantage,
      highlights: state.form.highlights ?? [],
      sourceExternalId: state.form.sourceExternalId,
      // FE-1: 安心留痕開關狀態須納入草稿（boolean 直接使用，避免 undefined）
      trustEnabled: Boolean(state.form.trustEnabled),
    }),
    [
      state.form.title,
      state.form.price,
      state.form.address,
      state.form.communityName,
      state.form.size,
      state.form.age,
      state.form.floorCurrent,
      state.form.floorTotal,
      state.form.rooms,
      state.form.halls,
      state.form.bathrooms,
      state.form.type,
      state.form.description,
      state.form.advantage1,
      state.form.advantage2,
      state.form.disadvantage,
      state.form.highlights,
      state.form.sourceExternalId,
      // FE-1: 依賴陣列須包含 trustEnabled
      state.form.trustEnabled,
    ]
  );

  const { hasDraft, restoreDraft, clearDraft, getDraftPreview, migrateDraft } = usePropertyDraft(
    draftFormData,
    state.userId
  );

  // 匿名草稿遷移到登入用戶
  useEffect(() => {
    const hasAnonymousDraft = safeLocalStorage.getItem('mh_draft_upload_anonymous');
    if (state.userId && hasAnonymousDraft) {
      migrateDraft(undefined, state.userId);
    }
  }, [state.userId, migrateDraft]);

  // ============================================================
  // Object URL Cleanup on Unmount
  // ============================================================
  // 使用 ref 追蹤需要清理的 URL，避免 closure 問題
  const managedImagesRef = useRef(state.managedImages);
  managedImagesRef.current = state.managedImages;

  useEffect(() => {
    return () => {
      managedImagesRef.current.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, []);

  // ============================================================
  // Validation Hook
  // ============================================================
  const validation = usePropertyFormValidation(
    {
      title: state.form.title,
      price: state.form.price,
      address: state.form.address,
      communityName: state.form.communityName,
      advantage1: state.form.advantage1,
      advantage2: state.form.advantage2,
      disadvantage: state.form.disadvantage,
      highlights: state.form.highlights || [],
    },
    state.managedImages.length // UP-3: 使用 managedImages.length
  );

  // ============================================================
  // File Selection Handler (含壓縮與錯誤處理)
  // ============================================================
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    dispatch({ type: 'SET_VALIDATING', payload: true });
    dispatch({ type: 'START_COMPRESSION' });

    const files = Array.from(e.target.files);
    pendingFilesRef.current = files;

    try {
      // 1) 基礎驗證 (副檔名/大小/Magic Bytes)
      const { validFiles, invalidFiles, allValid } = await validateImagesAsync(files);
      if (!allValid) {
        invalidFiles.forEach(({ file, error }) => {
          notify.warning(`${file.name} 無法上傳`, error || '檔案格式或大小不符合要求');
        });
      }

      if (validFiles.length === 0) {
        dispatch({ type: 'SET_VALIDATING', payload: false });
        dispatch({
          type: 'COMPRESSION_FAILED',
          payload: {
            message: '所有檔案驗證失敗',
            canFallback: false,
            originalFiles: [],
          },
        });
        return;
      }

      // 2) 客戶端壓縮與 EXIF 校正
      const { optimized, warnings, skipped } = await optimizeImages(validFiles, {
        maxWidthOrHeight: 2048,
        maxSizeMB: 1.5,
        quality: 0.85,
        onProgress: (p) => dispatch({ type: 'UPDATE_COMPRESSION_PROGRESS', payload: p }),
      });

      // 處理 HEIC 或壓縮錯誤
      const heicErrors = warnings.filter((w) => w.includes('HEIC') || w.includes('heic'));
      if (heicErrors.length > 0) {
        heicErrors.forEach((msg) => notify.error('HEIC 格式錯誤', msg));
      }
      warnings
        .filter((w) => !w.includes('HEIC') && !w.includes('heic'))
        .forEach((msg) => notify.warning('圖片壓縮失敗', msg));

      // 3) 最終大小防線（保證不超過 1.5MB）
      const accepted = optimized.filter((file) => {
        if (file.size > MAX_COMPRESSED_SIZE_BYTES) {
          notify.warning(`${file.name} 壓縮後仍超過 1.5MB`, '請改用較低解析度的照片');
          return false;
        }
        return true;
      });

      if (accepted.length === 0) {
        dispatch({
          type: 'COMPRESSION_FAILED',
          payload: {
            message: '所有圖片壓縮失敗或仍超過大小限制',
            canFallback: validFiles.some((f) => f.size <= MAX_COMPRESSED_SIZE_BYTES),
            originalFiles: validFiles.filter((f) => f.size <= MAX_COMPRESSED_SIZE_BYTES),
          },
        });
        return;
      }

      if (skipped > 0) {
        notify.info('圖片已加入', `有 ${skipped} 張已符合尺寸，跳過壓縮`);
      }

      // UP-3: 建立 ManagedImage 陣列
      const newManagedImages = accepted.map((file) => createManagedImage(file));
      dispatch({ type: 'FINISH_COMPRESSION', payload: newManagedImages });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '壓縮過程發生未知錯誤';
      dispatch({
        type: 'COMPRESSION_FAILED',
        payload: {
          message,
          canFallback: true,
          originalFiles: files.filter((f) => f.size <= MAX_COMPRESSED_SIZE_BYTES),
        },
      });
      notify.error('圖片處理失敗', message);
    } finally {
      dispatch({ type: 'SET_VALIDATING', payload: false });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, []);

  // ============================================================
  // Fallback: 上傳原檔 (跳過壓縮)
  // ============================================================
  const retryWithOriginal = useCallback(() => {
    if (!state.lastError?.originalFiles || state.lastError.originalFiles.length === 0) {
      notify.warning('無法重試', '沒有可用的原始檔案');
      return;
    }

    const files = state.lastError.originalFiles;
    const newManagedImages = files.map((file) => createManagedImage(file));

    dispatch({ type: 'CLEAR_ERROR' });
    dispatch({ type: 'ADD_IMAGES', payload: newManagedImages });
    notify.success('已加入原檔', `${files.length} 張圖片將以原始大小上傳`);
  }, [state.lastError]);

  // UP-3: Remove Image (使用 id)
  // ============================================================
  const removeImage = useCallback(
    (id: string) => {
      // Side Effect Cleanup: 在 Dispatch 前處理 URL Revocation (Reducer 必須保持純淨)
      const imgToRemove = state.managedImages.find((img) => img.id === id);
      if (imgToRemove?.previewUrl) {
        URL.revokeObjectURL(imgToRemove.previewUrl);
      }
      dispatch({ type: 'REMOVE_IMAGE', payload: id });
    },
    [state.managedImages]
  );

  // ============================================================
  // UP-3.3: Set Cover
  // ============================================================
  const setCover = useCallback((id: string) => {
    dispatch({ type: 'SET_COVER', payload: id });
    notify.success('已設定封面', '此照片將作為物件封面');
  }, []);

  // ============================================================
  // Submit Handler
  // ============================================================
  const handleSubmit = useCallback(async () => {
    if (!validation.basicValid) {
      notify.error('請完成必填欄位', '標題、價格、地址與社區名稱為必填');
      return;
    }
    if (!validation.twoGoodOneFairValid) {
      notify.error(
        '兩好一公道字數不足',
        `優點至少各 ${VALIDATION_RULES.advantage.minLength} 字，公道話至少 ${VALIDATION_RULES.disadvantage.minLength} 字`
      );
      return;
    }
    if (!validation.images.valid) {
      notify.error('請上傳照片', '至少需要一張物件照片');
      return;
    }

    // UP-3.4: 確保封面在第一位
    const sortedImages = getSortedImages(state.managedImages);

    // UP-3.D: MVP Standard - Form Validation
    // 檢查：排序後的第一張圖是否標記為封面
    // 如果沒有封面，這是 Validation Error，應告知用戶而非偷偷修改
    if (sortedImages.length > 0 && sortedImages[0]?.isCover !== true) {
      logger.error('[UP-3.D] Validation Failed: No cover image selected.');
      // MVP: 阻擋上傳並通知用戶 (避免靜默失敗)
      notify.error('系統偵測到封面設定異常，請重新整理頁面或重新選擇封面。');
      return;
    }

    // Dev Assertion
    if (process.env.NODE_ENV !== 'production') {
      const isHealthy = sortedImages.length === 0 || sortedImages[0]?.isCover === true;
      if (!isHealthy) {
        logger.error('[UP-3.D] Invariant Violation: Cover image missing at index 0');
      }
    }

    const filesToUpload = sortedImages.map((img) => img.file);

    dispatch({
      type: 'START_UPLOAD',
      payload: { total: filesToUpload.length },
    });

    let uploadRes: {
      urls: string[];
      failed: { file: File; error: string }[];
      allSuccess: boolean;
    } | null = null;

    try {
      uploadRes = await propertyService.uploadImages(filesToUpload, {
        concurrency: 3,
        onProgress: (current, total) =>
          dispatch({
            type: 'UPDATE_UPLOAD_PROGRESS',
            payload: { current, total },
          }),
      });

      if (!uploadRes.allSuccess) {
        notify.warning('部分圖片上傳失敗', '部分照片未能上傳，但我們將繼續處理其他照片');
      }

      if (uploadRes.urls.length === 0) {
        throw new Error('所有圖片上傳失敗，請檢查網路連線後重試');
      }

      const result = await propertyService.createPropertyWithForm(
        state.form,
        uploadRes.urls,
        state.selectedCommunityId
      );

      dispatch({
        type: 'UPLOAD_SUCCESS',
        payload: {
          public_id: result.public_id,
          community_id: result.community_id,
          community_name: result.community_name || state.form.communityName,
          is_new_community: !state.selectedCommunityId && result.community_id !== null,
        },
      });

      clearDraft();
      notify.success('🎉 刊登成功！', `物件編號：${result.public_id}`);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '發生未知錯誤';

      let errorType: UploadError['type'] = 'upload';
      if (
        errorMessage.includes('網路') ||
        errorMessage.includes('network') ||
        errorMessage.includes('fetch')
      ) {
        errorType = 'network';
      }

      if (uploadRes && uploadRes.urls.length > 0) {
        notify.info('正在清理未使用的圖片...', '發佈失敗，正在移除已上傳的圖片');
        try {
          await propertyService.deleteImages(uploadRes.urls);
        } catch {
          notify.warning('圖片清理失敗', '部分圖片可能仍留在伺服器');
        }
      }

      dispatch({
        type: 'UPLOAD_FAILED',
        payload: { type: errorType, message: errorMessage },
      });

      if (errorType === 'network') {
        notify.error('網路連線錯誤', '請檢查您的網路連線後重試');
      } else {
        notify.error('刊登失敗', errorMessage);
      }
    }
  }, [validation, state.managedImages, state.form, state.selectedCommunityId, clearDraft]);

  // ============================================================
  // Compatibility: setForm / setLoading / setSelectedCommunityId
  // ============================================================
  const setForm: React.Dispatch<React.SetStateAction<PropertyFormInput>> = useCallback(
    (action) => {
      if (typeof action === 'function') {
        dispatch({ type: 'SET_FORM', payload: action(state.form) });
      } else {
        dispatch({ type: 'SET_FORM', payload: action });
      }
    },
    [state.form]
  );

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setSelectedCommunityId = useCallback((id: string | undefined) => {
    dispatch({ type: 'SET_COMMUNITY_ID', payload: id });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // ============================================================
  // Context Value
  // ============================================================
  const value: UploadContextType = {
    form: state.form,
    setForm,
    validation,
    loading: state.loading,
    setLoading,
    validating: state.validating,
    compressing: state.compressing,
    compressionProgress: state.compressionProgress,
    uploadProgress: state.uploadProgress,
    selectedCommunityId: state.selectedCommunityId,
    setSelectedCommunityId,
    fileInputRef,
    handleFileSelect,
    removeImage,
    setCover, // UP-3.3
    handleSubmit,
    uploadResult: state.uploadResult,
    showConfirmation: state.showConfirmation,
    userId: state.userId,
    managedImages: state.managedImages, // UP-3
    hasDraft,
    restoreDraft,
    clearDraft,
    getDraftPreview,
    lastError: state.lastError,
    clearError,
    retryWithOriginal,
  };

  return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>;
};

export const useUploadForm = () => {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error('useUploadForm must be used within an UploadFormProvider');
  }
  return context;
};
