import React, { useState, useMemo } from 'react';
import { X, ChevronRight, Check, Copy, Share2, FileText, Link2 } from 'lucide-react';
import { PropertyReportData, ReportStyle, REPORT_STYLES, HIGHLIGHT_OPTIONS } from './types';
import { notify } from '../../lib/notify';

interface ReportGeneratorProps {
  property: PropertyReportData;
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'style' | 'highlights' | 'photos' | 'preview';

export default function ReportGenerator({ property, isOpen, onClose }: ReportGeneratorProps) {
  const [step, setStep] = useState<Step>('style');
  const [selectedStyle, setSelectedStyle] = useState<ReportStyle>('simple');
  const [selectedHighlights, setSelectedHighlights] = useState<string[]>(['commute', 'school', 'community']);
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([0, 1, 2, 3]);
  const [customMessage, setCustomMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  // 預設訊息
  const defaultMessage = useMemo(() => 
    `這是「${property.title}」的物件報告，我幫您整理了幾個重點，有空可以看看 🙂`,
    [property.title]
  );

  // 生成報告連結
  const generateReportUrl = () => {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      aid: property.agent.id,
      src: 'line_share',
      h: selectedHighlights.join(','),
      s: selectedStyle
    });
    return `${baseUrl}/maihouses/r/${property.publicId}?${params.toString()}`;
  };

  // 處理亮點選擇
  const toggleHighlight = (id: string) => {
    setSelectedHighlights(prev => {
      if (prev.includes(id)) {
        return prev.filter(h => h !== id);
      }
      if (prev.length >= 3) {
        // 最多選 3 個
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  // 處理照片選擇
  const togglePhoto = (index: number) => {
    setSelectedPhotos(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      }
      if (prev.length >= 5) {
        return [...prev.slice(1), index];
      }
      return [...prev, index];
    });
  };

  // 生成報告
  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      // TODO: 呼叫 API 建立報告記錄
      // await fetch('/api/report/create', {
      //   method: 'POST',
      //   body: JSON.stringify({ ... })
      // });
      
      await new Promise(r => setTimeout(r, 800));
      const url = generateReportUrl();
      setGeneratedUrl(url);
      setStep('preview');
    } catch (e) {
      notify.error('生成失敗，請稍後再試');
    } finally {
      setIsGenerating(false);
    }
  };

  // 複製連結
  const handleCopyLink = async () => {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      notify.success('連結已複製！');
    } catch (e) {
      notify.error('複製失敗');
    }
  };

  // LINE 分享
  const handleLineShare = () => {
    const message = customMessage || defaultMessage;
    const url = encodeURIComponent(generatedUrl || '');
    const text = encodeURIComponent(message);
    window.open(`https://line.me/R/msg/text/?${text}%0A${url}`, '_blank');
  };

  // Web Share
  const handleShare = async () => {
    if (!navigator.share || !generatedUrl) {
      handleCopyLink();
      return;
    }
    
    try {
      await navigator.share({
        title: property.title,
        text: customMessage || defaultMessage,
        url: generatedUrl
      });
    } catch (e) {
      // 使用者取消分享
    }
  };

  // 重置並關閉
  const handleClose = () => {
    setStep('style');
    setGeneratedUrl(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">生成物件報告</h2>
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-full transition"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* 進度指示 */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-2 text-sm">
            {(['style', 'highlights', 'photos', 'preview'] as Step[]).map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-1.5 ${step === s ? 'text-[#003366] font-bold' : 'text-slate-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === s ? 'bg-[#003366] text-white' : 
                    (['style', 'highlights', 'photos', 'preview'].indexOf(step) > i) ? 'bg-green-500 text-white' : 'bg-slate-200'
                  }`}>
                    {(['style', 'highlights', 'photos', 'preview'].indexOf(step) > i) ? <Check size={14} /> : i + 1}
                  </div>
                  <span className="hidden sm:inline">
                    {s === 'style' && '選樣式'}
                    {s === 'highlights' && '選亮點'}
                    {s === 'photos' && '選照片'}
                    {s === 'preview' && '完成'}
                  </span>
                </div>
                {i < 3 && <ChevronRight size={16} className="text-slate-300" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* 內容區域 */}
        <div className="flex-1 overflow-y-auto p-5">
          
          {/* Step 1: 選擇樣式 */}
          {step === 'style' && (
            <div className="space-y-4">
              <div className="text-sm text-slate-500 mb-4">
                選擇最適合這位客戶的報告樣式
              </div>
              
              {Object.values(REPORT_STYLES).map(style => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id as ReportStyle)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition ${
                    selectedStyle === style.id 
                      ? 'border-[#003366] bg-blue-50' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{style.icon}</span>
                    <div className="flex-1">
                      <div className="font-bold text-slate-800">{style.name}</div>
                      <div className="text-sm text-slate-500">{style.description}</div>
                    </div>
                    {selectedStyle === style.id && (
                      <div className="w-6 h-6 bg-[#003366] rounded-full flex items-center justify-center">
                        <Check size={14} className="text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: 選擇亮點 */}
          {step === 'highlights' && (
            <div className="space-y-4">
              <div className="text-sm text-slate-500 mb-4">
                選擇 3 個最能打動客戶的亮點（已選 {selectedHighlights.length}/3）
              </div>
              
              {HIGHLIGHT_OPTIONS.map(h => (
                <button
                  key={h.id}
                  onClick={() => toggleHighlight(h.id)}
                  className={`w-full p-3 rounded-xl border-2 text-left transition ${
                    selectedHighlights.includes(h.id)
                      ? 'border-[#003366] bg-blue-50' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{h.icon}</span>
                    <div className="flex-1">
                      <div className="font-bold text-slate-800">{h.title}</div>
                      <div className="text-xs text-slate-500">{h.subtitle}</div>
                    </div>
                    {selectedHighlights.includes(h.id) && (
                      <div className="w-6 h-6 bg-[#003366] rounded-full flex items-center justify-center">
                        <Check size={14} className="text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 3: 選擇照片 */}
          {step === 'photos' && (
            <div className="space-y-4">
              <div className="text-sm text-slate-500 mb-4">
                選擇要放入報告的照片（已選 {selectedPhotos.length}/5）
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {property.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => togglePhoto(i)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition ${
                      selectedPhotos.includes(i)
                        ? 'border-[#003366] ring-2 ring-[#003366]/20' 
                        : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    {selectedPhotos.includes(i) && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-[#003366] rounded-full flex items-center justify-center">
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: 預覽 & 分享 */}
          {step === 'preview' && generatedUrl && (
            <div className="space-y-5">
              {/* 成功提示 */}
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check size={32} className="text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">報告已生成！</h3>
                <p className="text-sm text-slate-500 mt-1">選擇分享方式發送給客戶</p>
              </div>

              {/* 連結預覽 */}
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                  <Link2 size={14} />
                  報告連結
                </div>
                <div className="bg-white rounded-lg p-2 text-xs text-slate-500 break-all border border-slate-200">
                  {generatedUrl}
                </div>
              </div>

              {/* 分享訊息 */}
              <div>
                <label className="text-sm text-slate-600 mb-2 block">分享訊息（可編輯）</label>
                <textarea
                  value={customMessage || defaultMessage}
                  onChange={e => setCustomMessage(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366]"
                  rows={3}
                />
              </div>

              {/* 分享按鈕 */}
              <div className="space-y-3">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#003366] hover:bg-[#002244] text-white font-bold rounded-xl transition"
                >
                  <Copy size={18} />
                  複製連結
                </button>
                
                <button
                  onClick={handleLineShare}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#06C755] hover:bg-[#05a847] text-white font-bold rounded-xl transition"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                  </svg>
                  LINE 分享
                </button>
                
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 w-full py-3 border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-xl transition"
                >
                  <Share2 size={18} />
                  其他分享方式
                </button>
              </div>

              {/* 預覽報告 */}
              <a
                href={generatedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-sm text-[#003366] hover:underline"
              >
                <FileText size={14} />
                預覽報告頁面
              </a>
            </div>
          )}
        </div>

        {/* Footer 按鈕 */}
        {step !== 'preview' && (
          <div className="px-5 py-4 border-t border-slate-100 flex gap-3">
            {step !== 'style' && (
              <button
                onClick={() => {
                  const steps: Step[] = ['style', 'highlights', 'photos', 'preview'];
                  const currentIndex = steps.indexOf(step);
                  if (currentIndex > 0) {
                    const prevStep = steps[currentIndex - 1];
                    if (prevStep) setStep(prevStep);
                  }
                }}
                className="flex-1 py-3 border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-xl transition"
              >
                上一步
              </button>
            )}
            
            <button
              onClick={() => {
                if (step === 'style') setStep('highlights');
                else if (step === 'highlights') setStep('photos');
                else if (step === 'photos') handleGenerate();
              }}
              disabled={isGenerating || (step === 'highlights' && selectedHighlights.length === 0)}
              className="flex-1 py-3 bg-[#003366] hover:bg-[#002244] disabled:bg-slate-300 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  生成中...
                </>
              ) : step === 'photos' ? (
                '生成報告'
              ) : (
                <>
                  下一步
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
