import React from 'react';
import { Sparkles, Upload, X } from 'lucide-react';
import { useUploadForm } from './UploadContext';

const inputClass = "w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-maihouses-dark focus:border-transparent outline-none text-sm transition-all";

export const MediaSection: React.FC = () => {
  const { form, setForm, fileInputRef, handleFileSelect, removeImage, compressionProgress } = useUploadForm();

  const onInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-maihouses-dark">
        <Sparkles size={20} className="text-yellow-500" /> 文案與照片
      </h2>

      <div className="space-y-5">
        <div>
          <label htmlFor="upload-description" className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wider">物件描述</label>
          <textarea
            id="upload-description"
            name="description"
            value={form.description}
            onChange={onInput}
            rows={4}
            className={`${inputClass} resize-none`}
            placeholder="詳細介紹這個物件的特色、生活機能、交通便利性..."
          />
        </div>

        <div>
          <span className="mb-3 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
            物件照片 * <span className="text-slate-400 font-normal">(至少 1 張)</span>
          </span>
          <div className="grid grid-cols-4 gap-4">
            {form.images.map((url: string, i: number) => (
              <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                <img src={url} alt="" className="size-full object-cover transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute right-1.5 top-1.5 rounded-full bg-red-500 p-1.5 text-white shadow-lg transition-transform hover:scale-110"
                >
                  <X size={14} />
                </button>
                {i === 0 && (
                  <span className="absolute bottom-1.5 left-1.5 rounded-md bg-maihouses-dark/90 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                    封面
                  </span>
                )}
              </div>
            ))}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 transition-all hover:border-maihouses-light hover:bg-blue-50 hover:text-maihouses-light"
            >
              <Upload size={28} />
              <span className="mt-2 text-xs font-bold">上傳照片</span>
            </button>
            <span className="mt-2 text-xs font-bold">上傳照片</span>
          </button>
          <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
        </div>

        {/* UP-2.A: 壓縮進度 UI */}
        {compressionProgress !== null && (
          <div className="mt-3 flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="mb-1 flex justify-between text-xs font-bold text-blue-700">
                <span>正在優化圖片...</span>
                <span>{compressionProgress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-200">
                <div
                  className="h-full bg-blue-500 transition-all duration-300 ease-out"
                  style={{ width: `${compressionProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
