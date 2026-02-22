/**
 * SidebarMascot Component
 *
 * 側邊欄底部的邁邁公仔 SVG 卡片
 * 從 Sidebar.tsx 抽出以降低主組件行數
 */

const CARD_SHADOW = 'shadow-[0_4px_14px_var(--mh-shadow-card)]';

export function SidebarMascot() {
  return (
    <div
      className={`rounded-[14px] border border-[var(--line)] bg-gradient-to-br from-[var(--mh-color-f0f7ff)] to-[var(--mh-color-e8f4ff)] p-3.5 text-center ${CARD_SHADOW}`}
    >
      <svg
        className="mx-auto mb-2 h-24 w-20 text-brand-700"
        viewBox="0 0 200 240"
        aria-hidden="true"
      >
        <path
          d="M 85 40 L 85 15 L 100 30 L 115 15 L 115 40"
          stroke="currentColor"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 40 80 L 100 40 L 160 80"
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="55"
          y="80"
          width="90"
          height="100"
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 78 110 Q 85 105 92 110"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 108 110 Q 115 105 122 110"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="85" cy="125" r="4" stroke="currentColor" strokeWidth="3" fill="none" />
        <circle cx="115" cy="125" r="4" stroke="currentColor" strokeWidth="3" fill="none" />
        <path
          d="M 90 145 Q 100 155 110 145"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 55 130 L 25 110"
          stroke="currentColor"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          className="origin-[85%_60%] animate-[wave_2.5s_ease-in-out_infinite]"
          d="M 145 130 L 175 100"
          stroke="currentColor"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
        <circle
          className="origin-[85%_60%] animate-[wave_2.5s_ease-in-out_infinite]"
          cx="180"
          cy="95"
          r="6"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
        />
        <path
          d="M 85 180 L 85 210 L 75 210"
          stroke="currentColor"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 115 180 L 115 210 L 125 210"
          stroke="currentColor"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="mb-2.5 text-[13px] font-bold text-[var(--brand)]">有問題？問問鄰居！</p>
      <a
        href="#qa-section"
        className="inline-block rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-bold text-white no-underline"
      >
        前往問答區 →
      </a>
    </div>
  );
}
