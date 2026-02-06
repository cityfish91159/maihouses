/**
 * Skeleton Screen 組件 - Loading 狀態骨架屏
 *
 * Team Foxtrot-2: U-02 Loading Skeleton
 *
 * 提供統一的 Loading 狀態視覺回饋，避免空白閃爍
 *
 * Skills Applied:
 * - [UI/UX Pro Max] Skeleton Screen 最佳實踐
 * - [NASA TypeScript Safety] 完整類型定義
 *
 * @example
 * ```tsx
 * // 使用預設 Skeleton
 * <SkeletonScreen />
 *
 * // 自訂 Skeleton
 * <SkeletonCard lines={3} />
 * <SkeletonButton />
 * <SkeletonBanner />
 * ```
 */

import React from 'react';

// ============================================================================
// Base Skeleton Component
// ============================================================================

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

/**
 * 基礎 Skeleton 組件
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width = 'w-full',
  height = 'h-4',
  rounded = 'md',
}) => {
  const roundedClass = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  }[rounded];

  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${width} ${height} ${roundedClass} ${className}`}
      role="status"
      aria-label="Loading..."
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// ============================================================================
// Skeleton Card
// ============================================================================

interface SkeletonCardProps {
  lines?: number;
  showImage?: boolean;
  className?: string;
}

/**
 * Skeleton Card - 卡片式 Loading
 *
 * @param lines - 文字行數（預設 3）
 * @param showImage - 是否顯示圖片骨架（預設 true）
 */
export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  lines = 3,
  showImage = true,
  className = '',
}) => {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${className}`}
      role="status"
      aria-label="Loading card..."
    >
      {showImage && <Skeleton width="w-full" height="h-48" rounded="lg" className="mb-4" />}
      <Skeleton width="w-3/4" height="h-6" className="mb-3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? 'w-1/2' : 'w-full'}
          height="h-4"
          className="mb-2"
        />
      ))}
    </div>
  );
};

// ============================================================================
// Skeleton Button
// ============================================================================

interface SkeletonButtonProps {
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

/**
 * Skeleton Button - 按鈕 Loading
 */
export const SkeletonButton: React.FC<SkeletonButtonProps> = ({
  size = 'md',
  fullWidth = false,
  className = '',
}) => {
  const sizeMap = {
    sm: { width: 'w-20', height: 'h-8' },
    md: { width: 'w-24', height: 'h-10' },
    lg: { width: 'w-32', height: 'h-12' },
  };

  const { width, height } = sizeMap[size];

  return (
    <Skeleton
      width={fullWidth ? 'w-full' : width}
      height={height}
      rounded="full"
      className={className}
    />
  );
};

// ============================================================================
// Skeleton Banner
// ============================================================================

interface SkeletonBannerProps {
  className?: string;
}

/**
 * Skeleton Banner - TrustServiceBanner Loading
 */
export const SkeletonBanner: React.FC<SkeletonBannerProps> = ({ className = '' }) => {
  return (
    <div
      className={`mx-auto max-w-4xl px-4 ${className}`}
      role="status"
      aria-label="Loading banner..."
    >
      <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between md:gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Skeleton width="w-12" height="h-12" rounded="lg" />
          <div className="min-w-0 flex-1">
            <Skeleton width="w-48" height="h-4" className="mb-2" />
            <Skeleton width="w-64" height="h-3" />
          </div>
        </div>
        <SkeletonButton size="lg" className="md:w-auto" />
      </div>
    </div>
  );
};

// ============================================================================
// Skeleton List
// ============================================================================

interface SkeletonListProps {
  items?: number;
  showAvatar?: boolean;
  className?: string;
}

/**
 * Skeleton List - 列表 Loading
 */
export const SkeletonList: React.FC<SkeletonListProps> = ({
  items = 3,
  showAvatar = true,
  className = '',
}) => {
  return (
    <div className={`space-y-4 ${className}`} role="status" aria-label="Loading list...">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          {showAvatar && <Skeleton width="w-12" height="h-12" rounded="full" />}
          <div className="flex-1">
            <Skeleton width="w-3/4" height="h-4" className="mb-2" />
            <Skeleton width="w-1/2" height="h-3" />
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// Skeleton Screen (Full Page)
// ============================================================================

interface SkeletonScreenProps {
  type?: 'card' | 'list' | 'banner' | 'page';
  className?: string;
}

/**
 * Skeleton Screen - 完整頁面 Loading
 */
export const SkeletonScreen: React.FC<SkeletonScreenProps> = ({
  type = 'page',
  className = '',
}) => {
  if (type === 'card') {
    return <SkeletonCard className={className} />;
  }

  if (type === 'list') {
    return <SkeletonList className={className} />;
  }

  if (type === 'banner') {
    return <SkeletonBanner className={className} />;
  }

  // Default: Full page
  return (
    <div className={`min-h-screen bg-slate-50 p-4 ${className}`}>
      <div className="mx-auto max-w-4xl">
        <Skeleton width="w-64" height="h-8" className="mb-6" />
        <SkeletonBanner className="mb-6" />
        <div className="grid gap-4 md:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Export
// ============================================================================

export default SkeletonScreen;
