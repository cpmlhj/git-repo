import {
	ConfigManager,
	NotificationSystem,
	getSubscriptionManager,
	SubscriptionManager,
	ReportService,
	Scheduler,
	Config
} from '@github-analytics/core'
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
	private scheduler: Scheduler | null = null
	private ReportService: ReportService | null = null

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
	}

	getSubscriptionManager() {
		return this.subscriptionManager
	}

	getConfigManager() {
		return this.configManager
	}

	getNotificationSystem() {
		return this.notificationSystem
	}

	getReportService() {
		return this.ReportService
	}

	getScheduler() {
		if (!this.scheduler) {
			this.scheduler = Scheduler.getInstance()
		}
		return this.scheduler
	}
}
