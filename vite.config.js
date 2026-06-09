import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer/',
    },
  },
  build: {
    outDir: 'docs',
    target: 'esnext',
    rollupOptions: {
      output: {
        // 禁止代码拆分，所有代码合并到一个 JS 文件
        manualChunks: undefined,
        inlineDynamicImports: true,
      },
    },
    // 大图标库不给拆，直接内联到主包
    chunkSizeWarningLimit: 5000,
  },
  server: {
    proxy: {
      '/api/baidu-ocr': {
        target: 'https://aip.baidubce.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/baidu-ocr/, ''),
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
