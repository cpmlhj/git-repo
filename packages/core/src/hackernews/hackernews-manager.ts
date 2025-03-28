import { HackerNewsClient } from './hackernews-client'
import { HackerNewsAnalyticsService } from './analytics-service'
import { HNStory, HNStoryType } from '../types'
import { Logger } from '../helpers/logger'
import { format_date } from '../helpers/date-format'
import { ConfigManager } from '../config'
import { GenerationEventEmitter } from '../events'
import path from 'path'
import fs from 'fs'

export class HackerNewsManager {
	private configManager: ConfigManager
	private client: HackerNewsClient
	private analyticsService: HackerNewsAnalyticsService
	private eventEmitter: GenerationEventEmitter
	private logger = Logger.getInstance()

	constructor() {
		this.configManager = ConfigManager.getInstance()
		this.client = new HackerNewsClient()
		this.analyticsService = new HackerNewsAnalyticsService()
		this.eventEmitter = GenerationEventEmitter.getInstance()
	}

	/**
	 * 获取并分析HackerNews热点
	 */
	async getHotTopics(emitter: (chunk: any) => void) {
		try {
			const { exports } = this.configManager.getConfig()
			// 获取多种类型的热门故事
			const stories = await this.client.getMultiTypeStories(
				['top', 'best', 'new'],
				10
			)
			this.logger.info(
				`Successfully fetched ${stories.length} stories from HackerNews`
			)
			const taskId = 'hackerNews'
			const unsubscribe = this.eventEmitter.onGeneration(
				taskId, // TODO: 有且只有一个监听任务
				emitter
			)
			let content = ''

			// 生成分析报告
			for await (const chunk of this.analyticsService.categorizeTopics(
				stories
			)) {
				content += chunk
				this.eventEmitter.emitGenerationEvent({
					taskId,
					content: chunk,
					type: 'chunk'
				})
			}

			this.logger.info(
				'Successfully generated HackerNews analytics report'
			)
			// 结束监听
			unsubscribe && unsubscribe()
			this.eventEmitter.emitGenerationEvent({
				taskId,
				content: '',
				type: 'complete'
			})
			if (exports && exports.path) {
				this.exportContentToMarkdown({
					content,
					filepath: exports.path
				})
			}
		} catch (error) {
			this.logger.error(
				'Error while fetching and analyzing HackerNews:',
				error
			)
			throw error
		}
	}

	// /**
	//  * 获取指定类型的热门故事
	//  */
	// async getStoriesByType(
	// 	type: HNStoryType,
	// 	limit: number = 30
	// ): Promise<HNStory[]> {
	// 	try {
	// 		const stories = await this.client.getStories(type, limit)
	// 		this.logger.info(
	// 			`Successfully fetched ${stories.length} ${type} stories from HackerNews`
	// 		)
	// 		return stories
	// 	} catch (error) {
	// 		this.logger.warn(
	// 			`Error while fetching ${type} stories from HackerNews:`
	// 		)
	// 		this.logger.error(error)
	// 		throw error
	// 	}
	// }

	// 将总结内容保存为 Markdown 文件
	private exportContentToMarkdown({
		content,
		filepath
	}: {
		content: string
		filepath: string
	}) {
		const today = new Date()
		let fileName = `hackerNews_${format_date(today.toISOString())}.md`
		// 创建owner和repo的层级目录
		const fileDir = path.join(filepath, 'hackerNews')
		if (!fs.existsSync(fileDir)) {
			fs.mkdirSync(fileDir, { recursive: true })
		}
		let counter = 1

		// 处理文件名重复的情况
		while (fs.existsSync(path.join(fileDir, fileName))) {
			fileName = fileName.replace('.md', `-${counter}.md`)
			counter++
		}

		// 导出 Markdown 文件
		const filePath = path.join(fileDir, fileName)
		fs.writeFileSync(filePath, content)
	}
}
