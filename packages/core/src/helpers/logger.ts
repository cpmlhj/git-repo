import winston from 'winston'
import { format } from 'winston'
import path from 'path'
import fs from 'fs'
import { format_date } from './date-format'

// 日志级别颜色配置
const colors = {
	error: 'red',
	warn: 'yellow',
	info: 'green',
	debug: 'blue'
}

// 创建日志目录结构
const createLogDir = (level: string) => {
	const date = format_date(new Date().toISOString(), 'YYYY-MM-DD')
	const dir = path.join(process.cwd(), 'logs', date, level)
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true })
	}
	return dir
}

export class Logger {
	private static instance: winston.Logger

	static getInstance() {
		if (!Logger.instance) {
			Logger.instance = winston.createLogger({
				levels: winston.config.syslog.levels,
				format: format.combine(
					format.timestamp({
						format: 'YYYY-MM-DD HH:mm:ss'
					}),
					format.errors({ stack: true }),
					format.json()
				),
				transports: [
					// 控制台输出（带颜色）
					new winston.transports.Console({
						format: format.combine(
							format.colorize({ colors }),
							format.printf(
								({
									level,
									message,
									timestamp
								}) => {
									return `[${timestamp}] ${level}: ${message}`
								}
							)
						)
					}),
					...Logger.generateLogFileConfig()
				]
			})
		}
		return Logger.instance
	}

	static generateLogFileConfig() {
		return Object.keys(colors).map((level: string) => {
			const dir = createLogDir(level)
			const filename = path.join(dir, `${level}.log`)
			return new winston.transports.File({
				level: level,
				filename,
				handleExceptions: level === 'error' || level === 'warn',
				format: format.combine(
					format.uncolorize(),
					format.printf(({ level, message, timestamp }) => {
						return `[${timestamp}] ${level}: ${message}`
					})
				)
			})
		})
	}
}

// 快捷访问方法
export const logger = Logger.getInstance()
