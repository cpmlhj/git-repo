import cron from 'node-cron'
import { format_range_date } from '../helpers/date-format'

export interface FrequencyStrategy {
	getDateRange(): string[]
	executionTime(sceduler_fn?: (args: any) => any): cron.ScheduledTask | null
	get metaData(): {
		type: string
		name: string
		custom_date?: { start: string; end: string }
	}
}

export class DailyStrategy implements FrequencyStrategy {
	get metaData() {
		return {
			type: 'daily',
			name: '日报'
		}
	}

	getDateRange() {
		const date = format_range_date('daily')
		return [date]
	}

	executionTime(sceduler_fn: (args: any) => any) {
		return cron.schedule('* 9 * * *', sceduler_fn)
	}
}

export class WeeklyStrategy implements FrequencyStrategy {
	get metaData() {
		return {
			type: 'weekly',
			name: '周报'
		}
	}

	getDateRange() {
		const date = format_range_date('weekly')
		return [date]
	}

	executionTime(sceduler_fn: (args: any) => any) {
		return cron.schedule('0 9 * * 1', sceduler_fn)
	}
}

export class CustomStrategy implements FrequencyStrategy {
	constructor(private interval: { start: string; end: string }) {}

	get metaData() {
		return {
			type: 'custom',
			name: '自定义',
			custom_date: this.interval
		}
	}

	getDateRange() {
		const date = format_range_date('custom', this.interval.start)
		return [date]
	}

	executionTime() {
		// 自定义策略可能不需要下次执行时间
		return null
	}
}
