import React, { useState, useRef } from 'react';
import { notify } from '../../../lib/notify';
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
  title: initialTitle = '惠宇上晴 12F｜3房2廳2衛',
  subTitle: initialSubTitle = '南屯區 · 67.3 坪 · 屋齡 5 年',
  price: initialPrice = 'NT$ 32,880,000',
  pricePerPing: initialPricePerPing = '參考：52.1 萬/坪',
  stats: initialStats = [
    { label: '議價建議', value: '-2% ~ -6%' },
    { label: '貸款月付', value: '≈ 8.6 萬' },
    { label: '近三筆實登', value: '52.8 / 51.5 / 50.9' },
  ],
  imageUrl:
    initialImageUrl = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='200'%3E%3Crect width='100%25' height='100%25' fill='%23e5edff'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%231749d7'%3EMAIN%3C/text%3E%3C/svg%3E",
}: MaiCardProps) {
  const [title, setTitle] = useState(initialTitle);
  const [subTitle, setSubTitle] = useState(initialSubTitle);
  const [price, setPrice] = useState(initialPrice);
  const [pricePerPing, setPricePerPing] = useState(initialPricePerPing);
  const [stats, setStats] = useState(initialStats);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerateReport = () => {
    notify.success('系統提示：報告生成中...');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = notify.loading('正在分析房仲頁面...');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        setImageUrl(base64data); // Show the uploaded image

        // 模擬 API 呼叫 (實際應呼叫 /api/x-raymike)
        // const res = await fetch('/api/x-raymike', { method: 'POST', body: JSON.stringify({ image: base64data }) });

        setTimeout(() => {
          // 模擬偵測到的資料
          setTitle('偵測結果：帝寶 18F｜豪宅規格');
          setSubTitle('大安區 · 120.5 坪 · 屋齡 10 年');
          setPrice('NT$ 188,000,000');
          setPricePerPing('參考：156.0 萬/坪');
          setStats([
            { label: '議價建議', value: '-5% ~ -8%' },
            { label: '貸款月付', value: '≈ 45.2 萬' },
            { label: '近三筆實登', value: '155.0 / 152.3 / 148.9' },
          ]);
          notify.success('分析完成！已自動填入資訊', undefined, {
            id: toastId,
          });
        }, 1500);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      notify.error('分析失敗', undefined, { id: toastId });
    }
  };

  return (
    <section className={`${styles['uag-card']} ${styles['k-span-3']}`}>
      <div className={styles['uag-card-header']}>
        <div>
          <div className={styles['uag-card-title']}>手機報告生成器</div>
          <div className={styles['uag-card-sub']}>半屏小卡・行動優先</div>
        </div>
        <div className={styles['uag-actions']}>
          <input
            type="file"
            ref={fileInputRef}
            className={styles['file-input-hidden']}
            accept="image/*"
            onChange={handleFileChange}
          />
          <button
            className={`${styles['uag-btn']} ${styles['secondary']} ${styles['uag-btn-spacing-right']}`}
            onClick={handleImportClick}
          >
            匯入房仲頁面
          </button>
          <button
            className={`${styles['uag-btn']} ${styles['primary']}`}
            onClick={handleGenerateReport}
          >
            生成報告
          </button>
        </div>
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
                <div className={styles['mai-price-label']}>開價</div>
                <div className={styles['mai-price-value']}>{price}</div>
                <div className={styles['mai-price-unit']}>{pricePerPing}</div>
              </div>
              <ul className={styles['mai-stats']}>
                {stats.map((stat, index) => (
                  <li key={index}>
                    <span>{stat.label}</span>
                    <b>{stat.value}</b>
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles['mai-right']}>
              <div className={styles['mai-thumb']}>
                <img
                  alt="物件主圖"
                  src={imageUrl}
                  className={styles['mai-thumb-image']}
                />
              </div>
              <div className={styles['mai-mini']}>
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className={styles['mai-mini-placeholder']}></div>
                ))}
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
