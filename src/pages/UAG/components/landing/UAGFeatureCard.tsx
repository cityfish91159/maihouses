import type { LucideIcon } from 'lucide-react';

import styles from '../../UAG.module.css';

interface UAGFeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  step?: { number: number; label: string };
}

export function UAGFeatureCard({ icon: Icon, title, description, step }: UAGFeatureCardProps) {
  return (
    <div className={styles['landing-card']}>
      <div className={styles['landing-card-icon']}>
        <Icon size={28} />
      </div>
      <h3 className={styles['landing-card-title']}>{title}</h3>
      <p className={styles['landing-card-desc']}>{description}</p>
      {step && (
        <div className={styles['landing-card-step']}>
          <span className={styles['landing-card-step-number']}>{step.number}</span>
          <span className={styles['landing-card-step-label']}>{step.label}</span>
        </div>
      )}
    </div>
  );
}
