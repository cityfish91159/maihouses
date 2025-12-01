import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { propertyService, PropertyFormInput } from '../services/propertyService';
import { CommunityPicker } from '../components/ui/CommunityPicker';
import { 
  Loader2, Upload, X, Sparkles, ThumbsUp, ThumbsDown, 
  Download, Check, Home, MapPin, Shield, ArrowLeft
} from 'lucide-react';

export const PropertyUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [user, setUser] = useState<any>(null);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | undefined>();

  const [form, setForm] = useState<PropertyFormInput>({
    title: '', price: '', address: '', communityName: '', size: '', age: '', 
    floorCurrent: '', floorTotal: '', rooms: '3', halls: '2', bathrooms: '2', 
    type: '電梯大樓', description: '',
    advantage1: '', advantage2: '', disadvantage: '',
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

  // 驗證邏輯
  const validation = {
    adv1Valid: form.advantage1.length >= 5,
    adv2Valid: form.advantage2.length >= 5,
    disValid: form.disadvantage.length >= 10,
    get allValid() { return this.adv1Valid && this.adv2Valid && this.disValid; }
  };
  const basicValid = form.title.length > 0 && form.price.length > 0 && form.address.length > 0;
  const canSubmit = basicValid && validation.allValid && imageFiles.length > 0;

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

  // 圖片處理
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setImageFiles(prev => [...prev, ...files]);
      const urls = files.map(file => URL.createObjectURL(file));
      setImages(prev => [...prev, ...urls]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  // 發布
  const publish = async () => {
    if (!basicValid) return alert('請填寫標題、價格、地址');
    if (!validation.allValid) return alert('兩好一公道字數不足！');
    if (imageFiles.length === 0) return alert('請至少上傳一張照片');
    
    setLoading(true);
    try {
      const uploadedUrls = await propertyService.uploadImages(imageFiles);
      // 傳入已選擇的社區 ID（如果有的話）
      const result = await propertyService.createPropertyWithForm(form, uploadedUrls, selectedCommunityId);
      
      alert('🎉 刊登成功！物件編號：' + result.public_id);
      navigate('/property/' + result.public_id);
    } catch (e: any) {
      alert('失敗：' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none text-sm";

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-800">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 h-16 flex items-center px-4 shadow-sm justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div className="flex items-center text-[#003366] font-extrabold text-xl gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#003366] to-[#00A8E8] rounded-lg flex items-center justify-center text-white">
              <Home size={18} />
            </div>
            邁房子
          </div>
        </div>
        
        <button onClick={handleImport591} disabled={loading} className="text-xs bg-blue-50 text-[#00A8E8] px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 flex items-center gap-1 border border-blue-100">
          {loading ? <Loader2 size={12} className="animate-spin"/> : <Download size={12}/>}
          591 搬家
        </button>
      </nav>

      <main className="max-w-2xl mx-auto p-4 pb-32 space-y-5">
        
        {/* 區塊 1: 基本資料 */}
        <section className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-[#003366] mb-4 flex items-center gap-2">
            <Home size={18}/> 基本資料
          </h2>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">物件標題 *</label>
              <input name="title" value={form.title} onChange={handleInput} className={inputClass + " font-bold"} placeholder="例如：信義區101景觀全新裝潢大三房" />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">價格 (萬) *</label>
                <input name="price" type="number" value={form.price} onChange={handleInput} className={inputClass} placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">地址 *</label>
                <input name="address" value={form.address} onChange={handleInput} className={inputClass} placeholder="台北市信義區..." />
              </div>
            </div>

            {/* 社區名稱 - 智能選擇器 */}
            <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
              <label className="block text-xs font-medium text-[#003366] mb-1 flex items-center gap-1">
                <MapPin size={12} />
                這間房子在哪個社區？
              </label>
              <p className="text-[10px] text-blue-600 mb-2">
                💡 填好社區名稱，同社區買方會優先看到你的物件
              </p>
              <CommunityPicker
                value={form.communityName}
                address={form.address}
                onChange={handleCommunityChange}
              />
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">坪數</label>
                <input name="size" type="number" value={form.size} onChange={handleInput} className={inputClass} placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">屋齡</label>
                <input name="age" type="number" value={form.age} onChange={handleInput} className={inputClass} placeholder="0" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">類型</label>
                <select name="type" value={form.type} onChange={handleInput} className={inputClass}>
                  <option>電梯大樓</option>
                  <option>公寓</option>
                  <option>透天</option>
                  <option>套房</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">房</label>
                <input name="rooms" type="number" value={form.rooms} onChange={handleInput} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">廳</label>
                <input name="halls" type="number" value={form.halls} onChange={handleInput} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">衛</label>
                <input name="bathrooms" type="number" value={form.bathrooms} onChange={handleInput} className={inputClass} />
              </div>
            </div>
          </div>
        </section>

        {/* 區塊 2: 兩好一公道 */}
        <section className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="text-orange-500" size={20} />
            <div>
              <h2 className="text-lg font-bold text-[#003366]">兩好一公道</h2>
              <p className="text-xs text-slate-500">誠實揭露，建立買賣信任</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="flex items-center gap-1.5 font-medium text-green-700 mb-1 text-xs">
                <ThumbsUp size={14}/> 優點 1 (至少 5 字)
              </label>
              <input 
                name="advantage1" 
                value={form.advantage1} 
                onChange={handleInput} 
                className={inputClass + (validation.adv1Valid ? ' border-green-300 bg-green-50/50' : '')} 
                placeholder="例如：格局方正，採光極佳" 
              />
              <span className={"text-xs mt-0.5 block " + (validation.adv1Valid ? 'text-green-600' : 'text-slate-400')}>
                {form.advantage1.length}/5 字 {validation.adv1Valid && '✓'}
              </span>
            </div>

            <div>
              <label className="flex items-center gap-1.5 font-medium text-green-700 mb-1 text-xs">
                <ThumbsUp size={14}/> 優點 2 (至少 5 字)
              </label>
              <input 
                name="advantage2" 
                value={form.advantage2} 
                onChange={handleInput} 
                className={inputClass + (validation.adv2Valid ? ' border-green-300 bg-green-50/50' : '')} 
                placeholder="例如：近捷運站，生活機能好" 
              />
              <span className={"text-xs mt-0.5 block " + (validation.adv2Valid ? 'text-green-600' : 'text-slate-400')}>
                {form.advantage2.length}/5 字 {validation.adv2Valid && '✓'}
              </span>
            </div>

            <div>
              <label className="flex items-center gap-1.5 font-medium text-orange-700 mb-1 text-xs">
                <ThumbsDown size={14}/> 誠實公道話 (至少 10 字)
              </label>
              <input 
                name="disadvantage" 
                value={form.disadvantage} 
                onChange={handleInput} 
                className={inputClass + (validation.disValid ? ' border-orange-300 bg-orange-50/50' : '')} 
                placeholder="例如：臨路有車流聲，建議加裝氣密窗" 
              />
              <span className={"text-xs mt-0.5 block " + (validation.disValid ? 'text-orange-600' : 'text-red-400')}>
                {form.disadvantage.length}/10 字 {validation.disValid ? '✓' : '(請更詳細描述)'}
              </span>
            </div>
          </div>
        </section>

        {/* 區塊 3: 文案與照片 */}
        <section className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-[#003366] mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-yellow-500"/> 文案與照片
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">物件描述</label>
              <textarea 
                name="description" 
                value={form.description} 
                onChange={handleInput} 
                rows={4} 
                className={inputClass + " resize-none"}
                placeholder="詳細介紹這個物件的特色、生活機能、交通便利性..." 
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">
                物件照片 * <span className="text-slate-400">(至少 1 張)</span>
              </label>
              <div className="grid grid-cols-4 gap-3">
                {images.map((url, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden relative group border border-slate-200">
                    <img src={url} alt="" className="w-full h-full object-cover"/>
                    <button 
                      onClick={() => removeImage(i)} 
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <X size={12}/>
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 bg-[#003366] text-white text-[10px] px-1.5 py-0.5 rounded">
                        封面
                      </span>
                    )}
                  </div>
                ))}
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-[#00A8E8] hover:text-[#00A8E8] transition-colors"
                >
                  <Upload size={24}/>
                  <span className="text-xs mt-1">上傳</span>
                </button>
                <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
              </div>
            </div>
          </div>
        </section>

        {/* 預覽區 */}
        {(form.title || form.price || images.length > 0) && (
          <section className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-500 mb-3 flex items-center gap-2">
              <MapPin size={14}/> 即時預覽
            </h3>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {images.length > 0 && (
                <div className="aspect-video">
                  <img src={images[0]} alt="" className="w-full h-full object-cover"/>
                </div>
              )}
              <div className="p-4">
                <h4 className="font-bold text-slate-900">{form.title || '物件標題'}</h4>
                <p className="text-xs text-slate-500 mt-1">{form.address || '地址'}</p>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-xl font-extrabold text-[#003366]">{form.price || '0'}</span>
                  <span className="text-sm text-slate-500">萬</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {[form.type, form.size && (form.size + '坪'), form.rooms + '房' + form.halls + '廳' + form.bathrooms + '衛'].filter(Boolean).map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 bg-blue-50 text-[#003366] text-xs rounded-full">{tag}</span>
                  ))}
                </div>
                {/* 社區牆預覽提示 */}
                {form.communityName && (
                  <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      🏘️ 社區牆：
                      <span className={selectedCommunityId ? 'text-green-600 font-medium' : 'text-blue-600 font-medium'}>
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 z-50">
        <div className="max-w-2xl mx-auto">
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
            <div className="flex justify-center gap-4 mt-2 text-xs text-slate-400">
              <span className={basicValid ? 'text-green-600' : ''}>
                {basicValid ? '✓ 基本資料' : '○ 基本資料'}
              </span>
              <span className={validation.allValid ? 'text-green-600' : ''}>
                {validation.allValid ? '✓ 兩好一公道' : '○ 兩好一公道'}
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
