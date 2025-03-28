import { router, baseProcedure } from '../trpc'
import { z } from 'zod'
import fs from 'fs'
import path from 'path'
import { Readable } from 'stream'
import { modelTypeSchema } from './llm'

export const repo = router({
	getReportList: baseProcedure
		.input(
			z.object({
				owner: z.string(),
				repo: z.string()
			})
		)
		.query(async ({ input }) => {
			const reportsPath = path.join(
				process.cwd(),
				'data',
				'reports',
				input.owner,
				input.repo
			)

			if (!fs.existsSync(reportsPath)) {
				return []
			}

			const files = fs.readdirSync(reportsPath)
			return files.filter((file) => file.endsWith('.md'))
		}),

	streamReport: baseProcedure
		.input(
			z.object({
				owner: z.string(),
				repo: z.string(),
				reportName: z.string()
			})
		)
		.subscription(async ({ input }) => {
			const reportPath = path.join(
				process.cwd(),
				'data',
				'reports',
				input.owner,
				input.repo,
				input.reportName
			)

			if (!fs.existsSync(reportPath)) {
				throw new Error('报告文件不存在')
			}

			return new Readable({
				read() {
					const content = fs.readFileSync(
						reportPath,
						'utf-8'
					)
					this.push(content)
					this.push(null)
				}
			})
		})
})
