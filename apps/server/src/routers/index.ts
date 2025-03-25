import { router } from '../trpc'
import { subscriptionRouter } from './subscriptions'
import { llmRouter } from './llm'
import { WssRouter } from './wss'

import { EventEmitter } from 'events'

export const ee = new EventEmitter()

export const appRouter = router({
	subscriptions: subscriptionRouter,
	llm: llmRouter,
	report: WssRouter
})

export type AppRouter = typeof appRouter
