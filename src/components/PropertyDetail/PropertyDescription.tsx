import { memo } from 'react';

interface PropertyDescriptionProps {
  description: string;
}

/**
 * 房源描述組件
 *
 * @remarks
 * 使用 React.memo 優化,描述內容不變時不重新渲染
 */
export const PropertyDescription = memo(function PropertyDescription({
  description,
}: PropertyDescriptionProps) {
  return (
    <div className="prose prose-slate max-w-none">
      <h3 className="mb-3 text-lg font-bold text-slate-900">物件特色</h3>
      <p className="whitespace-pre-line leading-relaxed text-slate-600">{description}</p>
    </div>
  );
});
