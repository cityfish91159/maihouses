import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Header.css'

type QuickAction = {
  label: string
  href: string
  iconPath: string
  primary?: boolean
}

type FilterPill =
  | {
      id: string
      label: string
      icon: string
      type: 'link'
      href: string
    }
  | {
      id: string
      label: string
      icon: string
      type: 'modal'
      modal: { title: string; body: string }
    }

const marqueeSegments: Array<{ type: 'text' | 'highlight'; value: string }> = [
  { type: 'text', value: '買房這麼大的事，先到 ' },
  { type: 'highlight', value: '邁鄰居' },
  { type: 'text', value: ' 為未來的家查口碑、找評價，最放心！' },
]

const quickActions: QuickAction[] = [
  {
    label: '房地產表列',
    href: '/maihouses/property.html',
    iconPath: 'M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z',
  },
  {
    label: '登入',
    href: '/auth/login',
    iconPath:
      'M10 17l5-5-5-5v3H3v4h7v3zm9-12h-8v2h8v10h-8v2h8a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z',
  },
  {
    label: '註冊',
    href: '/auth/register',
    iconPath: 'M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm-9 9a9 9 0 0 1 18 0z',
    primary: true,
  },
]

const filterPills: FilterPill[] = [
  {
    id: 'community',
    label: '社區評價',
    icon: '●',
    type: 'link',
    href: '/maihouses/community-wall_mvp.html',
  },
  {
    id: 'agent',
    label: '房仲專區',
    icon: '●',
    type: 'modal',
    modal: { title: '房仲專區', body: '專業房仲服務與物件推薦' },
  },
  {
    id: 'neighbor',
    label: '邁鄰居',
    icon: '●',
    type: 'modal',
    modal: { title: '邁鄰居', body: '認識您的鄰居，建立社區連結' },
  },
]

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
            <nav className="mh-nav-right" aria-label="主要動作">
              {quickActions.map((action) => {
                const isStatic = action.href.endsWith('.html')
                const className = `mh-pill${action.primary ? ' mh-pill--primary' : ''}`
                const content = (
                  <>
                    <svg className="mh-icon" viewBox="0 0 24 24" aria-hidden="true">
                      <path d={action.iconPath} />
                    </svg>
                    <span className="mh-label">{action.label}</span>
                  </>
                )

                if (isStatic) {
                  return (
                    <a key={action.label} className={className} href={action.href}>
                      {content}
                    </a>
                  )
                }

                return (
                  <Link key={action.label} className={className} to={action.href}>
                    {content}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Panel 卡片 - 包含跑馬燈、搜索框、膠囊按鈕 */}
      <div className="panel">
        <div className="marquee-container" aria-live="polite">
          {marqueeSegments.map((segment, index) =>
            segment.type === 'highlight' ? (
              <b className="brand-highlight" key={segment.value + index}>
                {segment.value}
              </b>
            ) : (
              <span key={segment.value + index}>{segment.value}</span>
            )
          )}
        </div>

        <div className="search-container">
          {/* 主搜索框 */}
          <div className="search-box-modern">
            <label htmlFor="search-input" className="sr-only">
              搜尋框
            </label>
            <input
              type="text"
              id="search-input"
              name="search-query"
              className="search-input"
              placeholder="輸入社區名稱、地址或捷運站..."
              aria-label="搜尋框"
              onKeyDown={(e) => e.key === 'Enter' && console.log('Search triggered')}
            />
            <button className="search-btn-primary" onClick={() => console.log('Search triggered')}>
              搜索
            </button>
          </div>

          {/* 快速篩選膠囊按鈕 */}
          <div className="filter-pills">
            {filterPills.map((pill) => {
              if (pill.type === 'link') {
                return (
                  <a key={pill.id} href={pill.href} className="pill" style={{ textDecoration: 'none' }}>
                    <span className="pill-icon" aria-hidden="true">
                      {pill.icon}
                    </span>
                    {pill.label}
                  </a>
                )
              }

              return (
                <button
                  key={pill.id}
                  className="pill"
                  type="button"
                  onClick={() => openModal(pill.modal.title, pill.modal.body)}
                >
                  <span className="pill-icon" aria-hidden="true">
                    {pill.icon}
                  </span>
                  {pill.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalContent.title}</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>
                ×
              </button>
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
