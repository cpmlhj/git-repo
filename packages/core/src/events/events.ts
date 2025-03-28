import { EventEmitter } from 'events'

export interface GenerationEvent {
	taskId: string
	content: string | 'finish'
	type: 'chunk' | 'complete'
}

export class GenerationEventEmitter extends EventEmitter {
	private static instance: GenerationEventEmitter
	private taskListeners: Map<string, Function> = new Map()

	private constructor() {
		super()
	}

	public hasTask(taskId: string): boolean {
		return this.taskListeners.has(taskId)
	}

	public static getInstance(): GenerationEventEmitter {
		if (!GenerationEventEmitter.instance) {
			GenerationEventEmitter.instance = new GenerationEventEmitter()
		}
		return GenerationEventEmitter.instance
	}

	public emitGenerationEvent(event: GenerationEvent) {
		this.emit('generation', event)
	}

	public onGeneration(
		taskId: string,
		callback: (event: GenerationEvent) => void
	) {
		// 检查是否已存在该taskId的监听器
		if (this.taskListeners.has(taskId)) {
			return this.taskListeners.get(taskId)
		}

		const handler = (event: GenerationEvent) => {
			if (event.taskId === taskId) {
				callback(event)
				if (event.type === 'complete') {
					this.removeListener('generation', handler)
					this.taskListeners.delete(taskId)
				}
			}
		}
		this.on('generation', handler)
		const cleanup = () => {
			this.removeListener('generation', handler)
			this.taskListeners.delete(taskId)
		}
		this.taskListeners.set(taskId, cleanup)
		return cleanup
	}
}
