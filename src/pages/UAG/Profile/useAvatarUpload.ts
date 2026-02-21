import { useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { notify } from '../../../lib/notify';
import type { AvatarUploaderBaseProps } from './displayTypes';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_IN_BYTES = 2 * 1024 * 1024;

const isBlobUrl = (url: string | null): url is string => Boolean(url && url.startsWith('blob:'));

interface UseAvatarUploadParams {
  avatarUrl: AvatarUploaderBaseProps['avatarUrl'];
  onUpload: AvatarUploaderBaseProps['onUpload'];
}

export function useAvatarUpload({ avatarUrl, onUpload }: UseAvatarUploadParams) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previousBlobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const previousBlobUrl = previousBlobUrlRef.current;
    if (isBlobUrl(previousBlobUrl) && previousBlobUrl !== avatarUrl) {
      URL.revokeObjectURL(previousBlobUrl);
    }
    previousBlobUrlRef.current = isBlobUrl(avatarUrl) ? avatarUrl : null;
  }, [avatarUrl]);

  useEffect(() => {
    return () => {
      const previousBlobUrl = previousBlobUrlRef.current;
      if (isBlobUrl(previousBlobUrl)) {
        URL.revokeObjectURL(previousBlobUrl);
      }
    };
  }, []);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      const fileType = file.type || 'unknown';
      notify.error('格式不支援', `目前檔案格式為 ${fileType}，請上傳 JPG、PNG 或 WebP 圖片`);
      event.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE_IN_BYTES) {
      const fileSizeInMb = (file.size / 1024 / 1024).toFixed(2);
      notify.error('檔案過大', `目前檔案大小為 ${fileSizeInMb}MB，最大限制為 2MB`);
      event.target.value = '';
      return;
    }

    try {
      await onUpload(file);
      event.target.value = '';
    } catch {
      // Keep the current value when upload fails.
    }
  };

  return {
    inputRef,
    handleFileChange,
  };
}
