import React from 'react';
import { Camera } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { AvatarUploaderBaseProps } from './AvatarUploader';
import { useAvatarUpload } from './useAvatarUpload';

export const AvatarUploaderCompact: React.FC<AvatarUploaderBaseProps> = ({
  name,
  avatarUrl,
  isUploading,
  onUpload,
  className,
}) => {
  const { inputRef, handleFileChange } = useAvatarUpload({ avatarUrl, onUpload });

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="size-12 rounded-full border border-slate-100 object-cover"
          />
        ) : (
          <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-base font-bold text-slate-500">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-slate-900 text-white">
          <Camera size={10} />
        </div>
      </div>
      <div className="flex-1">
        <p className="text-base font-bold text-slate-900">{name}</p>
        <p className="text-xs text-slate-500">房仲個人資料</p>
      </div>
      <button
        type="button"
        className="min-h-[44px] min-w-[44px] rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-600 transition-colors hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 motion-reduce:transition-none"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        aria-label="上傳頭像"
      >
        {isUploading ? '上傳中...' : '變更'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};
