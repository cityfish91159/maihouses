import React, { useState, useEffect } from 'react';

export default function MascotMaiMai() {
  const [mood, setMood] = useState(0);
  
  // 管家待命動畫：友善待機 → 準備服務 → 聆聽中
  useEffect(() => {
    const interval = setInterval(() => {
      setMood(m => (m + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // 根據心情變化手勢
  const getArmPose = () => {
    switch (mood) {
      case 0: // 待命 - 雙手交疊前方
        return { left: 'M 55 140 Q 70 150 85 145', right: 'M 145 140 Q 130 150 115 145' };
      case 1: // 準備服務 - 右手舉起打招呼
        return { left: 'M 55 135 L 35 150', right: 'M 145 130 L 175 95' };
      case 2: // 聆聽 - 手托下巴
        return { left: 'M 55 135 L 45 145', right: 'M 145 135 Q 155 140 150 125' };
      default:
        return { left: 'M 55 140 Q 70 150 85 145', right: 'M 145 140 Q 130 150 115 145' };
    }
  };

  const arms = getArmPose();

  return (
    <div className="w-36 h-36 mb-6 text-brand-700 -mt-8 relative group cursor-pointer">
        {/* 光暈背景 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-brand-100/50 rounded-full blur-2xl -z-10 group-hover:bg-brand-200/60 transition-colors"></div>
        
        <svg viewBox="0 0 200 260" className="w-full h-full drop-shadow-sm animate-float">
          
          {/* === 管家裝飾 === */}
          
          {/* 耳機 - 表示隨時傾聽 */}
          <path 
            d="M 60 115 Q 50 90 70 75 M 140 115 Q 150 90 130 75" 
            stroke="currentColor" 
            strokeWidth="4" 
            fill="none" 
            strokeLinecap="round"
            className="opacity-60"
          />
          <circle cx="55" cy="118" r="8" fill="currentColor" className="opacity-80" />
          <circle cx="145" cy="118" r="8" fill="currentColor" className="opacity-80" />
          <path 
            d="M 70 68 Q 100 50 130 68" 
            stroke="currentColor" 
            strokeWidth="5" 
            fill="none" 
            strokeLinecap="round"
            className="opacity-60"
          />
          
          {/* M-Antenna（管家帽造型）*/}
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
          
          {/* 領結 - 專業服務象徵 */}
          <path 
            d="M 90 82 L 100 92 L 110 82 M 100 92 L 100 100" 
            stroke="currentColor" 
            strokeWidth="4" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <circle cx="100" cy="82" r="4" fill="currentColor" />
          
          {/* Eyebrows - 友善微挑 */}
          <path d="M 78 108 Q 85 103 92 108" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 108 108 Q 115 103 122 108" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
          
          {/* Eyes - 微笑眼 */}
          {mood === 2 ? (
            // 聆聽時 - 專注眼神
            <>
              <circle cx="85" cy="123" r="5" stroke="currentColor" strokeWidth="3" fill="none" />
              <circle cx="115" cy="123" r="5" stroke="currentColor" strokeWidth="3" fill="none" />
              <circle cx="86" cy="122" r="2" fill="currentColor" />
              <circle cx="116" cy="122" r="2" fill="currentColor" />
            </>
          ) : (
            // 友善眼睛
            <>
              <circle cx="85" cy="125" r="4" stroke="currentColor" strokeWidth="3" fill="none" />
              <circle cx="115" cy="125" r="4" stroke="currentColor" strokeWidth="3" fill="none" />
            </>
          )}
          
          {/* 嘴巴 - 微笑 */}
          <path 
            d={mood === 1 ? "M 88 145 Q 100 158 112 145" : "M 90 145 Q 100 155 110 145"} 
            stroke="currentColor" 
            strokeWidth="3" 
            fill="none" 
            strokeLinecap="round"
          />
          
          {/* Hands - 動態手勢 */}
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
          
          {/* 右手揮手時的動畫小星星 */}
          {mood === 1 && (
            <>
              <text x="180" y="85" className="text-xs animate-ping" fill="#FFB800">✦</text>
              <text x="170" y="100" className="text-xs animate-pulse" fill="#FFB800" style={{ animationDelay: '0.3s' }}>✦</text>
            </>
          )}
          
          {/* 聆聽時的音波符號 */}
          {mood === 2 && (
            <>
              <path 
                d="M 42 110 Q 35 118 42 126" 
                stroke="#00629B" 
                strokeWidth="2" 
                fill="none" 
                strokeLinecap="round"
                className="animate-pulse opacity-60"
              />
              <path 
                d="M 35 105 Q 25 118 35 131" 
                stroke="#00629B" 
                strokeWidth="2" 
                fill="none" 
                strokeLinecap="round"
                className="animate-pulse opacity-40"
                style={{ animationDelay: '0.2s' }}
              />
            </>
          )}

          {/* Legs - 站立待命 */}
          <path d="M 85 180 L 85 215 L 75 215" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 115 180 L 115 215 L 125 215" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* 管家名牌 */}
          <rect x="80" y="155" width="40" height="16" rx="3" stroke="currentColor" strokeWidth="2" fill="none" className="opacity-60" />
          <text x="100" y="166" textAnchor="middle" fontSize="8" fill="currentColor" fontWeight="bold" className="opacity-80">邁邁</text>
        </svg>
    </div>
  );
}
