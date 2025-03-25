import { router, baseProcedure } from '../trpc'
import { SubscriptionConfig } from '@github-analytics/core'
import { z } from 'zod'

const subscriptionSchema = z.object({
	owner: z.string(),
	repo: z.string(),
	frequency: z.object({
		type: z.enum(['daily', 'weekly', 'custom']),
		interval: z
			.object({
				start: z.string().optional(),
				end: z.string().optional()
			})
			.optional()
	}),
	eventTypes: z.array(
		z.enum([
			'IssueCommentEvent',
			'IssuesEvent',
			'PullRequestReviewEvent',
			'PullRequestReviewCommentEvent',
			'PullRequestEvent',
			'ForkEvent',
			'PushEvent',
			'ReleaseEvent',
			'DiscussionEvent',
			'DiscussionCommentEvent'
		])
	)
})

export const subscriptionRouter = router({
	add: baseProcedure
		.input(subscriptionSchema)
		.mutation(async ({ input, ctx }) => {
			const subscriptionManager =
				ctx.GithubSentinelManager.getSubscriptionManager()
			await subscriptionManager?.addSubscription(
				input as SubscriptionConfig
			)
			return { success: true }
		}),

	list: baseProcedure.query(async ({ ctx }) => {
		const subscriptionManager =
			ctx.GithubSentinelManager.getSubscriptionManager()
		return subscriptionManager?.getSubscriptions()
	}),

	remove: baseProcedure
		.input(
			z.object({
				owner: z.string(),
				repo: z.string()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const subscriptionManager =
				ctx.GithubSentinelManager.getSubscriptionManager()
			await subscriptionManager?.removeSubscription(
				input.owner,
				input.repo
			)
			return { success: true }
		}),

	update: baseProcedure
		.input(
			z.object({
				repo: z.string(),
				updateConfig: subscriptionSchema.partial()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const subscriptionManager =
				ctx.GithubSentinelManager.getSubscriptionManager()
			await subscriptionManager?.updateSubscription(
				input.repo,
				input.updateConfig as SubscriptionConfig
			)
			return { success: true }
		})
})
