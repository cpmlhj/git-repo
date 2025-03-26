import { createTransport } from 'nodemailer'
import { ConfigManager, Config } from '../config'
import { logger } from '../helpers/logger'

export class NodeMailer {
	private transporter

	private emailConfig: Config['notifications']['email']

	// 重试次数
	private retryCount = 5

	constructor() {
		const config = ConfigManager.getInstance().getConfig()
		this.emailConfig = config.notifications.email
		this.transporter = createTransport({
			name: 'smtp',
			host: this.emailConfig?.host,
			port: this.emailConfig?.port,
			secure: false,
			auth: {
				user: this.emailConfig?.user,
				pass: this.emailConfig?.pass
			}
		})
	}

	async sendMail({
		text,
		title,
		isHtml
	}: {
		text: string
		title: string
		isHtml: boolean
	}) {
		if (!this.emailConfig?.from) {
			logger.warning('未配置发件人，邮件通知将不会发送')
			return
		}
		// 再一次确认是否存在收件人
		if (!this.emailConfig?.to) {
			logger.warning('未配置收件人，邮件通知将不会发送')
			return
		}
		if (this.retryCount <= 0) {
			logger.warning('邮件发送取消，因失败次数过多，请检查邮件配置')
			return
		}
		try {
			await this.transporter.sendMail({
				from: `github-sentinel AI助手 <${this.emailConfig?.from}>`,
				to: this.emailConfig?.to,
				subject: title,
				[isHtml ? 'html' : 'text']: text
			})
			logger.info(`邮件发送成功: 目标~${this.emailConfig?.to}`)
		} catch (error) {
			logger.warning('邮件发送失败')
			logger.error(error)
			// 减少发生次数
			this.retryCount--
		}
	}
}
