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

  const touchStartXRef = useRef<number | null>(null);
  const touchCurrentXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const lastSwipeAtRef = useRef(0);
  const lastSwipeDirectionRef = useRef<'next' | 'prev' | null>(null);

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
      setCurrentImageIndex(index);
      onPhotoClick();
    },
    [onPhotoClick]
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

      let hasNavigated = false;

      setCurrentImageIndex((prevIndex) => {
        const normalizedPrevIndex = Math.min(prevIndex, imageCount - 1);
        const nextIndex =
          direction === 'next'
            ? Math.min(normalizedPrevIndex + 1, imageCount - 1)
            : Math.max(normalizedPrevIndex - 1, 0);

        if (nextIndex !== normalizedPrevIndex) {
          hasNavigated = true;
          onPhotoClick();
        }

        return nextIndex;
      });

      return hasNavigated;
    },
    [imageCount, onPhotoClick]
  );

  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    const startTouch = event.touches[0];
    if (!startTouch) return;

    touchStartXRef.current = startTouch.clientX;
    touchCurrentXRef.current = startTouch.clientX;
    touchStartYRef.current = startTouch.clientY;
  }, []);

  const handleTouchMove = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    const currentTouch = event.touches[0];
    if (!currentTouch) return;

    const startX = touchStartXRef.current;
    const startY = touchStartYRef.current;
    const currentX = currentTouch.clientX;
    const currentY = currentTouch.clientY;

    if (typeof startX === 'number' && typeof startY === 'number') {
      const deltaX = Math.abs(currentX - startX);
      const deltaY = Math.abs(currentY - startY);

      if (deltaX > SWIPE_INTENT_THRESHOLD && deltaX > deltaY) {
        event.preventDefault();
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

    if (Math.abs(deltaX) <= SWIPE_THRESHOLD) return;

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
              aria-label={`切換到第 ${index + 1} 張照片${index === activeImageIndex ? '（目前選中）' : ''}`}
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
                alt={`照片 ${index + 1}`}
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
