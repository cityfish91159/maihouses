import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Loader2, Download, Check, Home, ArrowLeft, Building2, Edit3, RotateCcw
} from 'lucide-react';
import { notify } from '../lib/notify';

// 抽離的子組件 (HP-2.2)
import { BasicInfoSection } from '../components/upload/BasicInfoSection';
import { FeaturesSection } from '../components/upload/FeaturesSection';
import { TwoGoodsSection } from '../components/upload/TwoGoodsSection';
import { MediaSection } from '../components/upload/MediaSection';
import { PreviewSection } from '../components/upload/PreviewSection';
import { UploadFormProvider, useUploadForm } from '../components/upload/UploadContext';

const PropertyUploadContent: React.FC = () => {
  const navigate = useNavigate();
  const { 
    loading, 
    setLoading, 
    uploadProgress, 
    setForm, 
    validation, 
    handleSubmit,
    uploadResult,
    showConfirmation,
    // Draft 功能
    hasDraft,
    restoreDraft,
    getDraftPreview
  } = useUploadForm();

  const [user, setUser] = useState<any>(null);
  const [draftAvailable, setDraftAvailable] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
    // 檢查是否有草稿可用
    setDraftAvailable(hasDraft());
  }, [hasDraft]);

  // 還原草稿
  const handleRestoreDraft = () => {
    const draftData = restoreDraft();
    if (draftData) {
      setForm(prev => ({
        ...prev,
        ...draftData,
        images: prev.images // 保留當前圖片（不覆蓋）
      }));
      setDraftAvailable(false);
      const preview = getDraftPreview();
      notify.success('草稿已還原', preview ? `標題：${preview.title.slice(0, 20)}...` : '已載入上次編輯內容');
    }
  };

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

  if (showConfirmation && uploadResult) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
          <div className="bg-green-500 py-10 text-center text-white">
            <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Check size={40} strokeWidth={3} />
            </div>
            <h1 className="text-2xl font-black">上傳成功！</h1>
            <p className="mt-1 opacity-90">您的物件已正式發佈</p>
          </div>
          
          <div className="p-8">
            <div className="mb-8 space-y-4">
              <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Home size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">物件編號</p>
                  <p className="font-mono font-bold text-slate-700">{uploadResult.public_id}</p>
                </div>
              </div>

              {uploadResult.community_name && (
                <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">社區牆</p>
                    <p className="font-bold text-slate-700">{uploadResult.community_name}</p>
                    {uploadResult.is_new_community && (
                      <span className="mt-0.5 inline-block rounded bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        新建立
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Link 
                to={`/p/${uploadResult.public_id}`}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#003366] py-4 font-bold text-white transition-all hover:bg-[#002244] active:scale-[0.98]"
              >
                查看物件詳情
              </Link>
              {uploadResult.community_id && (
                <Link 
                  to={`/community/${uploadResult.community_id}`}
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-[#003366] py-4 font-bold text-[#003366] transition-all hover:bg-blue-50 active:scale-[0.98]"
                >
                  前往社區牆
                </Link>
              )}
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 text-sm font-bold text-slate-400 hover:text-slate-600"
              >
                繼續上傳下一個
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-black text-[#003366]">刊登物件</h1>
          </div>
          <div className="flex items-center gap-3">
            {draftAvailable && (
              <button 
                onClick={handleRestoreDraft}
                className="flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-600 transition-all hover:bg-blue-100"
              >
                <RotateCcw size={16}/> 還原草稿
              </button>
            )}
            <button 
              onClick={handleImport591}
              className="hidden items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-sm font-bold text-orange-600 transition-all hover:bg-orange-100 sm:flex"
            >
              <Download size={16}/> 591 搬家
            </button>
            {!user && (
              <Link to="/auth" className="text-sm font-bold text-blue-600 hover:underline">登入以同步</Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto mt-8 max-w-5xl px-4">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left: Form */}
          <div className="space-y-8 lg:col-span-7">
            <BasicInfoSection />
            <FeaturesSection />
            <TwoGoodsSection />
            <MediaSection />
          </div>

          {/* Right: Preview & Submit */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">
              <PreviewSection />

              <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">發佈確認</h3>
                  <span className={`text-xs font-bold ${validation.canSubmit ? 'text-green-500' : 'text-red-400'}`}>
                    {validation.canSubmit ? '✓ 資料已齊全' : '⚠ 尚有必填欄位'}
                  </span>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!validation.canSubmit || loading}
                  className={`group relative w-full overflow-hidden rounded-xl py-4 font-black text-white transition-all active:scale-[0.98] ${
                    validation.canSubmit && !loading
                      ? 'bg-gradient-to-r from-[#003366] to-[#00A8E8] shadow-lg shadow-blue-200 hover:translate-y-[-2px] hover:shadow-xl'
                      : 'cursor-not-allowed bg-slate-300'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="animate-spin" size={20} />
                      <span>{uploadProgress ? `上傳中 ${Math.round((uploadProgress.current / uploadProgress.total) * 100)}%` : '處理中...'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Edit3 size={20} />
                      <span>立即發佈物件</span>
                    </div>
                  )}
                </button>

                <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-400">
                  點擊發佈即代表您同意 <Link to="/terms" className="underline">服務條款</Link> 與 <Link to="/privacy" className="underline">隱私權政策</Link>，並保證所提供之資訊真實無誤。
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export const PropertyUploadPage: React.FC = () => {
  return (
    <UploadFormProvider>
      <PropertyUploadContent />
    </UploadFormProvider>
  );
};
