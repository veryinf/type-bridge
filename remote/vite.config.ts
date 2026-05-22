import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3020
  },
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
})
