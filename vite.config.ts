import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/sudo-/',
  plugins: [react()],
  server: {
    host: true,
  },
})
