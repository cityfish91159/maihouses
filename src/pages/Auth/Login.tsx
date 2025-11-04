import { trackEvent } from '../../services/uag'

export default function Login() {
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    trackEvent('login_submit', '/auth/login')
    alert('已送出（Demo）')
  }

  return (
    <section className="max-w-md mx-auto p-6 bg-white rounded-[var(--r-lg)] shadow-[var(--shadow-card)] mt-8">
      <h1 className="text-xl font-semibold mb-4">登入</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full border border-[var(--border-default)] p-2 rounded-[var(--r-md)]"
          type="email"
          placeholder="Email"
          aria-label="Email"
          required
        />
        <input
          className="w-full border border-[var(--border-default)] p-2 rounded-[var(--r-md)]"
          type="password"
          placeholder="密碼"
          aria-label="密碼"
          required
        />
        <button className="w-full px-4 py-2 rounded-[var(--r-pill)] bg-[var(--brand)] text-[var(--brand-fg)]">
          提交
        </button>
      </form>
    </section>
  )
}
