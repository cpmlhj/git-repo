export interface BaseModel {
	maxTokens?: number
	temperature?: number
	proxyAgent?: any
}

export interface OpenAIModel extends BaseModel {
	apiKey: string
	model: string
	baseUrl?: string
}

export interface OllamaModel extends BaseModel {
	baseUrl: string
	model: string
}

export type Model = OpenAIModel | OllamaModel
