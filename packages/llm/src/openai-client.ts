import { OpenAI } from 'openai'

export interface OpenAIConfig {
	apiKey: string
	model?: string
	baseURL?: string
	maxTokens?: number
	temperature?: number
	proxyAgent?: any
}

export class OpenAIClient {
	private client: OpenAI
	private config: OpenAIConfig

	constructor(config: OpenAIConfig) {
		this.config = {
			model: config.model || 'gpt-4-turbo-preview',
			maxTokens: config.maxTokens || 2000,
			temperature: config.temperature || 0.7,
			apiKey: config.apiKey,
			proxyAgent: config.proxyAgent
		}
		if (config.baseURL) this.config.baseURL = config.baseURL
		if (!this.config.apiKey) throw new Error('OpenAI API Key is required')
		this.client = new OpenAI({
			apiKey: this.config.apiKey,
			baseURL: this.config.baseURL,
			httpAgent: this.config.proxyAgent
		})
	}

	async chat(messages: any) {
		try {
			const completion = await this.client.chat.completions.create({
				model: this.config.model!,
				messages,
				max_tokens: this.config.maxTokens,
				temperature: this.config.temperature
			})

			return completion.choices[0].message
		} catch (error) {
			console.error('OpenAI API调用失败:', error)
			throw error
		}
	}

	async complete(prompt: string) {
		return this.chat([{ role: 'user', content: prompt }])
	}
}
