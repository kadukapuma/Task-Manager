import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on all network interfaces (0.0.0.0), not just localhost, so
    // other devices on the same LAN (e.g. a phone) can reach the dev server.
    host: true,
  },
})
