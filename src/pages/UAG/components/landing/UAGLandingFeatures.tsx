import { BarChart3, Radar, ShieldCheck } from 'lucide-react';

import styles from '../../UAG.module.css';
import { UAGFeatureCard } from './UAGFeatureCard';

const FEATURES = [
  {
    icon: Radar,
    title: '買家行為追蹤',
    description: '買家瀏覽了哪些房源、停留多久、有沒有點 LINE 或電話，系統自動記錄並整理成清單。',
  },
  {
    icon: BarChart3,
    title: '自動意願分級',
    description: '根據瀏覽時間和互動深度，買家被分為 S · A · B · C 四個等級，S 級代表已主動想聯絡你。',
  },
  {
    icon: ShieldCheck,
    title: '獨家保護期',
    description: '購買 S 級買家後，你有 72 小時獨家聯絡權，這段時間其他房仲看不到這位買家。',
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
