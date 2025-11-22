import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { trackEvent } from '../../services/analytics'
import { useAuth } from '../../hooks/useAuth'
import { signIn, signInWithGoogle } from '../../services/auth'

export default function Login() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      navigate('/')
    }
  }, [user, navigate])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      try {
        trackEvent('login_submit', '/auth/login')
      } catch (e) {
        console.warn('Analytics failed', e)
      }
      
      await signIn(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.message || '登入失敗')
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      await signInWithGoogle()
    } catch (err: any) {
      setError(err.message || 'Google 登入失敗')
      setLoading(false)
    }
  }

  return (
    <section className="relative z-10 mx-auto mt-8 max-w-md rounded-[var(--r-lg)] bg-white p-6 shadow-[var(--shadow-card)]">
      <h1 className="mb-4 text-xl font-semibold">登入</h1>
      
      {error && (
        <div className="mb-4 rounded-[var(--r-md)] bg-red-50 border border-red-200 p-3 text-red-600 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={onSubmit} className="space-y-3 relative z-10">
        <input
          id="login-email"
          name="email"
          className="w-full rounded-[var(--r-md)] border border-[var(--border-default)] p-2"
          type="email"
          placeholder="Email"
          aria-label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <input
          id="login-password"
          name="password"
          className="w-full rounded-[var(--r-md)] border border-[var(--border-default)] p-2"
          type="password"
          placeholder="密碼"
          aria-label="密碼"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        <button 
          type="submit"
          disabled={loading}
          className="w-full cursor-pointer rounded-[var(--r-pill)] bg-[var(--brand)] px-4 py-2 text-[var(--brand-fg)] disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          {loading ? '登入中...' : '登入'}
        </button>
      </form>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border-default)]"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-[var(--text-secondary)]">或</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading}
        className="relative z-10 w-full rounded-[var(--r-pill)] border border-[var(--border-default)] bg-white px-4 py-2 text-[var(--text-primary)] hover:bg-gray-50 disabled:opacity-50"
      >
        <span className="flex items-center justify-center gap-2">
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          使用 Google 登入
        </span>
      </button>

      <div className="mt-4 text-center text-sm text-[var(--text-secondary)]">
        還沒有帳號？ <Link to="/auth/register" className="text-[var(--brand)] hover:underline">立即註冊</Link>
      </div>
    </section>
  )
}
