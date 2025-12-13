export function FeedSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-brand-100 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="size-10 rounded-full bg-gray-200 animate-pulse" />
                        <div className="space-y-2">
                            <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
                            <div className="h-3 w-20 rounded bg-gray-200 animate-pulse" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-4 w-3/4 rounded bg-gray-200 animate-pulse" />
                        <div className="h-4 w-1/2 rounded bg-gray-200 animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    );
}
