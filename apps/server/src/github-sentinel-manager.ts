import {
	ConfigManager,
	NotificationSystem,
	getSubscriptionManager,
	SubscriptionManager,
	ReportService,
	HackerNewsManager
} from '@github-sentinel/core'
import { llmClient } from '@github-sentinel/llm'
import { resolve } from 'path'

interface SentinelManagerProps {
	proxy?: string
	exportFilePath?: string
}

export class GithubSentinelManager {
	private static instance: GithubSentinelManager
	private subscriptionManager: SubscriptionManager | null = null
	private configManager: ConfigManager | null = null
	private notificationSystem: NotificationSystem | null = null
	private ReportService: ReportService | null = null
	private hackerNewsManager: HackerNewsManager | null = null

	private llmClient: llmClient | null = null

	private constructor(config: SentinelManagerProps) {
		this.init(config)
	}

	public static async getInstance(
		config: SentinelManagerProps
	): Promise<GithubSentinelManager> {
		if (!GithubSentinelManager.instance) {
			GithubSentinelManager.instance =
				await new GithubSentinelManager(config)
		}
		return GithubSentinelManager.instance
	}

	async init(config: SentinelManagerProps) {
		this.configManager = ConfigManager.getInstance()
		// 配置自定义输出路径
		if (config.exportFilePath) {
			const export_file_path = resolve(
				__dirname,
				config.exportFilePath
			)
			this.configManager.setConfig('exports', {
				path: export_file_path,
				show_export: true
			})
		}
		this.subscriptionManager = await getSubscriptionManager()
		this.ReportService = ReportService.getInstance()
		this.llmClient = new llmClient()
	}

	getSubscriptionManager() {
		return this.subscriptionManager
	}

	getConfigManager() {
		return this.configManager
	}

	getHackerNewsManager() {
		if (!this.hackerNewsManager) {
			this.hackerNewsManager = new HackerNewsManager()
		}
		return this.hackerNewsManager
	}

	getNotificationSystem() {
		return this.notificationSystem
	}

	getReportService() {
		return this.ReportService
	}

	get llm() {
		return this.llmClient
	}

	updateModelConfig({
		modelType,
		modelConfig
	}: {
		modelType: 'openai' | 'ollama'
		modelConfig?: {
			model: string
			temperature?: number
			maxTokens?: number
		}
	}) {
		const config = this.configManager?.getConfig()
		if (config) {
			const { llm, platform } = config
			// 选择模型是否有改变
			if (
				modelType !== platform ||
				modelConfig?.model !== llm.model
			) {
				this.configManager?.setConfig('llm', {
					...llm,
					...modelConfig
				})
				this.configManager?.setConfig('platform', modelType)
			}
		}
	}
}
