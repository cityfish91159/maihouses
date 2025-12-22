import React from 'react';
import { Sparkles, Upload, X, Star } from 'lucide-react';
import { useUploadForm } from './UploadContext';
import { CompressionComparison } from './CompressionComparison';

const inputClass = "w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-maihouses-dark focus:border-transparent outline-none text-sm transition-all";

export const MediaSection: React.FC = () => {
  // UP-3: 使用 managedImages 與 setCover
  const {
    form,
    setForm,
    fileInputRef,
    handleFileSelect,
    removeImage,
    setCover,
    compressionProgress,
    managedImages
  } = useUploadForm();
  const [showComparison, setShowComparison] = React.useState(false);

  // Mock data for demonstration
  const mockComparison = {
    originalUrl: form.images[0] || '',
    compressedUrl: form.images[0] || '',
    originalSize: 5000000,
    compressedSize: 1000000
  };

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
          <span className="mb-3 flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>物件照片 * <span className="text-slate-400 font-normal">(至少 1 張，點擊 ⭐ 設為封面)</span></span>
            {managedImages.length > 0 && (
              <button
                onClick={() => setShowComparison(true)}
                className="text-maihouses-dark hover:underline"
              >
                查看壓縮效果 (Demo)
              </button>
            )}
          </span>

          {/* UP-3: 使用 managedImages 渲染圖片 */}
          <div className="grid grid-cols-4 gap-4">
            {managedImages.map((img) => (
              <div
                key={img.id}
                className={`group relative aspect-square overflow-hidden rounded-xl border-2 shadow-sm transition-all ${img.isCover ? 'border-yellow-400 ring-2 ring-yellow-200' : 'border-slate-200'
                  }`}
              >
                <img
                  src={img.previewUrl}
                  alt=""
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />

                {/* 刪除按鈕 */}
                <button
                  onClick={() => removeImage(img.id)}
                  className="absolute right-1.5 top-1.5 rounded-full bg-red-500 p-1.5 text-white shadow-lg transition-transform hover:scale-110"
                  title="移除圖片"
                >
                  <X size={14} />
                </button>

                {/* UP-3.3: 設為封面按鈕 */}
                <button
                  onClick={() => setCover(img.id)}
                  className={`absolute left-1.5 top-1.5 rounded-full p-1.5 shadow-lg transition-transform hover:scale-110 ${img.isCover
                      ? 'bg-yellow-400 text-yellow-900'
                      : 'bg-white/80 text-slate-400 hover:bg-yellow-100 hover:text-yellow-600'
                    }`}
                  title={img.isCover ? '目前封面' : '設為封面'}
                >
                  <Star size={14} fill={img.isCover ? 'currentColor' : 'none'} />
                </button>

                {/* 封面標籤 */}
                {img.isCover && (
                  <span className="absolute bottom-1.5 left-1.5 rounded-md bg-yellow-400 px-2 py-1 text-[10px] font-bold text-yellow-900 backdrop-blur-sm">
                    封面
                  </span>
                )}
              </div>
            ))}

            {/* 上傳按鈕 */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 transition-all hover:border-maihouses-light hover:bg-blue-50 hover:text-maihouses-light"
            >
              <Upload size={28} />
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
      </div>

      {showComparison && managedImages.length > 0 && (
        <CompressionComparison
          originalUrl={mockComparison.originalUrl}
          compressedUrl={mockComparison.compressedUrl}
          originalSize={mockComparison.originalSize}
          compressedSize={mockComparison.compressedSize}
          onClose={() => setShowComparison(false)}
        />
      )}
    </section>
  );
};
