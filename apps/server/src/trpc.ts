import { initTRPC } from '@trpc/server'
import * as trpcExpress from '@trpc/server/adapters/express'
import { CreateWSSContextFnOptions } from '@trpc/server/adapters/ws'
import { GithubSentinelManager } from './github-sentinel-manager'

type HybridContextOptions =
	| trpcExpress.CreateExpressContextOptions
	| CreateWSSContextFnOptions

export const createContext = async (opts: HybridContextOptions) => {
	const headers = 'req' in opts ? opts.req.headers : {}
	const githubSentinelManager = await GithubSentinelManager.getInstance({
		exportFilePath: process.env.exportFilePath || '../exports'
	})
	const protocolSpecific = {
		...('req' in opts
			? {
					req: opts.req,
					res: opts.res
				}
			: {})
	}
	return {
		headers,
		GithubSentinelManager: githubSentinelManager,
		...protocolSpecific
	}
}

export type Context = Awaited<ReturnType<typeof createContext>>

const t = initTRPC.context<Context>().create({
	errorFormatter: ({ shape }) => ({
		...shape,
		data: {
			...shape.data,
			timestamp: new Date().toISOString()
		}
	})
})

export const router = t.router

export const baseProcedure = t.procedure

export const mergeRouters = t.mergeRouters
