/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'
import checker from 'vite-plugin-checker'
import { execSync } from 'node:child_process'

// 為避免在 TS 下找不到 process 型別，這裡做最小宣告（不影響執行）
// 若需要更嚴謹的型別，可另行安裝 @types/node 並在 tsconfig 中啟用
declare const process: any

// 兼容使用者要求的 Codespaces HMR 設定，同時保留 GitHub Pages 需要的 base 與 build 輸出
const inCodespaces = !!process.env.CODESPACE_NAME
const hmrHost = inCodespaces
  ? `${process.env.CODESPACE_NAME}-5173.app.github.dev`
  : 'localhost'

// 判斷是否為 Vercel 環境
const isVercel = process.env.VERCEL === '1'

const resolveGitSha = (): string => {
  try {
    if (process.env.VERCEL_GIT_COMMIT_SHA) {
      return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)
    }
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'dev'
  }
}

const buildTimestamp = new Date().toISOString()
const gitSha = resolveGitSha()

export default defineConfig({
  plugins: [
    legacy({
      // 目標：避免舊版 iOS/Safari 因不支援 module 直接白屏
      // 交由 plugin-legacy 產出 nomodule + polyfills
      targets: ['defaults', 'ios >= 11', 'safari >= 11'],
    }),
    react(),
    // build 時已跑過 `tsc`，這個 checker 會額外啟動服務吃記憶體
    // 只在 dev/serve 啟用即可
    ...(process.env.NODE_ENV === 'development'
      ? [
          checker({
            typescript: true,
            overlay: { initialIsOpen: false },
          }),
        ]
      : []),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(gitSha),
    __BUILD_TIME__: JSON.stringify(buildTimestamp),
  },
  // Vercel 環境使用根路徑，避免靜態資源 MIME type 錯誤
  base: isVercel ? '/' : '/maihouses/',
  build: {
    outDir: 'dist', // Standardize to dist for Vercel
    sourcemap: false, // legacy build + sourcemap 容易 OOM，先關閉避免白屏無法部署
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1000kB
    rollupOptions: {
      input: {
        main: 'index.html',
        maimaiStory: 'maimai-story.html',
      },
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
          'ui-libs': ['lucide-react', 'react-icons'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/e2e/**'], // Exclude Playwright E2E tests from vitest
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'api/**/*.{test,spec}.{ts,tsx}'], // Explicit test file patterns
    root: process.cwd(), // Fix Windows path case-sensitivity issue
    setupFiles: ['./src/setupTests.ts'], // Load jest-dom matchers
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: inCodespaces ? 'wss' : 'ws',
      host: hmrHost,
      clientPort: inCodespaces ? 443 : 5173,
      overlay: false,
    },
    proxy: {
      '/api': {
        target: 'https://maihouses.vercel.app',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  preview: { port: 5173, strictPort: true },
  optimizeDeps: {
    entries: ['src/main.tsx', 'src/dev/maimai-story.tsx'],
  },
})
