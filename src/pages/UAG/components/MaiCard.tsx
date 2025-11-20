import React from 'react';
import toast from 'react-hot-toast';
import styles from '../UAG.module.css';

interface MaiCardProps {
  title?: string;
  subTitle?: string;
  price?: string;
  pricePerPing?: string;
  stats?: { label: string; value: string }[];
  imageUrl?: string;
}

export default function MaiCard({
  title = "惠宇上晴 12F｜3房2廳2衛",
  subTitle = "南屯區 · 67.3 坪 · 屋齡 5 年",
  price = "NT$ 32,880,000",
  pricePerPing = "參考：52.1 萬/坪",
  stats = [
    { label: "議價建議", value: "-2% ~ -6%" },
    { label: "貸款月付", value: "≈ 8.6 萬" },
    { label: "近三筆實登", value: "52.8 / 51.5 / 50.9" }
  ],
  imageUrl = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='200'%3E%3Crect width='100%25' height='100%25' fill='%23e5edff'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%231749d7'%3EMAIN%3C/text%3E%3C/svg%3E"
}: MaiCardProps) {
  
  const handleGenerateReport = () => {
    toast.success('系統提示：報告生成中...');
  };

  return (
    <section className={`${styles['uag-card']} ${styles['k-span-3']}`}>
      <div className={styles['uag-card-header']}>
        <div><div className={styles['uag-card-title']}>手機報告生成器</div><div className={styles['uag-card-sub']}>半屏小卡・行動優先</div></div>
        <div className={styles['uag-actions']}><button className={`${styles['uag-btn']} ${styles['primary']}`} onClick={handleGenerateReport}>生成報告</button></div>
      </div>
      <div className={styles['card-body']}>
        <section aria-label="手機報告生成小卡" className={styles['mai-card']}>
          <header className={styles['mai-head']}>
            <span className={styles['mai-tag']}>快速報告</span>
            <h3 className={styles['mai-title']}>{title}</h3>
            <p className={styles['mai-sub']}>{subTitle}</p>
          </header>
          <div className={styles['mai-body']}>
            <div className={styles['mai-left']}>
              <div className={styles['mai-price']}>
                <div className={styles['mai-price-label']}>開價</div><div className={styles['mai-price-value']}>{price}</div><div className={styles['mai-price-unit']}>{pricePerPing}</div>
              </div>
              <ul className={styles['mai-stats']}>
                {stats.map((stat, index) => (
                  <li key={index}><span>{stat.label}</span><b>{stat.value}</b></li>
                ))}
              </ul>
            </div>
            <div className={styles['mai-right']}>
              <div className={styles['mai-thumb']}><img alt="物件主圖" src={imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
              <div className={styles['mai-mini']}>
                <div style={{ background: '#f0f4ff', borderRadius: '8px', aspectRatio: '3/2' }}></div>
                <div style={{ background: '#f0f4ff', borderRadius: '8px', aspectRatio: '3/2' }}></div>
                <div style={{ background: '#f0f4ff', borderRadius: '8px', aspectRatio: '3/2' }}></div>
              </div>
            </div>
          </div>
          <div className={styles['mai-actions']}>
            <button className={`${styles['mai-btn']} ${styles['primary']}`}>一鍵生成報告</button>
            <button className={`${styles['mai-btn']} ${styles['line']}`}>LINE 分享</button>
          </div>
        </section>
      </div>
    </section>
  );
}
