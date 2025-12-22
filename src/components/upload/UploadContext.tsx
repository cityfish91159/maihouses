import React, { createContext, useContext, useState, useRef, ReactNode, useEffect, useCallback } from 'react';
import { usePropertyFormValidation, validateImagesAsync, VALIDATION_RULES, ValidationState } from '../../hooks/usePropertyFormValidation';
import { usePropertyDraft, DraftFormData } from '../../hooks/usePropertyDraft';
import { propertyService, PropertyFormInput } from '../../services/propertyService';
import { notify } from '../../lib/notify';

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
  validating: boolean; // 新增狀態
  uploadProgress: { current: number; total: number } | null;
  selectedCommunityId: string | undefined;
  setSelectedCommunityId: (id: string | undefined) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeImage: (index: number) => void;
  handleSubmit: () => Promise<void>;
  uploadResult: UploadResult | null;
  showConfirmation: boolean;
  // Draft 功能
  hasDraft: () => boolean;
  restoreDraft: () => DraftFormData | null;
  clearDraft: () => void;
  getDraftPreview: () => { title: string; savedAt: string } | null;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const UploadFormProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | undefined>();
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
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

  // 草稿功能整合
  const draftFormData = useCallback((): DraftFormData => ({
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
  }), [form]);

  const { hasDraft, restoreDraft, clearDraft, getDraftPreview } = usePropertyDraft(draftFormData());

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
    if (e.target.files && e.target.files.length > 0) {
      // 競態條件防護：驗證中鎖定
      setValidating(true);
      try {
        const files = Array.from(e.target.files);
        
        // 使用非同步驗證 (含 Magic Bytes 檢查)
        const { validFiles, invalidFiles, allValid } = await validateImagesAsync(files);
        
        if (!allValid) {
          invalidFiles.forEach(({ file, error }) => {
            notify.warning(`${file.name} 無法上傳`, error || '檔案格式或大小不符合要求');
          });
        }
        
        if (validFiles.length > 0) {
          setImageFiles(prev => [...prev, ...validFiles]);
          const urls = validFiles.map(file => URL.createObjectURL(file));
          setForm(prev => ({ ...prev, images: [...prev.images, ...urls] }));
        }
      } finally {
        setValidating(false);
        // 重置 input value 確保可以重複選擇相同檔案
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
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
          console.error('Cleanup failed:', cleanupError);
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
    selectedCommunityId, setSelectedCommunityId, fileInputRef,
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
