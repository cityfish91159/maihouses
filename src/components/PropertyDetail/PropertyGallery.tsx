import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motionA11y } from '../../lib/motionA11y';

interface PropertyGalleryProps {
  images: string[];
  title: string;
  onPhotoClick: () => void;
  fallbackImage: string;
}

const SWIPE_THRESHOLD = 80;
const SWIPE_INTENT_THRESHOLD = 20; // 提高到 20px 避免誤判垂直滾動為水平滑動
const SWIPE_COOLDOWN_MS = 250;
const HINT_ANIMATION_DURATION_MS = 5000; // 提示動畫播放 5 秒後停止

/**
 * 房源圖片輪播組件
 *
 * 功能:
 * - 主圖顯示
 * - 縮圖選擇器
 * - 圖片錯誤處理
 * - 手機左右滑動切圖
 */
export const PropertyGallery = memo(function PropertyGallery({
  images,
  title,
  onPhotoClick,
  fallbackImage,
}: PropertyGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showHintAnimation, setShowHintAnimation] = useState(true);
  const touchStartXRef = useRef<number | null>(null);
  const touchCurrentXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const lastSwipeAtRef = useRef(0);
  const lastSwipeDirectionRef = useRef<'next' | 'prev' | null>(null);
  const imageCount = images?.length ?? 0;

  // 提示動畫播放 5 秒後自動停止
  useEffect(() => {
    if (imageCount <= 1) return;

    const timer = setTimeout(() => {
      setShowHintAnimation(false);
    }, HINT_ANIMATION_DURATION_MS);

    return () => clearTimeout(timer);
  }, [imageCount]);

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

  const navigateBySwipe = useCallback(
    (direction: 'next' | 'prev') => {
      if (imageCount <= 1) return false;

      let hasNavigated = false;
      setCurrentImageIndex((prevIndex) => {
        const nextIndex =
          direction === 'next'
            ? Math.min(prevIndex + 1, imageCount - 1)
            : Math.max(prevIndex - 1, 0);

        if (nextIndex !== prevIndex) {
          hasNavigated = true;
          onPhotoClick();
        }

        return nextIndex;
      });

      return hasNavigated;
    },
    [imageCount, onPhotoClick]
  );

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const startTouch = e.touches[0];
    if (!startTouch) return;
    touchStartXRef.current = startTouch.clientX;
    touchCurrentXRef.current = startTouch.clientX;
    touchStartYRef.current = startTouch.clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const currentTouch = e.touches[0];
    if (!currentTouch) return;

    const startX = touchStartXRef.current;
    const startY = touchStartYRef.current;
    const currentX = currentTouch.clientX;
    const currentY = currentTouch.clientY;

    if (typeof startX === 'number' && typeof startY === 'number') {
      const deltaX = Math.abs(currentX - startX);
      const deltaY = Math.abs(currentY - startY);

      if (deltaX > SWIPE_INTENT_THRESHOLD && deltaX > deltaY) {
        e.preventDefault();
      }
    }

    touchCurrentXRef.current = currentX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchStartXRef.current === null || touchCurrentXRef.current === null) {
      touchStartXRef.current = null;
      touchCurrentXRef.current = null;
      touchStartYRef.current = null;
      return;
    }

    const deltaX = touchCurrentXRef.current - touchStartXRef.current;
    const now = Date.now();
    touchStartXRef.current = null;
    touchCurrentXRef.current = null;
    touchStartYRef.current = null;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;

    const swipeDirection = deltaX < 0 ? 'next' : 'prev';
    const isRapidSameDirectionSwipe =
      now - lastSwipeAtRef.current < SWIPE_COOLDOWN_MS &&
      lastSwipeDirectionRef.current === swipeDirection;

    if (isRapidSameDirectionSwipe) return;

    const hasNavigated = navigateBySwipe(swipeDirection);
    if (hasNavigated) {
      lastSwipeAtRef.current = now;
      lastSwipeDirectionRef.current = swipeDirection;
    }
  }, [navigateBySwipe]);

  const displayImage = images?.[currentImageIndex] || fallbackImage;

  return (
    <div className="mb-4">
      <div
        className="group relative aspect-video touch-pan-x overflow-hidden rounded-2xl bg-slate-200"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
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
        {imageCount > 1 && (
          <>
            <button
              type="button"
              aria-label="上一張照片"
              onClick={() => navigateBySwipe('prev')}
              disabled={currentImageIndex === 0}
              className={cn(
                'absolute left-3 top-1/2 z-10 grid min-h-[44px] min-w-[44px] -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur-md',
                currentImageIndex === 0
                  ? 'cursor-not-allowed opacity-35'
                  : 'opacity-80 hover:opacity-100 active:scale-95',
                motionA11y.transitionAll
              )}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              aria-label="下一張照片"
              onClick={() => navigateBySwipe('next')}
              disabled={currentImageIndex === imageCount - 1}
              className={cn(
                'absolute right-3 top-1/2 z-10 grid min-h-[44px] min-w-[44px] -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur-md',
                currentImageIndex === imageCount - 1
                  ? 'cursor-not-allowed opacity-35'
                  : 'opacity-80 hover:opacity-100 active:scale-95',
                motionA11y.transitionAll
              )}
            >
              <ChevronRight
                size={18}
                className={cn(
                  currentImageIndex === 0 &&
                    showHintAnimation &&
                    'animate-hint-swipe motion-reduce:animate-none'
                )}
              />
            </button>
          </>
        )}
        {imageCount > 0 && (
          <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-full bg-black/50 px-3 py-1.5 text-sm text-white backdrop-blur-md">
            <Home size={14} />
            <span>
              {currentImageIndex + 1} / {imageCount}
            </span>
          </div>
        )}
      </div>

      {images && images.length > 1 && (
        <div className="scrollbar-hide -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-2">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleThumbnailClick(i)}
              aria-label={`切換到第 ${i + 1} 張照片${i === currentImageIndex ? '（目前選中）' : ''}`}
              aria-pressed={i === currentImageIndex}
              className={cn(
                'h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2',
                i === currentImageIndex
                  ? 'ring-brand-700/20 border-brand-700 ring-2'
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
