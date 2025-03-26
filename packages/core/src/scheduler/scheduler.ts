import cron from 'node-cron'
//@ts-ignore
import PQueue from 'p-queue'
//@ts-ignore
import pRetry from 'p-retry'
import { ConfigManager } from '../config'
import { SubscriptionManager } from '../subscription'
import { NotificationSystem } from '../notification'
import { SubscriptionConfig } from '../types'
import { ReportService } from '../repo-generator/report-service'
import { logger } from '../helpers/logger'
import { format_date } from '../helpers/date-format'
import path from 'path'

const signals = ['SIGINT', 'SIGTERM', 'SIGUSR1', 'SIGUSR2']

/**
 * 定时调度器类
 */
export class Scheduler {
	private static instance: Scheduler
	private tasks: Map<string, cron.ScheduledTask>
	private subscriptionManager: SubscriptionManager
	private notificationSystem: NotificationSystem
	private configManager: ConfigManager
	private reportService: ReportService
	private queue: PQueue

	private constructor() {
		this.tasks = new Map()
		this.subscriptionManager = SubscriptionManager.getInstance()
		this.notificationSystem = new NotificationSystem()
		this.configManager = ConfigManager.getInstance()
		this.reportService = ReportService.getInstance()
		// 初始化队列，限制并发数为3
		this.queue = new PQueue({ concurrency: 3 })
	}

	// 调度器初始化
	public init() {
		// 确保有输出保存的目录
		const config = this.configManager.getConfig()
		const exports = config.exports
		if (!exports) {
			// 给出默认目录
			logger.warning(
				'未配置导出目录，默认使用 ./exports 目录，请在 config.yaml 中配置 exports 目录'
			)
			this.configManager.setConfig('exports', {
				show_export: true,
				path: path.join(process.cwd(), 'exports')
			})
		}
		logger.info('调度器初始化完成')
	}

	/**
	 * 获取调度器实例
	 */
	public static getInstance(): Scheduler {
		if (!Scheduler.instance) {
			Scheduler.instance = new Scheduler()
		}
		return Scheduler.instance
	}

	/**
	 * 启动调度器
	 */
	public async start(): Promise<void> {
		await this.subscriptionManager.init()
		const subscriptions =
			await this.subscriptionManager.getSubscriptions()

		// 定时执行更新
		this.scheduleSubscriptionCheck()
		for (const subscription of subscriptions) {
			if (subscription.frequency.type !== 'custom') {
				// 只执行 每周或每日的订阅项目
				await this.scheduleTask(subscription)
			}
		}
		signals.forEach((signal) => {
			process.on(signal, () => {
				logger.info(`收到信号 ${signal}, 停止调度...`)
				this.stop()
				process.exit(0)
			})
		})

		process.on('uncaughtException', (error) => {
			logger.error('未捕获的异常:', error)
			this.stop()
			process.exit(1)
		})
		process.on('unhandledRejection', (reason, promise) => {
			logger.error('未处理的拒绝:', reason)
			this.stop()
			process.exit(1)
		})

		// 防止进程退出
		await new Promise(() => {})
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
	 * 为订阅创建定时任务
	 */
	private async scheduleTask(
		subscription: SubscriptionConfig
	): Promise<void> {
		const taskId = `${subscription.owner}/${subscription.repo}`
		const Strategy = this.subscriptionManager.getStrategyForFrequency(
			subscription.frequency
		)
		if (this.tasks.has(taskId)) {
			this.tasks.get(taskId)?.stop()
			this.tasks.delete(taskId)
		}

		const executeWrapper = () => {
			const taskInfo = {
				time: format_date(new Date().toISOString()),
				subscription: `${subscription.owner}/${subscription.repo}`
			}
			logger.info(
				`定时器执行: ${JSON.stringify(taskInfo)}------订阅事件: ${subscription.eventTypes?.join('、')}`
			)

			// 使用 weak reference 或在执行完成后清理
			this.queue.add(async () => {
				try {
					await this.executeTask(subscription)
				} catch (error) {
					logger.error(`Task execution failed:`, error)
				}
			})
		}

		const task = Strategy.executionTime(executeWrapper)
		if (task) this.tasks.set(taskId, task)
	}

	/**
	 * 执行检查任务
	 */
	private async executeTask(
		subscription: SubscriptionConfig
	): Promise<void> {
		const retryOptions = {
			retries: 3,
			onFailedAttempt: (error: any) => {
				logger.error(
					`任务执行失败 (${subscription.owner}/${subscription.repo}), 重试中...`,
					error
				)
			}
		}
		try {
			await pRetry(async () => {
				await this.reportService.generateReport(subscription)

				// if (this.config.notifications.email) {
				// 	await this.notificationSystem.sendNotification(
				// 		{
				// 			type: 'email',
				// 			target: this.config.notifications.email.from
				// 		},
				// 		report
				// 	)
				// }
				// if (
				// 	this.config.notifications.webhook &&
				// 	this.config.notifications.webhook.url
				// ) {
				// 	await this.notificationSystem.sendNotification(
				// 		{
				// 			type: 'webhook',
				// 			target: this.config.notifications.webhook.url
				// 		},
				// 		report
				// 	)
				// }
				logger.info(
					`任务执行完成 ${subscription.owner}/${subscription.repo}`
				)
			}, retryOptions)
		} catch (error) {
			logger.error(
				`任务执行失败 ${subscription.owner}/${subscription.repo}:`,
				error
			)
		}
	}

	/**
	 * 检查并调度订阅任务
	 */
	private async checkAndScheduleSubscriptions(): Promise<void> {
		// 先重新初始化订阅管理器，确保从文件中读取最新数据
		await this.subscriptionManager.init()
		const subscriptions =
			await this.subscriptionManager.getSubscriptions()

		for (const subscription of subscriptions) {
			if (subscription.frequency.type !== 'custom') {
				const taskId = `${subscription.owner}/${subscription.repo}`
				if (!this.tasks.has(taskId)) {
					// 只为未调度的订阅创建任务
					await this.scheduleTask(subscription)
					logger.info(`新增订阅任务: ${taskId}`)
				}
			}
		}
	}

	/**
	 * 调度订阅检查任务
	 */
	private async scheduleSubscriptionCheck(): Promise<void> {
		// 每5分钟检查一次新的订阅
		const checkTask = cron.schedule('*/5 * * * *', async () => {
			logger.info('执行订阅检查...')
			await this.checkAndScheduleSubscriptions()
		})

		this.tasks.set('subscription-check', checkTask)
	}
}
