import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-12 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">404</p>
      <h1 className="mt-2 text-3xl font-extrabold text-slate-900">頁面不存在</h1>
      <p className="mt-3 text-sm text-slate-600">你要前往的頁面可能已移除、改版，或連結有誤。</p>
      <Link
        to="/"
        className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-brand-700 px-5 py-2 font-semibold text-white transition hover:bg-brand-600"
      >
        回到首頁
      </Link>
    </main>
  );
}
