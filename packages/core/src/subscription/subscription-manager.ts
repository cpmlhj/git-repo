import fs from 'fs/promises'
import f from 'fs'
import path from 'path'
import {
	ISubscriptionManager,
	SubscriptionConfig,
	SubscriptionFrequency
} from '../types'
import {
	DailyStrategy,
	WeeklyStrategy,
	CustomStrategy,
	FrequencyStrategy
} from './frequency-strategies'

/**
 * 订阅管理器实现类
 */
export class SubscriptionManager implements ISubscriptionManager {
	private subscriptionsFile: string
	private subscriptions: SubscriptionConfig[]

	private static instance: SubscriptionManager

	constructor(storageDir?: string) {
		const dir =
			path.resolve(process.cwd(), 'data') || storageDir || './data'
		this.subscriptionsFile = path.join(dir, 'subscriptions.json')
		this.subscriptions = []
	}

	static async getInstance(
		storageDir?: string
	): Promise<SubscriptionManager> {
		if (!SubscriptionManager.instance) {
			SubscriptionManager.instance = new SubscriptionManager(storageDir)
			// 初始化订阅管理器
			await SubscriptionManager.instance.init()
		}
		return SubscriptionManager.instance
	}

	getStrategyForFrequency(
		frequency: SubscriptionFrequency
	): FrequencyStrategy {
		switch (frequency.type) {
			case 'daily':
				return new DailyStrategy()
			case 'weekly':
				return new WeeklyStrategy()
			case 'custom':
				return new CustomStrategy(frequency.interval)
			default:
				throw new Error(`Unsupported frequency type: ${frequency}`)
		}
	}

	/**
	 * 初始化订阅管理器
	 */
	async init(): Promise<void> {
		try {
			// 确保存储目录存在
			if (!f.existsSync(this.subscriptionsFile)) {
				await fs.mkdir(path.dirname(this.subscriptionsFile), {
					recursive: true
				})
			}

			try {
				const data = await fs.readFile(this.subscriptionsFile, 'utf-8')
				this.subscriptions = JSON.parse(data)
				console.log(`初始化订阅管理器成功`)
			} catch (error) {
				// 如果文件不存在，创建一个空的订阅列表
				this.subscriptions = []
				await this.saveSubscriptions()
			}
		} catch (error: any) {
			throw new Error(`初始化订阅管理器失败: ${error.message}`)
		}
	}

	/**
	 * 添加订阅
	 */
	async addSubscription(config: SubscriptionConfig): Promise<void> {
		const existingIndex = this.subscriptions.findIndex(
			(sub) => sub.owner === config.owner && sub.repo === config.repo
		)

		if (existingIndex !== -1) {
			this.subscriptions[existingIndex] = config
		} else {
			this.subscriptions.push(config)
		}

		await this.saveSubscriptions()
	}

	/**
	 * 删除订阅
	 */
	async removeSubscription(owner: string, repo: string): Promise<void> {
		this.subscriptions = this.subscriptions.filter(
			(sub) => !(sub.owner === owner && sub.repo === repo)
		)
		await this.saveSubscriptions()
	}

	/**
	 * 获取所有订阅
	 */
	async getSubscriptions(): Promise<SubscriptionConfig[]> {
		return this.subscriptions
	}

	/**
	 * 更新订阅信息
	 */
	async updateSubscription(
		repo: string,
		updateConfig: Partial<SubscriptionConfig>
	) {
		const targetRepo = this.subscriptions.find((sub) => sub.repo === repo)
		targetRepo && Object.assign(targetRepo, updateConfig)
		await this.saveSubscriptions()
	}

	/**
	 * 保存订阅信息到文件
	 */
	private async saveSubscriptions(): Promise<void> {
		await fs.writeFile(
			this.subscriptionsFile,
			JSON.stringify(this.subscriptions, null, 2),
			'utf-8'
		)
	}
}
