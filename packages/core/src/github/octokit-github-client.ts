// @ts-ignore
import { Octokit } from '@octokit/rest'
import { GitHubEventType, GithubIssuesState } from '../types'
import { returnISOString } from '../helpers/date-format'
import dayjs from 'dayjs'
import { ConfigManager } from '../config/'
import { logger } from '../helpers/logger'
/**
 * 基于Octokit的GitHub API客户端实现
 */
export class OctokitGitHubClient {
	private client: Octokit

	private configManager: ConfigManager

	private static instance: OctokitGitHubClient

	constructor() {
		this.configManager = ConfigManager.getInstance()
		const { githubToken } = this.configManager.getConfig()
		this.client = new Octokit({
			auth: githubToken
		})
	}

	static getInstance() {
		if (!this.instance) {
			this.instance = new OctokitGitHubClient()
		}
		return this.instance
	}

	/**
	 *  查询是否存在仓库
	 */
	async isRepositoryExists(owner: string, repo: string) {
		try {
			await this.client.repos.get({
				owner,
				repo
			})
			return true
		} catch (e: any) {
			if (e && e.status === 404) {
				return false
			}
			return false
		}
	}

	/**
	 * 获取仓库事件
	 */
	async getRepositoryEvents(
		{ owner, repo }: { owner: string; repo: string },
		since?: Date
	) {
		try {
			const { data } = await this.client.activity.listRepoEvents({
				owner,
				repo,
				per_page: 100
			})
			if (since) {
				return data.filter(
					(event) =>
						new Date(event.created_at || '') >= since
				)
			}

			return data
		} catch (e) {
			logger.warning(e)
		}
	}

	async clientListForEvent({
		owner,
		repo,
		eventType,
		since,
		state = 'closed', // 默认获取已关闭的问题
		per_page = 2, // 默认20条
		page = 1,
		range_date
	}: {
		owner: string
		repo: string
		eventType: GitHubEventType
		since: string
		state?: GithubIssuesState
		per_page?: number
		page?: number
		range_date?: [string, string]
	}) {
		let list_fn
		let fn_args: any = {
			per_page,
			page,
			sort: 'updated',
			direction: 'desc'
		}
		switch (eventType) {
			case 'IssuesEvent':
				list_fn = this.client.issues.listForRepo
				fn_args = {
					...fn_args,
					state,
					since
				}
				break
			case 'PullRequestEvent':
				list_fn = this.client.pulls.list
				fn_args = {
					...fn_args,
					state
				}
				break
			case 'PullRequestReviewEvent':
				list_fn = this.client.pulls.listReviews
				fn_args = {
					pull_number: 30
				}
				break
			case 'ForkEvent':
				list_fn = this.client.repos.listForks
				break
			case 'PushEvent':
				list_fn = this.client.repos.listCommits
				fn_args = {
					...fn_args,
					since,
					unit: range_date
						? [
								returnISOString(range_date[0]),
								returnISOString(range_date[1])
							]
						: undefined
				}
				break
			case 'ReleaseEvent':
				list_fn = this.client.repos.listReleases
				break
			case 'DiscussionEvent':
				return []
			default:
				throw new Error(`Unsupported event type: ${eventType}`)
		}
		try {
			const { data } = await list_fn({
				owner,
				repo,
				...fn_args
			})
			if (!range_date) return data
			return this.getListDataWithUnit(range_date, data)
		} catch (e) {
			logger.error(e)
		}
	}

	getListDataWithUnit(range_date: [string, string], data: any[]) {
		return data
			.map((item) => {
				const change_date = dayjs(item.updated_at)
				const [start_date, end_date] = [
					dayjs(range_date[0]).startOf('day'),
					dayjs(range_date[1]).endOf('day')
				]
				if (
					change_date.isAfter(start_date) &&
					change_date.isBefore(end_date)
				) {
					return item
				}
				return null
			})
			.filter((item) => item)
	}
}
