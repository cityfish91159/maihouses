import type { ReactNode } from 'react';
import { GlobalHeader } from '../../components/layout/GlobalHeader';
import type { GlobalHeaderMode } from '../../constants/header';

interface ChatErrorLayoutProps {
  mode: GlobalHeaderMode;
  children: ReactNode;
}

export function ChatErrorLayout({ mode, children }: ChatErrorLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <GlobalHeader mode={mode} />
      <div className="mx-auto max-w-[960px] px-4 py-10 text-sm text-slate-600">{children}</div>
    </div>
  );
}
