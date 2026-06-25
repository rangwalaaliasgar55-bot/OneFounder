import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import tailwindcss from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, '.'),
  build: {
    outDir: path.resolve(__dirname, '../dist/client'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (/[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/.test(id)) {
            return 'vendor-react'
          }
          if (id.includes('react/jsx-runtime')) {
            return 'vendor-ui'
          }
          if (/[\\/]node_modules[\\/](framer-motion|gsap|@gsap[\\/]react)[\\/]/.test(id)) {
            return 'vendor-motion'
          }
          // Three.js is not grouped here; dynamic imports let Vite split it separately.
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss(),
        autoprefixer(),
      ],
    },
  },
  server: {
    port: 5000,
    host: '0.0.0.0',
    allowedHosts: true,
    hmr: process.env.REPLIT_DEV_DOMAIN ? {
      host: process.env.REPLIT_DEV_DOMAIN,
      clientPort: 443,
      protocol: 'wss',
    } : true,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
      '/auth': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
})
