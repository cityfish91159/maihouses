import { useState, useCallback, useEffect } from 'react';
import { STRINGS } from '../constants/strings';

export interface ComposerData {
  content: string;
  visibility: 'public' | 'private';
  communityId?: string | undefined;
  images?: File[] | undefined;
}

interface UseComposerOptions {
  onSubmit: (data: ComposerData) => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  initialVisibility?: 'public' | 'private';
  minLength?: number;
  maxLength?: number;
}

export function useComposer({
  onSubmit,
  onSuccess,
  onError,
  initialVisibility = 'public',
  minLength = 5, // P4-A3: 修正預設值為 5
  maxLength = 500, // P4-A3: 修正預設值為 500
}: UseComposerOptions) {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>(initialVisibility);
  const [communityId, setCommunityId] = useState<string | undefined>(undefined);
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // P4-A1: 監聽 initialVisibility 變化
  useEffect(() => {
    setVisibility(initialVisibility);
  }, [initialVisibility]);

  const reset = useCallback(() => {
    setContent('');
    setVisibility(initialVisibility);
    setCommunityId(undefined);
    setImages([]);
    setError(null);
    setIsSubmitting(false);
  }, [initialVisibility]);

  const validate = useCallback(() => {
    const trimmed = content.trim();
    if (trimmed.length < minLength) {
      return STRINGS.VALIDATION.MIN_LENGTH(minLength);
    }
    if (trimmed.length > maxLength) {
      return STRINGS.VALIDATION.MAX_LENGTH(maxLength);
    }
    return null;
  }, [content, minLength, maxLength]);

  const submit = useCallback(async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // P4-A5: 傳遞 communityId 與 images
      await onSubmit({
        content: content.trim(),
        visibility,
        communityId,
        images,
      });
      
      // P4-A11: 修正競態條件，先執行 onSuccess 再 reset
      // 注意：這裡假設 onSuccess 不需要依賴已清空的 state
      // 如果 onSuccess 需要數據，應該從參數傳遞，而不是依賴 hook state
      onSuccess?.();
      reset();
    } catch (err) {
      const message = err instanceof Error ? err.message : STRINGS.VALIDATION.SUBMIT_ERROR;
      setError(message);
      onError?.(err instanceof Error ? err : new Error(message));
    } finally {
      setIsSubmitting(false);
    }
  }, [content, visibility, communityId, images, onSubmit, onSuccess, onError, reset, validate]);

  return {
    content,
    setContent,
    visibility,
    setVisibility,
    communityId,
    setCommunityId,
    images,
    setImages,
    isSubmitting,
    error,
    submit,
    reset,
    validate,
    isValid: !validate(),
    charCount: content.trim().length, // P4-A8: 使用 trimmed length
    minLength,
    maxLength,
  };
}
