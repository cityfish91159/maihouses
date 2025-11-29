import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { trackEvent } from '../../services/analytics'
import { signUp, signInWithGoogle } from '../../services/auth'
import Header from '../../components/Header/Header'
import MascotInteractive from '../../components/MascotInteractive'

export default function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // 追蹤輸入狀態
  const [isTypingEmail, setIsTypingEmail] = useState(false)
  const [isTypingPassword, setIsTypingPassword] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      try {
        trackEvent('register_submit', '/auth/register')
      } catch (e) {
        console.warn('Analytics failed', e)
      }
      
      await signUp(email, password)
      setSuccess(true)
      setTimeout(() => navigate('/auth/login'), 2000)
    } catch (err: any) {
      setError(err.message || '註冊失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      await signInWithGoogle()
    } catch (err: any) {
      setError(err.message || 'Google 註冊失敗')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-page)] font-sans">
      <Header />

      <main className="container mx-auto px-4 py-12 md:py-20 flex justify-center items-center">
        <div className="w-full max-w-[420px] bg-white rounded-[24px] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] p-8 md:p-10 border border-slate-100 relative overflow-hidden">
          
          {/* 互動公仔 */}
          <div className="flex justify-center -mt-4 mb-4">
            <MascotInteractive
              size="md"
              isTypingEmail={isTypingEmail}
              isTypingPassword={isTypingPassword}
              hasError={!!error}
              isLoading={loading}
              isSuccess={success}
            />
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[var(--brand)] mb-2">加入邁房子</h1>
            <p className="text-[var(--text-secondary)] text-sm">建立帳號，開始您的找房之旅</p>
          </div>
      
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-100 p-4 text-red-600 text-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
      
          {success && (
            <div className="mb-6 rounded-xl bg-green-50 border border-green-100 p-4 text-green-600 text-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              註冊成功! 請檢查您的信箱確認帳號，稍後將跳轉到登入頁面...
            </div>
          )}
      
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label htmlFor="register-email" className="block text-sm font-bold text-[var(--text-primary)] mb-1.5 ml-1">Email</label>
              <input
                id="register-email"
                name="email"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-[var(--text-primary)] placeholder:text-slate-400 focus:bg-white focus:border-[var(--brand-light)] focus:ring-4 focus:ring-[var(--brand-light)]/10 transition-all outline-none"
                type="email"
                placeholder="name@example.com"
                aria-label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => { setIsTypingEmail(true); setIsTypingPassword(false); }}
                onBlur={() => setIsTypingEmail(false)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="register-password" className="block text-sm font-bold text-[var(--text-primary)] mb-1.5 ml-1">密碼</label>
              <input
                id="register-password"
                name="password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-[var(--text-primary)] placeholder:text-slate-400 focus:bg-white focus:border-[var(--brand-light)] focus:ring-4 focus:ring-[var(--brand-light)]/10 transition-all outline-none"
                type="password"
                placeholder="至少 6 個字元"
                aria-label="密碼"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => { setIsTypingPassword(true); setIsTypingEmail(false); }}
                onBlur={() => setIsTypingPassword(false)}
                minLength={6}
                required
                autoComplete="new-password"
              />
            </div>
            <button 
              type="submit"
              disabled={loading || success}
              className="w-full rounded-full bg-[var(--brand)] px-4 py-3.5 text-white font-bold text-[15px] shadow-lg shadow-[var(--brand)]/20 hover:bg-[#002d4a] hover:shadow-xl hover:shadow-[var(--brand)]/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {(() => {
                if (loading) return (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    註冊中...
                  </span>
                )
                if (success) return '✓ 註冊成功'
                return '建立帳號'
              })()}
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
            disabled={loading || success}
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
            使用 Google 註冊
          </button>

          <div className="mt-8 text-center text-[15px] text-[var(--text-secondary)]">
            已經有帳號？ <Link to="/auth/login" className="text-[var(--brand-light)] font-bold hover:text-[var(--brand)] hover:underline transition-colors">立即登入</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
