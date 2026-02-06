import React, { useRef } from 'react';
import { Camera } from 'lucide-react';
import { notify } from '../../../lib/notify';

interface AvatarUploaderProps {
  name: string;
  avatarUrl: string | null;
  isUploading: boolean;
  onUpload: (file: File) => Promise<void>;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  name,
  avatarUrl,
  isUploading,
  onUpload,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      notify.error('格式不支援', '請上傳 jpg/png/webp 圖片');
      event.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      notify.error('檔案過大', '最大 2MB');
      event.target.value = '';
      return;
    }

    try {
      await onUpload(file);
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">頭像</p>
          <p className="text-xs text-slate-500">支援 jpg/png/webp，2MB 內</p>
        </div>
        <button
          type="button"
          className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:border-slate-300"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          aria-label="上傳頭像"
        >
          {isUploading ? '上傳中...' : '變更'}
        </button>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="size-16 rounded-full border border-slate-100 object-cover"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-500">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-slate-900 text-white">
            <Camera size={12} />
          </div>
        </div>
        <div className="text-xs text-slate-500">
          <p>建議 400 x 400px 以上</p>
          <p>背景乾淨更容易辨識</p>
        </div>
      </div>

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
