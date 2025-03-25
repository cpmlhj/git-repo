import {
	createWSClient,
	httpBatchLink,
	wsLink,
	createTRPCReact,
	splitLink,
	loggerLink
} from '@trpc/react-query'
import { inferRouterInputs } from '@trpc/server'
import type { AppRouter } from '../../../server/src'

import { QueryClient } from '@tanstack/react-query'

export type RouterInputs = inferRouterInputs<AppRouter>

export const browserQueryClient: QueryClient = new QueryClient({
	defaultOptions: {
		queries: {}
	}
})

export const trpc = createTRPCReact<AppRouter>()
export const trpcServer = trpc.createClient({
	links: [
		loggerLink({
			enabled: (opts) =>
				(process.env.NODE_ENV === 'development' &&
					typeof window !== 'undefined') ||
				(opts.direction === 'down' &&
					opts.result instanceof Error)
		}),
		splitLink({
			condition(op) {
				return op.type === 'subscription'
			},
			true: wsLink({
				client: createWSClient({
					url: 'ws://localhost:3009',
					onOpen: () => console.log('ws open'),
					onClose: () => console.log('ws close'),
					retryDelayMs: () => 3000
				})
			}),
			false: httpBatchLink({
				url: 'http://localhost:9090/api/trpc'
			})
		})
	]
})
