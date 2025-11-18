import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Header.css'

export default function Header() {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalContent, setModalContent] = useState({ title: '', body: '' })

  const openModal = (title: string, body: string) => {
    setModalContent({ title, body })
    setModalOpen(true)
  }

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <div className="brand">
            <div className="mark" />
            <span className="brand-name">邁房子</span>
            <span className="brand-slogan">讓家，不只是地址</span>
          </div>
          <div className="auth">
            {/* 使用者提供：右上三欄（房地產表列｜登入｜註冊）CSS，原樣貼入 */}
            <span
              dangerouslySetInnerHTML={{
                __html: `
<style>
  :root{
    --mh-brand:#1749D7;               /* 你的品牌藍 */
    --mh-text:#0b1220;
    --mh-hair:rgba(11,18,32,.08);
    --mh-pill-bg:rgba(255,255,255,.72);
    --mh-pill-hover:rgba(255,255,255,.9);
    --mh-blur:12px;
    --mh-radius:14px;
    --mh-t:150ms ease;                /* 微互動 150ms */
  }
  .mh-nav-right{ display:flex; gap:10px; align-items:center; }
  .mh-pill{
    --x:14px; --y:10px;
    display:inline-flex; align-items:center; gap:8px;
    padding:var(--y) var(--x);
    min-height:44px;                  /* base desktop height */
    border-radius:var(--mh-radius);
    background:var(--mh-pill-bg);
    backdrop-filter:blur(var(--mh-blur)); -webkit-backdrop-filter:blur(var(--mh-blur));
    border:1px solid var(--mh-hair);
    color:var(--mh-text); text-decoration:none;
    font-size:14px; font-weight:600; line-height:1;
    transition:transform var(--mh-t), background var(--mh-t), box-shadow var(--mh-t), border-color var(--mh-t);
    box-shadow:0 0 0 0 rgba(23,73,215,0);
  }
  .mh-pill:hover{ background:var(--mh-pill-hover); transform:translateY(-1px); box-shadow:0 6px 16px rgba(23,73,215,.10); border-color:rgba(23,73,215,.18); }
  .mh-pill:active{ transform:translateY(0); box-shadow:0 2px 8px rgba(23,73,215,.12); }
  .mh-pill:focus-visible{ outline:none; box-shadow:0 0 0 3px rgba(23,73,215,.20); border-color:rgba(23,73,215,.32); }
  .mh-pill--primary{ background:linear-gradient(180deg, rgba(23,73,215,.08), rgba(23,73,215,.02)); border-color:rgba(23,73,215,.22); }
  .mh-pill--primary:hover{ background:linear-gradient(180deg, rgba(23,73,215,.12), rgba(23,73,215,.04)); }
  .mh-icon{ width:18px; height:18px; opacity:.9; }
  .mh-icon path{ fill:currentColor; }
  /* 手機版縮小30% (高度/字級/padding/icon) */
  @media (max-width:640px){
    .mh-pill{ font-size:10px; --x:10px; --y:7px; min-height:31px; gap:6px; }
    .mh-icon{ width:14px; height:14px; }
  }
  /* 桌機版放大字級 +4px，增 padding 與 icon 尺寸 */
  @media (min-width:1024px){
    .mh-pill{ font-size:18px; --x:18px; --y:12px; min-height:48px; }
    .mh-icon{ width:22px; height:22px; }
  }
</style>
                `.trim()
              }}
            />

            {/* 使用者提供：右上三欄（房地產表列｜登入｜註冊）HTML，原樣貼入（HashRouter 版本 href） */}
            <span
              dangerouslySetInnerHTML={{
                __html: `
<!-- 右上三欄（房地產表列｜登入｜註冊） START -->
<nav class="mh-nav-right" aria-label="主要動作">
  <a class="mh-pill" href="/maihouses/property.html">
    <svg class="mh-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z"/>
    </svg>
    <span>房地產表列</span>
  </a>
  <a class="mh-pill" href="/maihouses/auth.html?mode=login">
    <svg class="mh-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 17l5-5-5-5v3H3v4h7v3zm9-12h-8v2h8v10h-8v2h8a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/>
    </svg>
    <span>登入</span>
  </a>
  <a class="mh-pill mh-pill--primary" href="/maihouses/auth.html?mode=signup">
    <svg class="mh-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm-9 9a9 9 0 0 1 18 0z"/>
    </svg>
    <span>註冊</span>
  </a>
</nav>
<!-- 右上三欄（房地產表列｜登入｜註冊） END -->
                `.trim()
              }}
            />
          </div>
        </div>
      </header>

      {/* Panel 卡片 - 包含跑馬燈、搜索框、膠囊按鈕 */}
      <div className="panel">
        <div className="marquee-container">
          買房這麼大的事，先到 <b className="brand-highlight">邁鄰居</b> 為未來的家查口碑、找評價，最放心！
        </div>

        <div className="search-container">
          {/* 主搜索框 */}
          <div className="search-box-modern">
            <label htmlFor="search-input" className="sr-only">搜尋框</label>
            <input 
              type="text" 
              id="search-input"
              name="search-query"
              className="search-input" 
              placeholder="輸入社區名稱、地址或捷運站..."
              aria-label="搜尋框"
              onKeyDown={(e) => e.key === 'Enter' && console.log('Search triggered')}
            />
            <button className="search-btn-primary" onClick={() => console.log('Search triggered')}>搜索</button>
          </div>
          
          {/* 快速篩選膠囊按鈕 */}
          <div className="filter-pills">
            <a 
              href="/maihouses/community-wall_mvp.html"
              className="pill pill-community"
              style={{ textDecoration: 'none' }}
            >
              <span className="pill-icon">●</span>
              社區評價
            </a>
            <button 
              className="pill pill-location"
              onClick={() => openModal('房仲專區', '專業房仲服務與物件推薦')}
            >
              <span className="pill-icon">●</span>
              房仲專區
            </button>
            <button 
              className="pill pill-transit"
              onClick={() => openModal('邁鄰居', '認識您的鄰居，建立社區連結')}
            >
              <span className="pill-icon">●</span>
              邁鄰居
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalContent.title}</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>{modalContent.body}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
