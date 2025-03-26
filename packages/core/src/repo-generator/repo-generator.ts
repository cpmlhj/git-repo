import { GitHubEvent, GitHubEventType } from '../types'
import { OctokitGitHubClient } from '../github'
import { Config } from '../config'
import {
	OpenAIClient,
	StreamResponse,
	ChatResponse
} from '@github-sentinel/llm'
import { EventContentGenerators, EXPORT_CHUNK_FINISHED } from './events_outpus'
import { FrequencyStrategy } from '../subscription/frequency-strategies'
import { GenerationEventEmitter } from '../events'
import { logger } from '../helpers/logger'

interface ReportGeneratorConfig {
	githubToken: string
}

/**
 * 报告生成器类
 */
export class ReportGenerator {
	private llmClient: OpenAIClient | undefined

	private githubClient: OctokitGitHubClient

	private eventEmitter: GenerationEventEmitter

	constructor() {
		this.llmClient = new OpenAIClient()
		this.githubClient = new OctokitGitHubClient()
		this.eventEmitter = GenerationEventEmitter.getInstance()
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
			report += await this.generateAISummary(event_data)
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
		// 生成 Markdown 格式的报告
		const title = `# GitHub 仓库 ${params.owner}/${params.repo} ${periodText}\n\n`

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
				event_data
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
			logger.info(`events: ${events}`)
			stats += `- ${this.formatEventType(type)}: ${events.length} 个\n`
		}

		return stats + '\n'
	}

	/**
	 * 生成AI分析总结
	 */
	private async generateAISummary(
		eventsByType: Partial<Record<GitHubEventType, any>>
	): Promise<string> {
		let summary = '## AI 分析总结\n\n'

		// 处理Issues
		if (eventsByType['IssuesEvent']) {
			const issuesPrompt = this.generateIssuesPrompt(
				eventsByType['IssuesEvent']
			)
			const issuesAnalysis =
				await this.llmClient?.complete(issuesPrompt)
			summary +=
				'### Issues 分析\n\n' +
				(issuesAnalysis as ChatResponse)?.content +
				'\n\n'
		}

		// 处理Pull Requests
		if (eventsByType['PullRequestEvent']) {
			const prPrompt = this.generatePullRequestsPrompt(
				eventsByType['PullRequestEvent']
			)
			const prAnalysis = await this.llmClient?.complete(prPrompt)
			summary +=
				'### Pull Requests 分析\n\n' +
				(prAnalysis as ChatResponse)?.content +
				'\n\n'
		}

		return summary
	}

	/**
	 * 流式生成AI分析总结
	 */
	private async *generateAISummaryStream(
		eventsByType: Partial<Record<GitHubEventType, any>>
	): AsyncGenerator<string> {
		yield '## AI 分析总结\n\n'

		// 处理Issues
		if (eventsByType['IssuesEvent']) {
			const issuesPrompt = this.generateIssuesPrompt(
				eventsByType['IssuesEvent']
			)
			yield '### Issues 分析\n\n'
			const issuesStream = await this.llmClient?.complete(
				issuesPrompt,
				true
			)
			if (issuesStream) {
				for await (const chunk of issuesStream as StreamResponse) {
					yield chunk.choices[0].delta.content || ''
				}
			}
		}

		// 处理Pull Requests
		if (eventsByType['PullRequestEvent']) {
			const prPrompt = this.generatePullRequestsPrompt(
				eventsByType['PullRequestEvent']
			)
			yield '### Pull Requests 分析\n\n'
			const prStream = await this.llmClient?.complete(
				prPrompt,
				true
			)
			if (prStream) {
				for await (const chunk of prStream as StreamResponse) {
					yield chunk.choices[0].delta.content || ''
				}
			}
		}

		yield EXPORT_CHUNK_FINISHED
	}

	/**
	 * 生成Issues分析提示
	 */
	private generateIssuesPrompt(issues: any[]): string {
		const issuesData = issues
			.map((event) => {
				const pull_request = event.pull_request
				return {
					title: event.title,
					state: event.state,
					created_at: event.created_at,
					updated_at: event.updated_at,
					comments: event.comments,
					labels: event.labels?.map(
						(label: any) => label.name
					),
					author_type: event.author_association,
					is_pr: !!pull_request,
					merged_at: pull_request?.merged_at,
					draft: event.draft
				}
			})
			.filter(Boolean)

		return `请分析以下Issues数据，总结主要问题类型、解决进度和重要性：\n\n${JSON.stringify(
			issuesData,
			null,
			2
		)}\n\n请提供以下分析：\n1. 问题分类和分布\n2. 解决进度和效率\n3. 重要或紧急的问题\n4. 建议和改进方向`
	}

	/**
	 * 生成Pull Requests分析提示
	 */
	private generatePullRequestsPrompt(prs: any[]): string {
		const prsData = prs
			.map((event) => {
				return {
					title: event.title,
					state: event.state,
					action: event.action,
					created_at: event.created_at,
					updated_at: event.updated_at,
					base: event.base.ref,
					head: event.head.ref
				}
			})
			.filter(Boolean)

		return `请分析以下Pull Requests数据，总结代码变更情况和合并状态：\n\n${JSON.stringify(
			prsData,
			null,
			2
		)}\n\n请提供以下分析：\n1. 代码变更类型和分布\n2. 合并进度和效率\n3. 重要的功能更新或修复\n4. 建议和改进方向`
	}

	/**
	 * 格式化事件类型
	 */
	private formatEventType(type: string): string {
		const typeMap: Partial<Record<GitHubEventType, string>> = {
			IssuesEvent: 'Issue 更新',
			PullRequestEvent: 'Pull Request 更新',
			ReleaseEvent: '新版本发布',
			DiscussionEvent: '讨论更新'
		}

		return typeMap[type as GitHubEventType] || type
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
