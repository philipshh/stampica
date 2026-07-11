import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        // Same-origin /api in dev, proxied to the local API server (backend/)
        proxy: {
            '/api': 'http://localhost:3000',
        },
    },
})
