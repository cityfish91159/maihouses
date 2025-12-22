import React, { createContext, useContext, useState, useRef, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { usePropertyFormValidation, validateImagesAsync, VALIDATION_RULES, ValidationState } from '../../hooks/usePropertyFormValidation';
import { usePropertyDraft, DraftFormData } from '../../hooks/usePropertyDraft';
import { propertyService, PropertyFormInput } from '../../services/propertyService';
import { notify } from '../../lib/notify';
import { supabase } from '../../lib/supabase';
import { parseSupabaseError } from '../../utils/errorParser';
import { optimizeImages } from '../../services/imageService';

const MAX_COMPRESSED_SIZE_BYTES = 1.5 * 1024 * 1024;

interface UploadResult {
  public_id: string;
  community_id: string | null;
  community_name: string | null;
  is_new_community: boolean;
}

interface UploadContextType {
  form: PropertyFormInput;
  setForm: React.Dispatch<React.SetStateAction<PropertyFormInput>>;
  validation: ValidationState;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  validating: boolean;
  compressing: boolean; // UP-2.K: 新增狀態 (用戶要求)
  compressionProgress: number | null; // UP-2.A: 壓縮進度
  uploadProgress: { current: number; total: number } | null;
  selectedCommunityId: string | undefined;
  setSelectedCommunityId: (id: string | undefined) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeImage: (index: number) => void;
  handleSubmit: () => Promise<void>;
  uploadResult: UploadResult | null;
  showConfirmation: boolean;
  userId: string | undefined;
  // Draft 功能
  hasDraft: () => boolean;
  restoreDraft: () => DraftFormData | null;
  clearDraft: () => void;
  getDraftPreview: () => { title: string; savedAt: string } | null;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const UploadFormProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false); // UP-2.K
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [compressionProgress, setCompressionProgress] = useState<number | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  // ... (rest of state)

  // ... (useEffect for userId)

  // ... (draft logic)

  // ... (objectUrl cleanup)

  const [validating, setValidating] = useState(false);

  // ... (validation hook)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setValidating(true);
    setCompressing(true); // UP-2.K: Start compressing state
    try {
      const files = Array.from(e.target.files);

      // 1) 基礎驗證 (副檔名/大小/Magic Bytes)
      const { validFiles, invalidFiles, allValid } = await validateImagesAsync(files);
      if (!allValid) {
        invalidFiles.forEach(({ file, error }) => {
          notify.warning(`${file.name} 無法上傳`, error || '檔案格式或大小不符合要求');
        });
      }

      if (validFiles.length === 0) {
        return;
      }

      // 2) 客戶端壓縮與 EXIF 校正
      // UP-2.A: 傳入 onProgress 回調
      setCompressionProgress(0);
      const { optimized, warnings, skipped } = await optimizeImages(validFiles, {
        maxWidthOrHeight: 2048,
        maxSizeMB: 1.5,
        quality: 0.85,
        onProgress: (p) => setCompressionProgress(p)
      });
      // setCompressionProgress(null); // UP-2.L: Moved to finally

      warnings.forEach(message => notify.warning('圖片壓縮失敗，已跳過', message));

      // 3) 最終大小防線（保證不超過 1.5MB）
      const accepted = optimized.filter(file => {
        if (file.size > MAX_COMPRESSED_SIZE_BYTES) {
          notify.warning(`${file.name} 壓縮後仍超過 1.5MB`, '請改用較低解析度的照片');
          return false;
        }
        return true;
      });

      if (accepted.length === 0) {
        if (warnings.length === 0) {
          notify.warning('圖片未加入', '所有圖片壓縮後仍不符合大小限制');
        }
        return;
      }

      if (skipped > 0) {
        notify.info('圖片已加入', `有 ${skipped} 張已符合尺寸，跳過壓縮`);
      }

      setImageFiles(prev => [...prev, ...accepted]);
      const urls = accepted.map(file => URL.createObjectURL(file));
      setForm(prev => ({ ...prev, images: [...prev.images, ...urls] }));
    } finally {
      setValidating(false);
      setCompressing(false); // UP-2.L: Reset compressing state
      setCompressionProgress(null); // UP-2.L: Reset progress
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // ... (removeImage)

  // ... (handleSubmit)

  const value = {
    form, setForm, validation, loading, setLoading, validating, uploadProgress,
    compressing, // UP-2.K: Expose compressing state
    compressionProgress,
    selectedCommunityId, setSelectedCommunityId, fileInputRef, userId,
    handleFileSelect, removeImage, handleSubmit, uploadResult, showConfirmation,
    // Draft 功能
    hasDraft, restoreDraft, clearDraft, getDraftPreview
  };

  return (
    <UploadContext.Provider value={value}>
      {children}
    </UploadContext.Provider>
  );
};

export const useUploadForm = () => {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error('useUploadForm must be used within an UploadFormProvider');
  }
  return context;
};
