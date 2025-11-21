import React from 'react'

export default function LegacyPropertyGrid() {
  const baseUrl = (import.meta as any).env?.BASE_URL || '/'
  
  return (
    <section className="rounded-lg bg-white p-0 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] overflow-hidden">
      {/* 以 iframe 方式嵌入你上傳的完整房源清單 HTML，完全不改動其內文與排版 */}
      <iframe
        title="房源清單"
        src={`${baseUrl}maihouses_list_noheader.html`}
        style={{ width: '100%', border: 0, minHeight: '1400px' }}
        loading="lazy"
      />
    </section>
  )
}
