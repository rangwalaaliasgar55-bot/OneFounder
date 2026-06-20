import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import tailwindcss from 'tailwindcss'
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
        manualChunks: {
          'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui':     ['react/jsx-runtime'],
          'vendor-three':  ['three', '@react-three/fiber', '@react-three/drei'],
          'vendor-motion': ['framer-motion', 'gsap', '@gsap/react'],
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
