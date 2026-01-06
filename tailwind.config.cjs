module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#00385a', // Unified brand color
          light: '#009FE8',
          dark: '#00385a',
          700: '#00385a',
          600: '#004E7C',
          500: '#00629B',
          300: '#7EA5FF',
          100: '#E6EDF7',
          50: '#F6F9FF',
        },
        ink: {
          900: '#0A2246',
          700: '#2A2F3A',
          600: '#6C7B91',
          400: '#94A3B8',
        },
        primary: '#0A2246',
        success: '#0f6a23',
        bg: {
          base: '#f6f9ff',
          card: 'rgba(255, 255, 255, 0.92)',
          soft: '#F6F9FF',
        },
        border: {
          light: '#E6EDF7',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          muted: '#6C7B91',
          ink: '#0A2246',
        },
        maihouses: {
          dark: '#003366', // Was hardcoded
          light: '#00A8E8', // Was hardcoded
        }
      },
      maxWidth: {
        'container': '1080px',
      },
      /**
       * 🎬 MaiHouses Animation System (SSOT)
       * - 所有動畫定義於此，index.css 不應重複定義
       * - 使用 transform/opacity 確保 GPU 加速
       * - cubic-bezier 提供專業動效手感
       */
      animation: {
        /** 淡入動畫 - 用於元素初始載入 */
        'fadeIn': 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        /** 漂浮動畫 - MaiMai 待機狀態 */
        'float': 'float 3s cubic-bezier(0.45, 0, 0.55, 1) infinite',
        /** 桌面漂浮 - 較大幅度 */
        'float-desktop': 'floatDesktop 3s cubic-bezier(0.45, 0, 0.55, 1) infinite',
        /** 慢彈跳 - 輕微彈跳效果 */
        'bounce-slow': 'bounce 2s infinite',
        /** 搖擺動畫 - MaiMai 天線/身體搖動 */
        'wiggle': 'wiggle 0.3s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        /** 揮手動畫 - MaiMai 打招呼 */
        'wave': 'wave 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        /** 眨眼動畫 - MaiMai 眼睛眨動 */
        'blink': 'blink 3s steps(1) infinite',
        /** 跳躍動畫 - MaiMai 開心跳躍 */
        'jump': 'jump 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        /** 抖動動畫 - MaiMai 受驚/緊張 */
        'shake': 'shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        /** 閃爍動畫 - 星星/特效閃爍 */
        'twinkle': 'twinkle 1.5s ease-in-out infinite',
        /** 延遲閃爍 - 錯開時間的閃爍 */
        'twinkle-delay': 'twinkle 1.5s ease-in-out infinite 0.4s',
        /** 滴落動畫 - 汗滴/淚滴 */
        'drip': 'drip 2s ease-out infinite',
        /** 上浮動畫 - 蒸氣/泡泡 */
        'float-up': 'floatUp 3s ease-in-out infinite',
        /** 撒花動畫 - 慶祝特效 */
        'confetti': 'confetti 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
      },
      /**
       * 🎬 Keyframes 定義 (SSOT - Single Source of Truth)
       * 規範：
       * - 只使用 transform + opacity（GPU 合成層）
       * - 避免 top/left/width/height（觸發 layout）
       * - 使用 will-change 需在組件層級設定
       */
      keyframes: {
        /** 淡入 + 上移：用於卡片、Modal 進場 */
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        /** 漂浮：MaiMai 待機呼吸效果 */
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-7px)' },
        },
        /** 桌面漂浮：較大幅度適合大螢幕 */
        floatDesktop: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        /** 搖擺：天線/身體左右搖動 */
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-5deg)' },
          '75%': { transform: 'rotate(5deg)' },
        },
        /** 揮手：手臂揮動打招呼 */
        wave: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '50%': { transform: 'rotate(20deg)' },
        },
        /** 眨眼：steps(1) 實現離散開關效果 */
        blink: {
          '0%, 45%, 55%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        /** 跳躍：彈性過衝效果 (overshoot) */
        jump: {
          '0%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-15px)' },
          '60%': { transform: 'translateY(-5px)' },
        },
        /** 抖動：左右快速震動表達緊張 */
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-3px)' },
          '40%, 80%': { transform: 'translateX(3px)' },
        },
        /** 閃爍：星星/光點縮放+透明度變化 */
        twinkle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.8)' },
        },
        /** 滴落：汗滴/淚滴下墜消失 */
        drip: {
          '0%': { transform: 'translateY(0)', opacity: '0.7' },
          '100%': { transform: 'translateY(20px)', opacity: '0' },
        },
        /** 上浮：蒸氣/泡泡緩慢上升 */
        floatUp: {
          '0%, 100%': { transform: 'translateY(0)', opacity: '0.7' },
          '50%': { transform: 'translateY(-10px)', opacity: '1' },
        },
        /** 撒花：CSS 變數控制方向 --confetti-dx/dy */
        confetti: {
          '0%': { transform: 'translate(0, 0) scale(0.6) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translate(var(--confetti-dx, 0px), var(--confetti-dy, 80px)) scale(1.2) rotate(360deg)', opacity: '0' },
        },
      },
      zIndex: {
        dropdown: '30',
        overlay: '40',
        modal: '50',
      },
    }
  },
  plugins: []
}
