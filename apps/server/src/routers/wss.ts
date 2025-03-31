import { router, baseProcedure } from '../trpc'
import { observable } from '@trpc/server/observable'
import { ee } from '../routers'
import { GenerationEvent } from '@github-sentinel/core'
import { WSEventName } from './constants'
import { modelTypeSchema } from './llm'
import * as z from 'zod'
import { TRPCError } from '@trpc/server'

export const WssRouter = router({
	generateReport: baseProcedure.subscription(() => {
		return observable<GenerationEvent>((emit) => {
			const emitReport = (chunk: GenerationEvent) => {
				emit.next(chunk)
			}
			ee.on(WSEventName.REPORT_GENERATE, emitReport)
			return () => ee.off(WSEventName.REPORT_GENERATE, emitReport)
		})
	}),
	generateHackerNewsReport: baseProcedure.subscription(() => {
		return observable<GenerationEvent>((emit) => {
			const emitReport = (chunk: GenerationEvent) => {
				emit.next(chunk)
				if (chunk.type === 'complete') {
					ee.off(
						WSEventName.HACKER_NEWS_GENERATE,
						emitReport
					)
					return
				}
			}
			ee.on(WSEventName.HACKER_NEWS_GENERATE, emitReport)
			return () =>
				ee.off(WSEventName.HACKER_NEWS_GENERATE, emitReport)
		})
	}),
	subscribeHackerNews: baseProcedure
		.input(
			z.object({
				modelType: modelTypeSchema,
				modelConfig: z
					.object({
						model: z.string(),
						temperature: z.number().optional(),
						maxTokens: z.number().optional()
					})
					.optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			ctx.GithubSentinelManager.updateModelConfig({
				modelConfig: input.modelConfig,
				modelType: input.modelType
			})
			const exporter =
				ctx.GithubSentinelManager.getHackerNewsManager()
			exporter.getHotTopics((chunk: GenerationEvent) =>
				ee.emit(WSEventName.HACKER_NEWS_GENERATE, chunk)
			)
		}),
	submitReportGeneration: baseProcedure
		.input(
			z.object({
				owner: z.string(),
				repo: z.string(),
				modelType: modelTypeSchema,
				modelConfig: z
					.object({
						model: z.string(),
						temperature: z.number().optional(),
						maxTokens: z.number().optional()
					})
					.optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const subscriptionManager =
					ctx.GithubSentinelManager.getSubscriptionManager()
				const subscriptions =
					await subscriptionManager?.getSubscriptions()
				const subscription = subscriptions?.find(
					(item) =>
						item.owner === input.owner &&
						item.repo === input.repo
				)
				if (!subscription) {
					throw new Error('未找到订阅信息')
				}

				ctx.GithubSentinelManager.updateModelConfig({
					modelConfig: input.modelConfig,
					modelType: input.modelType
				})
				const exporter =
					ctx.GithubSentinelManager.getReportService()

				exporter?.generateNow(
					subscription,
					(chunk: GenerationEvent) =>
						ee.emit(WSEventName.REPORT_GENERATE, chunk)
				)
			} catch (error) {
				console.error(error)
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: '生成报告失败'
				})
			}
		})
})
