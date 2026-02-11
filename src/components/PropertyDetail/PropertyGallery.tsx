import { memo, useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motionA11y } from '../../lib/motionA11y';
import { useSwipeNavigation } from './hooks/useSwipeNavigation';

interface PropertyGalleryProps {
  images: string[];
  title: string;
  onPhotoClick: () => void;
  fallbackImage: string;
}

const SWIPE_THRESHOLD = 50;
const SWIPE_INTENT_THRESHOLD = 20;
const SWIPE_COOLDOWN_MS = 250;
const HINT_ANIMATION_DURATION_MS = 5000;

export const PropertyGallery = memo(function PropertyGallery({
  images,
  title,
  onPhotoClick,
  fallbackImage,
}: PropertyGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showHintAnimation, setShowHintAnimation] = useState(true);
  const [loadedImageSrc, setLoadedImageSrc] = useState<string | null>(null);

  const imageCount = images?.length ?? 0;
  const activeImageIndex = imageCount > 0 ? Math.min(currentImageIndex, imageCount - 1) : 0;
  const displayImage = images?.[activeImageIndex] || fallbackImage;
  const isImageLoading = loadedImageSrc !== displayImage;

  useEffect(() => {
    if (imageCount <= 1) return;

    const timer = setTimeout(() => {
      setShowHintAnimation(false);
    }, HINT_ANIMATION_DURATION_MS);

    return () => clearTimeout(timer);
  }, [imageCount]);

  const handleThumbnailClick = useCallback(
    (index: number) => {
      if (index === activeImageIndex) return;
      setCurrentImageIndex(index);
      onPhotoClick();
    },
    [activeImageIndex, onPhotoClick]
  );

  const handleImageLoad = useCallback(() => {
    setLoadedImageSrc(displayImage);
  }, [displayImage]);

  const handleMainImageError = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      if (event.currentTarget.src !== fallbackImage) {
        event.currentTarget.src = fallbackImage;
        return;
      }

      setLoadedImageSrc(displayImage);
    },
    [displayImage, fallbackImage]
  );

  const handleThumbnailError = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      if (event.currentTarget.src !== fallbackImage) {
        event.currentTarget.src = fallbackImage;
      }
    },
    [fallbackImage]
  );

  const navigateBySwipe = useCallback(
    (direction: 'next' | 'prev') => {
      if (imageCount <= 1) return false;

      const nextIndex =
        direction === 'next'
          ? Math.min(activeImageIndex + 1, imageCount - 1)
          : Math.max(activeImageIndex - 1, 0);

      if (nextIndex === activeImageIndex) {
        return false;
      }

      setCurrentImageIndex(nextIndex);
      onPhotoClick();
      return true;
    },
    [activeImageIndex, imageCount, onPhotoClick]
  );

  const { onTouchStart: handleTouchStart, onTouchMove: handleTouchMove, onTouchEnd: handleTouchEnd } =
    useSwipeNavigation({
      enabled: imageCount > 1,
      swipeThreshold: SWIPE_THRESHOLD,
      swipeIntentThreshold: SWIPE_INTENT_THRESHOLD,
      swipeCooldownMs: SWIPE_COOLDOWN_MS,
      onNavigate: navigateBySwipe,
    });

  return (
    <div className="mb-4">
      <div
        className="group relative aspect-video touch-pan-y overflow-hidden rounded-2xl bg-slate-200"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        data-testid="gallery-touch-surface"
      >
        {isImageLoading && (
          <div
            data-testid="gallery-main-skeleton"
            aria-hidden="true"
            className="absolute inset-0 z-[1] animate-pulse rounded-2xl bg-slate-200"
          />
        )}

        <img
          src={displayImage}
          alt={title}
          onLoad={handleImageLoad}
          onError={handleMainImageError}
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
              disabled={activeImageIndex === 0}
              className={cn(
                'absolute left-3 top-1/2 z-10 grid min-h-[44px] min-w-[44px] -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur-md',
                activeImageIndex === 0
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
              disabled={activeImageIndex === imageCount - 1}
              className={cn(
                'absolute right-3 top-1/2 z-10 grid min-h-[44px] min-w-[44px] -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur-md',
                activeImageIndex === imageCount - 1
                  ? 'cursor-not-allowed opacity-35'
                  : 'opacity-80 hover:opacity-100 active:scale-95',
                motionA11y.transitionAll
              )}
            >
              <ChevronRight
                size={18}
                className={cn(
                  activeImageIndex === 0 &&
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
              {activeImageIndex + 1} / {imageCount}
            </span>
          </div>
        )}
      </div>

      {images && images.length > 1 && (
        <div className="scrollbar-hide -mx-4 mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-2">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => handleThumbnailClick(index)}
              aria-label={`切換到第 ${index + 1} 張照片${index === activeImageIndex ? '（目前顯示中）' : ''}`}
              aria-pressed={index === activeImageIndex}
              className={cn(
                'h-16 w-24 shrink-0 snap-center overflow-hidden rounded-lg border-2',
                index === activeImageIndex
                  ? 'ring-brand-700/20 border-brand-700 ring-2'
                  : 'border-transparent opacity-70 hover:opacity-100',
                motionA11y.transitionAll
              )}
            >
              <img
                src={image}
                alt={`第 ${index + 1} 張縮圖`}
                onError={handleThumbnailError}
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
