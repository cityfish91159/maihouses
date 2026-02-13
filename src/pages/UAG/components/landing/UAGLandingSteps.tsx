import styles from '../../UAG.module.css';

const STEPS = [
  { step: 1, label: '註冊認證', color: 'var(--uag-brand)' },
  { step: 2, label: 'AI 配對推播', color: 'var(--uag-accent)' },
  { step: 3, label: '獲取聯絡權限', color: 'var(--grade-s)' },
] as const;

export function UAGLandingSteps() {
  return (
    <section className={styles['landing-steps']}>
      <h2 className={styles['landing-steps-title']}>三步驟開始使用</h2>

      <div className={styles['landing-steps-row']}>
        {STEPS.map(({ step, label, color }) => (
          <div key={step} className={styles['landing-step']}>
            <div
              className={styles['flow-stage']}
              style={{ background: color }}
            >
              {step}
            </div>
            <span className={styles['landing-step-label']}>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
