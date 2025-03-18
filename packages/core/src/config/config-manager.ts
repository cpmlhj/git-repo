import dotenv from 'dotenv'
import { parse } from 'yaml'
import { readFileSync } from 'fs'
import { resolve, isAbsolute } from 'path'
import { LLMModelConfig } from '../types'

/**
 * 配置项接口
 */
export interface Config {
	/** GitHub Token */
	githubToken: string
	/** 通知配置 */
	notifications: {
		/** 邮件配置 */
		email?: {
			/** SMTP 服务器 */
			host: string
			/** SMTP 端口 */
			port: number
			/** 用户名 */
			user: string
			/** 密码 */
			pass: string
			/** 发件人 */
			from: string
		}
		/** Webhook 配置 */
		webhook?: {
			/** Webhook URL */
			url: string
		}
	}
	/** 订阅配置 */
	subscriptions: {
		/** 默认更新频率 */
		defaultFrequency: 'daily' | 'weekly'
		/** 默认关注的事件类型 */
		defaultEventTypes: Array<
			'issues' | 'pull_requests' | 'releases' | 'discussions'
		>
	}
	httpsProxy?: string
	// llm 配置
	llm?: Omit<LLMModelConfig, 'maxTokens' | 'temperature'>
	// export file
	exports?: {
		/** 导出文件路径 */
		path: string
		/** 导出文件格式 */
		format?: 'md' | 'json'
		/** 是否导出 */
		show_export: boolean
	}
}

/**
 * 配置管理器类
 */
export class ConfigManager {
	private static instance: ConfigManager
	private config: Config

	private constructor() {
		this.config = this.loadConfig()
	}

	/**
	 * 获取配置管理器实例
	 */
	public static getInstance(): ConfigManager {
		if (!ConfigManager.instance) {
			ConfigManager.instance = new ConfigManager()
		}
		return ConfigManager.instance
	}

	/**
	 * 获取配置项
	 */
	public getConfig(): Config {
		return this.config
	}

	public setConfig<T extends keyof Config>(key: T, value: Config[T]) {
		this.config[key] = value
	}

	/**
	 * 加载配置
	 */
	private loadConfig(): Config {
		// 加载 .env 文件
		dotenv.config()

		// 尝试加载 YAML 配置文件
		let yamlConfig
		try {
			const yamlPath = resolve(process.cwd(), 'config.yaml')
			const yamlContent = readFileSync(yamlPath, 'utf8')
			yamlConfig = parse(yamlContent)
		} catch (error) {
			console.warn('未找到 YAML 配置文件或解析失败，将使用默认配置')
		}
		// 合并环境变量和 YAML 配置
		if (yamlConfig && yamlConfig.exports) {
			if (
				yamlConfig.exports.path &&
				!isAbsolute(yamlConfig.exports.path)
			) {
				yamlConfig.exports.path = resolve(
					process.cwd(),
					yamlConfig.exports.path
				)
			}
		}
		return {
			githubToken: process.env.GITHUB_TOKEN || '',
			llm: {
				apiKey: process.env.OPENAI_API_KEY || '',
				baseURL: process.env.OPENAI_BASE_URL || '',
				model: process.env.OPENAI_MODEL
			},
			notifications: {
				email: yamlConfig?.notifications?.email || {
					host: process.env.SMTP_HOST,
					port: parseInt(process.env.SMTP_PORT || '587'),
					user: process.env.SMTP_USER,
					pass: process.env.SMTP_PASS,
					from: process.env.SMTP_FROM
				},
				webhook: yamlConfig?.notifications?.webhook || {
					url: process.env.WEBHOOK_URL
				}
			},
			subscriptions: {
				defaultFrequency: (yamlConfig?.subscriptions
					?.defaultFrequency ||
					process.env.DEFAULT_FREQUENCY ||
					'daily') as 'daily' | 'weekly',
				defaultEventTypes: (yamlConfig?.subscriptions
					?.defaultEventTypes ||
					process.env.DEFAULT_EVENT_TYPES?.split(',') || [
						'issues',
						'pull_requests',
						'releases'
					]) as Array<
					'issues' | 'pull_requests' | 'releases' | 'discussions'
				>
			},
			httpsProxy: process.env.HTTPS_PROXY,
			exports: yamlConfig?.exports || undefined
		}
	}
}
