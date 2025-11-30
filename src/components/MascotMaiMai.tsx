import React, { useState, useEffect } from 'react';

export default function MascotMaiMai() {
  const [mood, setMood] = useState(0);
  
  // 簡單的待命動畫
  useEffect(() => {
    const interval = setInterval(() => {
      setMood(m => (m + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // 手勢變化
  const getArms = () => {
    switch (mood) {
      case 0: // 待命
        return { left: 'M 55 130 L 35 145', right: 'M 145 130 L 165 145' };
      case 1: // 揮手
        return { left: 'M 55 130 L 35 145', right: 'M 145 130 L 175 100' };
      case 2: // 雙手張開歡迎
        return { left: 'M 55 130 L 25 115', right: 'M 145 130 L 175 115' };
      default:
        return { left: 'M 55 130 L 35 145', right: 'M 145 130 L 165 145' };
    }
  };

  const arms = getArms();

  return (
    <div className="w-32 h-40 mb-4 text-brand relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-brand-100/50 rounded-full blur-2xl -z-10"></div>
        
        <svg viewBox="0 0 200 240" className="w-full h-full drop-shadow-sm animate-float">
          
          {/* M-Antenna */}
          <path 
            d="M 85 40 L 85 15 L 100 30 L 115 15 L 115 40" 
            stroke="currentColor" 
            strokeWidth="5" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          
          {/* House Body & Roof */}
          <path 
            d="M 40 80 L 100 40 L 160 80" 
            stroke="currentColor" 
            strokeWidth="6" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <rect 
            x="55" y="80" 
            width="90" height="100" 
            stroke="currentColor" 
            strokeWidth="6" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          
          {/* 領結 - 簡化版 */}
          <circle cx="100" cy="85" r="4" fill="currentColor" />
          
          {/* Eyebrows */}
          <path d="M 78 110 Q 85 105 92 110" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 108 110 Q 115 105 122 110" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
          
          {/* Eyes */}
          <circle cx="85" cy="125" r="4" stroke="currentColor" strokeWidth="3" fill="none" />
          <circle cx="115" cy="125" r="4" stroke="currentColor" strokeWidth="3" fill="none" />
          
          {/* 嘴巴 - 微笑 */}
          <path 
            d="M 90 145 Q 100 155 110 145" 
            stroke="currentColor" 
            strokeWidth="3" 
            fill="none" 
            strokeLinecap="round"
          />
          
          {/* Hands - 動態 */}
          <path 
            d={arms.left}
            stroke="currentColor" 
            strokeWidth="5" 
            fill="none" 
            strokeLinecap="round"
            className="transition-all duration-500"
          />
          <path 
            d={arms.right}
            stroke="currentColor" 
            strokeWidth="5" 
            fill="none" 
            strokeLinecap="round"
            className="transition-all duration-500"
          />

          {/* Legs */}
          <path d="M 85 180 L 85 215 L 75 215" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 115 180 L 115 215 L 125 215" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    </div>
  );
}
