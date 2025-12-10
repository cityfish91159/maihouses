import { useState } from 'react'

export function CookieConsent() {
  // 使用惰性初始化，避免在 effect 中 setState
  const [show, setShow] = useState(() => {
    if (typeof window === 'undefined') return false
    const consent = localStorage.getItem('cookie-consent')
    return !consent
  })

  const accept = () => {
    localStorage.setItem('cookie-consent', 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-overlay bg-gray-900 p-4 text-white shadow-lg md:p-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
        <div className="text-sm text-gray-300">
          我們使用 Cookie 來改善您的瀏覽體驗並提供個人化內容。繼續瀏覽即表示您同意我們的隱私權政策。
        </div>
        <div className="flex gap-3">
          <button
            onClick={accept}
            className="rounded-full bg-brand px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
          >
            我同意
          </button>
        </div>
      </div>
    </div>
  )
}
