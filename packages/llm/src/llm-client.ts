import { ConfigManager } from '@github-sentinel/core'
import { RunnableSequence } from '@langchain/core/runnables'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { BaseLLMClient } from './models/base'
export class llmClient {
	private config: ConfigManager

	private instances: Map<string, BaseLLMClient<any>> = new Map()
	private currentPlatform: string = ''

	constructor() {
		this.config = ConfigManager.getInstance()
	}

	private async loadPlatformClinet(platform: string) {
		try {
			const module = await import(`./models/${platform}.ts`)

			const clientClass = module.default
			const instance: BaseLLMClient<any> = new clientClass()
			await instance.initInstance()
			return instance
		} catch (e) {
			throw new Error(`平台 ${platform} 未实现或未找到 ${e}`)
		}
	}

	private async getCurrentInstance() {
		const { platform = 'openai' } = this.config.getConfig()
		if (
			this.currentPlatform !== platform ||
			!this.instances.has(platform)
		) {
			this.currentPlatform = platform
			const instance = await this.loadPlatformClinet(platform)
			this.instances.set(platform, instance)
		}
		return this.instances.get(platform)!
	}

	async getModelList() {
		const current = await this.getCurrentInstance()
		return current?.getModelList()
	}

	async createChain({ prompt }: { prompt: string }) {
		const { llm } = this.config.getConfig()
		const template = ChatPromptTemplate.fromMessages([
			{ role: 'ai', content: prompt },
			{ role: 'human', content: '{input}' }
		])
		const current = await this.getCurrentInstance()
		if (!current) throw new Error(`当前模型平台初始化失败`)
		// 动态设置model
		let instance = current.instance
		instance = instance.bind({ model: llm.model })
		const chain = RunnableSequence.from([
			template,
			current.instance,
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
	}): Promise<ReadableStream<string> & AsyncIterable<string>> {
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
}
