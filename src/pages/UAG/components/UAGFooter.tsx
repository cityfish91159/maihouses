import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../UAG.module.css';
import { ROUTES } from '../../../constants/routes';
import { UserData } from '../types/uag.types';

interface UAGFooterProps {
  user: UserData;
  useMock: boolean;
}

export const UAGFooter: React.FC<UAGFooterProps> = ({ user, useMock }) => (
  <div className={styles['uag-footer-bar']}>
    <div className={styles['uag-footer-actions']}>
      <button type="button" className={styles['uag-btn']} disabled>
        方案設定
      </button>
      <button type="button" className={`${styles['uag-btn']} ${styles['primary']}`} disabled>
        加值點數
      </button>
      <Link
        to={useMock ? `${ROUTES.UAG_PROFILE}?mock=true` : ROUTES.UAG_PROFILE}
        className={`${styles['uag-btn']} ${styles['uag-btn-link']}`}
      >
        個人資料
      </Link>
      <span className={styles['uag-points-badge']}>
        點數 <span id="user-points">{user.points}</span>
      </span>
    </div>
  </div>
);
