import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/maihouses/',
  build: { 
    outDir: 'docs',
    sourcemap: false
  },
  server: {
    hmr: { overlay: false }
  },
  optimizeDeps: {
    entries: ['src/main.tsx']
  }
})
