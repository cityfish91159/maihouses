import React from 'react';

interface LogoProps {
  showSlogan?: boolean;
  className?: string;
  onClick?: () => void;
  href?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  showSlogan = true, 
  className = "", 
  onClick,
  href = "/maihouses/"
}) => {
  const Content = () => (
    <div className={`flex items-center group cursor-pointer ${className}`}>
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
