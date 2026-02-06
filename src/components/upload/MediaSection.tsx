import React, { useCallback } from 'react';
import { Sparkles, Upload, X, Star } from 'lucide-react';
import { useUploadForm } from './UploadContext';
import { CompressionComparison } from './CompressionComparison';

// F3: 修正 focus ring 色系
const inputClass =
  'w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-brand focus:border-transparent outline-none text-sm transition-all';

// M4: 定義常數避免魔術數字
const MOCK_ORIGINAL_SIZE = 5_000_000; // 5MB
const MOCK_COMPRESSED_SIZE = 1_000_000; // 1MB

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
    managedImages,
  } = useUploadForm();
  // M6: useState 類型自動推斷
  const [showComparison, setShowComparison] = React.useState(false);

  // M3: Mock data 僅在開發環境使用
  // M1: 安全取得第一張圖片 URL（處理 noUncheckedIndexedAccess）
  const firstImageUrl = form.images[0] ?? '';
  const mockComparison =
    process.env.NODE_ENV !== 'production'
      ? {
          originalUrl: firstImageUrl,
          compressedUrl: firstImageUrl,
          // M4: 使用定義的常數
          originalSize: MOCK_ORIGINAL_SIZE,
          compressedSize: MOCK_COMPRESSED_SIZE,
        }
      : null;

  // M2, M5: 使用 useCallback 並改善命名
  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    },
    [setForm]
  );

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-maihouses-dark">
        <Sparkles size={20} className="text-brand-light" aria-hidden="true" /> 文案與照片
      </h2>

      <div className="space-y-5">
        <div>
          <label
            htmlFor="upload-description"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
          >
            物件描述
          </label>
          <textarea
            id="upload-description"
            name="description"
            value={form.description}
            onChange={handleDescriptionChange}
            rows={4}
            className={`${inputClass} resize-none`}
            placeholder="詳細介紹這個物件的特色、生活機能、交通便利性..."
          />
        </div>

        <div>
          <span className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>
              物件照片 *{' '}
              <span className="font-normal text-slate-500">(至少 1 張，點擊設為封面)</span>
            </span>
            {managedImages.length > 0 && (
              <button
                type="button"
                onClick={() => setShowComparison(true)}
                className="cursor-pointer text-maihouses-dark transition-colors duration-200 hover:text-brand-light hover:underline focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                aria-label="開啟圖片壓縮效果比較視窗"
              >
                查看壓縮效果 (Demo)
              </button>
            )}
          </span>

          {/* UP-3: 使用 managedImages 渲染圖片 */}
          <div className="grid grid-cols-4 gap-4">
            {managedImages.map((img, index) => (
              <div
                key={img.id}
                className={`group relative aspect-square overflow-hidden rounded-xl border-2 shadow-sm transition-all ${
                  img.isCover ? 'ring-brand/20 border-brand ring-2' : 'border-slate-200'
                }`}
              >
                <img
                  src={img.previewUrl}
                  alt={`物件照片 ${index + 1}${img.isCover ? '（封面）' : ''}`}
                  className="size-full object-cover transition-opacity duration-200 group-hover:opacity-90"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />

                {/* F1: 刪除按鈕加入 focus 樣式 */}
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="absolute right-1.5 top-1.5 cursor-pointer rounded-full bg-red-500 p-1.5 text-white shadow-lg transition-colors duration-200 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                  title="移除圖片"
                  aria-label="移除此圖片"
                >
                  <X size={14} aria-hidden="true" />
                </button>

                {/* F2: 封面按鈕加入 focus 樣式 */}
                <button
                  type="button"
                  onClick={() => setCover(img.id)}
                  className={`absolute left-1.5 top-1.5 cursor-pointer rounded-full p-1.5 shadow-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 ${
                    img.isCover
                      ? 'hover:bg-brand/90 bg-brand text-white'
                      : 'bg-white/80 text-slate-600 hover:bg-brand-50 hover:text-brand'
                  }`}
                  title={img.isCover ? '目前封面' : '設為封面'}
                  aria-label={img.isCover ? '目前為封面' : '設為封面'}
                >
                  <Star size={14} fill={img.isCover ? 'currentColor' : 'none'} aria-hidden="true" />
                </button>

                {/* 封面標籤 */}
                {img.isCover && (
                  <span className="absolute bottom-1.5 left-1.5 rounded-md bg-brand px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                    封面
                  </span>
                )}
              </div>
            ))}

            {/* F4: 上傳按鈕統一色系 */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-500 transition-colors duration-200 hover:border-brand-light hover:bg-blue-50 hover:text-maihouses-light"
              aria-label="上傳物件照片"
              aria-controls="photo-upload-input"
            >
              <Upload size={28} aria-hidden="true" />
              <span className="mt-2 text-xs font-bold">上傳照片</span>
            </button>
            <input
              type="file"
              id="photo-upload-input"
              multiple
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*"
              aria-label="選擇物件照片檔案"
            />
          </div>

          {/* UP-2.A: 壓縮進度 UI */}
          {compressionProgress !== null && (
            <div
              className="mt-3 flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3"
              role="status"
              aria-live="polite"
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Sparkles size={20} className="animate-pulse" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <div className="mb-1 flex justify-between text-xs font-bold text-blue-700">
                  <span>正在優化圖片...</span>
                  <span>{compressionProgress}%</span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={compressionProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="圖片壓縮進度"
                  className="h-1.5 w-full overflow-hidden rounded-full bg-blue-200"
                >
                  <div
                    className="h-full bg-blue-500 transition-all duration-200 ease-out"
                    style={{ width: `${compressionProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showComparison && managedImages.length > 0 && mockComparison && (
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
