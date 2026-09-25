import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The app can be served from the domain root or a sub-directory. Use a
// relative base so the generated HTML works for both deployments.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    manifest: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: { host: true },
})
