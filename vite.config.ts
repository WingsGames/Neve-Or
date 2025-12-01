import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // CRITICAL: This ensures assets load correctly on GitHub Pages
  build: {
    outDir: 'dist',
  },
  define: {
    // Safely expose specific env vars to client, avoiding Windows path issues
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      API_KEY: JSON.stringify(process.env.API_KEY || '')
    }
  }
})