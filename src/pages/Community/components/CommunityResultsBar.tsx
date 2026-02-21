interface CommunitySortOption {
  key: string;
  label: string;
}

interface CommunityResultsBarProps {
  total: number;
  activeFilterLabel: string;
  sortBy: string;
  sortOptions: readonly CommunitySortOption[];
  onSortChange: (sortKey: string) => void;
}

export function CommunityResultsBar({
  total,
  activeFilterLabel,
  sortBy,
  sortOptions,
  onSortChange,
}: CommunityResultsBarProps) {
  return (
    <div className="mb-5 flex flex-col gap-3 rounded-[18px] border border-brand-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-semibold text-brand-700" aria-live="polite">
        共 {total} 個社區 · 篩選：{activeFilterLabel}
      </p>

      <div className="flex items-center gap-2">
        <label htmlFor="community-sort" className="text-brand-700/70 text-xs font-semibold">
          排序
        </label>
        <select
          id="community-sort"
          value={sortBy}
          onChange={(event) => onSortChange(event.target.value)}
          aria-label="排序方式"
          className="focus-visible:ring-brand-400 min-h-[44px] rounded-full border border-brand-100 bg-white px-4 py-2 text-sm font-semibold text-brand-700 transition-colors duration-200 hover:border-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          {sortOptions.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
