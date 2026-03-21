import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-asset-videos',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (!req.url?.startsWith('/videos/')) return next()
          const fileName = decodeURIComponent(req.url.slice('/videos/'.length))
          const filePath = path.resolve(__dirname, '..', 'assets', fileName)
          if (!fs.existsSync(filePath)) return next()

          const stat = fs.statSync(filePath)
          const range = req.headers.range

          if (range) {
            const parts = range.replace(/bytes=/, '').split('-')
            const start = parseInt(parts[0], 10)
            const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1
            res.writeHead(206, {
              'Content-Range': `bytes ${start}-${end}/${stat.size}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': end - start + 1,
              'Content-Type': 'video/mp4',
            })
            fs.createReadStream(filePath, { start, end }).pipe(res)
          } else {
            res.writeHead(200, {
              'Content-Type': 'video/mp4',
              'Content-Length': stat.size,
              'Accept-Ranges': 'bytes',
            })
            fs.createReadStream(filePath).pipe(res)
          }
        })
      },
    },
  ],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
    },
  },
})
