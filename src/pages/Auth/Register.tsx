import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { trackEvent } from '../../services/analytics'
import { useAuth } from '../../hooks/useAuth'
import { signUp } from '../../services/auth'

export default function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      trackEvent('register_submit', '/auth/register')
      await signUp(email, password)
      setSuccess(true)
      setTimeout(() => navigate('/auth/login'), 2000)
    } catch (err: any) {
      setError(err.message || '註冊失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto mt-8 max-w-md rounded-[var(--r-lg)] bg-white p-6 shadow-[var(--shadow-card)]">
      <h1 className="mb-4 text-xl font-semibold">註冊</h1>
      
      {error && (
        <div className="mb-4 rounded-[var(--r-md)] bg-red-50 border border-red-200 p-3 text-red-600 text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 rounded-[var(--r-md)] bg-green-50 border border-green-200 p-3 text-green-600 text-sm">
          註冊成功! 請檢查您的信箱確認帳號,稍後將跳轉到登入頁面...
        </div>
      )}
      
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          id="register-email"
          name="email"
          className="w-full rounded-[var(--r-md)] border border-[var(--border-default)] p-2"
          type="email"
          placeholder="Email"
          aria-label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          id="register-password"
          name="password"
          className="w-full rounded-[var(--r-md)] border border-[var(--border-default)] p-2"
          type="password"
          placeholder="密碼 (至少6個字元)"
          aria-label="密碼"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        <button 
          type="submit"
          disabled={loading || success}
          className="w-full rounded-[var(--r-pill)] bg-[var(--brand)] px-4 py-2 text-[var(--brand-fg)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '註冊中...' : success ? '註冊成功' : '註冊'}
        </button>
      </form>
    </section>
  )
}
