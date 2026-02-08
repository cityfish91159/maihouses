import { memo, useState, useCallback } from 'react';
import { Home } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motionA11y } from '../../lib/motionA11y';

interface PropertyGalleryProps {
  images: string[];
  title: string;
  onPhotoClick: () => void;
  fallbackImage: string;
}

/**
 * 房源圖片輪播組件
 *
 * 功能:
 * - 主圖顯示
 * - 縮圖選擇器
 * - 圖片錯誤處理
 * - 圖片計數顯示
 *
 * @remarks
 * 使用 React.memo 優化,避免父組件渲染時重新渲染
 * useCallback 穩定事件處理函數,避免子組件不必要的重新渲染
 */
export const PropertyGallery = memo(function PropertyGallery({
  images,
  title,
  onPhotoClick,
  fallbackImage,
}: PropertyGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleThumbnailClick = useCallback(
    (index: number) => {
      setCurrentImageIndex(index);
      onPhotoClick();
    },
    [onPhotoClick]
  );

  const handleImageError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      if (e.currentTarget.src !== fallbackImage) {
        e.currentTarget.src = fallbackImage;
      }
    },
    [fallbackImage]
  );

  const displayImage = images?.[currentImageIndex] || fallbackImage;

  return (
    <div className="mb-4">
      {/* 主圖 */}
      <div className="group relative aspect-video overflow-hidden rounded-2xl bg-slate-200">
        <img
          src={displayImage}
          alt={title}
          onError={handleImageError}
          className={cn(
            'size-full object-cover duration-700 group-hover:scale-105',
            motionA11y.transitionTransform
          )}
          loading="eager"
          decoding="async"
        />
        <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-full bg-black/50 px-3 py-1.5 text-xs text-white backdrop-blur-md">
          <Home size={12} />
          <span>
            {currentImageIndex + 1} / {images?.length || 1}
          </span>
        </div>
      </div>

      {/* 縮圖橫向滾動 */}
      {images && images.length > 1 && (
        <div className="scrollbar-hide -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => handleThumbnailClick(i)}
              className={cn(
                'h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2',
                i === currentImageIndex
                  ? 'border-brand-700 ring-2 ring-brand-700/20'
                  : 'border-transparent opacity-70 hover:opacity-100',
                motionA11y.transitionAll
              )}
            >
              <img
                src={img}
                alt={`照片 ${i + 1}`}
                onError={handleImageError}
                className="size-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
