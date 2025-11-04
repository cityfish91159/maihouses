import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './HeroAssure.css'

export default function HeroAssure() {
  const [progress] = useState(62)
  
  const steps = [
    { id: 1, name: '已看屋', status: 'done', icon: '✓' },
    { id: 2, name: '已出價', status: 'done', icon: '✓' },
    { id: 3, name: '雙向簽署', status: 'active', icon: '✍️' },
    { id: 4, name: '身分驗證', status: 'next', icon: '💳' },
    { id: 5, name: '貸款服務', status: 'pending', icon: '💰' },
    { id: 6, name: '交屋驗屋', status: 'pending', icon: '🔍' },
  ]

  return (
    <section 
      aria-label="安心留痕服務卡片" 
      className="assurance-card"
      style={{
        borderRadius: '14px',
        overflow: 'visible'
      }}
    >
      {/* 進度條裝飾 */}
      <div className="confetti" style={{
        pointerEvents: 'none',
        position: 'absolute',
        inset: 0,
        zIndex: 2
      }}></div>

      {/* 進度標題 */}
      <div className="assurance-header">
        <div className="assurance-title">安心留痕服務</div>
        <div className="assurance-progress-text">
          進度{' '}
          <span className="progress-badge">{progress}</span>%
        </div>
      </div>

      {/* 步驟進度圖 */}
      <div className="assurance-body">
        <div className="steps-grid">
          {steps.map((step) => (
            <div key={step.id} className={`step step-${step.status}`}>
              <div className="step-icon">{step.icon}</div>
              <div className="step-caption">{step.name}</div>
            </div>
          ))}
        </div>

        {/* 保護權益說明框 */}
        <div className="info-box">
          <div className="info-lock">🔒</div>
          <div>
            <div className="info-title">
              <strong style={{ color: 'var(--brand)' }}>你的權益：</strong>
              <strong>完成身分驗證，並開啟貸款服務；所有簽署與溝通都在平台留痕，可回溯可查證。</strong>
            </div>
            <div className="info-chips">
              <span className="chip">流程即時更新</span>
              <span className="chip">可疑變更自動警示</span>
            </div>
          </div>
        </div>
      </div>

      {/* 進度條 */}
      <div className="progress-bar-container">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${progress}%` }}
        ></div>
        <span 
          className="progress-dot" 
          style={{ left: `calc(${progress}% - 7px)` }}
        ></span>
      </div>

      {/* 底部按鈕 */}
      <div className="assurance-footer">
        <span className="footer-text">了解每一步保護了什麼</span>
        <Link to="/assure" className="detail-button">
          詳讀保障內容
        </Link>
      </div>
    </section>
  )
}
