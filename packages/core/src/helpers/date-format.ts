import dayjs from 'dayjs'
import { GithubRepoListSince } from '../types'

export function format_range_date(
	period: GithubRepoListSince,
	custom_date?: string
) {
	const now = dayjs()
	if (period === 'daily') {
		return now.subtract(1, 'day').toISOString()
	} else if (period === 'weekly') {
		return now.subtract(7, 'day').toISOString()
	} else if (period === 'custom') {
		if (!custom_date) throw new Error('自定义时间范围缺少开始时间')
		const target = dayjs(custom_date)
		const day = Math.abs(now.diff(target, 'day'))
		return now.subtract(day, 'day').toISOString()
	} else {
		throw new Error('未知的时间范围')
	}
}

export function returnISOString(date: string) {
	return dayjs(date).toISOString()
}

export function format_date(date: string) {
	return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}
