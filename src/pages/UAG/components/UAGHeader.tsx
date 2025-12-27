import React from 'react';
import styles from '../UAG.module.css';

export const UAGHeader = () => (
  <header className={styles['uag-header']}>
    <div className={styles['uag-header-inner']}>
      <div className={styles['uag-logo']}><div className={styles['uag-logo-badge']}>邁</div><span>邁房子廣告後台</span></div>
      <div className={styles['uag-breadcrumb']}><span>游杰倫 21世紀不動產河南店</span><span className={`${styles['uag-badge']} ${styles['uag-badge--pro']}`}>專業版 PRO</span></div>
    </div>
  </header>
);
