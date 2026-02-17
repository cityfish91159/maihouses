import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { MaiMaiBase } from '../../../components/MaiMai';
import { useMaiMaiA11yProps } from '../../../hooks/useMaiMaiA11yProps';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import styles from '../UAG.module.css';

interface UAGEmptyStateProps {
  onDismiss: () => void;
}

export function UAGEmptyState({ onDismiss }: UAGEmptyStateProps) {
  const maimaiA11yProps = useMaiMaiA11yProps();
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <section
      className={`${styles['k-span-6']} ${styles['welcome-card']}`}
      aria-label="新手引導"
    >
      <button
        type="button"
        className={styles['welcome-close']}
        onClick={onDismiss}
        aria-label="關閉歡迎引導"
      >
        <X size={18} strokeWidth={2.5} />
      </button>

      <div className={styles['welcome-card-inner']}>
        <div className={styles['welcome-maimai-wrap']}>
          <MaiMaiBase mood="wave" size={isMobile ? 'sm' : 'md'} {...maimaiA11yProps} />
        </div>

        <div className={styles['welcome-text']}>
          <h2 className={styles['welcome-title']}>嗨！歡迎加入 MaiHouses！</h2>
          <p className={styles['welcome-desc']}>
            你的買家雷達已經就緒。當有消費者在看你負責的物件，我會馬上通知你。
          </p>
          <p className={styles['welcome-desc']}>現在先去上架你的第一筆物件吧！</p>

          <div className={styles['welcome-actions']}>
            <Link to="/property/upload" className={styles['welcome-cta']}>
              上架物件
            </Link>
            <button type="button" className={styles['welcome-dismiss']} onClick={onDismiss}>
              知道了
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
