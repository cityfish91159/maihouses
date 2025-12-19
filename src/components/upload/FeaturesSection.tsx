import React from 'react';
import { Sparkles, AlertTriangle } from 'lucide-react';
import { HighlightPicker } from '../ui/HighlightPicker';
import { useUploadForm } from './UploadContext';

export const FeaturesSection: React.FC = () => {
  const { form, setForm, validation } = useUploadForm();

  const onChange = (tags: string[]) => {
    setForm(prev => ({ ...prev, highlights: tags }));
  };

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-[#003366]">
        <Sparkles size={20} className="text-blue-500"/> 物件特色
      </h2>
      <div className="rounded-xl bg-blue-50/30 p-5 border border-blue-100/50">
        <label htmlFor="highlight-picker" className="mb-4 flex items-center gap-2 text-sm font-bold text-blue-800">
          重點膠囊 (至少 3 個)
        </label>
        <input id="highlight-picker" className="sr-only" aria-hidden="true" tabIndex={-1} readOnly />
        <HighlightPicker 
          value={form.highlights || []} 
          onChange={onChange} 
        />
        {!validation.highlights.valid && (
          <p className="mt-3 text-xs text-red-500 flex items-center gap-1.5 font-medium">
            <AlertTriangle size={14} /> {validation.highlights.message}
          </p>
        )}
        {validation.highlights.warnings.length > 0 && (
          <div className="mt-3 space-y-1">
            {validation.highlights.warnings.map((w: string, i: number) => (
              <p key={i} className="text-xs text-amber-600 flex items-center gap-1.5">
                <AlertTriangle size={14} /> {w}
              </p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
