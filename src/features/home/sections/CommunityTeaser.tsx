import '../../../styles/tokens.css'

export default function CommunityTeaser() {
  // 靜態 HTML（含樣式由 tokens.css 提供，僅此檔案引用，避免全域影響）
  return (
    <div className="community-teaser-html">
      {/* 名稱卡 */}
      <section className="section">
        <div className="header">
          <div>
            <h2 className="title">惠宇上晴｜社區牆</h2>
            <p className="sub">真實住戶互動 × 社區口碑</p>
          </div>
          <span className="badge">已加入 88 位</span>
        </div>
        <div className="tabs">
          <div className="tab active">全部</div>
          <div className="tab">公告</div>
          <div className="tab">精華區</div>
        </div>
      </section>

      {/* 社區熱帖 */}
      <section className="section">
        <div className="header"><h3 className="title">社區熱帖</h3></div>
        <div className="tabs" style={{ marginTop: 2 }}>
          <div className="tab active">全部</div>
          <div className="tab">公開牆</div>
          <div className="tab">私密牆</div>
        </div>

        <div className="post">
          <div className="dot" />
          <div className="content">
            <b>有人要團購掃地機嗎？</b> 這款 iRobot 打折，滿 5 台有團購價～
            <div className="post-actions">
              <button className="action-btn" type="button">❤️ 讚</button>
              <button className="action-btn" type="button">💬 回覆</button>
              <button className="action-btn" type="button">⭐ 收藏</button>
            </div>
          </div>
        </div>

        <div className="post">
          <div className="dot" />
          <div className="content">
            <b>漏水處理已完成</b> 昨天 12F-B 的浴室滲水，已由管委會協助修復與記錄。
            <div className="post-actions">
              <button className="action-btn" type="button">👍 有幫助</button>
            </div>
          </div>
        </div>

        <div className="post">
          <div className="dot" />
          <div className="content">
            <b>停車位交流</b> 我有 B2-128 想與 B1 交換，意者留言～
            <div className="post-actions">
              <button className="action-btn" type="button">💬 聯繫</button>
              <button className="action-btn" type="button">⭐ 追蹤</button>
            </div>
          </div>
        </div>
      </section>

      {/* 社區評價 */}
      <section className="section">
        <div className="header"><h3 className="title">社區評價</h3></div>

        <article className="review">
          <div className="av2">J</div>
          <div>
            <div className="name">J***｜B 棟住戶 <span className="rating"><span className="star">★★★★★</span></span></div>
            <div className="tags">
              <span className="tag">#物業/管理</span>
            </div>
            <p>公設維護得乾淨，假日草皮有人整理。之前反映停車動線，管委會一週內就公告改善。</p>
          </div>
        </article>

        <article className="review">
          <div className="av2">W</div>
          <div>
            <div className="name">W***｜12F 住戶 <span className="rating"><span className="star">★★★★☆</span></span></div>
            <div className="tags">
              <span className="tag">#噪音</span>
            </div>
            <p>住起來整體舒服，但面向上路的低樓層在上下班尖峰車聲明顯，喜靜的買家可考慮中高樓層。</p>
          </div>
        </article>

        <article className="review">
          <div className="av2">L</div>
          <div>
            <div className="name">L***｜C 棟住戶 <span className="rating"><span className="star">★★★★☆</span></span></div>
            <div className="tags">
              <span className="tag">#漏水/壁癌</span>
            </div>
            <p>頂樓排水設計不錯，颱風天也沒有積水問題。不過垃圾車時間稍晚，家裡偶爾會有下水道味。</p>
          </div>
        </article>

        <p className="hint">還有 3 則評價未顯示，<b>註冊會員看全部評價</b>。</p>
      </section>

      {/* 準住戶提問 */}
      <section className="section">
        <div className="header"><h3 className="title">準住戶提問</h3></div>
        <div className="post">
          <div className="dot" />
          <div className="content">
            12J 視野好嗎？
            <div className="tabs" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="tab" style={{ background: 'rgba(230, 240, 255, 0.6)', borderColor: '#e8f0f8', color: '#1749d7' }}>幫忙回覆</div>
            </div>
          </div>
        </div>
        <div className="post">
          <div className="dot" />
          <div className="content">
            頂樓會有漏水問題嗎？
            <div className="tabs" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="tab" style={{ background: 'rgba(230, 240, 255, 0.6)', borderColor: '#e8f0f8', color: '#1749d7' }}>幫忙回覆</div>
            </div>
          </div>
        </div>
        <div className="post">
          <div className="dot" />
          <div className="content">
            管委會收垃圾時間是幾點？
            <div className="tabs" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="tab" style={{ background: 'rgba(230, 240, 255, 0.6)', borderColor: '#e8f0f8', color: '#1749d7' }}>幫忙回覆</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
