import { OpenAIModel } from './type'
import { ConfigManager } from '@github-analytics/core'
import { ChatOpenAI } from '@langchain/openai'
import { RunnableSequence } from '@langchain/core/runnables'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { HttpsProxyAgent } from 'https-proxy-agent'
export class llmClient {
	private config: ConfigManager

	constructor() {
		this.config = ConfigManager.getInstance()
	}

	async createChain({ prompt }: { prompt: string }) {
		const template = ChatPromptTemplate.fromMessages([
			{ role: 'ai', content: prompt },
			{ role: 'human', content: '{input}' }
		])
		const chat = await this.initChat()
		const chain = RunnableSequence.from([
			template,
			chat,
			new StringOutputParser()
		])
		return chain
	}

	async chatCompletionWithStream({
		question,
		prompt
	}: {
		question: string
		prompt: string
	}) {
		try {
			const chain = await this.createChain({ prompt })
			const stream = await chain.stream({ input: question })
			return stream
		} catch (error) {
			throw error
		}
	}

	async chatCompletion({
		question,
		prompt
	}: {
		question: string
		prompt: string
	}) {
		try {
			const chain = await this.createChain({ prompt })
			const response = await chain.invoke({ input: question })
			return response
		} catch (error) {
			console.error(error)
		}
	}

	private initChat() {
		const { platform = 'openai' } = this.config.getConfig()
		switch (platform) {
			case 'openai':
				return this.initOpenai()
			// case 'ollama':
			// 	return this.initOllama()
			default:
				throw new Error(`当前平台暂不支持`)
		}
	}

	private initOpenai() {
		const { llm, httpsProxy } = this.config.getConfig()
		const { model, maxTokens, temperature } = llm as OpenAIModel
		return new ChatOpenAI({
			model,
			maxTokens,
			temperature,
			configuration: {
				httpAgent: httpsProxy
					? new HttpsProxyAgent(httpsProxy)
					: undefined
			}
		})
	}

	private async initOllama() {
		// TODO:
	}
}
