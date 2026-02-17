import { memo } from 'react';
import type { PropertyData } from '../../services/propertyService';
import { DEFAULT_PROPERTY } from '../../services/propertyService';
import { formatArea, formatLayout, formatFloor } from '../../utils/keyCapsules';

interface PropertySpecsProps {
  property: PropertyData;
}

/**
 * 房源基本規格卡片組件
 *
 * 顯示:
 * - 建案坪數
 * - 格局 (房/廳)
 * - 樓層
 * - 編號
 *
 * @remarks
 * 使用 React.memo 優化,規格資料變化才重新渲染
 * var(--mh-color-2200bb)-D9: 套用 Glassmorphism 設計語言（glass-card）
 */
export const PropertySpecs = memo(function PropertySpecs({ property }: PropertySpecsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 rounded-2xl p-4 glass-card sm:grid-cols-4">
      <div className="flex flex-col">
        <span className="text-xs text-slate-400">建案坪數</span>
        <span className="text-sm font-bold text-slate-800">
          {formatArea(property.size ?? DEFAULT_PROPERTY.size) || '--'}
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-slate-400">格局</span>
        <span className="text-sm font-bold text-slate-800">
          {formatLayout(
            property.rooms ?? DEFAULT_PROPERTY.rooms,
            property.halls ?? DEFAULT_PROPERTY.halls
          ) || '--'}
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-slate-400">樓層</span>
        <span className="text-sm font-bold text-slate-800">
          {formatFloor(
            property.floorCurrent ?? DEFAULT_PROPERTY.floorCurrent,
            property.floorTotal ?? DEFAULT_PROPERTY.floorTotal
          ) || '--'}
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-slate-400">編號</span>
        <span className="text-sm font-bold text-slate-800">{property.publicId}</span>
      </div>
    </div>
  );
});
