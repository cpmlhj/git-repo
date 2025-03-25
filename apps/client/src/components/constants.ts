import { RouterInputs } from '../utils/trpc'

type Selections = RouterInputs['subscriptions']['add']['eventTypes']
export const GithubEventSelections: Array<{
	label: string
	value: Selections[number]
}> = [
	{
		label: '问题评论',
		value: 'IssueCommentEvent'
	},
	{
		label: '问题',
		value: 'IssuesEvent'
	},
	{
		label: 'PR评审',
		value: 'PullRequestReviewEvent'
	},
	{
		label: 'PR评审评论',
		value: 'PullRequestReviewCommentEvent'
	},
	{
		label: 'PR',
		value: 'PullRequestEvent'
	},
	{
		label: '复刻',
		value: 'ForkEvent'
	},
	{
		label: '推送',
		value: 'PushEvent'
	},
	{
		label: '发布',
		value: 'ReleaseEvent'
	},
	{
		label: '讨论',
		value: 'DiscussionEvent'
	},
	{
		label: '讨论评论',
		value: 'DiscussionCommentEvent'
	}
]
