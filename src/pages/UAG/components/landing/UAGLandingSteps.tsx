import styles from '../../UAG.module.css';

const STEPS = [
  { step: 1, label: '註冊房仲帳號', desc: '免費，需認證身分' },
  { step: 2, label: '查看買家雷達', desc: '即時看到誰在看你的房' },
  { step: 3, label: '用點數取得聯絡方式', desc: '系統透過 LINE 通知買家' },
] as const;

export function UAGLandingSteps() {
  return (
    <section className={styles['landing-steps']}>
      <h2 className={styles['landing-steps-title']}>怎麼開始？</h2>

      <div className={styles['landing-steps-row']}>
        {STEPS.map(({ step, label, desc }, index) => (
          <div key={step} className={styles['landing-step-group']}>
            {index > 0 && <span className={styles['landing-step-arrow']}>→</span>}
            <div className={styles['landing-step']}>
              <div className={styles['landing-step-number']}>{step}</div>
              <span className={styles['landing-step-label']}>{label}</span>
              <span className={styles['landing-step-desc']}>{desc}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
