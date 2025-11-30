import React, { useState, useEffect } from 'react';

interface MascotHouseProps {
  animated?: boolean;
}

export default function MascotHouse({ animated = true }: MascotHouseProps) {
  const [phase, setPhase] = useState(0);
  
  // 循環動畫：模擬交易流程的 6 個階段
  useEffect(() => {
    if (!animated) return;
    
    const interval = setInterval(() => {
      setPhase(p => (p + 1) % 6);
    }, 2500);
    
    return () => clearInterval(interval);
  }, [animated]);

  // 根據階段決定表情和姿勢
  const getExpression = () => {
    switch (phase) {
      case 0: // 電聯 - 揮手打招呼
        return { leftArm: 'M 55 130 L 25 100', rightArm: 'M 145 130 L 175 90', eyeY: 125, mouthCurve: 'smile' };
      case 1: // 帶看 - 驚喜睜大眼
        return { leftArm: 'M 55 130 L 30 130', rightArm: 'M 145 130 L 170 130', eyeY: 123, eyeSize: 6, mouthCurve: 'wow' };
      case 2: // 出價 - 認真思考
        return { leftArm: 'M 55 130 L 35 145', rightArm: 'M 145 130 L 165 145', eyeY: 127, mouthCurve: 'think' };
      case 3: // 斡旋 - 緊張握拳
        return { leftArm: 'M 55 130 L 40 110', rightArm: 'M 145 130 L 160 110', eyeY: 125, mouthCurve: 'nervous' };
      case 4: // 成交 - 開心跳躍
        return { leftArm: 'M 55 130 L 20 95', rightArm: 'M 145 130 L 180 95', eyeY: 122, mouthCurve: 'happy', bounce: true };
      case 5: // 交屋 - 滿足微笑
        return { leftArm: 'M 55 130 L 25 120', rightArm: 'M 145 130 L 175 120', eyeY: 125, mouthCurve: 'proud' };
      default:
        return { leftArm: 'M 55 130 L 25 110', rightArm: 'M 145 130 L 175 110', eyeY: 125, mouthCurve: 'smile' };
    }
  };

  const expr = getExpression();
  const eyeSize = expr.eyeSize || 4;

  // 嘴巴形狀
  const getMouth = () => {
    switch (expr.mouthCurve) {
      case 'smile':
        return <path d="M 90 145 Q 100 155 110 145" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />;
      case 'wow':
        return <ellipse cx="100" cy="148" rx="6" ry="8" stroke="currentColor" strokeWidth="3" fill="none" />;
      case 'think':
        return <path d="M 92 148 L 108 148" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />;
      case 'nervous':
        return <path d="M 90 150 Q 95 145 100 150 Q 105 145 110 150" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />;
      case 'happy':
        return <path d="M 85 142 Q 100 165 115 142" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />;
      case 'proud':
        return <path d="M 88 145 Q 100 158 112 145" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />;
      default:
        return <path d="M 90 145 Q 100 155 110 145" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />;
    }
  };

  return (
    <svg 
      viewBox="0 0 200 240" 
      className={`w-full h-full drop-shadow-sm text-brand transition-transform duration-500 ${
        animated ? 'hover:scale-105' : ''
      } ${expr.bounce ? 'animate-bounce' : ''}`}
    >
      {/* 開心時的愛心裝飾 */}
      {phase === 4 && (
        <>
          <text x="25" y="70" className="text-xl animate-ping" fill="#FF6B9D">♥</text>
          <text x="165" y="75" className="text-xl animate-ping" style={{ animationDelay: '0.3s' }} fill="#FF6B9D">♥</text>
        </>
      )}

      {/* M-Antenna */}
      <path 
        d="M 85 40 L 85 15 L 100 30 L 115 15 L 115 40" 
        stroke="currentColor" 
        strokeWidth="5" 
        fill="none" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className={phase === 4 ? 'animate-pulse' : ''}
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

      {/* Eyebrows - 根據表情變化 */}
      {phase === 1 ? (
        // 驚訝 - 挑眉
        <>
          <path d="M 75 105 Q 85 98 95 105" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 105 105 Q 115 98 125 105" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      ) : phase === 2 ? (
        // 思考 - 皺眉
        <>
          <path d="M 78 108 L 92 112" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 108 112 L 122 108" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      ) : phase === 3 ? (
        // 緊張 - 擔心眉
        <>
          <path d="M 76 112 Q 85 106 94 112" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 106 112 Q 115 106 124 112" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      ) : (
        // 正常/開心
        <>
          <path d="M 78 110 Q 85 105 92 110" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 108 110 Q 115 105 122 110" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      )}
      
      {/* Eyes - 動態位置和大小 */}
      <circle 
        cx="85" 
        cy={expr.eyeY} 
        r={eyeSize} 
        stroke="currentColor" 
        strokeWidth="3" 
        fill={phase === 4 ? 'currentColor' : 'none'} 
        className="transition-all duration-300"
      />
      <circle 
        cx="115" 
        cy={expr.eyeY} 
        r={eyeSize} 
        stroke="currentColor" 
        strokeWidth="3" 
        fill={phase === 4 ? 'currentColor' : 'none'}
        className="transition-all duration-300"
      />
      
      {/* 開心時的眼睛弧線（笑眼）*/}
      {phase === 4 && (
        <>
          <path d="M 78 122 Q 85 128 92 122" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M 108 122 Q 115 128 122 122" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* Mouth - 動態表情 */}
      {getMouth()}

      {/* Hands - 動態姿勢 */}
      <path 
        d={expr.leftArm} 
        stroke="currentColor" 
        strokeWidth="5" 
        fill="none" 
        strokeLinecap="round"
        className="transition-all duration-500"
      />
      <path 
        d={expr.rightArm} 
        stroke="currentColor" 
        strokeWidth="5" 
        fill="none" 
        strokeLinecap="round"
        className="transition-all duration-500"
      />

      {/* Legs - 動態走路 */}
      <path 
        d={phase % 2 === 0 ? "M 85 180 L 85 215 L 75 215" : "M 85 180 L 80 215 L 70 212"} 
        stroke="currentColor" 
        strokeWidth="5" 
        fill="none" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="transition-all duration-300"
      />
      <path 
        d={phase % 2 === 0 ? "M 115 180 L 115 215 L 125 215" : "M 115 180 L 120 215 L 130 212"} 
        stroke="currentColor" 
        strokeWidth="5" 
        fill="none" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="transition-all duration-300"
      />

      {/* 交屋時的鑰匙 */}
      {phase === 5 && (
        <g className="animate-pulse">
          <circle cx="175" cy="100" r="8" stroke="#FFB800" strokeWidth="3" fill="none" />
          <path d="M 175 108 L 175 130 M 172 120 L 178 120 M 172 125 L 178 125" stroke="#FFB800" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}
