import { useState } from 'react'
import { FaBars, FaHome, FaUser, FaTimes, FaSearch } from 'react-icons/fa'
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
            <FaBars className="menu-icon" onClick={() => setModalOpen(!modalOpen)} />
            {modalOpen && <FaTimes className="menu-icon" onClick={() => setModalOpen(false)} />}
            <Link to="/auth/login" className="icon-button"><FaUser /></Link>
            <Link to="/" className="icon-button"><FaHome /></Link>
          </div>
        </div>
      </header>

      {/* 跑馬燈 Banner - 只放文字 */}
      <div className="hero-banner">
        <div className="marquee-container">
          <div className="marquee-content">
            <span className="marquee-text">
              買房這麼大的事，快上<span className="brand-highlight">邁鄰居</span>看未來的家完整評價、認識未來的鄰居
            </span>
          </div>
        </div>
      </div>

      {/* 搜索框區域 - 2025 流行設計 */}
      <div className="search-section">
        <div className="search-container">
          {/* 主搜索框 */}
          <div className="search-box-modern">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              className="search-input" 
              placeholder="輸入社區名稱、地址或捷運站..."
            />
            <button className="search-btn-primary">搜索</button>
          </div>
          
          {/* 快速篩選膠囊按鈕 */}
          <div className="filter-pills">
            <button 
              className="pill pill-community"
              onClick={() => openModal('社區評價', '查看真實住戶的社區評價與回饋')}
            >
              <span className="pill-icon">●</span>
              社區評價
            </button>
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
