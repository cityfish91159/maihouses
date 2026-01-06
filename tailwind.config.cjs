module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      /**
       * 🎨 Design Tokens - CSS Variable Driven (SSOT)
       * - 所有顏色引用 CSS 變數 (src/index.css / public/main.css)
       * - 語意化命名，禁止硬編碼 Hex
       */
      colors: {
        // Brand Colors - 引用 CSS 變數
        brand: {
          DEFAULT: 'var(--brand)',           // #00385a
          light: 'var(--brand-light)',       // #009FE8
          dark: 'var(--primary-dark)',       // #002a44
          700: 'var(--brand)',               // #00385a
          600: 'var(--brand-600)',           // #004E7C
          500: 'var(--primary-light)',       // #005282
          300: '#7EA5FF',                    // 暫無 CSS 變數，待補充
          100: 'var(--border)',              // #E6EDF7
          50: 'var(--bg-base)',              // #F6F9FF
        },
        // Ink (Text) Colors
        ink: {
          900: 'var(--text-primary)',        // #0A2246
          700: '#2A2F3A',
          600: 'var(--text-muted)',          // #6C7B91
          400: '#94A3B8',
        },
        // Accent Colors - 消除 Magic Colors
        accent: {
          alert: '#E63946',                  // 紅點、警告
          'alert-rgb': '230, 57, 70',        // 用於 shadow
        },
        // Semantic
        primary: 'var(--text-primary)',
        success: 'var(--success)',
        danger: 'var(--danger)',
        // Background
        bg: {
          base: 'var(--bg-base)',
          page: 'var(--bg-page)',
          card: 'var(--bg-elevated)',
          soft: 'var(--bg-alt)',
          // 消除 bg-white/96 - 使用語意化 token
          'card-blur': 'rgba(255, 255, 255, 0.96)',
        },
        // Border
        border: {
          DEFAULT: 'var(--border)',
          light: 'var(--border-light)',
        },
        // Text (legacy support)
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          muted: 'var(--text-muted)',
          ink: 'var(--text-primary)',
        },
        // Neutral Gradient Colors - 用於 avatar/card 漸層
        neutral: {
          150: '#F2F5F8',  // gradient from
          200: '#E1E6EB',  // gradient to
          100: '#F5F7FA',  // button hover
          80: '#E8F0FF',   // button hover alt
        },
      },
      /**
       * 🌑 Semantic Box Shadows - rgba(var()) Pattern
       * - 使用 CSS 變數的 RGB 值實現動態陰影
       * - 消除所有 hardcoded rgba(0,56,90,...) 
       */
      dropShadow: {
        'brand-xs': '0 1px 0 rgba(var(--brand-primary-rgb, 0, 56, 90), 0.12)',
      },
      boxShadow: {
        // Brand Shadows (使用 --brand-primary-rgb: 0, 56, 90)
        'brand-xs': '0 1px 2px rgba(var(--brand-primary-rgb, 0, 56, 90), 0.05)',
        'brand-sm': '0 2px 6px rgba(var(--brand-primary-rgb, 0, 56, 90), 0.08)',
        'brand-md': '0 4px 12px rgba(var(--brand-primary-rgb, 0, 56, 90), 0.10)',
        'brand-lg': '0 8px 24px rgba(var(--brand-primary-rgb, 0, 56, 90), 0.12)',
        'brand-xl': '0 12px 32px rgba(var(--brand-primary-rgb, 0, 56, 90), 0.15)',
        // Card Shadows (語意化)
        'card': '0 2px 8px rgba(var(--brand-primary-rgb, 0, 56, 90), 0.06)',
        'card-hover': '0 10px 26px rgba(13, 39, 94, 0.12)',
        'card-glow': '0 4px 20px rgba(var(--brand-primary-rgb, 0, 56, 90), 0.03)',
        // Header/Banner Shadows
        'header': '0 2px 8px rgba(var(--brand-primary-rgb, 0, 56, 90), 0.15)',
        // Accent/Alert Shadows (紅點光暈)
        'alert-glow': '0 0 8px rgba(230, 57, 70, 0.6)',
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
