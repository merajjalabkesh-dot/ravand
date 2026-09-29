// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    manifest: true,
    rollupOptions: {
      input: {
        main: 'index.html',       // نسخه اپ
        site: 'index-site.html'   // نسخه سایت
      },
      output: { manualChunks: undefined }
    }
  },
  server: { host: true, port: 5175, strictPort: true }
})