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
  compressing: boolean; // UP-2.K: 新增狀態
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
  const [compressionProgress, setCompressionProgress] = useState<number | null>(null); // UP-2.A: 壓縮進度
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | undefined>();
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<PropertyFormInput>({
    title: '', price: '', address: '', communityName: '', size: '', age: '',
    floorCurrent: '', floorTotal: '', rooms: '3', halls: '2', bathrooms: '2',
    type: '電梯大樓', description: '',
    advantage1: '', advantage2: '', disadvantage: '',
    highlights: [],
    images: [],
    sourceExternalId: ''
  });

  // 取得 userId 並監聽登入事件（支援匿名 → 登入遷移）
  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUserId(data.user?.id);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id);
    });
    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  // 草稿功能整合
  const draftFormData = useMemo<DraftFormData>(() => ({
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
    sourceExternalId: form.sourceExternalId
  }), [
    form.title,
    form.price,
    form.address,
    form.communityName,
    form.size,
    form.age,
    form.floorCurrent,
    form.floorTotal,
    form.rooms,
    form.halls,
    form.bathrooms,
    form.type,
    form.description,
    form.advantage1,
    form.advantage2,
    form.disadvantage,
    form.highlights,
    form.sourceExternalId
  ]);

  const { hasDraft, restoreDraft, clearDraft, getDraftPreview, migrateDraft } = usePropertyDraft(draftFormData, userId);

  // 匿名草稿遷移到登入用戶
  useEffect(() => {
    const hasAnonymousDraft = typeof window !== 'undefined' && localStorage.getItem('mh_draft_upload_anonymous');
    if (userId && hasAnonymousDraft) {
      migrateDraft(undefined, userId);
    }
  }, [userId, migrateDraft]);

  // 追蹤 Object URLs 以便在組件卸載時清理
  const objectUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    objectUrlsRef.current = form.images.filter(url => url.startsWith('blob:'));
  }, [form.images]);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const [validating, setValidating] = useState(false);

  const validation = usePropertyFormValidation(
    {
      title: form.title,
      price: form.price,
      address: form.address,
      communityName: form.communityName,
      advantage1: form.advantage1,
      advantage2: form.advantage2,
      disadvantage: form.disadvantage,
      highlights: form.highlights || [],
    },
    imageFiles.length
  );

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

  const removeImage = (index: number) => {
    const urlToRemove = form.images[index];
    if (urlToRemove && urlToRemove.startsWith('blob:')) {
      URL.revokeObjectURL(urlToRemove);
    }
    setForm(prev => ({ ...prev, images: prev.images.filter((_: string, i: number) => i !== index) }));
    setImageFiles(prev => prev.filter((_: File, i: number) => i !== index));
  };

  const handleSubmit = async () => {
    if (!validation.basicValid) {
      notify.error('請完成必填欄位', '標題、價格、地址與社區名稱為必填');
      return;
    }
    if (!validation.twoGoodOneFairValid) {
      notify.error('兩好一公道字數不足', `優點至少各 ${VALIDATION_RULES.advantage.minLength} 字，公道話至少 ${VALIDATION_RULES.disadvantage.minLength} 字`);
      return;
    }
    if (!validation.images.valid) {
      notify.error('請上傳照片', '至少需要一張物件照片');
      return;
    }

    setLoading(true);
    setUploadProgress({ current: 0, total: imageFiles.length });

    let uploadRes: { urls: string[]; failed: { file: File; error: string }[]; allSuccess: boolean } | null = null;

    try {
      uploadRes = await propertyService.uploadImages(imageFiles, {
        concurrency: 3,
        onProgress: (current, total) => setUploadProgress({ current, total }),
      });

      if (!uploadRes.allSuccess) {
        notify.warning('部分圖片上傳失敗', '部分照片未能上傳，但我們將繼續處理其他照片');
      }

      if (uploadRes.urls.length === 0) {
        throw new Error('所有圖片上傳失敗，請檢查網路連線後重試');
      }

      // KC-4.2 & 4.3: AI 生成亮點膠囊 (優雅降級)
      let finalForm = { ...form };
      /* 暫時關閉 AI 自動生成，以尊重用戶手動勾選為主 (User Request)
      try {
        const aiRes = await fetch('/api/property/generate-key-capsules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title,
            description: form.description,
            advantage1: form.advantage1,
            advantage2: form.advantage2
          })
        });
        
        if (aiRes.ok) {
          const { capsules } = await aiRes.json();
          if (capsules && capsules.length > 0) {
            // 成功才覆寫 (KC-4.2) - 僅在欄位為空時填入，避免覆寫用戶手動輸入
            if (capsules[0] && !finalForm.advantage1) finalForm.advantage1 = capsules[0];
            if (capsules[1] && !finalForm.advantage2) finalForm.advantage2 = capsules[1];
            
            // 同時存入 highlights 確保 UI 優先使用
            finalForm.highlights = capsules;
            
            notify.success('AI 亮點生成成功', `已自動優化標籤：${capsules.join(', ')}`);
          }
        } else {
          throw new Error('AI 服務回應異常');
        }
      } catch (aiError) {
        // 降級處理：AI 失敗不阻塞主流程 (KC-4.3)
        notify.warning('AI 亮點生成跳過', '目前無法使用 AI 優化，將以原始內容發佈');
      }
      */

      const result = await propertyService.createPropertyWithForm(finalForm, uploadRes.urls, selectedCommunityId);

      setUploadResult({
        public_id: result.public_id,
        community_id: result.community_id,
        community_name: result.community_name || form.communityName,
        is_new_community: !selectedCommunityId && result.community_id !== null
      });
      setShowConfirmation(true);

      // 發佈成功後清除草稿
      clearDraft();

      notify.success('🎉 刊登成功！', `物件編號：${result.public_id}`);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '發生未知錯誤';

      // 補償機制：發佈失敗時清理已上傳的圖片 (孤兒檔案處理)
      if (uploadRes && uploadRes.urls.length > 0) {
        notify.info('正在清理未使用的圖片...', '發佈失敗，正在移除已上傳的圖片');
        try {
          await propertyService.deleteImages(uploadRes.urls);
        } catch (cleanupError) {
          notify.warning('圖片清理失敗', '部分圖片可能仍留在伺服器，請稍後重試或聯繫客服協助');
        }
      }

      notify.error('刊登失敗', errorMessage);
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

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
