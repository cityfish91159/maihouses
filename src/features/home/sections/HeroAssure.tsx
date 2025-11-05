import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import './HeroAssure.css'

export default function HeroAssure() {
  const [progress] = useState(62)
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={cardRef}
      className="card"
      aria-label="安心保證流程"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
      }}
    >
      <header className="head">
        <div className="ttl">
          <div className="shield">🔒</div>
          <div>
            <h3 className="title">安心保證流程</h3>
            <div className="subtitle">每一步都有紀錄與保障</div>
          </div>
        </div>
        <div className="pct">
          <div className="pct-chip" aria-label={`Progress: ${progress}%`}><b>{progress}</b><span>%</span></div>
          <div className="pct-bar" aria-hidden="true"><i style={{ width: `${progress}%` }}></i></div>
        </div>
      </header>

      <div className="body">
        <div className="steps">
          <div className="step done">
            <div className="dot-wrap"><div className="dot"></div><div className="line"></div></div>
            <div className="cap"><div className="t">已看屋</div><div className="s">完成現場帶看與基本紀錄</div></div>
          </div>
          <div className="step done">
            <div className="dot-wrap"><div className="dot"></div><div className="line"></div></div>
            <div className="cap"><div className="t">已出價</div><div className="s">要約與條件已留痕</div></div>
          </div>
          <div className="step active">
            <div className="dot-wrap"><div className="dot"></div><div className="line"></div></div>
            <div className="cap"><div className="t">雙向簽署</div><div className="s">平台簽署，雙方可回溯查驗</div></div>
          </div>
          <div className="step">
            <div className="dot-wrap"><div className="dot"></div><div className="line"></div></div>
            <div className="cap"><div className="t">身分驗證</div><div className="s">KYC 驗證與黑名單檢核</div></div>
          </div>
          <div className="step">
            <div className="dot-wrap"><div className="dot"></div><div className="line"></div></div>
            <div className="cap"><div className="t">金流通知</div><div className="s">代收代付與異常監控</div></div>
          </div>
          <div className="step">
            <div className="dot-wrap"><div className="dot"></div></div>
            <div className="cap"><div className="t">交屋驗屋</div><div className="s">交付清單與驗屋紀錄</div></div>
          </div>
        </div>

        <div className="info">
          <div className="lock">✔</div>
          <div>
            <b style={{ color: 'var(--brand)' }}>你的權益：</b>
            完成<b>身分驗證</b>並開啟<b>金流通知</b>；所有簽署與溝通都在平台留痕，可回溯可查證。
            <div className="chips">
              <span className="chip">流程即時更新</span>
              <span className="chip">可疑變更自動警示</span>
            </div>
          </div>
        </div>
      </div>

      <footer className="foot">
        <span className="hint">了解每一步保護了什麼</span>
        <Link to="/assure" className="btn" aria-label="Read more about the protection details">
          詳讀保障內容
        </Link>
      </footer>
    </section>
  )
}
