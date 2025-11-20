import React from 'react';
import { Listing, FeedPost } from '../types/uag.types';
import styles from '../UAG.module.css';

interface ListingFeedProps {
  listings: Listing[];
  feed: FeedPost[];
}

export default function ListingFeed({ listings, feed }: ListingFeedProps) {
  return (
    <>
      {/* [3] Listings */}
      <section className={`${styles['uag-card']} ${styles['k-span-3']}`}>
        <div className={styles['uag-card-header']}>
          <div><div className={styles['uag-card-title']}>我的房源總覽</div><div className={styles['uag-card-sub']}>即時掌握曝光、點擊與收藏</div></div>
        </div>
        <div id="listing-container">
          {listings.length === 0 ? (
            <div style={{ padding: '12px', fontSize: '13px', color: '#94a3b8' }}>尚無房源資料。</div>
          ) : (
            listings.map((item, idx) => (
              <article className={styles['listing-item']} key={idx}>
                <div className={styles['l-thumb']} style={{ background: item.thumbColor }}></div>
                <div>
                  <div className={styles['l-title']}>{item.title}</div>
                  <div className={styles['l-tags']}>
                    {item.tags?.map((t, i) => <span className={styles['l-tag']} key={i}>{t}</span>)}
                  </div>
                  <div className={styles['l-kpi']}>
                    <span>曝光 <b>{item.view}</b></span>
                    <span>點擊 <b>{item.click}</b></span>
                    <span>收藏 <b>{item.fav}</b></span>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {/* [4] Feed */}
      <section className={`${styles['uag-card']} ${styles['k-span-3']}`}>
        <div className={styles['uag-card-header']}>
          <div><div className={styles['uag-card-title']}>社區牆＆真實口碑</div><div className={styles['uag-card-sub']}>用真實交流建立信任</div></div>
          <div className={styles['uag-actions']}><button className={styles['uag-btn']}>貼文</button></div>
        </div>
        <div id="feed-container">
          {feed.length === 0 ? (
            <div style={{ padding: '12px', fontSize: '13px', color: '#94a3b8' }}>尚無社區牆互動。</div>
          ) : (
            feed.map((post, idx) => (
              <article className={styles['feed-post']} key={idx}>
                <div className={styles['fp-title']}>{post.title}</div>
                <div className={styles['fp-meta']}>{post.meta}</div>
                <div className={styles['fp-body']}>{post.body}</div>
              </article>
            ))
          )}
        </div>
      </section>
    </>
  );
}
