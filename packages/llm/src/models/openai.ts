import { BaseLLMClient } from './base'
import { ChatOpenAI } from '@langchain/openai'
import { OpenAIModel } from '../type'
import openai from 'openai'
import { HttpsProxyAgent } from 'https-proxy-agent'

export default class OpenAIClient extends BaseLLMClient<ChatOpenAI> {
	private openai: openai | null = null
	constructor() {
		super()
	}
	initInstance() {
		const { llm, httpsProxy } = this.config.getConfig()
		const { model, maxTokens, temperature, apiKey, baseUrl } =
			llm as OpenAIModel
		this.openai = new openai({
			apiKey,
			baseURL: baseUrl,
			httpAgent: httpsProxy
				? new HttpsProxyAgent(httpsProxy)
				: undefined
		})
		this.instance = new ChatOpenAI({
			model,
			maxTokens,
			temperature,
			useResponsesApi: true,
			configuration: {
				httpAgent: httpsProxy
					? new HttpsProxyAgent(httpsProxy)
					: undefined
			}
		})
	}
	async getModelList() {
		try {
			const models = await this.openai?.models.list()
			return (
				models?.data
					.filter(
						(model) =>
							model.id.startsWith('gpt-3.5') ||
							model.id.startsWith('gpt-4')
					)
					.map((model) => model.id) || []
			)
		} catch (error) {
			console.log(error)
			throw error
		}
	}
}
