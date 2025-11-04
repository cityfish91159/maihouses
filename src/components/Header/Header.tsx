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
          <Link to="/" className="brand">
            <div className="mark" />
            <span>邁房子</span>
          </Link>
          <div className="auth">
            <Link to="/auth/login" className="login">登入</Link>
            <Link to="/auth/register" className="signup">註冊</Link>
          </div>
        </div>
      </header>

      <div className="hero-search-wrap">
        <div className="hero-search">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="搜尋社區、地址..." 
              className="search-input"
            />
            <button className="find-btn">找房</button>
          </div>
        </div>
        <div className="pills">
          <button 
            className="pill"
            onClick={() => openModal('社區評價', '查看真實住戶的社區評價與回饋')}
          >
            社區評價
          </button>
          <button 
            className="pill"
            onClick={() => openModal('房仲專區', '專業房仲服務與物件推薦')}
          >
            房仲專區
          </button>
          <button 
            className="pill"
            onClick={() => openModal('邁鄰居', '認識您的鄰居，建立社區連結')}
          >
            邁鄰居
          </button>
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
