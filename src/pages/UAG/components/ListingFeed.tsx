import React from 'react';
import { Listing, FeedPost } from '../mockData';

interface ListingFeedProps {
  listings: Listing[];
  feed: FeedPost[];
}

export default function ListingFeed({ listings, feed }: ListingFeedProps) {
  return (
    <>
      {/* [3] Listings */}
      <section className="uag-card k-span-3">
        <div className="uag-card-header">
          <div><div className="uag-card-title">我的房源總覽</div><div className="uag-card-sub">即時掌握曝光、點擊與收藏</div></div>
        </div>
        <div id="listing-container">
          {listings.length === 0 ? (
            <div style={{ padding: '12px', fontSize: '13px', color: '#94a3b8' }}>尚無房源資料。</div>
          ) : (
            listings.map((item, idx) => (
              <article className="listing-item" key={idx}>
                <div className="l-thumb" style={{ background: item.thumbColor }}></div>
                <div>
                  <div className="l-title">{item.title}</div>
                  <div className="l-tags">
                    {item.tags.map((t, i) => <span className="l-tag" key={i}>{t}</span>)}
                  </div>
                  <div className="l-kpi">
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
      <section className="uag-card k-span-3">
        <div className="uag-card-header">
          <div><div className="uag-card-title">社區牆＆真實口碑</div><div className="uag-card-sub">用真實交流建立信任</div></div>
          <div className="uag-actions"><button className="uag-btn">貼文</button></div>
        </div>
        <div id="feed-container">
          {feed.length === 0 ? (
            <div style={{ padding: '12px', fontSize: '13px', color: '#94a3b8' }}>尚無社區牆互動。</div>
          ) : (
            feed.map((post, idx) => (
              <article className="feed-post" key={idx}>
                <div className="fp-title">{post.title}</div>
                <div className="fp-meta">{post.meta}</div>
                <div className="fp-body">{post.body}</div>
              </article>
            ))
          )}
        </div>
      </section>
    </>
  );
}
