export interface EventContentGenerator {
	title: string
	generate: (data: any[]) => string
}

interface IssueInfo {
	title: string
	number: number
	state: string
	created_at: string
	updated_at: string
	html_url: string
	user: {
		login: string
	}
}

interface PullRequestInfo {
	title: string
	number: number
	state: string
	created_at: string
	updated_at: string
	html_url: string
	user: {
		login: string
	}
	base: {
		ref: string
	}
	head: {
		ref: string
	}
}

const IssuesEvent: EventContentGenerator = {
	title: 'Issues 列表',
	generate: (issues: IssueInfo[]) => {
		if (!issues?.length) return '暂无开放的 issues\n\n'
		return issues
			.map(
				(issue) =>
					`- [#${issue.number}](${issue.html_url}) ${issue.title}\n` +
					`  - 状态: ${issue.state}\n` +
					`  - 创建者: ${issue.user.login}\n` +
					`  - 创建时间: ${issue.created_at}\n` +
					`  - 更新时间: ${issue.updated_at}\n\n`
			)
			.join('')
	}
}
const PullRequestEvent: EventContentGenerator = {
	title: 'Pull Requests 列表',
	generate: (prs: PullRequestInfo[]) => {
		if (!prs?.length) return '暂无开放的 pull requests\n\n'
		return prs
			.map(
				(pr) =>
					`- [#${pr.number}](${pr.html_url}) ${pr.title}\n` +
					`  - 状态: ${pr.state}\n` +
					`  - 创建者: ${pr.user.login}\n` +
					`  - 分支: ${pr.head.ref} -> ${pr.base.ref}\n` +
					`  - 创建时间: ${pr.created_at}\n` +
					`  - 更新时间: ${pr.updated_at}\n\n`
			)
			.join('')
	}
}

const PullRequestReviewEvent: EventContentGenerator = {
	title: 'Pull Request Reviews',
	generate: (reviews: any[]) => {
		if (!reviews?.length) return '暂无 PR 评审记录\n\n'
		return reviews
			.map(
				(review) =>
					`- PR #${review.pull_request_number}\n` +
					`  - 评审者: ${review.user.login}\n` +
					`  - 状态: ${review.state}\n` +
					`  - 提交时间: ${review.submitted_at}\n\n`
			)
			.join('')
	}
}

const ForkEvent: EventContentGenerator = {
	title: 'Fork 记录',
	generate: (forks: any[]) => {
		if (!forks?.length) return '暂无 fork 记录\n\n'
		return forks
			.map(
				(fork) =>
					`- ${fork.owner.login}/${fork.name}\n` +
					`  - 创建时间: ${fork.created_at}\n` +
					`  - Stars: ${fork.stargazers_count}\n\n`
			)
			.join('')
	}
}

const PushEvent: EventContentGenerator = {
	title: '提交记录',
	generate: (commits: any[]) => {
		if (!commits?.length) return '暂无提交记录\n\n'
		return commits
			.map(
				(commit) =>
					`- ${commit.sha.substring(0, 7)}\n` +
					`  - 作者: ${commit.commit.author.name}\n` +
					`  - 信息: ${commit.commit.message}\n` +
					`  - 时间: ${commit.commit.author.date}\n\n`
			)
			.join('')
	}
}

const ReleaseEvent: EventContentGenerator = {
	title: '发布记录',
	generate: (releases: any[]) => {
		if (!releases?.length) return '暂无发布记录\n\n'
		return releases
			.map(
				(release) =>
					`- [${release.tag_name}](${release.html_url})\n` +
					`  - 标题: ${release.name}\n` +
					`  - 发布者: ${release.author.login}\n` +
					`  - 发布时间: ${release.published_at}\n\n`
			)
			.join('')
	}
}

const DiscussionEvent: EventContentGenerator = {
	title: '讨论列表',
	generate: () => '暂不支持讨论事件的展示\n\n'
}

export const EventContentGenerators = {
	IssuesEvent,
	PullRequestEvent,
	PullRequestReviewEvent,
	ForkEvent,
	PushEvent,
	ReleaseEvent,
	DiscussionEvent
}
