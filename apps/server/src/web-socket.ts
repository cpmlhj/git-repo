import { applyWSSHandler } from '@trpc/server/adapters/ws'
import { WebSocketServer } from 'ws'
import { createContext } from './trpc'
import { appRouter } from './routers'

const wss = new WebSocketServer({
	port: 3009
})
const handler = applyWSSHandler({
	wss,
	router: appRouter,
	createContext: createContext
})

wss.on('connection', (ws) => {
	console.log(`➕➕ Connection (${wss.clients.size})`)
	ws.once('close', () => {
		console.log(`➖➖ Connection (${wss.clients.size})`)
	})
})

process.on('SIGTERM', () => {
	console.log('SIGTERM')
	handler.broadcastReconnectNotification()
	wss.close()
})
