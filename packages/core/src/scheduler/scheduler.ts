import cron from 'node-cron'
import PQueue from 'p-queue'
import pRetry from 'p-retry'
import { Config, ConfigManager } from '../config'
import { SubscriptionManager } from '../subscription'
import { NotificationSystem } from '../notification'
import { SubscriptionConfig } from '../types'
import { ReportGenerator } from '../repo-generator'
import path from 'path'

/**
 * 定时调度器类
 */
export class Scheduler {
	private static instance: Scheduler
	private tasks: Map<string, cron.ScheduledTask>
	private subscriptionManager: SubscriptionManager
	private notificationSystem: NotificationSystem
	private config: Config
	private reportGenerator: ReportGenerator
	private queue: PQueue

	private constructor(
		subscriptionManager: SubscriptionManager,
		notificationSystem: NotificationSystem,
		config: ConfigManager,
		proxyAgent?: any
	) {
		this.tasks = new Map()
		this.subscriptionManager = subscriptionManager
		this.notificationSystem = notificationSystem
		this.config = config.getConfig()
		this.reportGenerator = new ReportGenerator({
			githubToken: this.config.githubToken,
			openaiConfig: this.config.llm
				? Object.assign(this.config.llm, { proxyAgent })
				: undefined
		})
		// 初始化队列，限制并发数为3
		this.queue = new PQueue({ concurrency: 3 })
	}

	/**
	 * 获取调度器实例
	 */
	public static getInstance(
		subscriptionManager: SubscriptionManager,
		notificationSystem: NotificationSystem,
		config: ConfigManager,
		proxyAgent?: any
	): Scheduler {
		if (!Scheduler.instance) {
			Scheduler.instance = new Scheduler(
				subscriptionManager,
				notificationSystem,
				config,
				proxyAgent
			)
		}
		return Scheduler.instance
	}

	/**
	 * 启动调度器
	 */
	public async start(): Promise<void> {
		const subscriptions = await this.subscriptionManager.getSubscriptions()
		for (const subscription of subscriptions) {
			await this.scheduleTask(subscription)
		}
	}

	/**
	 * 停止调度器
	 */
	public stop(): void {
		for (const task of this.tasks.values()) {
			task.stop()
		}
		this.tasks.clear()
	}

	/**
	 * 立即执行指定订阅的检查任务
	 */
	public async checkNow(subscription: SubscriptionConfig): Promise<void> {
		await this.executeTask(subscription)
	}

	/**
	 * 为订阅创建定时任务
	 */
	private async scheduleTask(
		subscription: SubscriptionConfig
	): Promise<void> {
		const taskId = `${subscription.owner}/${subscription.repo}`
		const cronExpression = this.getCronExpression(subscription.frequency)

		if (this.tasks.has(taskId)) {
			this.tasks.get(taskId)?.stop()
			this.tasks.delete(taskId)
		}

		const task = cron.schedule(cronExpression, () => {
			this.queue.add(() => this.executeTask(subscription))
		})

		this.tasks.set(taskId, task)
	}

	/**
	 * 执行检查任务
	 */
	private async executeTask(subscription: SubscriptionConfig): Promise<void> {
		const retryOptions = {
			retries: 3,
			onFailedAttempt: (error: any) => {
				console.error(
					`任务执行失败 (${subscription.owner}/${subscription.repo}), 重试中...`,
					error
				)
			}
		}
		try {
			await pRetry(async () => {
				const lastCheck = new Date()
				lastCheck.setDate(
					lastCheck.getDate() -
						(subscription.frequency === 'daily' ? 1 : 7)
				)

				const report = await this.reportGenerator.generateReport({
					owner: subscription.owner,
					repo: subscription.repo,
					period: subscription.frequency,
					eventTypes: subscription.eventTypes || [],
					lastCheck,
					export: {
						output_dir: path.resolve(process.cwd(), 'reports')
					}
				})

				if (this.config.notifications.email) {
					await this.notificationSystem.sendNotification(
						{
							type: 'email',
							target: this.config.notifications.email.from
						},
						report
					)
				}
				if (
					this.config.notifications.webhook &&
					this.config.notifications.webhook.url
				) {
					await this.notificationSystem.sendNotification(
						{
							type: 'webhook',
							target: this.config.notifications.webhook.url
						},
						report
					)
				}
			}, retryOptions)
		} catch (error) {
			console.error(
				`任务执行失败 ${subscription.owner}/${subscription.repo}:`,
				error
			)
		}
	}

	/**
	 * 获取 Cron 表达式
	 */
	private getCronExpression(frequency: 'daily' | 'weekly'): string {
		return frequency === 'daily' ? '0 9 * * *' : '0 9 * * 1'
	}
}
