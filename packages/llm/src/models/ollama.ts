import { BaseLLMClient } from './base'
import { Ollama } from '@langchain/ollama'
import { OllamaModel } from '../type'

export default class OllamaClient extends BaseLLMClient<Ollama> {
	constructor() {
		super()
	}
	initInstance() {
		const { llm } = this.config.getConfig()
		const { baseUrl, model } = llm as any
		this.instance = new Ollama({
			baseUrl,
			model
		})
	}
	async getModelList(): Promise<string[]> {
		const { llm } = this.config.getConfig()
		const { baseUrl = 'http://127.0.0.1:11434' } = llm as OllamaModel

		try {
			const response = await fetch(`${baseUrl}/api/tags`)
			const data = await response.json()
			return data.models.map(
				(model: Record<string, string>) => model.model
			)
		} catch (error) {
			console.error('Failed to fetch Ollama models:', error)
			throw error
		}
	}
}
