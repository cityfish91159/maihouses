import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { propertyService, PropertyFormInput } from '../services/propertyService';
import { 
  Loader2, Upload, X, Sparkles, ThumbsUp, ThumbsDown, 
  Download, Check, AlertCircle, Home, MapPin, DollarSign, 
  ChevronRight, ChevronLeft, Shield, Hash, ArrowLeft, Phone, MessageCircle
} from 'lucide-react';

export const PropertyUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 狀態
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [user, setUser] = useState<any>(null);

  const [form, setForm] = useState<PropertyFormInput>({
    title: '', price: '', address: '', size: '', age: '', 
    floorCurrent: '', floorTotal: '', rooms: '3', halls: '2', bathrooms: '2', 
    type: '電梯大樓', description: '',
    advantage1: '', advantage2: '', disadvantage: '',
    sourceExternalId: ''
  });

  // Auth Check
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 字數驗證邏輯
  const validateReview = () => {
    const adv1Valid = form.advantage1.length >= 5;
    const adv2Valid = form.advantage2.length >= 5;
    const disValid = form.disadvantage.length >= 10;
    return { adv1Valid, adv2Valid, disValid, allValid: adv1Valid && adv2Valid && disValid };
  };
  const validation = validateReview();

  // 591 搬家 (Mock)
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

  // 圖片選擇
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setImageFiles(prev => [...prev, ...files]);
      const urls = files.map(file => URL.createObjectURL(file));
      setImages(prev => [...prev, ...urls]);
    }
  };

  // 最終發布
  const publish = async () => {
    if (!validation.allValid) return alert('兩好一公道字數不足！');
    if (imageFiles.length === 0) return alert('請至少上傳一張照片');
    
    setLoading(true);
    try {
      const uploadedUrls = await propertyService.uploadImages(imageFiles);
      const result = await propertyService.createPropertyWithForm(form, uploadedUrls);
      
      alert(`🎉 刊登成功！物件編號：${result.public_id}`);
      navigate(`/property/${result.public_id}`);
    } catch (e: any) {
      alert('失敗：' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Fallback 圖片
  const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
  const displayImage = images.length > 0 ? images[0] : FALLBACK_IMAGE;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-800">
      {/* Header - 與詳情頁完全一致 */}
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
        
        <div className="flex items-center text-xs font-mono text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <Upload size={12} className="mr-1 text-gray-400"/>
          上傳物件
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-4 pb-24">
        {/* Step Indicator */}
        <div className="flex justify-center mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`h-2 w-16 mx-1 rounded-full transition-all ${step >= i ? 'bg-[#003366]' : 'bg-slate-200'}`} />
          ))}
        </div>

        {/* STEP 1: 基本資料 */}
        {step === 1 && (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-[#003366]">1. 基本資料</h2>
              <button onClick={handleImport591} disabled={loading} className="text-sm bg-blue-50 text-[#00A8E8] px-4 py-2 rounded-xl font-bold hover:bg-blue-100 flex items-center gap-1">
                {loading ? <Loader2 size={14} className="animate-spin"/> : <Download size={14}/>}
                591 搬家
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">物件標題</label>
                <input name="title" value={form.title} onChange={handleInput} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 font-bold focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="例如：信義區101景觀全新裝潢大三房" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">價格 (萬)</label>
                  <input name="price" type="number" value={form.price} onChange={handleInput} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">地址</label>
                  <input name="address" value={form.address} onChange={handleInput} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="台北市信義區..." />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">坪數</label>
                  <input name="size" type="number" value={form.size} onChange={handleInput} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">屋齡</label>
                  <input name="age" type="number" value={form.age} onChange={handleInput} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">類型</label>
                  <select name="type" value={form.type} onChange={handleInput} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none">
                    <option>電梯大樓</option>
                    <option>公寓</option>
                    <option>透天</option>
                    <option>套房</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">房</label>
                  <input name="rooms" type="number" value={form.rooms} onChange={handleInput} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">廳</label>
                  <input name="halls" type="number" value={form.halls} onChange={handleInput} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">衛</label>
                  <input name="bathrooms" type="number" value={form.bathrooms} onChange={handleInput} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" />
                </div>
              </div>
            </div>

            <button onClick={() => setStep(2)} className="w-full bg-[#003366] text-white py-4 rounded-xl font-bold mt-4 flex items-center justify-center gap-2 hover:bg-[#004488] transition-colors">
              下一步 <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* STEP 2: 兩好一公道 */}
        {step === 2 && (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
              <Shield className="text-orange-500" size={32} />
              <div>
                <h2 className="text-xl font-bold text-[#003366]">2. 兩好一公道 (必填)</h2>
                <p className="text-sm text-slate-500">誠實揭露，建立信任</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 font-bold text-green-700 mb-1 text-sm"><ThumbsUp size={16}/> 優點 1 (至少 5 字)</label>
                <input name="advantage1" value={form.advantage1} onChange={handleInput} className={`w-full p-4 rounded-xl border ${validation.adv1Valid ? 'border-green-200 bg-green-50/30' : 'border-slate-200 bg-slate-50'} focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none`} placeholder="例如：格局方正，採光極佳" />
                <p className="text-xs text-slate-400 mt-1">{form.advantage1.length}/5 字</p>
              </div>
              <div>
                <label className="flex items-center gap-2 font-bold text-green-700 mb-1 text-sm"><ThumbsUp size={16}/> 優點 2 (至少 5 字)</label>
                <input name="advantage2" value={form.advantage2} onChange={handleInput} className={`w-full p-4 rounded-xl border ${validation.adv2Valid ? 'border-green-200 bg-green-50/30' : 'border-slate-200 bg-slate-50'} focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none`} placeholder="例如：近捷運站，生活機能好" />
                <p className="text-xs text-slate-400 mt-1">{form.advantage2.length}/5 字</p>
              </div>
              <div>
                <label className="flex items-center gap-2 font-bold text-orange-700 mb-1 text-sm"><ThumbsDown size={16}/> 誠實公道話 (至少 10 字)</label>
                <input name="disadvantage" value={form.disadvantage} onChange={handleInput} className={`w-full p-4 rounded-xl border ${validation.disValid ? 'border-orange-200 bg-orange-50/30' : 'border-slate-200 bg-slate-50'} focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none`} placeholder="例如：臨路有車流聲，建議加裝氣密窗" />
                <p className={`text-xs mt-1 ${validation.disValid ? 'text-slate-400' : 'text-red-500'}`}>{form.disadvantage.length}/10 字 {!validation.disValid && '* 請更詳細描述缺點'}</p>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button onClick={() => setStep(1)} className="px-6 py-3 font-bold text-slate-400 hover:text-slate-600">
                <ChevronLeft size={20} className="inline"/> 上一步
              </button>
              <button 
                onClick={() => validation.allValid ? setStep(3) : alert('請完成字數要求')} 
                className={`flex-1 py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-colors ${validation.allValid ? 'bg-[#003366] hover:bg-[#004488]' : 'bg-slate-300 cursor-not-allowed'}`}
              >
                下一步 <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: 文案與照片 */}
        {step === 3 && (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <h2 className="text-2xl font-bold text-[#003366]">3. 文案與照片</h2>
            
            {/* 文案區 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Sparkles className="text-yellow-500" size={16}/> 物件描述
              </label>
              <textarea 
                name="description" 
                value={form.description} 
                onChange={handleInput} 
                rows={6} 
                className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none resize-none" 
                placeholder="詳細介紹這個物件的特色..." 
              />
            </div>

            {/* 照片上傳 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">物件照片</label>
              <div className="grid grid-cols-4 gap-4">
                {images.map((url, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden relative group border border-slate-200">
                    <img src={url} className="w-full h-full object-cover"/>
                    <button onClick={() => {
                      setImages(prev => prev.filter((_, idx) => idx !== i));
                      setImageFiles(prev => prev.filter((_, idx) => idx !== i));
                    }} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition">
                      <X size={12}/>
                    </button>
                  </div>
                ))}
                <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-[#00A8E8] hover:text-[#00A8E8] transition-colors">
                  <Upload size={24}/>
                  <span className="text-xs mt-1">上傳</span>
                </button>
                <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button onClick={() => setStep(2)} className="px-6 py-3 font-bold text-slate-400 hover:text-slate-600">
                <ChevronLeft size={20} className="inline"/> 上一步
              </button>
              <button onClick={() => setStep(4)} className="flex-1 bg-[#003366] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#004488] transition-colors">
                預覽 <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: 預覽 - 與詳情頁完全一致的樣式 */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="bg-[#003366] text-white p-3 text-center text-sm font-bold rounded-t-2xl">
              詳情頁預覽 (買家視角)
            </div>
            
            <div className="bg-white rounded-b-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Image Gallery - 與詳情頁相同 */}
              <div className="aspect-video bg-slate-200 overflow-hidden relative group">
                <img 
                  src={displayImage} 
                  alt={form.title || '物件照片'}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1">
                  <Home size={12} />
                  <span>共 {images.length} 張照片</span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* 標題與價格 */}
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                    {form.title || '物件標題'}
                  </h1>
                  <div className="flex items-center gap-2 text-slate-500 mt-2 text-sm">
                    <MapPin size={16} />
                    {form.address || '地址'}
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-[#003366]">{form.price || '0'}</span>
                    <span className="text-lg text-slate-500 font-medium">萬</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {[form.type, `${form.rooms}房${form.halls}廳${form.bathrooms}衛`, form.size ? `${form.size}坪` : null].filter(Boolean).map(tag => (
                    <span key={tag} className="px-3 py-1 bg-blue-50 text-[#003366] text-xs font-medium rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="h-px bg-slate-100" />

                {/* 兩好一公道卡片 */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <h3 className="font-bold text-[#003366] mb-3 flex items-center gap-2">
                    <AlertCircle size={18}/> 兩好一公道
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <span className="bg-green-100 text-green-700 p-1 rounded mt-0.5"><ThumbsUp size={14}/></span>
                      <span>{form.advantage1 || '優點 1'}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="bg-green-100 text-green-700 p-1 rounded mt-0.5"><ThumbsUp size={14}/></span>
                      <span>{form.advantage2 || '優點 2'}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="bg-orange-100 text-orange-700 p-1 rounded mt-0.5"><ThumbsDown size={14}/></span>
                      <span className="text-slate-700">{form.disadvantage || '誠實公道話'}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="prose prose-slate max-w-none">
                  <h3 className="text-lg font-bold text-slate-900 mb-3">物件特色</h3>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                    {form.description || '物件描述...'}
                  </p>
                </div>
              </div>
            </div>

            {/* 發布按鈕 */}
            <button 
              onClick={publish} 
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#003366] to-[#00A8E8] text-white py-5 rounded-xl font-bold text-xl shadow-lg shadow-blue-900/20 hover:scale-[1.01] transition-transform flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" size={24}/> : <Check size={24}/>}
              確認刊登物件
            </button>
            <button onClick={() => setStep(3)} className="w-full text-slate-400 font-bold py-2 hover:text-slate-600">
              <ChevronLeft size={16} className="inline"/> 返回修改
            </button>
          </div>
        )}
      </main>

      {/* Mobile Bottom Bar - 與詳情頁一致 */}
      {step === 4 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-3 lg:hidden flex gap-3 z-50 pb-safe">
          <button onClick={publish} disabled={loading} className="flex-1 bg-[#003366] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
            {loading ? <Loader2 className="animate-spin" size={20}/> : <Check size={20}/>}
            確認刊登
          </button>
          <button onClick={() => setStep(3)} className="w-12 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center border border-slate-200">
            <ChevronLeft size={20} />
          </button>
        </div>
      )}
    </div>
  );
};
