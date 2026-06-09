import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, '.'),
  build: {
    outDir: path.resolve(__dirname, '../dist/client'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: 'all',
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
