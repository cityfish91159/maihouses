import { Check } from 'lucide-react';

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

interface ChecklistPanelProps {
  checklist: ChecklistItem[];
  onToggle: (id: string, checked: boolean) => void;
  onConfirm: () => void;
}

export function ChecklistPanel({ checklist, onToggle, onConfirm }: ChecklistPanelProps) {
  return (
    <div className="mt-2 space-y-2">
      {checklist.map((item) => (
        <div
          key={item.id}
          onClick={() => onToggle(item.id, !item.checked)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggle(item.id, !item.checked);
            }
          }}
          role="checkbox"
          aria-checked={item.checked}
          aria-label={item.label}
          tabIndex={0}
          className={`flex cursor-pointer items-center rounded-xl border p-4 transition ${
            item.checked ? 'border-brand-200 bg-brand-50/50' : 'border-border hover:bg-bg-base'
          }`}
        >
          <div
            className={`flex size-5 items-center justify-center rounded border bg-bg-card ${
              item.checked ? 'border-brand-600 bg-brand-600' : 'border-border'
            }`}
          >
            {item.checked && <Check size={12} className="text-white" />}
          </div>
          <span
            className={`ml-3 text-sm leading-relaxed ${
              item.checked ? 'font-bold text-brand-700' : 'text-ink-900'
            }`}
          >
            {item.label}
          </span>
        </div>
      ))}
      <button
        onClick={onConfirm}
        className="mt-2 min-h-[48px] w-full rounded-xl bg-brand-700 py-3 font-bold text-white transition hover:bg-brand-600"
      >
        完成交屋
      </button>
    </div>
  );
}
