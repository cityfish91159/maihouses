import { Link } from 'react-router-dom'
import './Header.css'

export default function Header() {
  return (
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
  )
}
