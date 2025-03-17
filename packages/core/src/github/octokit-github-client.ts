import { Octokit } from '@octokit/rest'
import { GitHubEventType, IGitHubClient } from '../types'
/**
 * 基于Octokit的GitHub API客户端实现
 */
export class OctokitGitHubClient implements IGitHubClient {
	private client: Octokit

	private static instance: OctokitGitHubClient

	constructor(token: string) {
		this.client = new Octokit({
			auth: token
		})
	}

	static getInstance(token: string) {
		if (!this.instance) {
			this.instance = new OctokitGitHubClient(token)
		}
		return this.instance
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
					(event) => new Date(event.created_at || '') >= since
				)
			}

			return data
		} catch (e) {
			console.warn(e)
		}
	}

	/**
	 * 获取仓库信息
	 */
	async getRepositoryInfo({
		owner,
		repo
	}: {
		owner: string
		repo: string
	}): Promise<any> {
		try {
			const { data } = await this.client.repos.get({
				owner,
				repo
			})
			return data
		} catch (e) {
			console.warn(e)
		}
	}

	// 获取最新release信息
	async getLatestRelease({
		owner,
		repo
	}: {
		owner: string
		repo: string
	}): Promise<any> {
		try {
			const { data } = await this.client.repos.getLatestRelease({
				owner,
				repo
			})
			return data
		} catch (e) {
			console.warn(e)
		}
	}

	async clientListForEvent({
		owner,
		repo,
		eventType,
		since,
		state,
		per_page = 10, // 默认十条
		page = 1
	}: {
		owner: string
		repo: string
		eventType: GitHubEventType
		since?: Date
		state?: 'open' | 'closed'
		per_page?: number
		page?: number
	}) {
		let list_fn
		let fn_args: any = {
			per_page,
			page
		}
		switch (eventType) {
			case 'IssuesEvent':
				list_fn = this.client.issues.listForRepo
				fn_args = {
					...fn_args,
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
			return data
		} catch (e) {
			console.error(e)
		}
	}
}
