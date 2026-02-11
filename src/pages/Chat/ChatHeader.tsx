
interface ChatHeaderProps {
  isLoading?: boolean;
  counterpartName?: string | undefined;
  counterpartSubtitle?: string | undefined;
  statusLabel?: string | undefined;
  propertyTitle?: string | undefined;
  propertySubtitle?: string | undefined;
  propertyImage?: string | undefined;
}

export function ChatHeader({
  isLoading,
  counterpartName,
  counterpartSubtitle,
  statusLabel,
  propertyTitle,
  propertySubtitle,
  propertyImage,
}: ChatHeaderProps) {
  if (isLoading) {
    return (
      <section className="grid gap-3 md:grid-cols-2">
        <div className="animate-pulse rounded-2xl border border-brand-100 bg-white p-4">
          <div className="mb-3 h-4 w-24 rounded bg-slate-100" />
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-full bg-slate-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-slate-100" />
              <div className="h-3 w-24 rounded bg-slate-100" />
            </div>
          </div>
        </div>
        <div className="animate-pulse rounded-2xl border border-brand-100 bg-white p-4">
          <div className="mb-3 h-4 w-24 rounded bg-slate-100" />
          <div className="flex items-center gap-3">
            <div className="h-16 w-20 rounded-xl bg-slate-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 rounded bg-slate-100" />
              <div className="h-3 w-28 rounded bg-slate-100" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-3 md:grid-cols-2">
      <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-bold text-brand-500">對方資訊</p>
          {statusLabel && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              {statusLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-lg font-black text-brand-700">
            {counterpartName?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-base font-bold text-slate-900">{counterpartName || '未知使用者'}</p>
            <p className="text-xs text-slate-500">{counterpartSubtitle || '未提供資訊'}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
        <p className="mb-3 text-xs font-bold text-brand-500">物件資訊</p>
        <div className="flex items-center gap-3">
          <div className="h-16 w-20 overflow-hidden rounded-xl border border-brand-100 bg-slate-50">
            {propertyImage ? (
              <img src={propertyImage} alt="" aria-hidden="true" className="size-full object-cover" />
            ) : null}
          </div>
          <div>
            <p className="text-base font-bold text-slate-900">{propertyTitle || '未提供物件'}</p>
            <p className="text-xs text-slate-500">{propertySubtitle || '尚無地址資訊'}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
