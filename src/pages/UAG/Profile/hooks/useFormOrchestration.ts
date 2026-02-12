import { useCallback, useEffect, useMemo, type FormEvent } from 'react';
import type { AgentProfileMe, UpdateAgentProfilePayload } from '../../../../types/agent.types';
import { usePersistedTab, buildProfileTabStorageKey } from './usePersistedTab';
import { useProfileFormState } from './useProfileFormState';
import { useProfileFormValidation, type ValidationField } from './useProfileFormValidation';

interface FormStateInfo {
  hasUnsavedChanges: boolean;
  isSubmitDisabled: boolean;
}

interface UseFormOrchestrationParams {
  profile: AgentProfileMe;
  isSaving: boolean;
  onSave: (payload: UpdateAgentProfilePayload) => Promise<void>;
  onFormStateChange: ((state: FormStateInfo) => void) | undefined;
  storageKeyPrefix: string;
}

type SetFieldFn = ReturnType<typeof useProfileFormState>['setField'];
type ValidateFieldFn = ReturnType<typeof useProfileFormValidation>['validateField'];
type ToggleSelectionFn = ReturnType<typeof useProfileFormState>['toggleSelection'];

interface BasicTabHandlers {
  onNameChange: (value: string) => void;
  onNameBlur: () => void;
  onCompanyChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onPhoneBlur: () => void;
  onLineIdChange: (value: string) => void;
  onLineIdBlur: () => void;
  onJoinedAtChange: (value: string) => void;
  onLicenseNumberChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onToggleSpecialty: (option: string) => void;
  onToggleCertification: (option: string) => void;
}

function buildHandlers(
  setField: SetFieldFn,
  validateField: ValidateFieldFn,
  toggleSelection: ToggleSelectionFn
): BasicTabHandlers {
  return {
    onNameChange: (value) => {
      setField('name', value);
      validateField('name', value);
    },
    onNameBlur: () => validateField('name'),
    onCompanyChange: (value) => setField('company', value),
    onPhoneChange: (value) => {
      setField('phone', value);
      validateField('phone', value);
    },
    onPhoneBlur: () => validateField('phone'),
    onLineIdChange: (value) => {
      setField('lineId', value);
      validateField('lineId', value);
    },
    onLineIdBlur: () => validateField('lineId'),
    onJoinedAtChange: (value) => setField('joinedAt', value),
    onLicenseNumberChange: (value) => setField('licenseNumber', value),
    onBioChange: (value) => setField('bio', value),
    onToggleSpecialty: (option) => toggleSelection('specialties', option),
    onToggleCertification: (option) => toggleSelection('certifications', option),
  };
}

export function useFormOrchestration({
  profile,
  isSaving,
  onSave,
  onFormStateChange,
  storageKeyPrefix,
}: UseFormOrchestrationParams) {
  const tabStorageKey = buildProfileTabStorageKey(storageKeyPrefix, profile.id);
  const { activeTab, setActiveTab } = usePersistedTab(tabStorageKey);
  const { values, setField, toggleSelection, payload, hasUnsavedChanges } = useProfileFormState(profile);
  const { errors, hasErrors: hasValidationErrors, validateField, validateAll } = useProfileFormValidation({
    name: values.name,
    phone: values.phone,
    lineId: values.lineId,
  });

  const isSubmitDisabled = isSaving || !hasUnsavedChanges || hasValidationErrors;
  const handlers = useMemo(
    () => buildHandlers(setField, validateField, toggleSelection),
    [setField, validateField, toggleSelection]
  );
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    onFormStateChange?.({ hasUnsavedChanges, isSubmitDisabled });
  }, [hasUnsavedChanges, isSubmitDisabled, onFormStateChange]);

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!validateAll()) return;
      if (isSaving || !hasUnsavedChanges) return;
      await onSave(payload);
    },
    [hasUnsavedChanges, isSaving, onSave, payload, validateAll]
  );

  return {
    activeTab,
    setActiveTab,
    values,
    errors,
    handlers,
    today,
    isSaving,
    hasUnsavedChanges,
    isSubmitDisabled,
    handleSubmit,
  };
}
