import { ConfigManager } from '@github-sentinel/core'
import OllamaClient from './ollama'
import OpenAIClient from './openai'

export type SUPPORTED_PLATFORMS = {
	openai: OpenAIClient
	ollama: OllamaClient
}

export abstract class BaseLLMClient<T> {
	config: ConfigManager
	instance: T | null = null
	constructor() {
		this.config = ConfigManager.getInstance()
	}
	abstract initInstance(): void

	abstract getModelList(): Promise<string[]>

	get modelInstance() {
		if (!this.instance) {
			this.initInstance()
		}
		return this.instance
	}
}
