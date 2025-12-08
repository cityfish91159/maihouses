import { useState, useCallback } from 'react';

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
  minLength = 1,
  maxLength = 2000,
}: UseComposerOptions) {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>(initialVisibility);
  const [communityId, setCommunityId] = useState<string | undefined>(undefined);
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      return `內容至少需要 ${minLength} 個字`;
    }
    if (trimmed.length > maxLength) {
      return `內容不能超過 ${maxLength} 個字`;
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
      await onSubmit({
        content: content.trim(),
        visibility,
        communityId,
        images,
      });
      reset();
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : '發布失敗';
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
    charCount: content.length,
  };
}
