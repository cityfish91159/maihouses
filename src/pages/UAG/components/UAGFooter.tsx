import React from 'react';
import { Settings, Plus, Coins } from 'lucide-react';
import styles from '../UAG.module.css';
import { UserData } from '../types/uag.types';

interface UAGFooterProps {
  user: UserData;
  pointsBumping?: boolean;
}

export const UAGFooter: React.FC<UAGFooterProps> = ({ user, pointsBumping }) => {
  const pointsClass = [
    styles['footer-capsule'],
    pointsBumping ? styles['animate-points-bump'] : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={styles['uag-footer-bar']} role="toolbar" aria-label="快捷操作列">
      <button className={styles['footer-capsule']} type="button" aria-label="方案設定">
        <Settings size={14} strokeWidth={2.5} aria-hidden="true" />
        <span>方案設定</span>
      </button>

      <button className={styles['footer-capsule']} type="button" aria-label="加值點數">
        <Plus size={14} strokeWidth={2.5} aria-hidden="true" />
        <span>加值點數</span>
      </button>

      <div
        className={pointsClass}
        role="status"
        aria-label={`目前點數 ${user.points}`}
      >
        <Coins size={14} strokeWidth={2.5} aria-hidden="true" />
        <span>點數 {user.points}</span>
      </div>
    </div>
  );
};
