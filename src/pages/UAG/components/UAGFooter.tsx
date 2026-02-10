import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../UAG.module.css';
import { ROUTES } from '../../../constants/routes';
import { UserData } from '../types/uag.types';

interface UAGFooterProps {
  user: UserData;
  useMock: boolean;
  toggleMode: () => void;
}

export const UAGFooter: React.FC<UAGFooterProps> = ({ user, useMock, toggleMode }) => (
  <div className={styles['uag-footer-bar']}>
    <div className={styles['uag-footer-meta']}>
      <span className={styles['uag-footer-label']}>系統模式</span>
      <strong className={useMock ? styles['uag-footer-mode-mock'] : styles['uag-footer-mode-live']}>
        {useMock ? 'Local Mock' : 'Live API'}
      </strong>
      <button type="button" className={styles['uag-mode-toggle']} onClick={toggleMode}>
        切換模式
      </button>
    </div>

    <div className={styles['uag-footer-actions']}>
      <button type="button" className={styles['uag-btn']}>
        方案設定
      </button>
      <button type="button" className={`${styles['uag-btn']} ${styles['primary']}`}>
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
