import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';
import { usePropertyFormValidation, validateImages, VALIDATION_RULES } from '../../hooks/usePropertyFormValidation';
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
  validation: any;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  uploadProgress: { current: number; total: number } | null;
  selectedCommunityId: string | undefined;
  setSelectedCommunityId: (id: string | undefined) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeImage: (index: number) => void;
  handleSubmit: () => Promise<void>;
  uploadResult: UploadResult | null;
  showConfirmation: boolean;
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const { validFiles, invalidFiles, allValid } = validateImages(files);
      
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
    }
  };

  const removeImage = (index: number) => {
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

    try {
      const uploadRes = await propertyService.uploadImages(imageFiles, {
        concurrency: 3,
        onProgress: (current, total) => setUploadProgress({ current, total }),
      });

      if (!uploadRes.allSuccess) {
        notify.warning('部分圖片上傳失敗', '部分照片未能上傳，但我們將繼續處理其他照片');
      }

      if (uploadRes.urls.length === 0) {
        throw new Error('所有圖片上傳失敗，請檢查網路連線後重試');
      }

      const result = await propertyService.createPropertyWithForm(form, uploadRes.urls, selectedCommunityId);
      
      setUploadResult({
        public_id: result.public_id,
        community_id: result.community_id,
        community_name: result.community_name || form.communityName,
        is_new_community: !selectedCommunityId && result.community_id !== null
      });
      setShowConfirmation(true);
      notify.success('🎉 刊登成功！', `物件編號：${result.public_id}`);
    } catch (e: any) {
      console.error('Publish error:', e);
      notify.error('刊登失敗', e?.message || '發生未知錯誤');
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  const value = {
    form, setForm, validation, loading, setLoading, uploadProgress,
    selectedCommunityId, setSelectedCommunityId, fileInputRef,
    handleFileSelect, removeImage, handleSubmit, uploadResult, showConfirmation
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
