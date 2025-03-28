import { HNStory } from '../types'
import { llmClient } from '@github-sentinel/llm'
import { prompt } from '../repo-generator/prompt'

export class HackerNewsAnalyticsService {
	private llmClient: llmClient

	constructor() {
		this.llmClient = new llmClient()
	}

	/**
	 * 对故事标题进行主题分类
	 */
	async *categorizeTopics(stories: HNStory[]) {
		try {
			const response =
				await this.llmClient.chatCompletionWithStream({
					question: JSON.stringify(stories, null, 2),
					prompt: prompt.hacker_news_dayily_openai_prompot
				})
			if (response) {
				for await (const chunk of response) {
					yield chunk
				}
			}
		} catch (error) {
			console.error('解析主题分类结果失败:', error)
			throw error
		}
	}
}
