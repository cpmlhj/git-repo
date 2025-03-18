import { RestEndpointMethodTypes } from '@octokit/rest'

/**
 * GitHub 事件接口
 */
export type GitHubEvent =
	RestEndpointMethodTypes['activity']['listRepoEvents']['response']['data'][0]

export type GithubIssuesState = 'open' | 'closed' | 'all'

export type GithubRepoListSince = 'daily' | 'weekly' | 'custom'

export type GitHubEventType =
	| 'IssueCommentEvent'
	| 'IssuesEvent'
	| 'PullRequestReviewEvent'
	| 'PullRequestReviewCommentEvent'
	| 'PullRequestEvent'
	| 'ForkEvent'
	| 'PushEvent'
	| 'ReleaseEvent'
	| 'DiscussionEvent'
	| 'DiscussionCommentEvent'

export type SubscriptionFrequency =
	| { type: 'daily' }
	| { type: 'weekly' }
	| {
			type: 'custom'
			interval: {
				start: string
				end: string
			}
	  }

/**
 * 订阅配置接口
 */
export interface SubscriptionConfig {
	/** 仓库所有者 */
	owner: string
	/** 仓库名称 */
	repo: string
	/** 更新通知频率 */
	frequency: SubscriptionFrequency
	/** 关注的事件类型 */
	eventTypes?: Array<GitHubEventType>
}

/**
 * 通知配置接口
 */
export interface NotificationConfig {
	/** 通知类型 */
	type: 'email' | 'webhook'
	/** 通知目标 */
	target: string
	/** 通知模板 */
	template?: string
}

/**
 * 订阅管理器接口
 */
export interface ISubscriptionManager {
	/** 添加订阅 */
	addSubscription(config: SubscriptionConfig): Promise<void>
	/** 删除订阅 */
	removeSubscription(owner: string, repo: string): Promise<void>
	/** 获取所有订阅 */
	getSubscriptions(): Promise<SubscriptionConfig[]>
}

/**
 * GitHub API 客户端接口
 */
export interface IGitHubClient {
	/** 获取仓库事件 */
	getRepositoryEvents(
		{ owner, repo }: { owner: string; repo: string },
		since?: Date
	): Promise<any>
	/** 获取仓库信息 */
	getRepositoryInfo({
		owner,
		repo
	}: {
		owner: string
		repo: string
	}): Promise<any>
}

/**
 * 通知系统接口
 */
export interface INotificationSystem {
	/** 发送通知 */
	sendNotification(config: NotificationConfig, content: string): Promise<void>
	/** 添加通知配置 */
	addNotificationConfig(config: NotificationConfig): Promise<void>
	/** 移除通知配置 */
	removeNotificationConfig(type: string, target: string): Promise<void>
}

export interface LLMModelConfig {
	apiKey: string
	model?: string
	baseURL?: string
	maxTokens?: number
	temperature?: number
	proxyAgent?: any
}
