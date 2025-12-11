
import { useState } from 'react';
import { notify } from '../../lib/notify';
import { STRINGS } from '../../constants/strings';

interface InlineComposerProps {
    onSubmit: (content: string) => Promise<void>;
    disabled?: boolean;
    userInitial: string;
}

export function InlineComposer({
    onSubmit,
    disabled,
    userInitial,
}: InlineComposerProps) {
    const [content, setContent] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!content.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await onSubmit(content.trim());
            setContent('');
            setIsExpanded(false);
            notify.success(STRINGS.COMPOSER.SUCCESS);
        } catch (err) {
            console.error('Failed to create post', err);
            notify.error(STRINGS.COMPOSER.ERROR_TITLE);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className={`rounded-2xl border bg-white p-3 shadow-sm transition-all ${isExpanded ? 'border-brand-200 shadow-md' : 'border-brand-100'
                }`}
        >
            <div className="flex items-start gap-2.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700 ring-1 ring-brand-100">
                    {userInitial}
                </div>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onFocus={() => setIsExpanded(true)}
                    onBlur={() => {
                        if (!content.trim()) setIsExpanded(false);
                    }}
                    placeholder={STRINGS.COMPOSER.PLACEHOLDER_FEED}
                    disabled={disabled}
                    className="focus:ring-brand-200 min-h-[40px] flex-1 resize-none rounded-xl border-0 bg-brand-50 px-3 py-2 text-sm leading-relaxed text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2"
                    rows={isExpanded ? 3 : 1}
                />
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={disabled || isSubmitting || !content.trim()}
                    className="shrink-0 rounded-full bg-brand-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isSubmitting ? STRINGS.COMPOSER.SUBMITTING : STRINGS.COMPOSER.SUBMIT}
                </button>
            </div>
        </div>
    );
}
