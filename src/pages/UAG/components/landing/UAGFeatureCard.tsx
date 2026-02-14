import type { LucideIcon } from 'lucide-react';

import styles from '../../UAG.module.css';

interface UAGFeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function UAGFeatureCard({ icon: Icon, title, description }: UAGFeatureCardProps) {
  return (
    <div className={styles['landing-card']}>
      <div className={styles['landing-card-icon']}>
        <Icon size={28} />
      </div>
      <h3 className={styles['landing-card-title']}>{title}</h3>
      <p className={styles['landing-card-desc']}>{description}</p>
    </div>
  );
}
