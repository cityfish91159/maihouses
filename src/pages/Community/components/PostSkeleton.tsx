/**
 * PostSkeleton Component
 * 
 * 載入中的骨架屏動畫
 */

export function PostSkeleton() {
  return (
    <div className="flex gap-2.5 rounded-[14px] border border-border-light bg-white p-3 animate-pulse" aria-hidden="true">
      <div className="h-10 w-10 shrink-0 rounded-full bg-gray-200" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 rounded bg-gray-200" />
          <div className="h-3 w-12 rounded bg-gray-200" />
        </div>
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-12 w-full rounded bg-gray-200" />
        <div className="flex gap-2">
          <div className="h-3 w-10 rounded bg-gray-200" />
          <div className="h-3 w-10 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

export function WallSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="社區牆載入中"
      className="flex flex-col gap-3"
    >
      <span className="sr-only">正在載入社區牆內容，請稍候...</span>
      {/* Reviews Skeleton */}
      <div className="overflow-hidden rounded-[18px] border border-border-light bg-white/98 p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-5 w-24 rounded bg-gray-200 animate-pulse" />
          <div className="h-4 w-16 rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-24 w-full rounded-[14px] bg-gray-100 animate-pulse" />
          <div className="h-24 w-full rounded-[14px] bg-gray-100 animate-pulse" />
        </div>
      </div>
      
      {/* Posts Skeleton */}
      <div className="overflow-hidden rounded-[18px] border border-border-light bg-white/98 p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-5 w-24 rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="flex flex-col gap-2">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      </div>
    </div>
  );
}
