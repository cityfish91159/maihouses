import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AgentProfileMe, UpdateAgentProfilePayload } from '../../../../types/agent.types';

export interface ProfileFormValues {
  name: string;
  company: string;
  bio: string;
  specialties: string[];
  certifications: string[];
  phone: string;
  lineId: string;
  licenseNumber: string;
  joinedAt: string;
}

const toDateInputValue = (value: string | null) => (value ? value.slice(0, 10) : '');

const toNullIfBlank = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

export function buildProfilePayload(values: ProfileFormValues): UpdateAgentProfilePayload {
  const payload: UpdateAgentProfilePayload = {
    name: values.name.trim(),
    company: toNullIfBlank(values.company),
    bio: toNullIfBlank(values.bio),
    specialties: values.specialties,
    certifications: values.certifications,
    phone: toNullIfBlank(values.phone),
    lineId: toNullIfBlank(values.lineId),
    licenseNumber: toNullIfBlank(values.licenseNumber),
  };

  if (values.joinedAt) {
    payload.joinedAt = new Date(values.joinedAt).toISOString();
  }

  return payload;
}

const buildInitialFormValues = (profile: AgentProfileMe): ProfileFormValues => ({
  name: profile.name,
  company: profile.company ?? '',
  bio: profile.bio ?? '',
  specialties: profile.specialties ?? [],
  certifications: profile.certifications ?? [],
  phone: profile.phone ?? '',
  lineId: profile.lineId ?? '',
  licenseNumber: profile.licenseNumber ?? '',
  joinedAt: toDateInputValue(profile.joinedAt || profile.createdAt),
});

export function useProfileFormState(profile: AgentProfileMe) {
  const [values, setValues] = useState<ProfileFormValues>(() => buildInitialFormValues(profile));

  useEffect(() => {
    setValues(buildInitialFormValues(profile));
  }, [profile]);

  const setField = useCallback(
    <K extends keyof ProfileFormValues>(field: K, value: ProfileFormValues[K]) => {
      setValues((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const toggleSelection = useCallback((field: 'specialties' | 'certifications', option: string) => {
    setValues((prev) => {
      const currentItems = prev[field];
      const nextItems = currentItems.includes(option)
        ? currentItems.filter((item) => item !== option)
        : [...currentItems, option];

      return {
        ...prev,
        [field]: nextItems,
      };
    });
  }, []);

  const payload = useMemo(() => buildProfilePayload(values), [values]);
  const initialPayload = useMemo(
    () => buildProfilePayload(buildInitialFormValues(profile)),
    [profile]
  );

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(payload) !== JSON.stringify(initialPayload),
    [payload, initialPayload]
  );

  return {
    values,
    setField,
    toggleSelection,
    payload,
    hasUnsavedChanges,
  };
}
