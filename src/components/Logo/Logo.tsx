import React from 'react';

interface LogoProps {
  showSlogan?: boolean;
  className?: string;
  onClick?: () => void;
  href?: string;
  showBadge?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  showSlogan = true, 
  className = "", 
  onClick,
  href = "/maihouses/",
  showBadge = true,
}) => {
  const Content = () => (
    <div className={`flex items-center gap-3 group cursor-pointer ${className}`}>
      {/* Logo Icon */}
      <div className="relative w-[42px] h-[42px] bg-gradient-to-br from-brand-700 to-[#005282] rounded-xl flex items-center justify-center shadow-lg shadow-brand-700/20 overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:shadow-brand-700/30">
        {/* Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-700 ease-out"></div>
        
        {/* Icon SVG */}
        <svg className="w-[22px] h-[22px] text-white relative z-10 drop-shadow-sm transform transition-transform duration-300 group-hover:-translate-y-[1px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.5L12 3L21 9.5V20.5C21 21.0523 20.5523 21.5 20 21.5H4C3.44772 21.5 3 21.0523 3 20.5V9.5Z" />
          <path d="M9 21.5V13H15V21.5" />
        </svg>
        
        {/* Notification Badge (opt-in) */}
        {showBadge && (
          <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#FF6B6B] rounded-full shadow-[0_0_0_1.5px_#004E7C]"></div>
        )}
      </div>

      <div className="flex items-center">
        <div className="flex items-baseline gap-1">
          {/* Font serif, Brand Dark Blue */}
          <span className="text-[24px] font-bold font-serif text-brand-700 tracking-wide leading-none">邁房子</span>
        </div>
        
        {showSlogan && (
          <div className="hidden sm:flex items-center ml-3 pl-3 border-l-2 border-brand-100/80 h-5">
            <span className="text-[15px] font-bold text-brand-500 tracking-[0.15em] uppercase group-hover:text-brand-700 transition-colors leading-none pt-[1px]">
              讓家，不只是地址
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} onClick={onClick} className="no-underline">
        <Content />
      </a>
    );
  }

  return (
    <div onClick={onClick}>
      <Content />
    </div>
  );
};
