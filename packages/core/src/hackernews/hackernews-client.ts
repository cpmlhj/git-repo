import { HNStory, HNStoryType } from '../types'
import { HttpsProxyAgent } from 'https-proxy-agent'

export class HackerNewsClient {
	private readonly baseUrl = 'https://hn.algolia.com/api/v1'

	/**
	 * 获取指定类型的故事ID列表
	 */
	private async searchStories(
		query: string = '',
		type: HNStoryType = 'top'
	): Promise<HNStory[]> {
		const tags = type === 'job' ? 'story,job' : 'story'
		// 添加时间过滤，只获取最近一天的文章
		const oneYearAgo = Math.floor(Date.now() / 1000) - 2 * 24 * 60 * 60
		const searchUrl = `${this.baseUrl}/search?tags=${tags}&query=${encodeURIComponent(query)}&numericFilters=created_at_i>${oneYearAgo}`

		try {
			const response = await fetch(searchUrl, {
				// @ts-ignore
				agent: new HttpsProxyAgent('http://127.0.0.1:10887'),
				timeout: 10000
			})

			const data = await response.json()
			return data.hits.map((hit: any) => ({
				id: hit.objectID,
				title: hit.title,
				url: hit.url,
				score: hit.points || 0,
				time: hit.created_at_i,
				by: hit.author,
				descendants: hit.num_comments || 0,
				type: hit._tags.includes('job') ? 'job' : 'story'
				// kids: hit.children || []
			}))
		} catch (e) {
			console.error('Error searching stories:', e)
			throw e
		}
	}

	/**
	 * 获取指定类型的热门故事列表
	 */
	async getStories(
		type: HNStoryType = 'top',
		limit: number = 5
	): Promise<HNStory[]> {
		const stories = await this.searchStories('', type)
		return stories.sort((a, b) => b.score - a.score).slice(0, limit)
	}

	/**
	 * 获取多个类型的热门故事
	 */
	async getMultiTypeStories(
		types: HNStoryType[] = ['top', 'best'],
		limit: number = 5
	): Promise<HNStory[]> {
		const storiesPromises = types.map((type) =>
			this.searchStories('', type)
		)
		const storiesArrays = await Promise.all(storiesPromises)

		// 使用Set去重，以id为唯一标识
		const uniqueStories = Array.from(
			new Map(
				storiesArrays.flat().map((story) => [story.id, story])
			).values()
		)

		// 对去重后的故事按分数排序
		return uniqueStories
			.sort((a, b) => b.score - a.score)
			.slice(0, limit)
	}

	/**
	 * 按关键词搜索故事
	 */
	async searchByKeyword(
		keyword: string,
		limit: number = 5
	): Promise<HNStory[]> {
		const stories = await this.searchStories(keyword)
		return stories.sort((a, b) => b.score - a.score).slice(0, limit)
	}
}
