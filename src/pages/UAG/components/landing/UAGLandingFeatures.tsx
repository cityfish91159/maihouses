import { Radar, ShieldCheck, Trophy } from 'lucide-react';

import styles from '../../UAG.module.css';
import { UAGFeatureCard } from './UAGFeatureCard';

const FEATURES = [
  {
    icon: Radar,
    title: '即時雷達匹配',
    description: '即時追蹤消費者瀏覽軌跡，AI 自動匹配意向最高的潛力買家給你。',
  },
  {
    icon: Trophy,
    title: '智慧評級系統',
    description: '根據瀏覽頻率、停留時間、互動深度，自動評定 S/A/B/C/F 等級。',
  },
  {
    icon: ShieldCheck,
    title: '獨佔保護期',
    description: '購買線索後享有獨佔保護期，確保你的投資不被其他房仲搶走。',
  },
] as const;

export function UAGLandingFeatures() {
  return (
    <section className={styles['landing-features']}>
      <div className={styles['landing-features-grid']}>
        {FEATURES.map((feature) => (
          <UAGFeatureCard
            key={feature.title}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </div>
    </section>
  );
}
