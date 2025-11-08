import { trackEvent } from '../../services/uag'

export default function Login() {
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    trackEvent('login_submit', '/auth/login')
    alert('已送出（Demo）')
  }

  return (
    <section className="mx-auto mt-8 max-w-md rounded-[var(--r-lg)] bg-white p-6 shadow-[var(--shadow-card)]">
      <h1 className="mb-4 text-xl font-semibold">登入</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full rounded-[var(--r-md)] border border-[var(--border-default)] p-2"
          type="email"
          placeholder="Email"
          aria-label="Email"
          required
        />
        <input
          className="w-full rounded-[var(--r-md)] border border-[var(--border-default)] p-2"
          type="password"
          placeholder="密碼"
          aria-label="密碼"
          required
        />
        <button className="w-full rounded-[var(--r-pill)] bg-[var(--brand)] px-4 py-2 text-[var(--brand-fg)]">
          提交
        </button>
      </form>
    </section>
  )
}
