import { memo } from 'react';
import type { LucideProps } from 'lucide-react';
import { BarChart3, LayoutDashboard, Settings, Users } from 'lucide-react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import styles from '../UAG.module.css';

export type UAGMobileTab = 'overview' | 'leads' | 'monitor' | 'settings';

interface UAGTabBarProps {
  readonly activeTab: UAGMobileTab;
  readonly onTabChange: (tab: UAGMobileTab) => void;
}

type LucideIcon = ForwardRefExoticComponent<
  Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>
>;

const TAB_ITEMS: ReadonlyArray<{
  readonly id: UAGMobileTab;
  readonly label: string;
  readonly Icon: LucideIcon;
}> = [
  { id: 'overview', label: '概覽', Icon: LayoutDashboard },
  { id: 'leads', label: '商機', Icon: Users },
  { id: 'monitor', label: '監控', Icon: BarChart3 },
  { id: 'settings', label: '設定', Icon: Settings },
];

export const UAGTabBar = memo(function UAGTabBar({ activeTab, onTabChange }: UAGTabBarProps) {
  return (
    <nav className={styles['uag-tab-bar']} aria-label="UAG 行動分頁">
      {TAB_ITEMS.map(({ id, label, Icon }) => {
        const isActive = activeTab === id;

        return (
          <button
            key={id}
            type="button"
            className={`${styles['uag-tab-item']} ${isActive ? styles['uag-tab-item-active'] : ''}`}
            onClick={() => onTabChange(id)}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={18} className={styles['uag-tab-icon'] ?? ''} aria-hidden="true" />
            <span className={styles['uag-tab-label']}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
});
