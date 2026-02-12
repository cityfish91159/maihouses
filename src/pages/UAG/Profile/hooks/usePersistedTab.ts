import { useEffect, useState } from 'react';
import { safeLocalStorage } from '../../../../lib/safeStorage';

export type ProfileTab = 'basic' | 'expertise';

const DEFAULT_PROFILE_TAB: ProfileTab = 'basic';

const isProfileTab = (value: string | null): value is ProfileTab =>
  value === 'basic' || value === 'expertise';

const readPersistedTab = (storageKey: string): ProfileTab => {
  if (typeof window === 'undefined') return DEFAULT_PROFILE_TAB;
  try {
    const storedValue = safeLocalStorage.getItem(storageKey);
    return isProfileTab(storedValue) ? storedValue : DEFAULT_PROFILE_TAB;
  } catch {
    return DEFAULT_PROFILE_TAB;
  }
};

export const buildProfileTabStorageKey = (prefix: string, profileId: string) =>
  `${prefix}-${profileId}-active-tab`;

export function usePersistedTab(storageKey: string) {
  const [activeTab, setActiveTab] = useState<ProfileTab>(() => readPersistedTab(storageKey));

  useEffect(() => {
    setActiveTab(readPersistedTab(storageKey));
  }, [storageKey]);

  useEffect(() => {
    try {
      safeLocalStorage.setItem(storageKey, activeTab);
    } catch {
      // ignore storage failures
    }
  }, [activeTab, storageKey]);

  return { activeTab, setActiveTab };
}
