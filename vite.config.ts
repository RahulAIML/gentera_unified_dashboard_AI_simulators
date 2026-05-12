import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/gentera': {
        target: 'https://serv.aux-rolplay.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path,
      },
    },
  },
})
