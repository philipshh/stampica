import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

// Dev server only: /dev/posters POSTs rendered showcase posters here.
function saveShowcase(): Plugin {
    return {
        name: 'save-showcase',
        apply: 'serve',
        configureServer(server) {
            server.middlewares.use('/__save', (req, res) => {
                const name = new URL(req.url ?? '', 'http://x').searchParams.get('name') ?? ''
                if (req.method !== 'POST' || !/^[a-z0-9-]+\.jpg$/.test(name)) {
                    res.statusCode = 400
                    return res.end('bad request')
                }
                const chunks: Buffer[] = []
                req.on('data', (c: Buffer) => chunks.push(c))
                req.on('end', () => {
                    const dir = path.resolve(__dirname, 'public/showcase')
                    fs.mkdirSync(dir, { recursive: true })
                    fs.writeFileSync(path.join(dir, name), Buffer.concat(chunks))
                    res.end('ok')
                })
            })
        },
    }
}

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), saveShowcase()],
    server: {
        // Same-origin /api in dev, proxied to the local API server (backend/)
        proxy: {
            '/api': process.env.API_PROXY ?? 'http://localhost:3001',
        },
    },
})
