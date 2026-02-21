interface CommunityQuickFilterOption {
  key: string;
  label: string;
}

interface CommunityQuickFiltersProps {
  options: readonly CommunityQuickFilterOption[];
  activeKey: string;
  onChange: (filterKey: string) => void;
}

export function CommunityQuickFilters({
  options,
  activeKey,
  onChange,
}: CommunityQuickFiltersProps) {
  return (
    <div
      className="mt-4 flex w-full max-w-xl flex-wrap items-center justify-center gap-2"
      role="group"
      aria-label="快速篩選"
    >
      {options.map((option) => {
        const isActive = option.key === activeKey;

        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            aria-pressed={isActive}
            className={`focus-visible:ring-brand-400 min-h-[44px] rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              isActive
                ? 'border-brand-700 bg-brand-700 text-white'
                : 'border-brand-100 bg-white text-brand-700 hover:border-brand-300 hover:bg-brand-50'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
