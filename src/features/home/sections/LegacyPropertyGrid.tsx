import React from 'react'

export default function LegacyPropertyGrid() {
  const baseUrl = import.meta.env.BASE_URL || '/'
  
  return (
    <section className="mh-card p-0 overflow-hidden">
      {/* 以 iframe 方式嵌入你上傳的完整房源清單 HTML，完全不改動其內文與排版 */}
      <iframe
        title="房源清單"
        src={`${baseUrl}maihouses_list_noheader.html`}
        className="w-full border-0 h-[1200px] sm:h-[1400px] md:h-screen md:max-h-[1600px]"
        loading="lazy"
        sandbox="allow-scripts allow-same-origin allow-popups"
      />
    </section>
  )
}
