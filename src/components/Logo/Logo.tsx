import React from 'react';

interface LogoProps {
  showSlogan?: boolean;
  className?: string;
  onClick?: () => void;
  href?: string;
  showBadge?: boolean;
  ariaLabel?: string;
}

interface LogoContentProps {
  showSlogan: boolean;
  className: string;
  showBadge: boolean;
}

// 將 Content 移到組件外部，避免每次渲染時重新創建
const LogoContent: React.FC<LogoContentProps> = ({ showSlogan, className, showBadge }) => (
  <div className={`group flex cursor-pointer items-center gap-3 ${className}`}>
    {/* Logo Icon */}
    <div className="shadow-brand-700/20 group-hover:shadow-brand-700/30 relative flex size-[42px] items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-700 to-brand-600 shadow-lg transition-all duration-300 group-hover:scale-105">
      {/* Shine Effect */}
      <div className="absolute inset-0 translate-y-full bg-gradient-to-tr from-transparent via-white/10 to-transparent transition-transform duration-700 ease-out group-hover:translate-y-0"></div>

      {/* Icon SVG */}
      <svg
        className="relative z-10 size-[22px] text-white drop-shadow-sm transition-transform duration-300 group-hover:-translate-y-px"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9.5L12 3L21 9.5V20.5C21 21.0523 20.5523 21.5 20 21.5H4C3.44772 21.5 3 21.0523 3 20.5V9.5Z" />
        <path d="M9 21.5V13H15V21.5" />
      </svg>

      {/* Design Accent Dot (opt-in) */}
      {showBadge && (
        <div className="absolute right-2 top-2 size-1.5 rounded-full bg-red-400 shadow-[0_0_0_1.5px] shadow-brand-600"></div>
      )}
    </div>

    <div className="flex items-center">
      <div className="flex items-baseline gap-1">
        {/* Font serif, Brand Dark Blue */}
        <span className="font-serif text-[24px] font-bold leading-none tracking-wide text-brand-700">
          邁房子
        </span>
      </div>

      {showSlogan && (
        <div className="border-brand-100/80 ml-3 hidden h-5 items-center border-l-2 pl-3 sm:flex">
          <span className="pt-px text-[15px] font-bold uppercase leading-none tracking-[0.15em] text-brand-500 transition-colors group-hover:text-brand-700">
            讓家，不只是地址
          </span>
        </div>
      )}
    </div>
  </div>
);

export const Logo: React.FC<LogoProps> = ({
  showSlogan = true,
  className = '',
  onClick,
  href = '/maihouses/',
  showBadge = true,
  ariaLabel,
}) => {
  const contentProps = { showSlogan, className, showBadge };

  if (href) {
    return (
      <a href={href} onClick={onClick} className="no-underline" aria-label={ariaLabel}>
        <LogoContent {...contentProps} />
      </a>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) onClick();
      }}
      aria-label={ariaLabel}
    >
      <LogoContent {...contentProps} />
    </div>
  );
};
