import { BarChart3, Radar, ShieldCheck } from 'lucide-react';

import styles from '../../UAG.module.css';
import { UAGFeatureCard } from './UAGFeatureCard';

const FEATURES = [
  {
    icon: Radar,
    title: '買家行為追蹤',
    description: '誰在看你的房子、停了多久、有沒有想聯絡——全部自動記錄。',
    step: { number: 1, label: '註冊房仲帳號' },
  },
  {
    icon: BarChart3,
    title: '自動意願分級',
    description: '系統依瀏覽深度分 S · A · B · C 等級，S 級是主動想聯絡你的人。',
    step: { number: 2, label: '查看買家雷達' },
  },
  {
    icon: ShieldCheck,
    title: '獨家保護期',
    description: '用點數取得聯絡方式，72 小時內只有你能聯絡這位買家。',
    step: { number: 3, label: '用點數取得聯絡方式' },
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
            step={feature.step}
          />
        ))}
      </div>
    </section>
  );
}
