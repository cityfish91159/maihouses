import React from 'react';
import type { User } from '@supabase/supabase-js';
import { ROUTES } from '../../../constants/routes';
import styles from '../UAG.module.css';

interface UAGHeaderProps {
  user?: User | null;
}

export const UAGHeader: React.FC<UAGHeaderProps> = ({ user }) => {
  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || '訪客';
  const email = user?.email;

  return (
    <header className={styles['uag-header']}>
      <div className={styles['uag-header-inner']}>
        <div className={styles['uag-logo']}>
          <div className={styles['uag-logo-badge']}>邁</div>
          <span>邁房子客戶導覽台</span>
        </div>
        <div className={styles['uag-breadcrumb']}>
          <span>精準獲客 · UAG 導覽</span>
          <span className={`${styles['uag-badge']} ${styles['uag-badge--pro']}`}>專業版 PRO</span>
        </div>
        <div className={styles['uag-header-actions']}>
          <a href={ROUTES.HOME} className={styles['uag-home-link']}>
            返回首頁
          </a>
          {user && (
            <div className={styles['uag-user']}>
              <div className={styles['uag-user-avatar']}>
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className={styles['uag-user-info']}>
                <span className={styles['uag-user-name']}>{displayName}</span>
                {email && <span className={styles['uag-user-email']}>{email}</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
