import { OpenAI } from 'openai'
import { Stream } from 'openai/streaming.mjs'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { ConfigManager, OpenAIModel } from '@github-analytics/core'

export interface OpenAIConfig {
	apiKey: string
	model?: string
	baseURL?: string
	maxTokens?: number
	temperature?: number
	proxyAgent?: any
}

export type ChatResponse = OpenAI.Chat.Completions.ChatCompletionMessage
export type StreamResponse = Stream<OpenAI.Chat.Completions.ChatCompletionChunk>

export class OpenAIClient {
	private client: OpenAI
	private config: ConfigManager

	constructor() {
		this.config = ConfigManager.getInstance()
		const config = this.config.getConfig()
		const modelConfig = config.llm as OpenAIModel
		if (!modelConfig || !modelConfig.apiKey)
			throw new Error('OpenAI API Key is required')
		let agent
		if (config.httpsProxy) {
			agent = new HttpsProxyAgent(config.httpsProxy)
		}
		this.client = new OpenAI({
			apiKey: modelConfig.apiKey,
			baseURL: modelConfig.baseUrl,
			httpAgent: agent
		})
	}

	async chat(
		messages: any[],
		stream = false
	): Promise<ChatResponse | StreamResponse> {
		const modelConfig = this.config.getConfig().llm as OpenAIModel
		try {
			const completion = await this.client.chat.completions.create({
				model: modelConfig.model,
				messages,
				max_tokens: modelConfig.maxTokens || 1000,
				temperature: modelConfig.temperature,
				stream
			})
			if (!stream) {
				return (completion as unknown as any).choices[0].message
			}
			return completion as StreamResponse
		} catch (error) {
			console.error('OpenAI API调用失败:', error)
			throw error
		}
	}

	async complete(prompt: string, stream = false) {
		return this.chat([{ role: 'user', content: prompt }], stream)
	}
}
