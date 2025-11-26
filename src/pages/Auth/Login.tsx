import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { trackEvent } from '../../services/analytics'
import { useAuth } from '../../hooks/useAuth'
import { signIn, signInWithGoogle } from '../../services/auth'
import Header from '../../components/Header/Header'

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
    <div className="min-h-screen bg-[var(--bg-page)] font-sans">
      <Header />

      <main className="container mx-auto px-4 py-12 md:py-20 flex justify-center items-center">
        <div className="w-full max-w-[420px] bg-white rounded-[24px] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] p-8 md:p-10 border border-slate-100">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[var(--brand)] mb-2">歡迎回來</h1>
            <p className="text-[var(--text-secondary)] text-sm">登入以繼續使用邁房子服務</p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-100 p-4 text-red-600 text-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-sm font-bold text-[var(--text-primary)] mb-1.5 ml-1">Email</label>
              <input
                id="login-email"
                name="email"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-[var(--text-primary)] placeholder:text-slate-400 focus:bg-white focus:border-[var(--brand-light)] focus:ring-4 focus:ring-[var(--brand-light)]/10 transition-all outline-none"
                type="email"
                placeholder="name@example.com"
                aria-label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5 ml-1">
                <label htmlFor="login-password" className="block text-sm font-bold text-[var(--text-primary)]">密碼</label>
                <a href="#" className="text-xs font-semibold text-[var(--brand-light)] hover:text-[var(--brand)] transition-colors">忘記密碼？</a>
              </div>
              <input
                id="login-password"
                name="password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-[var(--text-primary)] placeholder:text-slate-400 focus:bg-white focus:border-[var(--brand-light)] focus:ring-4 focus:ring-[var(--brand-light)]/10 transition-all outline-none"
                type="password"
                placeholder="••••••••"
                aria-label="密碼"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[var(--brand)] px-4 py-3.5 text-white font-bold text-[15px] shadow-lg shadow-[var(--brand)]/20 hover:bg-[#002d4a] hover:shadow-xl hover:shadow-[var(--brand)]/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  登入中...
                </span>
              ) : '登入'}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-slate-400 font-medium">或</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full rounded-full border border-slate-200 bg-white px-4 py-3 text-[var(--text-primary)] font-bold text-[15px] hover:bg-slate-50 hover:border-slate-300 transition-all active:bg-slate-100 disabled:opacity-70 flex items-center justify-center gap-3 group"
          >
            <svg className="h-5 w-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
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
          </button>

          <div className="mt-8 text-center text-[15px] text-[var(--text-secondary)]">
            還沒有帳號？ <Link to="/auth/register" className="text-[var(--brand-light)] font-bold hover:text-[var(--brand)] hover:underline transition-colors">立即註冊</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
