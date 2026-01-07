import React from 'react';
import styles from '../UAG.module.css';
import { UserData } from '../types/uag.types';

interface UAGFooterProps {
  user: UserData;
  useMock: boolean;
  toggleMode: () => void;
}

export const UAGFooter: React.FC<UAGFooterProps> = ({ user, useMock, toggleMode }) => (
  <div className={styles['uag-footer-bar']}>
    <div style={{ marginRight: 'auto', fontSize: '12px', color: 'var(--ink-300)' }}>
      系統模式：<strong style={{ color: useMock ? '#f59e0b' : '#16a34a' }}>{useMock ? "Local Mock" : "Live API"}</strong>
      <button onClick={toggleMode} style={{ marginLeft: '10px', fontSize: '10px', cursor: 'pointer', border: '1px solid #ccc', padding: '2px 6px', borderRadius: '4px' }}>切換模式</button>
    </div>
    <button className={styles['uag-btn']}>方案設定</button>
    <button className={`${styles['uag-btn']} ${styles['primary']}`}>加值點數</button>
    <span className={styles['uag-badge']} style={{ fontSize: '14px', background: '#fff8dc', color: 'var(--grade-s)', borderColor: '#fcd34d' }}>
      點數 <span id="user-points">{user.points}</span>
    </span>
  </div>
);
