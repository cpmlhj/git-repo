import { GitHubEvent, GitHubEventType, LLMModelConfig } from '../types'
import { OctokitGitHubClient } from '../github'
import { Config } from '../config'
import { OpenAIClient } from '@github-sentinel/llm'
import { EventContentGenerators } from './events_outpus'
import { format_date } from '../helpers/date-format'
import { FrequencyStrategy } from '../subscription/frequency-strategies'
import fs from 'fs'
import path from 'path'

interface ReportGeneratorConfig {
	githubToken: string
	openaiConfig?: LLMModelConfig
}

/**
 * 报告生成器类
 */
export class ReportGenerator {
	private llmClient: OpenAIClient | undefined

	private githubClient: OctokitGitHubClient

	constructor(config: ReportGeneratorConfig) {
		if (config.openaiConfig) {
			this.llmClient = new OpenAIClient(config.openaiConfig)
		}
		this.githubClient = new OctokitGitHubClient(config.githubToken)
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
	}): Promise<string> {
		const {
			type,
			name: periodText,
			custom_date
		} = params.frequencyStrategy.metaData
		const since = params.frequencyStrategy.getDateRange()

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

		// 生成 Markdown 格式的报告
		let report = `# GitHub 仓库 ${params.owner}/${params.repo} ${periodText}\n\n`

		// 添加统计信息
		report += this.generateStatistics(event_data)

		// // 添加详细事件信息
		// report += content

		// 生成AI分析总结
		if (this.llmClient) {
			report += await this.generateAISummary(event_data)
		}

		if (params.export) {
			// 创建owner和repo的层级目录
			const ownerDir = path.join(params.export.path, params.owner)
			const repoDir = path.join(ownerDir, params.repo)
			if (!fs.existsSync(repoDir)) {
				fs.mkdirSync(repoDir, { recursive: true })
			}

			// 生成基础文件名（年月日格式）
			const today = new Date()
			const baseFileName = custom_date
				? `${custom_date?.start}_${custom_date?.end}.md`
				: format_date(today.toISOString()) + '.md'
			let fileName = baseFileName
			let counter = 1

			// 处理文件名重复的情况
			while (fs.existsSync(path.join(repoDir, fileName))) {
				fileName = baseFileName.replace('.md', `-${counter}.md`)
				counter++
			}

			// 导出 Markdown 文件
			const filePath = path.join(repoDir, fileName)
			fs.writeFileSync(filePath, report)
		}
		return report
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
			const issuesAnalysis = await this.llmClient?.complete(issuesPrompt)
			summary += '### Issues 分析\n\n' + issuesAnalysis?.content + '\n\n'
		}

		// 处理Pull Requests
		if (eventsByType['PullRequestEvent']) {
			const prPrompt = this.generatePullRequestsPrompt(
				eventsByType['PullRequestEvent']
			)
			const prAnalysis = await this.llmClient?.complete(prPrompt)
			summary +=
				'### Pull Requests 分析\n\n' + prAnalysis?.content + '\n\n'
		}

		return summary
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
					labels: event.labels?.map((label: any) => label.name),
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
	 * 格式化动作描述
	 */
	private formatAction(action: string): string {
		const actionMap: Record<string, string> = {
			opened: '创建',
			closed: '关闭',
			reopened: '重新打开',
			edited: '编辑',
			merged: '合并',
			published: '发布',
			created: '创建',
			deleted: '删除',
			commented: '评论'
		}
		return actionMap[action] || action
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
				const data = await this.githubClient.clientListForEvent({
					owner,
					repo,
					since,
					eventType: event,
					range_date
				})
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
			console.error('导出Markdown文件时发生错误:', e)
			throw e
		}
	}
}
