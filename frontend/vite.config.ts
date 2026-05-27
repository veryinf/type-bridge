import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 9245,
    host: '127.0.0.1',
  },
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
})
