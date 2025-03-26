import { Config, ConfigManager } from '../config'
import { SubscriptionConfig } from '../types'
import { format_date } from '../helpers/date-format'
import { ReportGenerator } from './repo-generator'
import { SubscriptionManager } from '../subscription'
import { logger } from '../helpers/logger'

import fs from 'fs'
import path from 'path'

/**
 * 报告服务类
 */
export class ReportService {
	private static instance: ReportService
	private reportGenerator: ReportGenerator
	private subscriptionManager: SubscriptionManager
	private config: Config

	private constructor() {
		this.config = ConfigManager.getInstance().getConfig()
		this.subscriptionManager = SubscriptionManager.getInstance()
		this.reportGenerator = new ReportGenerator()
	}

	/**
	 * 获取报告服务实例
	 */
	public static getInstance(): ReportService {
		if (!ReportService.instance) {
			ReportService.instance = new ReportService()
		}
		return ReportService.instance
	}

	public async generateReport(
		subscription: SubscriptionConfig & { stream_output?: boolean }
	) {
		const { owner, repo, eventTypes, frequency } = subscription
		const Strategy =
			this.subscriptionManager.getStrategyForFrequency(frequency)
		const report = await this.reportGenerator.generateReport({
			owner,
			repo,
			frequencyStrategy: Strategy,
			eventTypes: eventTypes || []
		})
		if (this.config.exports) {
			await this.exportContentToMarkdown({
				owner,
				repo,
				filepath: this.config.exports.path,
				content: report,
				custom_date:
					frequency.type === 'custom'
						? frequency.interval
						: undefined
			})
		}
		return report
	}

	/**
	 * 立即生成报告
	 *  const ss = generateNow()
	 *   ss
	 */

	public async generateNow(
		subscription: SubscriptionConfig & { stream_output?: boolean },
		emitter: (chunk: any) => void
	) {
		try {
			const { owner, repo, eventTypes, frequency } = subscription
			const Strategy =
				this.subscriptionManager.getStrategyForFrequency(
					frequency
				)
			const report =
				await this.reportGenerator.generateReportStream({
					owner,
					repo,
					frequencyStrategy: Strategy,
					eventTypes: eventTypes || [],
					emitter
				})
			if (this.config.exports && report) {
				await this.exportContentToMarkdown({
					owner,
					repo,
					filepath: this.config.exports.path,
					content: report,
					custom_date:
						frequency.type === 'custom'
							? frequency.interval
							: undefined
				})
			}
		} catch (error) {
			logger.error(
				`报告生成失败 ${subscription.owner}/${subscription.repo}:`,
				error
			)
			throw error
		}
	}

	// 将总结内容保存为 Markdown 文件
	async exportContentToMarkdown({
		content,
		filepath,
		owner,
		repo,
		custom_date
	}: {
		content: string
		filepath: string
		owner: string
		repo: string
		custom_date?: {
			start: string
			end: string
		}
	}) {
		// 创建owner和repo的层级目录
		const ownerDir = path.join(filepath, owner)
		const repoDir = path.join(ownerDir, repo)
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
		fs.writeFileSync(filePath, content)
	}
}
