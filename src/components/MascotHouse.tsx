import React, { useState, useEffect } from 'react';
import { Antenna, Roof, Body, Eyebrows, Eyes, Mouth, Legs } from './MaiMai';
import type { MaiMaiMood } from './MaiMai';

interface MascotHouseProps {
  animated?: boolean;
}

/**
 * MascotHouse - 首頁安心留痕區公仔
 * @description 6 階段交易流程動畫，使用 MaiMai 原子組件
 */
export default function MascotHouse({ animated = true }: MascotHouseProps) {
  const [phase, setPhase] = useState(0);

  // 循環動畫：模擬交易流程的 6 個階段
  useEffect(() => {
    if (!animated) return;

    const interval = setInterval(() => {
      setPhase((p) => (p + 1) % 6);
    }, 2500);

    return () => clearInterval(interval);
  }, [animated]);

  // 階段對應的心情
  const phaseMoods: MaiMaiMood[] = ['wave', 'excited', 'thinking', 'happy', 'celebrate', 'idle'];
  const currentMood: MaiMaiMood = phaseMoods[phase] ?? 'idle';

  // 根據階段決定手臂姿勢
  const getArmPaths = () => {
    switch (phase) {
      case 0: // 電聯 - 揮手打招呼
        return { left: 'M 55 130 L 25 100', right: 'M 145 130 L 175 90' };
      case 1: // 帶看 - 驚喜睜大眼
        return { left: 'M 55 130 L 30 130', right: 'M 145 130 L 170 130' };
      case 2: // 出價 - 專注認真（托下巴思考）
        return { left: 'M 55 130 L 45 150', right: 'M 145 130 L 155 145' };
      case 3: // 斡旋 - 期待加油（握拳打氣）
        return { left: 'M 55 130 L 30 105', right: 'M 145 130 L 170 105' };
      case 4: // 成交 - 開心跳躍
        return { left: 'M 55 130 L 20 95', right: 'M 145 130 L 180 95' };
      case 5: // 交屋 - 滿足微笑
        return { left: 'M 55 130 L 25 120', right: 'M 145 130 L 175 120' };
      default:
        return { left: 'M 55 130 L 25 110', right: 'M 145 130 L 175 110' };
    }
  };

  const arms = getArmPaths();
  const isBouncing = phase === 4;

  return (
    <svg
      viewBox="0 0 200 240"
      className={`size-full text-brand drop-shadow-sm transition-transform duration-500 ${
        animated ? 'hover:scale-105' : ''
      } ${isBouncing ? 'animate-bounce' : ''}`}
    >
      {/* 開心時的愛心裝飾 */}
      {phase === 4 && (
        <>
          <text x="25" y="70" className="animate-ping text-xl" fill="var(--mh-color-ff6b9d)">
            ♥
          </text>
          <text
            x="165"
            y="75"
            className="animate-ping text-xl [animation-delay:300ms]"
            fill="var(--mh-color-ff6b9d)"
          >
            ♥
          </text>
        </>
      )}

      {/* 天線 - 使用原子組件 */}
      <Antenna mood={currentMood} animated={animated} />

      {/* 屋頂 - 使用原子組件 */}
      <Roof />

      {/* 身體 - 使用原子組件 */}
      <Body />

      {/* 眉毛 - 使用原子組件 */}
      <Eyebrows mood={currentMood} />

      {/* 眼睛 - 使用原子組件 */}
      <Eyes mood={currentMood} />

      {/* 嘴巴 - 使用原子組件 */}
      <Mouth mood={currentMood} />

      {/* 手臂 - 保持自訂動畫姿勢 */}
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

      {/* 腿 - 動態走路 */}
      <path
        d={phase % 2 === 0 ? 'M 85 180 L 85 215 L 75 215' : 'M 85 180 L 80 215 L 70 212'}
        stroke="currentColor"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-300"
      />
      <path
        d={phase % 2 === 0 ? 'M 115 180 L 115 215 L 125 215' : 'M 115 180 L 120 215 L 130 212'}
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
          <circle cx="175" cy="100" r="8" stroke="var(--mh-color-ffb800)" strokeWidth="3" fill="none" />
          <path
            d="M 175 108 L 175 130 M 172 120 L 178 120 M 172 125 L 178 125"
            stroke="var(--mh-color-ffb800)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      )}
    </svg>
  );
}
