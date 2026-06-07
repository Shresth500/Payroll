import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Proxy API calls to ASP.NET Core — avoids CORS issues in dev
    // Change 7001 to match your API port in launchSettings.json
    proxy: {
      '/api': {
        target: 'https://localhost:7255',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})