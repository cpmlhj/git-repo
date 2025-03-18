import {
	SubscriptionManager,
	ConfigManager,
	SubscriptionConfig,
	Scheduler,
	NotificationSystem,
	GitHubEventType
} from '@github-analytics/core'
import inquirer from 'inquirer'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { resolve } from 'path'

interface SubscriptionAnswers {
	owner: string
	repo: string
	frequency: 'daily' | 'weekly'
	eventTypes: string[]
}
function generate_event_types() {
	const eventTypes: Array<GitHubEventType> = [
		'IssuesEvent',
		'PullRequestReviewEvent',
		'PullRequestEvent',
		'ForkEvent',
		'PushEvent',
		'ReleaseEvent',
		'DiscussionEvent'
	]
	return eventTypes.map((item) => ({
		name: item,
		value: item
	}))
}

function isValidDateString(dateString: string): boolean {
	const date = new Date(dateString)
	return !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(dateString)
}

export class Subscriptions {
	private static async getInstances(args?: any) {
		const { proxy, filePath } = args || {}
		const config = ConfigManager.getInstance()
		const notification = new NotificationSystem()
		const subscriptionManager = await SubscriptionManager.getInstance()
		let proxyAgent
		if (proxy || process.env.proxy) {
			proxyAgent = new HttpsProxyAgent(proxy || process.env.proxy)
		}

		if (filePath) {
			const export_file_path = resolve(__dirname, filePath)
			config.setConfig('exports', {
				path: export_file_path,
				show_export: true
			})
		}
		const scheduler = Scheduler.getInstance(
			subscriptionManager,
			notification,
			config,
			proxyAgent
		)
		return {
			scheduler,
			config,
			notification,
			subscriptionManager
		}
	}

	public static async add() {
		const answers = await inquirer.prompt<SubscriptionAnswers>([
			{
				type: 'input',
				name: 'owner',
				message: '请输入GitHub仓库所有者名称：',
				validate: (input) => input.length > 0
			},
			{
				type: 'input',
				name: 'repo',
				message: '请输入GitHub仓库名称：',
				validate: (input) => input.length > 0
			},
			{
				type: 'list',
				name: 'frequency',
				message: '请选择更新频率：',
				choices: [
					{ name: '每日', value: 'daily' },
					{ name: '每周', value: 'weekly' }
				]
			},
			{
				type: 'checkbox',
				name: 'eventTypes',
				message: '请选择要监控的事件类型：',
				choices: generate_event_types()
			}
		])

		const { subscriptionManager } = await Subscriptions.getInstances()
		await subscriptionManager.addSubscription({
			owner: answers.owner,
			repo: answers.repo,
			frequency: { type: answers.frequency },
			eventTypes: answers.eventTypes as SubscriptionConfig['eventTypes']
		})

		console.log('订阅成功！')
	}

	public static async list() {
		const { subscriptionManager } = await this.getInstances()
		const subscriptions = await subscriptionManager.getSubscriptions()

		if (subscriptions.length === 0) {
			console.log('当前没有任何订阅。')
			return
		}

		console.log('当前订阅列表：')
		subscriptions.forEach((sub, index) => {
			console.log(`${index + 1}. ${sub.owner}/${sub.repo}`)
			console.log(`   频率: ${sub.frequency}`)
			console.log(`   事件: ${sub.eventTypes?.join(', ')}`)
			console.log('---')
		})
	}

	public static async remove() {
		const { subscriptionManager } = await Subscriptions.getInstances()
		const subscriptions = await subscriptionManager.getSubscriptions()

		if (subscriptions.length === 0) {
			console.log('当前没有任何订阅。')
			return
		}

		const { subscription }: { subscription: SubscriptionConfig } =
			await inquirer.prompt([
				{
					type: 'list',
					name: 'subscription',
					message: '请选择要取消的订阅：',
					choices: subscriptions.map((sub) => ({
						name: `${sub.owner}/${sub.repo}`,
						value: sub
					}))
				}
			])

		await subscriptionManager.removeSubscription(
			subscription.owner,
			subscription.repo
		)
		console.log('订阅已取消！')
	}

	public static async check(args: any) {
		const { subscriptionManager, scheduler } =
			await Subscriptions.getInstances(args)
		const { rangeTime } = args
		const subscriptions = await subscriptionManager.getSubscriptions()

		if (subscriptions.length === 0) {
			console.log('当前没有任何订阅。')
			return
		}

		const { subscription }: { subscription: SubscriptionConfig } =
			await inquirer.prompt([
				{
					type: 'list',
					name: 'subscription',
					message: '请选择要检查的仓库：',
					choices: subscriptions.map((sub) => ({
						name: `${sub.owner}/${sub.repo}`,
						value: sub
					}))
				}
			])
		let pre_frequency_type
		let _subscription = subscription
		if (rangeTime) {
			// 出现rangeDate时，更新订阅的频率为自定义
			const [start, end] = rangeTime.split('~')
			if (!isValidDateString(start) || !isValidDateString(end)) {
				console.warn(
					'日期格式错误，请输入正确的日期格式，如：2021-01-01~2021-01-02'
				)
				return
			}
			pre_frequency_type = subscription.frequency.type
			_subscription = Object.assign(subscription, {
				frequency: {
					type: 'custom',
					interval: { start, end }
				}
			})
			await subscriptionManager.updateSubscription(
				subscription.repo,
				_subscription
			)
		}
		await scheduler.checkNow(_subscription)

		// 执行完毕，恢复频率
		if (pre_frequency_type) {
			await subscriptionManager.updateSubscription(subscription.repo, {
				...subscription,
				// @ts-ignore
				frequency: { type: pre_frequency_type }
			})
		}
	}

	public static async startScheduler(args: any) {
		const { scheduler } = await Subscriptions.getInstances(args)

		console.log('调度器已启动，正在后台运行...')
		scheduler.start()
	}
}
