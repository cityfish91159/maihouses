import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import checker from 'vite-plugin-checker'

// 為避免在 TS 下找不到 process 型別，這裡做最小宣告（不影響執行）
// 若需要更嚴謹的型別，可另行安裝 @types/node 並在 tsconfig 中啟用
declare const process: any

// 兼容使用者要求的 Codespaces HMR 設定，同時保留 GitHub Pages 需要的 base 與 build 輸出
const inCodespaces = !!process.env.CODESPACE_NAME
const hmrHost = inCodespaces
  ? `${process.env.CODESPACE_NAME}-5173.app.github.dev`
  : 'localhost'

export default defineConfig({
  plugins: [
    react(),
    checker({
      typescript: true,
      overlay: { initialIsOpen: false },
    }),
  ],
  base: '/maihouses/',
  build: {
    outDir: 'docs',
    sourcemap: true, // Enable sourcemaps for debugging
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1000kB
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
          'ui-libs': ['lucide-react', 'react-icons', 'react-hot-toast'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
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
  },
  preview: { port: 5173, strictPort: true },
  optimizeDeps: {
    entries: ['src/main.tsx'],
  },
})
