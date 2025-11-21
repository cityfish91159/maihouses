import React from 'react'

export default function LegacyPropertyGrid() {
  const baseUrl = (import.meta as any).env?.BASE_URL || '/'
  
  return (
    <section className="mh-card p-0 overflow-hidden">
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
