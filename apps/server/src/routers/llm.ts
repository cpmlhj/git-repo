import { z } from 'zod'
import { baseProcedure, router } from '../trpc'
import config from '../../config.json'

export const modelTypeSchema = z.enum(['openai', 'ollama'])

const getOllamaModels = async (): Promise<string[]> => {
	try {
		const ollamaApiBaseUrl =
			process.env.OLLAMA_API_BASE_URL || 'http://localhost:11434'
		const response = await fetch(`${ollamaApiBaseUrl}/api/tags`)
		const data = await response.json()
		return data.models.map((model: { name: string }) => model.name)
	} catch (error) {
		console.error('Failed to fetch Ollama models:', error)
		return []
	}
}

export const llmRouter = router({
	getModels: baseProcedure
		.input(z.object({ modelType: modelTypeSchema }))
		.query(async ({ input }) => {
			const { modelType } = input

			if (modelType === 'openai') {
				return config.openai.models
			}

			if (modelType === 'ollama') {
				try {
					return await getOllamaModels()
				} catch (error) {
					console.error(error)
					throw new Error('Failed to fetch Ollama models:')
				}
			}
			return []
		})
})
