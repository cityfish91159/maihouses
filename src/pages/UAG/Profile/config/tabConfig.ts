import { User, Award } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ProfileTab } from '../hooks/usePersistedTab';

export interface TabConfig {
  label: string;
  icon: LucideIcon;
  buttonId: string;
  panelId: string;
}

export const PROFILE_TAB_CONFIG: Record<ProfileTab, TabConfig> = {
  basic: {
    label: '基本資料',
    icon: User,
    buttonId: 'profile-tab-basic',
    panelId: 'profile-panel-basic',
  },
  expertise: {
    label: '專長證照',
    icon: Award,
    buttonId: 'profile-tab-expertise',
    panelId: 'profile-panel-expertise',
  },
} as const;

export const PROFILE_TAB_ORDER: readonly ProfileTab[] = ['basic', 'expertise'] as const;
