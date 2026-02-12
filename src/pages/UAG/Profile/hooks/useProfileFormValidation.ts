import { useCallback, useMemo, useState } from 'react';
import type { ProfileFormValues } from './useProfileFormState';

export interface ProfileValidationErrors {
  name: string;
  phone: string;
  lineId: string;
}

export type ValidationField = keyof ProfileValidationErrors;

const EMPTY_VALIDATION_ERRORS: ProfileValidationErrors = {
  name: '',
  phone: '',
  lineId: '',
};

const trimValue = (value: string) => value.trim();

const createRequiredValidator =
  (errorMessage: string) =>
  (value: string): string =>
    trimValue(value) ? '' : errorMessage;

const createPatternValidator =
  (pattern: RegExp, errorMessage: string) =>
  (value: string): string => {
    const trimmedValue = trimValue(value);
    if (!trimmedValue) return '';
    return pattern.test(trimmedValue) ? '' : errorMessage;
  };

const validateName = createRequiredValidator('請輸入姓名。');
const validatePhone = createPatternValidator(
  /^09\d{8}$/,
  '請輸入正確手機號碼（09 開頭，共 10 碼）。'
);
const validateLineId = createPatternValidator(
  /^[a-z0-9_.@-]+$/i,
  'LINE ID 僅可包含英數、底線、點、@、減號。'
);

const validators: Record<ValidationField, (value: string) => string> = {
  name: validateName,
  phone: validatePhone,
  lineId: validateLineId,
};

const evaluateFieldError = (field: ValidationField, value: string) => validators[field](value);

const evaluateAllErrors = (values: Pick<ProfileFormValues, 'name' | 'phone' | 'lineId'>) => ({
  name: evaluateFieldError('name', values.name),
  phone: evaluateFieldError('phone', values.phone),
  lineId: evaluateFieldError('lineId', values.lineId),
});

export function useProfileFormValidation(values: Pick<ProfileFormValues, 'name' | 'phone' | 'lineId'>) {
  const [errors, setErrors] = useState<ProfileValidationErrors>(EMPTY_VALIDATION_ERRORS);

  const validateField = useCallback(
    (field: ValidationField, value?: string) => {
      const nextFieldError = evaluateFieldError(field, value ?? values[field]);
      setErrors((prev) => ({ ...prev, [field]: nextFieldError }));
      return !nextFieldError;
    },
    [values]
  );

  const validateAll = useCallback(() => {
    const nextErrors = evaluateAllErrors(values);
    setErrors(nextErrors);
    return !nextErrors.name && !nextErrors.phone && !nextErrors.lineId;
  }, [values]);

  const hasErrors = useMemo(() => {
    const nextErrors = evaluateAllErrors(values);
    return Boolean(nextErrors.name || nextErrors.phone || nextErrors.lineId);
  }, [values]);

  return {
    errors,
    hasErrors,
    validateField,
    validateAll,
  };
}
