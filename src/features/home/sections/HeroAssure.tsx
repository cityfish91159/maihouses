import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './HeroAssure.css'

type StepStatus = 'done' | 'active' | 'upcoming'

type AssureStep = {
  title: string
  subtitle: string
  status: StepStatus
}

const progressValue = 62

const assureSteps: AssureStep[] = [
  { title: '已看屋', subtitle: '完成現場帶看與基本紀錄', status: 'done' },
  { title: '已出價', subtitle: '要約與條件已留痕', status: 'done' },
  { title: '雙向簽署', subtitle: '平台簽署，雙方可回溯查驗', status: 'active' },
  { title: '身分驗證', subtitle: 'KYC 驗證與黑名單檢核', status: 'upcoming' },
  { title: '金流通知', subtitle: '代收代付與異常監控', status: 'upcoming' },
  { title: '交屋驗屋', subtitle: '交付清單與驗屋紀錄', status: 'upcoming' },
]

const assureChips = ['流程即時更新', '可疑變更自動警示']

export default function HeroAssure() {
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
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
      className="hero-assure-card assure-card"
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
          <div className="pct-chip" aria-label={`Progress: ${progressValue}%`}>
            <b>{progressValue}</b>
            <span>%</span>
          </div>
          <div className="pct-bar" aria-hidden="true">
            <i style={{ width: `${progressValue}%` }}></i>
          </div>
        </div>
      </header>

      <div className="body">
        <div className="steps">
          {assureSteps.map((step, index) => (
            <div
              className={`step${step.status !== 'upcoming' ? ` ${step.status}` : ''}`}
              key={`${step.title}-${step.status}`}
            >
              <div className="dot-wrap">
                <div className="dot"></div>
                {index < assureSteps.length - 1 && <div className="line"></div>}
              </div>
              <div className="cap">
                <div className="t">{step.title}</div>
                <div className="s">{step.subtitle}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="info" style={{ border: '1px dashed #00385a' }}>
          <div className="lock">✔</div>
          <div>
            <b style={{ color: '#00385a' }}>你的權益：</b>
            完成<b>身分驗證</b>並開啟<b>金流通知</b>；所有簽署與溝通都在平台留痕，可回溯可查證。
            <div className="chips">
              {assureChips.map((chip) => (
                <span 
                  className="chip" 
                  key={chip}
                  style={{ 
                    border: '1.5px solid #00385a',
                    color: '#00385a',
                    backgroundColor: 'rgba(0, 56, 90, 0.08)'
                  }}
                >
                  {chip}
                </span>
              ))}
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
