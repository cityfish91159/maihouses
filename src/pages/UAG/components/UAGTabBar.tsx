import { memo, useCallback, useEffect, useState } from 'react';
import type { LucideProps } from 'lucide-react';
import { BarChart3, LayoutDashboard, Users } from 'lucide-react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import styles from '../UAG.module.css';

/** 錨點 Tab ID，對應各區塊的 DOM id */
export type UAGAnchorTab = 'uag-section-overview' | 'uag-section-leads' | 'uag-section-monitor';

type LucideIcon = ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>;

const TAB_ITEMS: ReadonlyArray<{
  readonly id: UAGAnchorTab;
  readonly label: string;
  readonly Icon: LucideIcon;
}> = [
  { id: 'uag-section-overview', label: '概覽', Icon: LayoutDashboard },
  { id: 'uag-section-leads', label: '商機', Icon: Users },
  { id: 'uag-section-monitor', label: '監控', Icon: BarChart3 },
];

/**
 * 手機版錨點導航 Tab Bar
 * 點擊後 smooth scroll 到對應區塊，不隱藏任何內容
 * 規範引用: ux-guidelines #17 (iOS safe area)、#22 (觸控 ≥ 44px)
 */
export const UAGTabBar = memo(function UAGTabBar() {
  const [activeId, setActiveId] = useState<UAGAnchorTab>('uag-section-overview');

  const handleClick = useCallback((targetId: UAGAnchorTab) => {
    const el = document.getElementById(targetId);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveId(targetId);
  }, []);

  // IntersectionObserver: 自動偵測哪個區塊在畫面中，更新 active tab
  useEffect(() => {
    const ids = TAB_ITEMS.map((t) => t.id);
    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id as UAGAnchorTab);
          }
        }
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    );

    for (const el of elements) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <nav className={styles['uag-tab-bar']} aria-label="UAG 快速導航">
      {TAB_ITEMS.map(({ id, label, Icon }) => {
        const isActive = activeId === id;
        return (
          <button
            key={id}
            type="button"
            className={`${styles['uag-tab-item']} ${isActive ? styles['uag-tab-item-active'] : ''}`}
            onClick={() => handleClick(id)}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={18} aria-hidden="true" />
            <span className={styles['uag-tab-label']}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
});
