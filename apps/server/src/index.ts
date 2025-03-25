import express from 'express'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import cors from 'cors'
import path from 'path'
import { appRouter } from './routers'
import { createContext } from './trpc'
export type { AppRouter } from './routers'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(cors())

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')))

// tRPC middleware
app.use(
	'/api/trpc',
	createExpressMiddleware({ router: appRouter, createContext })
)

const PORT = process.env.PORT || 9090

app.listen(PORT, () => {
	console.log(`🚀 Server is running on http://localhost:${PORT}`)
})

// // 执行 ws
import './web-socket'
