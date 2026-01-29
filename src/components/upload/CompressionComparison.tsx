import React, { useState } from 'react';
import { GripVertical } from 'lucide-react';

interface CompressionComparisonProps {
  originalUrl: string;
  compressedUrl: string;
  originalSize: number;
  compressedSize: number;
  onClose: () => void;
}

export const CompressionComparison: React.FC<CompressionComparisonProps> = ({
  originalUrl,
  compressedUrl,
  originalSize,
  compressedSize,
  onClose,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const ratio = Math.round((compressedSize / originalSize) * 100);
  const saving = 100 - ratio;

  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
    // 簡單實作：點擊跳轉，拖曳需更多事件處理，先求有點擊回饋
    // 若要完整 Drag，需綁定 container ref 計算 offset
    // 這裡為了穩健，先採用 Input Range 覆蓋在上方的方式
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      role="button"
      aria-label="關閉對話框"
      tabIndex={0}
    >
      <div
        className="relative w-full max-w-4xl overflow-hidden rounded-lg bg-gray-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="presentation"
      >
        <div className="flex items-center justify-between bg-gray-800 px-4 py-3 text-white">
          <h3 className="font-bold">壓縮效果對比</h3>
          <div className="space-x-4 text-sm">
            <span className="text-gray-400">
              原始: <span className="text-white">{formatSize(originalSize)}</span>
            </span>
            <span className="text-emerald-400">
              壓縮後: <span className="text-white">{formatSize(compressedSize)}</span> (-{saving}%)
            </span>
            <button onClick={onClose} className="rounded bg-white/10 px-2 py-1 hover:bg-white/20">
              關閉
            </button>
          </div>
        </div>

        <div className="relative aspect-video w-full select-none overflow-hidden bg-black/50">
          {/* 底層：壓縮圖 (Right/After) */}
          <img
            src={compressedUrl}
            alt="Compressed"
            className="absolute inset-0 size-full object-contain"
          />
          {/* 標籤 Right */}
          <div className="absolute right-4 top-4 rounded bg-black/50 px-2 py-1 text-xs text-white">
            After ({ratio}%)
          </div>

          {/* 上層：原始圖 (Left/Before) - 使用 clip-path 切割 */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <img
              src={originalUrl}
              alt="Original"
              className="absolute inset-0 size-full object-contain"
            />
            {/* 標籤 Left */}
            <div className="absolute left-4 top-4 rounded bg-black/50 px-2 py-1 text-xs text-white">
              Before (100%)
            </div>
          </div>

          {/* Slider Handle */}
          <div
            className="absolute inset-y-0 w-1 cursor-ew-resize bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)]"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -ml-3 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-800 shadow-lg">
              <GripVertical size={16} />
            </div>
          </div>

          {/* Control Input (Invisible but interactive) */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPosition}
            onChange={(e) => setSliderPosition(Number(e.target.value))}
            className="absolute inset-0 z-10 size-full cursor-ew-resize opacity-0"
          />
        </div>

        <div className="bg-gray-800 p-2 text-center text-xs text-gray-400">
          拖曳滑桿以比較畫質差異
        </div>
      </div>
    </div>
  );
};
