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
      output: {
        // وابستگی‌های ثابت را از کد اپ جدا کن تا وقتی خودِ اپ تغییر می‌کند
        // مرورگر مجبور نشود دوباره React و framer-motion را دانلود کند.
        // فقط ترتیبِ بارگذاری عوض می‌شود؛ نه ظاهر و نه رفتار.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('/react-dom/') || id.includes('/react-router') || /[\\/]react[\\/]/.test(id) || id.includes('/scheduler/')) return 'react-vendor'
          if (id.includes('/framer-motion/')) return 'motion'
          return 'vendor'
        }
      }
    }
  },
  server: { host: true, port: 5175, strictPort: true }
})