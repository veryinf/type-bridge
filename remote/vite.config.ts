import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3020,
    host: '0.0.0.0',
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
})
