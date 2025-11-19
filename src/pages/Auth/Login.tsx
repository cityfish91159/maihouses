import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { trackEvent } from '../../services/uag'
import { signIn } from '../../services/auth'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      trackEvent('login_submit', '/auth/login')
      await signIn(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.message || '登入失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto mt-8 max-w-md rounded-[var(--r-lg)] bg-white p-6 shadow-[var(--shadow-card)]">
      <h1 className="mb-4 text-xl font-semibold">登入</h1>
      
      {error && (
        <div className="mb-4 rounded-[var(--r-md)] bg-red-50 border border-red-200 p-3 text-red-600 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={onSubmit} className="space-y-3">
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
        />
        <button 
          type="submit"
          disabled={loading}
          className="w-full rounded-[var(--r-pill)] bg-[var(--brand)] px-4 py-2 text-[var(--brand-fg)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '登入中...' : '登入'}
        </button>
      </form>
    </section>
  )
}
