import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { propertyService, PropertyFormInput } from '../services/propertyService';
import { CommunityPicker } from '../components/ui/CommunityPicker';
import { HighlightPicker } from '../components/ui/HighlightPicker';
import { usePropertyFormValidation, validateImages, VALIDATION_RULES } from '../hooks/usePropertyFormValidation';
import { notify } from '../lib/notify';
import { 
  Loader2, Upload, X, Sparkles, ThumbsUp, ThumbsDown, 
  Download, Check, Home, MapPin, Shield, ArrowLeft, Building2, AlertTriangle, Edit3
} from 'lucide-react';

// 上傳結果介面
interface UploadResult {
  public_id: string;
  community_id: string | null;
  community_name: string | null;
  is_new_community: boolean;
}

export const PropertyUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [user, setUser] = useState<any>(null);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | undefined>();
  
  // 上傳成功後的確認狀態
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [form, setForm] = useState<PropertyFormInput>({
    title: '', price: '', address: '', communityName: '', size: '', age: '', 
    floorCurrent: '', floorTotal: '', rooms: '3', halls: '2', bathrooms: '2', 
    type: '電梯大樓', description: '',
    advantage1: '', advantage2: '', disadvantage: '',
    highlights: [],
    sourceExternalId: ''
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 社區選擇處理
  const handleCommunityChange = (name: string, communityId?: string) => {
    setForm({ ...form, communityName: name });
    setSelectedCommunityId(communityId);
  };

  // 使用驗證 Hook
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

  const canSubmit = validation.canSubmit;

  // 591 搬家
  const handleImport591 = () => {
    const url = prompt('請貼上 591 網址');
    if(!url) return;
    setLoading(true);
    setTimeout(() => {
      setForm(prev => ({ 
        ...prev, 
        title: '【急售】信義區捷運景觀豪邸', 
        price: '2880', 
        address: '台北市信義區忠孝東路', 
        size: '45.2',
        sourceExternalId: '591-MOCK-ID' 
      }));
      setLoading(false);
    }, 1000);
  };

  // 圖片處理（含驗證）
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      
      // 驗證圖片
      const { validFiles, invalidFiles, allValid } = validateImages(files);
      
      // 顯示無效檔案的錯誤
      if (!allValid) {
        invalidFiles.forEach(({ file, error }) => {
          notify.warning(`${file.name} 無法上傳`, error || '檔案格式或大小不符合要求', { duration: 5000 });
        });
      }
      
      // 只加入有效檔案
      if (validFiles.length > 0) {
        setImageFiles(prev => [...prev, ...validFiles]);
        const urls = validFiles.map(file => URL.createObjectURL(file));
        setImages(prev => [...prev, ...urls]);
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  // 發布
  const publish = async () => {
    // 使用驗證結果檢查
    if (!validation.basicValid) {
      notify.error(
        '請完成必填欄位',
        validation.errors
          .filter(e => ['title', 'price', 'address', 'communityName'].includes(e.field))
          .map(e => e.message)
          .join('、')
      );
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
    
    setLoading(true);
    setUploadProgress({ current: 0, total: imageFiles.length });
    
    try {
      // 上傳圖片（含進度回報）
      const uploadResult = await propertyService.uploadImages(imageFiles, {
        concurrency: 3,
        onProgress: (current, total) => setUploadProgress({ current, total }),
      });
      
      // 檢查是否有失敗的圖片
      if (!uploadResult.allSuccess) {
        const failedNames = uploadResult.failed.map(f => f.file.name).join('、');
        notify.warning('部分圖片上傳失敗', `${failedNames} 未能上傳，其他照片已成功`, { duration: 5000 });
      }
      
      // 如果所有圖片都失敗
      if (uploadResult.urls.length === 0) {
        throw new Error('所有圖片上傳失敗，請檢查網路連線後重試');
      }
      
      // 建立物件
      const result = await propertyService.createPropertyWithForm(form, uploadResult.urls, selectedCommunityId);
      
      // 顯示成功 Toast
      notify.success('🎉 刊登成功！', `物件編號：${result.public_id}`, { duration: 3000 });
      
      // 顯示確認頁
      setUploadResult({
        public_id: result.public_id,
        community_id: result.community_id,
        community_name: result.community_name || form.communityName,
        is_new_community: !selectedCommunityId && result.community_id !== null
      });
      setShowConfirmation(true);
      
    } catch (e: any) {
      console.error('Publish error:', e);
      notify.error('刊登失敗', e?.message || '發生未知錯誤', {
        actionLabel: '重試',
        onAction: publish,
        duration: 5500,
      });
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  const inputClass = "w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none text-sm";

  // ========================================
  // 上傳成功確認頁
  // ========================================
  if (showConfirmation && uploadResult) {
    return (
      <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-800">
        <nav className="sticky top-0 z-overlay flex h-16 items-center border-b border-slate-100 bg-white/90 px-4 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-2 text-xl font-extrabold text-[#003366]">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#003366] to-[#00A8E8] text-white">
              <Home size={18} />
            </div>
            邁房子
          </div>
        </nav>

        <main className="mx-auto max-w-lg p-6 py-12">
          {/* 成功圖示 */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-green-100">
              <Check size={40} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">🎉 刊登成功！</h1>
            <p className="mt-2 text-slate-500">物件編號：{uploadResult.public_id}</p>
          </div>

          {/* 社區歸屬確認 */}
          {uploadResult.community_name && uploadResult.community_name !== '無' && (
            <section className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                  <Building2 size={20} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800">社區牆歸屬</h3>
                  <p className="mt-1 text-lg font-medium text-[#003366]">
                    {uploadResult.community_name}
                  </p>
                  {uploadResult.is_new_community ? (
                    <p className="mt-1 flex items-center gap-1 text-sm text-amber-600">
                      <AlertTriangle size={14} />
                      新建立的社區牆，待審核後公開
                    </p>
                  ) : (
                    <p className="mt-1 flex items-center gap-1 text-sm text-green-600">
                      <Check size={14} />
                      已歸入現有社區牆
                    </p>
                  )}
                </div>
              </div>

              {/* 社區牆預覽連結 */}
              {uploadResult.community_id && (
                <Link 
                  to={`/community/${uploadResult.community_id}`}
                  className="mt-4 block w-full rounded-xl bg-blue-50 py-2 text-center text-sm font-medium text-blue-600 transition hover:bg-blue-100"
                >
                  🏘️ 查看社區牆
                </Link>
              )}
            </section>
          )}

          {/* 發現社區有誤？修正區塊 */}
          {uploadResult.community_name && uploadResult.community_name !== '無' && (
            <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertTriangle size={18} />
                <span className="font-medium">社區歸屬有誤？</span>
              </div>
              <p className="mt-2 text-sm text-amber-700">
                如果發現物件歸入了錯誤的社區牆，可以立即修正。
              </p>
              <button
                onClick={() => {
                  // 跳轉到物件編輯頁的社區修正功能
                  navigate(`/property/${uploadResult.public_id}/edit?fix=community`);
                }}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-100 py-2 text-sm font-medium text-amber-800 transition hover:bg-amber-200"
              >
                <Edit3 size={16} />
                修正社區歸屬
              </button>
            </section>
          )}

          {/* 操作按鈕 */}
          <div className="space-y-3">
            <Link
              to={`/property/${uploadResult.public_id}`}
              className="block w-full rounded-xl bg-gradient-to-r from-[#003366] to-[#00A8E8] py-4 text-center font-bold text-white shadow-lg"
            >
              查看物件頁面
            </Link>
            <button
              onClick={() => {
                setShowConfirmation(false);
                setUploadResult(null);
                // 清空表單
                setForm({
                  title: '', price: '', address: '', communityName: '', size: '', age: '', 
                  floorCurrent: '', floorTotal: '', rooms: '3', halls: '2', bathrooms: '2', 
                  type: '電梯大樓', description: '',
                  advantage1: '', advantage2: '', disadvantage: '',
                  sourceExternalId: ''
                });
                setImages([]);
                setImageFiles([]);
                setSelectedCommunityId(undefined);
              }}
              className="block w-full rounded-xl bg-slate-100 py-3 text-center font-medium text-slate-600 transition hover:bg-slate-200"
            >
              繼續上傳新物件
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-800">
      {/* Header */}
      <nav className="sticky top-0 z-overlay flex h-16 items-center justify-between border-b border-slate-100 bg-white/90 px-4 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="rounded-full p-2 transition-colors hover:bg-slate-100">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div className="flex items-center gap-2 text-xl font-extrabold text-[#003366]">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#003366] to-[#00A8E8] text-white">
              <Home size={18} />
            </div>
            邁房子
          </div>
        </div>
        
        <button onClick={handleImport591} disabled={loading} className="flex items-center gap-1 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#00A8E8] hover:bg-blue-100">
          {loading ? <Loader2 size={12} className="animate-spin"/> : <Download size={12}/>}
          591 搬家
        </button>
      </nav>

      <main className="mx-auto max-w-2xl space-y-5 p-4 pb-32">
        
        {/* 區塊 1: 基本資料 */}
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#003366]">
            <Home size={18}/> 基本資料
          </h2>
          
          <div className="space-y-3">
            <div>
              <label htmlFor="upload-title" className="mb-1 block text-xs font-medium text-slate-600">物件標題 *</label>
              <input id="upload-title" name="title" value={form.title} onChange={handleInput} className={inputClass + " font-bold"} placeholder="例如：信義區101景觀全新裝潢大三房" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="upload-price" className="mb-1 block text-xs font-medium text-slate-600">價格 (萬) *</label>
                <input id="upload-price" name="price" type="number" value={form.price} onChange={handleInput} className={inputClass} placeholder="0" />
              </div>
              <div>
                <label htmlFor="upload-address" className="mb-1 block text-xs font-medium text-slate-600">地址 *</label>
                <input id="upload-address" name="address" value={form.address} onChange={handleInput} className={inputClass} placeholder="台北市信義區..." />
              </div>
            </div>

            {/* 社區名稱 - 必填 */}
            <div>
              <span id="upload-community-label" className="mb-1 block text-xs font-medium text-slate-600">
                社區名稱 * <span className="text-slate-400">(透天/店面請選「無社區」)</span>
              </span>
              <CommunityPicker
                value={form.communityName}
                address={form.address}
                onChange={handleCommunityChange}
                required={true}
              />
              {!validation.communityValid && form.communityName.length > 0 && (
                <p className="mt-1 text-[10px] text-red-500">
                  請輸入完整社區名稱（至少2字）
                </p>
              )}
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <label htmlFor="upload-size" className="mb-1 block text-xs font-medium text-slate-600">坪數</label>
                <input id="upload-size" name="size" type="number" value={form.size} onChange={handleInput} className={inputClass} placeholder="0" />
              </div>
              <div>
                <label htmlFor="upload-age" className="mb-1 block text-xs font-medium text-slate-600">屋齡</label>
                <input id="upload-age" name="age" type="number" value={form.age} onChange={handleInput} className={inputClass} placeholder="0" />
              </div>
              <div className="col-span-2">
                <label htmlFor="upload-type" className="mb-1 block text-xs font-medium text-slate-600">類型</label>
                <select id="upload-type" name="type" value={form.type} onChange={handleInput} className={inputClass}>
                  <option>電梯大樓</option>
                  <option>公寓</option>
                  <option>透天</option>
                  <option>套房</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="upload-rooms" className="mb-1 block text-xs font-medium text-slate-600">房</label>
                <input id="upload-rooms" name="rooms" type="number" value={form.rooms} onChange={handleInput} className={inputClass} />
              </div>
              <div>
                <label htmlFor="upload-halls" className="mb-1 block text-xs font-medium text-slate-600">廳</label>
                <input id="upload-halls" name="halls" type="number" value={form.halls} onChange={handleInput} className={inputClass} />
              </div>
              <div>
                <label htmlFor="upload-bathrooms" className="mb-1 block text-xs font-medium text-slate-600">衛</label>
                <input id="upload-bathrooms" name="bathrooms" type="number" value={form.bathrooms} onChange={handleInput} className={inputClass} />
              </div>
            </div>
          </div>
        </section>

        {/* 區塊 2: 兩好一公道 */}
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="text-orange-500" size={20} />
            <div>
              <h2 className="text-lg font-bold text-[#003366]">兩好一公道</h2>
              <p className="text-xs text-slate-500">誠實揭露，建立買賣信任</p>
            </div>
          </div>

          <div className="space-y-3">            <div className="mb-4">
              <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-blue-700">
                <Sparkles size={14}/> 重點膠囊 (至少 3 個)
              </label>
              <HighlightPicker 
                value={form.highlights || []} 
                onChange={(tags) => setForm({ ...form, highlights: tags })} 
              />
              {!validation.highlightsValid && (
                <p className="mt-1 text-[10px] text-red-500">請至少選擇 3 個重點膠囊</p>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-2 text-[10px] text-slate-400">或填寫詳細優點</span>
              </div>
            </div>

            <div>
              <label htmlFor="upload-advantage1" className="mb-1 flex items-center gap-1.5 text-xs font-medium text-green-700">
                <ThumbsUp size={14}/> 優點 1 (至少 5 字)
              </label>
              <input
                id="upload-advantage1"
                name="advantage1"
                value={form.advantage1}
                onChange={handleInput}
                className={inputClass + (validation.adv1Valid ? ' border-green-300 bg-green-50/50' : '') + (validation.advantage1.contentWarning ? ' border-red-300' : '')}
                placeholder="例如：格局方正，採光極佳"
              />
              <div className="mt-0.5 flex items-center justify-between">
                <span className={"text-xs " + (validation.adv1Valid ? 'text-green-600' : 'text-slate-400')}>
                  {form.advantage1.length}/5 字 {validation.adv1Valid && '✓'}
                </span>
                {validation.advantage1.contentWarning && (
                  <span className="flex items-center gap-1 text-xs text-red-500">
                    <AlertTriangle size={12} /> {validation.advantage1.contentWarning}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="upload-advantage2" className="mb-1 flex items-center gap-1.5 text-xs font-medium text-green-700">
                <ThumbsUp size={14}/> 優點 2 (至少 5 字)
              </label>
              <input
                id="upload-advantage2"
                name="advantage2"
                value={form.advantage2}
                onChange={handleInput}
                className={inputClass + (validation.adv2Valid ? ' border-green-300 bg-green-50/50' : '') + (validation.advantage2.contentWarning ? ' border-red-300' : '')}
                placeholder="例如：近捷運站，生活機能好"
              />
              <div className="mt-0.5 flex items-center justify-between">
                <span className={"text-xs " + (validation.adv2Valid ? 'text-green-600' : 'text-slate-400')}>
                  {form.advantage2.length}/5 字 {validation.adv2Valid && '✓'}
                </span>
                {validation.advantage2.contentWarning && (
                  <span className="flex items-center gap-1 text-xs text-red-500">
                    <AlertTriangle size={12} /> {validation.advantage2.contentWarning}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="upload-disadvantage" className="mb-1 flex items-center gap-1.5 text-xs font-medium text-orange-700">
                <ThumbsDown size={14}/> 誠實公道話 (至少 10 字)
              </label>
              <input
                id="upload-disadvantage"
                name="disadvantage"
                value={form.disadvantage}
                onChange={handleInput}
                className={inputClass + (validation.disValid ? ' border-orange-300 bg-orange-50/50' : '') + (validation.disadvantage.contentWarning ? ' border-red-300' : '')}
                placeholder="例如：臨路有車流聲，建議加裝氣密窗"
              />
              <div className="mt-0.5 flex items-center justify-between">
                <span className={"text-xs " + (validation.disValid ? 'text-orange-600' : 'text-red-400')}>
                  {form.disadvantage.length}/10 字 {validation.disValid ? '✓' : '(請更詳細描述)'}
                </span>
                {validation.disadvantage.contentWarning && (
                  <span className="flex items-center gap-1 text-xs text-red-500">
                    <AlertTriangle size={12} /> {validation.disadvantage.contentWarning}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* 敏感詞警告區塊 */}
          {validation.contentCheck.hasIssues && (
            <div className={`mt-4 flex items-start gap-2 rounded-lg p-3 ${validation.contentCheck.blockSubmit ? 'border border-red-200 bg-red-50' : 'border border-yellow-200 bg-yellow-50'}`}>
              <AlertTriangle className={validation.contentCheck.blockSubmit ? 'text-red-500' : 'text-yellow-600'} size={18} />
              <div>
                <p className={`text-sm font-medium ${validation.contentCheck.blockSubmit ? 'text-red-700' : 'text-yellow-700'}`}>
                  {validation.contentCheck.blockSubmit ? '內容不符合發布規範' : '內容需要注意'}
                </p>
                <ul className="mt-1 space-y-0.5 text-xs text-slate-600">
                  {validation.contentCheck.warnings.map((w, i) => (
                    <li key={i}>• {w}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>

        {/* 區塊 3: 文案與照片 */}
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#003366]">
            <Sparkles size={18} className="text-yellow-500"/> 文案與照片
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="upload-description" className="mb-1 block text-xs font-medium text-slate-600">物件描述</label>
              <textarea
                id="upload-description"
                name="description"
                value={form.description}
                onChange={handleInput}
                rows={4}
                className={inputClass + " resize-none"}
                placeholder="詳細介紹這個物件的特色、生活機能、交通便利性..."
              />
            </div>

            <div>
              <span id="upload-photos-label" className="mb-2 block text-xs font-medium text-slate-600">
                物件照片 * <span className="text-slate-400">(至少 1 張)</span>
              </span>
              <div className="grid grid-cols-4 gap-3">
                {images.map((url, i) => (
                  <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200">
                    <img src={url} alt="" className="size-full object-cover"/>
                    <button 
                      onClick={() => removeImage(i)} 
                      className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition group-hover:opacity-100"
                    >
                      <X size={12}/>
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 rounded bg-[#003366] px-1.5 py-0.5 text-[10px] text-white">
                        封面
                      </span>
                    )}
                  </div>
                ))}
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-slate-400 transition-colors hover:border-[#00A8E8] hover:text-[#00A8E8]"
                >
                  <Upload size={24}/>
                  <span className="mt-1 text-xs">上傳</span>
                </button>
                <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
              </div>
            </div>
          </div>
        </section>

        {/* 預覽區 */}
        {(form.title || form.price || images.length > 0) && (
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-500">
              <MapPin size={14}/> 即時預覽
            </h3>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              {images.length > 0 && (
                <div className="aspect-video">
                  <img src={images[0]} alt="" className="size-full object-cover"/>
                </div>
              )}
              <div className="p-4">
                <h4 className="font-bold text-slate-900">{form.title || '物件標題'}</h4>
                <p className="mt-1 text-xs text-slate-500">{form.address || '地址'}</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-xl font-extrabold text-[#003366]">{form.price || '0'}</span>
                  <span className="text-sm text-slate-500">萬</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {[
                    form.type, 
                    form.size && (form.size + '坪'), 
                    form.rooms + '房' + form.halls + '廳' + form.bathrooms + '衛',
                    ...(form.highlights || [])
                  ].filter(Boolean).map((tag, i) => (
                    <span key={i} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-[#003366]">{tag}</span>
                  ))}
                </div>
                {/* 社區牆預覽提示 */}
                {form.communityName && (
                  <div className="mt-3 border-t border-slate-100 pt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      🏘️ 社區牆：
                      <span className={selectedCommunityId ? 'font-medium text-green-600' : 'font-medium text-blue-600'}>
                        {form.communityName}
                      </span>
                      {selectedCommunityId ? (
                        <span className="text-green-600">（使用現有）</span>
                      ) : (
                        <span className="text-blue-600">（將自動建立）</span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

      </main>

      {/* 底部發布按鈕 */}
      <div className="fixed inset-x-0 bottom-0 z-overlay border-t border-slate-100 bg-white p-4">
        <div className="mx-auto max-w-2xl">
          <button 
            onClick={publish} 
            disabled={loading || !canSubmit}
            className={"w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all " +
              (canSubmit 
                ? 'bg-gradient-to-r from-[#003366] to-[#00A8E8] text-white shadow-lg shadow-blue-900/20 hover:scale-[1.01]' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              )}
          >
            {loading ? <Loader2 className="animate-spin" size={20}/> : <Check size={20}/>}
            {loading ? '上傳中...' : canSubmit ? '確認刊登物件' : '請完成必填欄位'}
          </button>
          
          {!canSubmit && (
            <div className="mt-2 flex justify-center gap-4 text-xs text-slate-400">
              <span className={validation.basicValid ? 'text-green-600' : ''}>
                {validation.basicValid ? '✓ 基本資料' : '○ 基本資料'}
              </span>
              <span className={validation.twoGoodOneFairValid ? 'text-green-600' : ''}>
                {validation.twoGoodOneFairValid ? '✓ 兩好一公道' : '○ 兩好一公道'}
              </span>
              <span className={imageFiles.length > 0 ? 'text-green-600' : ''}>
                {imageFiles.length > 0 ? '✓ 照片' : '○ 照片'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
