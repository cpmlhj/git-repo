import { GitHubEvent, GitHubEventType } from '../types'
import { OctokitGitHubClient } from '../github'
import { Config } from '../config'
import { llmClient } from '@github-sentinel/llm'
import {
	EventContentGenerators,
	EventDataParesers,
	EXPORT_CHUNK_FINISHED
} from './events_outpus'
import { FrequencyStrategy } from '../subscription/frequency-strategies'
import { GenerationEventEmitter } from '../events'
import { logger } from '../helpers/logger'
import { ConfigManager } from '../config'
import { prompt } from './prompt'
import { log } from 'console'

/**
 * 报告生成器类
 */
export class ReportGenerator {
	private llmClient: llmClient | undefined

	private githubClient: OctokitGitHubClient

	private eventEmitter: GenerationEventEmitter

	private config: ConfigManager

	constructor() {
		this.llmClient = new llmClient()
		this.githubClient = new OctokitGitHubClient()
		this.eventEmitter = GenerationEventEmitter.getInstance()
		this.config = ConfigManager.getInstance()
	}

	/**
	 * 生成报告
	 */
	public async generateReport(params: {
		owner: string
		repo: string
		eventTypes: Array<GitHubEventType>
		frequencyStrategy: FrequencyStrategy
		export?: Config['exports']
		range_date?: [string, string]
	}): Promise<{ report: string; title: string }> {
		const {
			type,
			name: periodText,
			custom_date
		} = params.frequencyStrategy.metaData
		const since = params.frequencyStrategy.getDateRange()
		const { platform } = this.config.getConfig()

		const { event_data, content } = await this.contentGenerators({
			owner: params.owner,
			repo: params.repo,
			export_events: params.eventTypes,
			since: since[0],
			range_date:
				type === 'custom'
					? [custom_date!.start, custom_date!.end]
					: undefined
		})
		const title = `# GitHub 仓库 ${params.owner}/${params.repo} ${periodText}\n\n`
		// 生成 Markdown 格式的报告
		let report = title

		// 添加统计信息
		report += this.generateStatistics(event_data)

		// 添加详细事件信息 -- 不使用AI分析
		if (!this.llmClient) {
			report += content
		}

		// 生成AI分析总结
		if (this.llmClient) {
			report += await this.generateAISummary(
				event_data,
				platform,
				title
			)
		}
		return {
			report,
			title
		}
	}

	/**
	 * 流式生成报告
	 */
	public async generateReportStream(params: {
		owner: string
		repo: string
		eventTypes: Array<GitHubEventType>
		frequencyStrategy: FrequencyStrategy
		emitter: (chunk: any) => void
		export?: Config['exports']
		range_date?: [string, string]
	}) {
		const taskId = `${params.owner}/${params.repo}`
		if (this.eventEmitter.hasTask(taskId)) {
			throw new Error(`Task: ${taskId} already exists`)
		}
		const {
			type,
			name: periodText,
			custom_date
		} = params.frequencyStrategy.metaData
		const since = params.frequencyStrategy.getDateRange()
		const { platform } = this.config.getConfig()
		console.log(params, '这是什么')
		// 生成 Markdown 格式的报告
		const title = `# GitHub 仓库 ${params.owner}/${params.repo} ${periodText}\n\n`
		try {
			const unsubscribe = this.eventEmitter.onGeneration(
				taskId,
				params.emitter
			)

			// 添加详细事件信息
			const { event_data } = await this.contentGenerators({
				owner: params.owner,
				repo: params.repo,
				export_events: params.eventTypes,
				since: since[0],
				range_date:
					type === 'custom'
						? [custom_date!.start, custom_date!.end]
						: undefined
			})
			let repoprt = ''

			this.eventEmitter.emitGenerationEvent({
				taskId,
				content: title,
				type: 'chunk'
			})
			repoprt += title
			// 添加统计信息
			const Statistics = this.generateStatistics(event_data)

			this.eventEmitter.emitGenerationEvent({
				taskId,
				content: Statistics,
				type: 'chunk'
			})
			repoprt += Statistics
			// 生成AI分析总结
			if (this.llmClient) {
				for await (const chunk of this.generateAISummaryStream(
					event_data,
					platform,
					title
				)) {
					if (chunk === EXPORT_CHUNK_FINISHED) {
						this.eventEmitter.emitGenerationEvent({
							taskId,
							content: '',
							type: 'complete'
						})
						// 结束监听
						unsubscribe && unsubscribe()
						return repoprt
					} else {
						this.eventEmitter.emitGenerationEvent({
							taskId,
							content: chunk,
							type: 'chunk'
						})
					}
					repoprt += chunk
				}
			}
		} catch (e) {
			logger.error(e)
		}
	}

	/**
	 * 生成统计信息
	 */
	private generateStatistics(
		eventsByType: Record<string, GitHubEvent[]>
	): string {
		let stats = '## 统计信息\n\n'

		// 统计各类型事件数量
		for (const [type, events] of Object.entries(eventsByType)) {
			stats += `- ${type}事件: 共${events.length} 个\n`
		}

		return stats + '\n'
	}

	/**
	 * 生成AI分析总结
	 */
	private async generateAISummary(
		eventsByType: Partial<Record<GitHubEventType, any>>,
		platform: Config['platform'],
		title: string
	): Promise<string> {
		let summary = '## AI 分析总结\n\n'
		let chainPrompt = `${title} \n\n`
		// 处理事件，获取关键信息 组合为prompt
		Object.keys(eventsByType).forEach((eventType) => {
			const type =
				eventType as unknown as keyof typeof EventDataParesers
			chainPrompt += this.formatEventType(type, eventsByType[type])

			chainPrompt += '\n\n'
		})

		// 读取平台prompt
		const platformPrompt = prompt[platform]

		summary += await this.llmClient?.chatCompletion({
			question: chainPrompt,
			prompt: platformPrompt
		})

		return summary
	}

	/**
	 * 流式生成AI分析总结
	 */
	private async *generateAISummaryStream(
		eventsByType: Partial<Record<keyof typeof EventDataParesers, any>>,
		platform: Config['platform'],
		title: string
	): AsyncGenerator<string> {
		yield '## AI 分析总结\n\n'
		let chainPrompt = `${title} \n\n`
		// 处理事件，获取关键信息 组合为prompt
		Object.keys(eventsByType).forEach((eventType) => {
			const type =
				eventType as unknown as keyof typeof EventDataParesers
			chainPrompt += this.formatEventType(type, eventsByType[type])

			chainPrompt += '\n\n'
		})

		// 读取平台prompt
		const platformPrompt = prompt[platform]

		const prStream = await this.llmClient?.chatCompletionWithStream({
			question: chainPrompt,
			prompt: platformPrompt
		})

		if (prStream) {
			for await (const chunk of prStream) {
				yield chunk
			}
		}

		yield EXPORT_CHUNK_FINISHED
	}

	/**
	 * 格式化事件类型
	 */
	private formatEventType(
		type: keyof typeof EventDataParesers,
		evnets: any[]
	): string {
		const typeMap: Partial<Record<GitHubEventType, string>> = {
			IssuesEvent: 'Issue 更新',
			PullRequestEvent: 'Pull Request 更新',
			ReleaseEvent: '新版本发布',
			DiscussionEvent: '讨论更新'
		}
		const stringifyPrompt = JSON.stringify(
			EventDataParesers[type](evnets),
			null,
			2
		)
		return `### ${typeMap}  信息\n\n  ${stringifyPrompt}`
	}

	/**
	 * 导出仓库的issues和pull requests列表为Markdown文件
	 */
	async contentGenerators({
		owner,
		repo,
		export_events = [],
		since,
		range_date
	}: {
		owner: string
		repo: string
		export_events: Array<GitHubEventType>
		since: string
		outputDir?: string
		range_date?: [string, string]
	}) {
		try {
			const date = new Date().toISOString().split('T')[0]
			let content = `# ${owner}/${repo} 仓库报告 (${date})\n\n`
			const event_data: Partial<Record<GitHubEventType, any>> = {}
			for (const event of export_events) {
				const data = await this.githubClient.clientListForEvent(
					{
						owner,
						repo,
						since,
						eventType: event,
						range_date
					}
				)
				event_data[event] = data
				const { title, generate } =
					EventContentGenerators[
						event as keyof typeof EventContentGenerators
					]
				content += `## ${title}\n\n ${generate(data || [])}`
			}
			return {
				content,
				event_data
			}
		} catch (e) {
			logger.error('生成报告时发生错误:', e)
			throw e
		}
	}
}
