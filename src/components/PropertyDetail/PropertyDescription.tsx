import { memo, useState, useCallback } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motionA11y } from '../../lib/motionA11y';
import { cn } from '../../lib/utils';

interface PropertyDescriptionProps {
  description: string;
}

/**
 * 房源描述組件
 *
 * 功能:
 * - 預設顯示 4 行（line-clamp-4）
 * - 底部 gradient fade-out 提示有更多內容
 * - 展開/收起按鈕切換全文顯示
 *
 * @remarks
 * 使用 React.memo 優化,描述內容不變時不重新渲染
 * 符合 ux-guidelines #44（長文本可折疊）、#9（漸進揭露）
 */
export const PropertyDescription = memo(function PropertyDescription({
  description,
}: PropertyDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // 計算是否需要展開按鈕（超過 4 行約 240 字）
  const needsExpansion = description.length > 240;

  return (
    <div className="prose prose-slate max-w-none">
      <h3 className="mb-3 text-lg font-bold text-slate-900">物件特色</h3>
      <div className="relative">
        <p
          className={cn(
            'whitespace-pre-line leading-relaxed text-slate-600',
            !isExpanded && needsExpansion && 'line-clamp-4'
          )}
        >
          {description}
        </p>
        {/* Gradient fade-out（僅在未展開且需要展開時顯示） */}
        {!isExpanded && needsExpansion && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent"
            aria-hidden="true"
          />
        )}
      </div>
      {/* 展開/收起按鈕 */}
      {needsExpansion && (
        <button
          onClick={handleToggle}
          className={cn(
            'mt-2 flex min-h-[44px] items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
            motionA11y.transitionAll
          )}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? '收起描述' : '展開完整描述'}
        >
          {isExpanded ? (
            <>
              收起 <ChevronUp size={16} />
            </>
          ) : (
            <>
              展開全文 <ChevronDown size={16} />
            </>
          )}
        </button>
      )}
    </div>
  );
});
