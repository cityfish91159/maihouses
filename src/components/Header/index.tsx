import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="sticky top-0 z-[var(--z-header)] bg-white border-b border-[var(--border-default)] h-14">
      <div className="max-w-container mx-auto px-4 h-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" aria-label="邁房子首頁">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--brand-light)] shadow-[0_4px_10px_rgba(23,73,215,0.2)]" />
          <span className="font-black text-[var(--brand)] text-sm tracking-wide">邁房子</span>
        </Link>
        
        <nav className="flex items-center gap-4">
          <Link
            to="/auth/login"
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors"
            aria-label="登入"
          >
            登入
          </Link>
          <Link
            to="/auth/register"
            className="px-3 py-1.5 rounded-[var(--r-pill)] bg-[var(--brand)] text-[var(--brand-fg)] text-sm hover:opacity-90 transition-opacity"
            aria-label="註冊"
          >
            註冊
          </Link>
        </nav>
      </div>
    </header>
  )
}
