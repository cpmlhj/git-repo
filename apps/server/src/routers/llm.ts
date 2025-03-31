import { z } from 'zod'
import { baseProcedure, router } from '../trpc'
import { TRPCError } from '@trpc/server'

export const modelTypeSchema = z.enum(['openai', 'ollama'])

export const llmRouter = router({
	getModels: baseProcedure
		.input(z.object({ modelType: modelTypeSchema }))
		.query(async ({ input, ctx }) => {
			const { modelType } = input
			// 更新平台
			ctx.GithubSentinelManager.getConfigManager()?.setConfig(
				'platform',
				modelType
			)
			try {
				const models =
					ctx.GithubSentinelManager.llm?.getModelList()
				return models
			} catch (error) {
				console.error(error)
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: '获取模型列表失败'
				})
			}
		})
})
