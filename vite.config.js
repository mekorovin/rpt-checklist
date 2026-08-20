import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 127.0.0.1 вместо localhost: иначе Vite слушает только IPv6 ([::1]),
    // и встроенный браузер VS Code получает ERR_CONNECTION_REFUSED.
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
})
