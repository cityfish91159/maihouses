/**
 * Topbar Component
 * 
 * 頂部導航列
 */

interface TopbarProps {
  communityName: string;
}

export function Topbar({ communityName }: TopbarProps) {
  return (
    <header className="sticky top-0 z-50 flex items-center gap-2.5 border-b border-[rgba(230,237,247,0.8)] bg-[rgba(246,249,255,0.95)] px-4 py-2 backdrop-blur-[12px]">
      <a 
        href="/maihouses/" 
        className="flex items-center gap-2 rounded-[10px] px-2.5 py-1.5 text-sm font-bold text-[var(--primary)] no-underline transition-colors hover:bg-[rgba(0,56,90,0.06)]"
        aria-label="回到首頁"
      >
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        <span>回首頁</span>
      </a>
      <div className="flex-1 text-center">
        <h1 className="m-0 text-base font-extrabold text-[var(--primary-dark)]">{communityName}</h1>
        <p className="m-0 text-[11px] text-[var(--text-secondary)]">社區牆</p>
      </div>
      <div className="flex items-center gap-2">
        <button 
          className="relative inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-white px-2 py-2 text-sm text-[#173a7c] transition-all hover:bg-[#f6f9ff]"
          aria-label="通知，2 則未讀"
        >
          🔔
          <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-[#e02626] text-[11px] font-bold text-white" aria-hidden="true">2</span>
        </button>
        <button 
          className="flex items-center gap-1 rounded-[14px] border border-[var(--line)] bg-white px-2.5 py-1.5 text-[13px] font-bold text-[#173a7c]"
          aria-label="我的帳號"
        >
          👤 我的
        </button>
      </div>
    </header>
  );
}
