import { router, baseProcedure } from '../trpc'
import { z } from 'zod'
import fs from 'fs'
import path from 'path'
import { Readable } from 'stream'
import { modelTypeSchema } from './llm'

export const repo = router({
	generateReport: baseProcedure
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
		.mutation(async ({ input, ctx }) => {
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

			const config = ctx.GithubSentinelManager.getConfigManager()
			if (config) {
				const { llm } = config.getConfig()
				const { modelType, modelConfig } = input
				// 选择模型是否有改变
				if (
					modelType === 'openai' &&
					modelConfig?.model !== llm.model
				) {
					config.setConfig('llm', {
						...llm,
						...modelConfig
					})
				}

				// TODO OLLAMA 设置
			}

			const taskId = `${input.owner}/${input.repo}`
			// const reportGenerator =
			// 	ctx.GithubSentinelManager.getReportService()
			// reportGenerator?.generateNow(subscription, (chunk) => {
			// 	ctx.ee.emit(`report:${taskId}`, chunk)
			// })

			return { success: true, taskId }
		}),

	reportProgress: baseProcedure
		.input(
			z.object({
				taskId: z.string()
			})
		)
		.subscription(({ input, ctx }) => {
			// return new Observable<any>((subscriber) => {
			// 	const onProgress = (chunk: any) => {
			// 		subscriber.next(chunk)
			// 	}
			// 	ctx.ee.on(`report:${input.taskId}`, onProgress)
			// 	return () => {
			// 		ctx.ee.off(`report:${input.taskId}`, onProgress)
			// 	}
			// })
		}),

	getReportList: baseProcedure
		.input(
			z.object({
				owner: z.string(),
				repo: z.string()
			})
		)
		.query(async ({ input }) => {
			const reportsPath = path.join(
				process.cwd(),
				'data',
				'reports',
				input.owner,
				input.repo
			)

			if (!fs.existsSync(reportsPath)) {
				return []
			}

			const files = fs.readdirSync(reportsPath)
			return files.filter((file) => file.endsWith('.md'))
		}),

	streamReport: baseProcedure
		.input(
			z.object({
				owner: z.string(),
				repo: z.string(),
				reportName: z.string()
			})
		)
		.subscription(async ({ input }) => {
			const reportPath = path.join(
				process.cwd(),
				'data',
				'reports',
				input.owner,
				input.repo,
				input.reportName
			)

			if (!fs.existsSync(reportPath)) {
				throw new Error('报告文件不存在')
			}

			return new Readable({
				read() {
					const content = fs.readFileSync(
						reportPath,
						'utf-8'
					)
					this.push(content)
					this.push(null)
				}
			})
		})
})
