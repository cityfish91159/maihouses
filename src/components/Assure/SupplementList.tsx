import { Briefcase, User } from 'lucide-react';

interface SupplementItem {
  role: string;
  content: string;
  timestamp: number;
}

interface SupplementListProps {
  supplements: SupplementItem[];
}

export function SupplementList({ supplements }: SupplementListProps) {
  if (supplements.length === 0) return null;

  return (
    <div className="mt-4 border-t border-dashed border-border pt-4">
      {supplements.map((s) => (
        <div
          key={`${s.role}-${s.timestamp}`}
          className="mb-1 flex items-start gap-2 rounded-lg border border-border bg-bg-base p-2 text-xs"
        >
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              s.role === 'agent' ? 'bg-brand-50 text-brand-700' : 'bg-success/10 text-success'
            }`}
          >
            {s.role === 'agent' ? <Briefcase className="size-3" /> : <User className="size-3" />}
            {s.role === 'agent' ? '房仲' : '買方'}
          </span>
          <span className="flex-1">{s.content}</span>
        </div>
      ))}
    </div>
  );
}
