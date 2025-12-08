import React, { useState, useEffect, useCallback } from 'react';

type MascotMood = 'idle' | 'wave' | 'peek' | 'happy' | 'thinking' | 'celebrate' | 'sleep' | 'shy';

interface MascotInteractiveProps {
  mood?: MascotMood;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  // 登入頁互動
  isTypingEmail?: boolean;
  isTypingPassword?: boolean;
  hasError?: boolean;
  isLoading?: boolean;
  isSuccess?: boolean;
}

export default function MascotInteractive({
  mood: externalMood,
  size = 'md',
  className = '',
  isTypingEmail = false,
  isTypingPassword = false,
  hasError = false,
  isLoading = false,
  isSuccess = false,
}: MascotInteractiveProps) {
  const [internalMood, setInternalMood] = useState<MascotMood>('idle');
  const [isHovered, setIsHovered] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  // 根據登入狀態自動切換表情
  useEffect(() => {
    if (isSuccess) {
      setInternalMood('celebrate');
    } else if (hasError) {
      setInternalMood('shy');
    } else if (isLoading) {
      setInternalMood('thinking');
    } else if (isTypingPassword) {
      setInternalMood('peek'); // 輸入密碼時遮眼睛偷看
    } else if (isTypingEmail) {
      setInternalMood('happy'); // 輸入 email 時開心
    } else if (isHovered) {
      setInternalMood('wave');
    } else {
      setInternalMood('idle');
    }
  }, [isTypingEmail, isTypingPassword, hasError, isLoading, isSuccess, isHovered]);

  const mood = externalMood || internalMood;

  // 點擊互動
  const handleClick = useCallback(() => {
    setClickCount(prev => prev + 1);
    
    // 連續點擊會有不同反應
    if (clickCount >= 5) {
      setInternalMood('celebrate');
      setTimeout(() => setClickCount(0), 2000);
    }
  }, [clickCount]);

  // 尺寸配置
  const sizeConfig = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-40 h-40',
  };

  // 根據心情渲染不同的 SVG
  const renderMascot = () => {
    switch (mood) {
      case 'wave':
        return <MascotWave />;
      case 'peek':
        return <MascotPeek />;
      case 'happy':
        return <MascotHappy />;
      case 'thinking':
        return <MascotThinking />;
      case 'celebrate':
        return <MascotCelebrate />;
      case 'sleep':
        return <MascotSleep />;
      case 'shy':
        return <MascotShy />;
      default:
        return <MascotIdle />;
    }
  };

  return (
    <div
      className={`relative ${sizeConfig[size]} ${className} cursor-pointer select-none`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* 背景光暈 */}
      <div className="bg-[var(--brand)]/10 absolute left-1/2 top-1/2 -z-10 size-3/4 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full blur-2xl"></div>
      
      {/* 公仔 */}
      <div className={`size-full text-[var(--brand)] transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`}>
        {renderMascot()}
      </div>

      {/* 點擊特效 */}
      {clickCount > 0 && clickCount <= 5 && (
        <div className="absolute -right-2 -top-2 animate-bounce text-lg">
          {['💫', '✨', '🌟', '💖', '🎉'][Math.min(clickCount - 1, 4)]}
        </div>
      )}
    </div>
  );
}

// ============ 各種心情的 SVG ============

// 待機狀態 - 輕微呼吸動畫
function MascotIdle() {
  return (
    <svg viewBox="0 0 200 240" className="size-full animate-float drop-shadow-sm">
      {/* M-Antenna */}
      <path d="M 85 40 L 85 15 L 100 30 L 115 15 L 115 40" 
            stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

      {/* House Body & Roof */}
      <path d="M 40 80 L 100 40 L 160 80" 
            stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="55" y="80" width="90" height="100" 
            stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Eyebrows */}
      <path d="M 78 110 Q 85 105 92 110" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M 108 110 Q 115 105 122 110" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
      
      {/* Eyes - Hollow circles with blink animation */}
      <g className="animate-blink">
        <circle cx="85" cy="125" r="4" stroke="currentColor" strokeWidth="3" fill="none" />
        <circle cx="115" cy="125" r="4" stroke="currentColor" strokeWidth="3" fill="none" />
      </g>

      {/* Smile */}
      <path d="M 90 145 Q 100 155 110 145" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Hands - Relaxed */}
      <path d="M 55 130 L 30 140" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M 145 130 L 170 140" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" />

      {/* Legs */}
      <path d="M 85 180 L 85 215 L 75 215" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 115 180 L 115 215 L 125 215" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 揮手打招呼
function MascotWave() {
  return (
    <svg viewBox="0 0 200 240" className="size-full drop-shadow-sm">
      {/* M-Antenna - Wiggling */}
      <path d="M 85 40 L 85 15 L 100 30 L 115 15 L 115 40" 
            stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"
            className="animate-wiggle origin-bottom"/>

      {/* House Body & Roof */}
      <path d="M 40 80 L 100 40 L 160 80" 
            stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="55" y="80" width="90" height="100" 
            stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Happy Eyebrows */}
      <path d="M 78 108 Q 85 103 92 108" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M 108 108 Q 115 103 122 108" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
      
      {/* Eyes - Happy ^ ^ */}
      <path d="M 80 125 Q 85 120 90 125" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 110 125 Q 115 120 120 125" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Big Smile */}
      <path d="M 85 145 Q 100 160 115 145" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Left Hand - Relaxed */}
      <path d="M 55 130 L 30 140" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" />
      
      {/* Right Hand - Waving! */}
      <g className="animate-wave origin-bottom-left">
        <path d="M 145 130 L 175 95" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" />
        {/* Hand */}
        <circle cx="180" cy="88" r="8" stroke="currentColor" strokeWidth="4" fill="none" />
      </g>

      {/* Legs */}
      <path d="M 85 180 L 85 215 L 75 215" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 115 180 L 115 215 L 125 215" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* "Hi!" bubble */}
      <g className="animate-bounce">
        <ellipse cx="175" cy="60" rx="20" ry="15" fill="white" stroke="currentColor" strokeWidth="2"/>
        <text x="175" y="65" textAnchor="middle" fontSize="12" fontWeight="bold" fill="currentColor">Hi!</text>
      </g>
    </svg>
  );
}

// 偷看（輸入密碼時）
function MascotPeek() {
  return (
    <svg viewBox="0 0 200 240" className="size-full drop-shadow-sm">
      {/* M-Antenna */}
      <path d="M 85 40 L 85 15 L 100 30 L 115 15 L 115 40" 
            stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

      {/* House Body & Roof */}
      <path d="M 40 80 L 100 40 L 160 80" 
            stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="55" y="80" width="90" height="100" 
            stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Nervous Eyebrows */}
      <path d="M 78 108 L 92 112" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M 108 112 L 122 108" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
      
      {/* Eyes - Covered by hands! */}
      {/* Only showing peeking through fingers */}
      <circle cx="85" cy="125" r="3" fill="currentColor" />
      <circle cx="115" cy="125" r="3" fill="currentColor" />

      {/* Hands covering eyes */}
      <g>
        {/* Left hand covering left eye */}
        <path d="M 55 130 L 70 120" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" />
        <ellipse cx="78" cy="125" rx="12" ry="10" stroke="currentColor" strokeWidth="4" fill="white"/>
        {/* Finger gaps */}
        <path d="M 72 120 L 72 130" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M 78 120 L 78 130" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M 84 120 L 84 130" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        
        {/* Right hand covering right eye */}
        <path d="M 145 130 L 130 120" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" />
        <ellipse cx="122" cy="125" rx="12" ry="10" stroke="currentColor" strokeWidth="4" fill="white"/>
        {/* Finger gaps */}
        <path d="M 116 120 L 116 130" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M 122 120 L 122 130" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M 128 120 L 128 130" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>

      {/* Embarrassed Smile */}
      <path d="M 92 150 Q 100 155 108 150" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Blush */}
      <circle cx="75" cy="145" r="6" fill="#FFB6C1" opacity="0.6" />
      <circle cx="125" cy="145" r="6" fill="#FFB6C1" opacity="0.6" />

      {/* Legs */}
      <path d="M 85 180 L 85 215 L 75 215" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 115 180 L 115 215 L 125 215" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* "🔒" indicator */}
      <text x="100" y="175" textAnchor="middle" fontSize="16">🔒</text>
    </svg>
  );
}

// 開心（輸入 email 時）
function MascotHappy() {
  return (
    <svg viewBox="0 0 200 240" className="size-full animate-bounce-slow drop-shadow-sm">
      {/* M-Antenna - Happy bounce */}
      <path d="M 85 40 L 85 15 L 100 30 L 115 15 L 115 40" 
            stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Sparkles */}
      <text x="40" y="60" fontSize="14" className="animate-twinkle">✨</text>
      <text x="155" y="55" fontSize="12" className="animate-twinkle-delay">✨</text>

      {/* House Body & Roof */}
      <path d="M 40 80 L 100 40 L 160 80" 
            stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="55" y="80" width="90" height="100" 
            stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Super Happy Eyebrows - Raised */}
      <path d="M 76 105 Q 85 98 94 105" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M 106 105 Q 115 98 124 105" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
      
      {/* Eyes - Sparkling ✧ */}
      <circle cx="85" cy="122" r="5" stroke="currentColor" strokeWidth="3" fill="none" />
      <circle cx="85" cy="122" r="2" fill="currentColor" />
      <circle cx="115" cy="122" r="5" stroke="currentColor" strokeWidth="3" fill="none" />
      <circle cx="115" cy="122" r="2" fill="currentColor" />
      {/* Sparkle in eyes */}
      <circle cx="87" cy="120" r="1.5" fill="white" />
      <circle cx="117" cy="120" r="1.5" fill="white" />

      {/* Big Happy Smile - Open */}
      <path d="M 85 145 Q 100 165 115 145" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 90 148 Q 100 155 110 148" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.2" strokeLinecap="round" />

      {/* Hands - Excited up */}
      <path d="M 55 130 L 25 100" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M 145 130 L 175 100" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" />

      {/* Legs - Tippy toes */}
      <path d="M 85 180 L 85 210 L 75 210" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 115 180 L 115 210 L 125 210" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 思考（載入中）
function MascotThinking() {
  return (
    <svg viewBox="0 0 200 240" className="size-full drop-shadow-sm">
      {/* M-Antenna */}
      <path d="M 85 40 L 85 15 L 100 30 L 115 15 L 115 40" 
            stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Thinking bubbles */}
      <g className="animate-float-up">
        <circle cx="160" cy="50" r="5" fill="currentColor" opacity="0.3" />
        <circle cx="170" cy="35" r="8" fill="currentColor" opacity="0.5" />
        <circle cx="185" cy="15" r="12" fill="currentColor" opacity="0.7" />
      </g>

      {/* House Body & Roof */}
      <path d="M 40 80 L 100 40 L 160 80" 
            stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="55" y="80" width="90" height="100" 
            stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Thinking Eyebrows - One raised */}
      <path d="M 78 108 Q 85 105 92 110" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M 108 105 Q 115 100 122 105" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
      
      {/* Eyes - Looking up and to side */}
      <circle cx="87" cy="123" r="4" stroke="currentColor" strokeWidth="3" fill="none" />
      <circle cx="88" cy="122" r="1.5" fill="currentColor" />
      <circle cx="117" cy="123" r="4" stroke="currentColor" strokeWidth="3" fill="none" />
      <circle cx="118" cy="122" r="1.5" fill="currentColor" />

      {/* Thinking mouth - Hmm */}
      <path d="M 95 150 L 105 150" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* One hand on chin */}
      <path d="M 55 130 L 30 140" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M 145 130 L 135 155 L 110 155" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* Legs */}
      <path d="M 85 180 L 85 215 L 75 215" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 115 180 L 115 215 L 125 215" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Loading dots in thought bubble */}
      <g className="animate-pulse">
        <circle cx="175" cy="15" r="2" fill="white" />
        <circle cx="183" cy="15" r="2" fill="white" className="animate-pulse-delay-1" />
        <circle cx="191" cy="15" r="2" fill="white" className="animate-pulse-delay-2" />
      </g>
    </svg>
  );
}

// 慶祝（登入成功）
function MascotCelebrate() {
  return (
    <svg viewBox="0 0 200 240" className="animate-jump size-full drop-shadow-sm">
      {/* Confetti */}
      <g className="animate-confetti">
        <text x="30" y="40" fontSize="14">🎉</text>
        <text x="160" y="35" fontSize="12">🎊</text>
        <text x="20" y="80" fontSize="10">✨</text>
        <text x="175" y="75" fontSize="10">⭐</text>
      </g>

      {/* M-Antenna - Excited */}
      <path d="M 85 35 L 85 10 L 100 25 L 115 10 L 115 35" 
            stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"
            className="animate-wiggle"/>

      {/* House Body & Roof */}
      <path d="M 40 75 L 100 35 L 160 75" 
            stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="55" y="75" width="90" height="100" 
            stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Super Happy Eyebrows */}
      <path d="M 75 100 Q 85 93 95 100" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M 105 100 Q 115 93 125 100" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
      
      {/* Eyes - Closed happy ^ ^ */}
      <path d="M 78 118 Q 85 110 92 118" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M 108 118 Q 115 110 122 118" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />

      {/* Super Big Smile */}
      <path d="M 80 140 Q 100 165 120 140" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />

      {/* Hands - Raised in celebration! */}
      <path d="M 55 125 L 15 80" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M 145 125 L 185 80" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* Jazz hands */}
      <text x="8" y="75" fontSize="16">🙌</text>

      {/* Legs - Jumping */}
      <path d="M 85 175 L 75 200 L 65 205" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 115 175 L 125 200 L 135 205" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Success badge */}
      <g className="animate-bounce">
        <circle cx="100" cy="195" r="15" fill="#10B981" />
        <path d="M 92 195 L 98 201 L 110 189" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </svg>
  );
}

// 睡覺（閒置）
function MascotSleep() {
  return (
    <svg viewBox="0 0 200 240" className="size-full drop-shadow-sm">
      {/* M-Antenna - Droopy */}
      <path d="M 85 45 L 85 25 L 100 35 L 115 25 L 115 45" 
            stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>

      {/* Zzz */}
      <g className="animate-float-up">
        <text x="150" y="50" fontSize="12" fill="currentColor" opacity="0.7">z</text>
        <text x="165" y="35" fontSize="16" fill="currentColor" opacity="0.8">z</text>
        <text x="180" y="18" fontSize="20" fill="currentColor">Z</text>
      </g>

      {/* House Body & Roof */}
      <path d="M 40 80 L 100 40 L 160 80" 
            stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
      <rect x="55" y="80" width="90" height="100" 
            stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>

      {/* Sleepy Eyebrows */}
      <path d="M 78 115 L 92 115" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.7"/>
      <path d="M 108 115 L 122 115" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.7"/>
      
      {/* Eyes - Closed sleeping */}
      <path d="M 78 125 L 92 125" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 108 125 L 122 125" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Sleepy mouth */}
      <ellipse cx="100" cy="150" rx="5" ry="3" stroke="currentColor" strokeWidth="2" fill="none" />

      {/* Hands - Relaxed down */}
      <path d="M 55 130 L 35 155" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.8"/>
      <path d="M 145 130 L 165 155" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.8"/>

      {/* Legs - Standing still */}
      <path d="M 85 180 L 85 215 L 75 215" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
      <path d="M 115 180 L 115 215 L 125 215" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
    </svg>
  );
}

// 害羞/錯誤
function MascotShy() {
  return (
    <svg viewBox="0 0 200 240" className="animate-shake size-full drop-shadow-sm">
      {/* M-Antenna - Droopy sad */}
      <path d="M 85 45 L 85 20 L 100 32 L 115 20 L 115 45" 
            stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Sweat drop */}
      <ellipse cx="155" cy="70" rx="5" ry="8" fill="#87CEEB" className="animate-drip" />

      {/* House Body & Roof */}
      <path d="M 40 80 L 100 40 L 160 80" 
            stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="55" y="80" width="90" height="100" 
            stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Worried Eyebrows */}
      <path d="M 78 108 L 92 115" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M 122 108 L 108 115" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
      
      {/* Eyes - Worried */}
      <circle cx="85" cy="125" r="4" stroke="currentColor" strokeWidth="3" fill="none" />
      <circle cx="85" cy="126" r="1.5" fill="currentColor" />
      <circle cx="115" cy="125" r="4" stroke="currentColor" strokeWidth="3" fill="none" />
      <circle cx="115" cy="126" r="1.5" fill="currentColor" />

      {/* Worried mouth - Wavy */}
      <path d="M 88 150 Q 94 145 100 150 Q 106 155 112 150" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Big Blush */}
      <circle cx="70" cy="140" r="8" fill="#FFB6C1" opacity="0.6" />
      <circle cx="130" cy="140" r="8" fill="#FFB6C1" opacity="0.6" />

      {/* Hands - Nervous gesture */}
      <path d="M 55 130 L 40 120 L 35 130" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M 145 130 L 160 120 L 165 130" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Legs - Tense */}
      <path d="M 85 180 L 80 215 L 70 215" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 115 180 L 120 215 L 130 215" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Error indicator */}
      <g className="animate-pulse">
        <circle cx="165" cy="100" r="10" fill="#EF4444" opacity="0.9" />
        <text x="165" y="105" textAnchor="middle" fontSize="14" fill="white" fontWeight="bold">!</text>
      </g>
    </svg>
  );
}
