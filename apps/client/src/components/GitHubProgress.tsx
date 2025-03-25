import { FC, useMemo, useState } from 'react'
import { Button, Form, Select, message } from 'antd'
import { ModelSelect } from './ModelSelect'
import { SubscriptionManager } from './SubscriptionManager'
import { trpc } from '../utils/trpc'
import { StreamOutput } from './renderOutput'

/**
 * GitHub项目进展组件
 * 用于配置和展示GitHub项目的进展情况
 */
export const GitHubProgress: FC = () => {
	const [displayText, setDisplayText] = useState('')
	const [loading, setLoading] = useState(false)

	const requestframe = (content: string) => {
		requestAnimationFrame(() => {
			setDisplayText((prev) => prev + content)
		})
	}
	const [form] = Form.useForm()
	const { data: subscriptions } = trpc.subscriptions.list.useQuery()

	const selectedRepo = Form.useWatch('repository', form)
	const frequencyText = useMemo(() => {
		if (!selectedRepo || !subscriptions) return ''
		const subscription = subscriptions.find(
			(sub) => `${sub.owner}/${sub.repo}` === selectedRepo
		)
		if (!subscription) return ''

		switch (subscription.frequency.type) {
			case 'daily':
				return '每日'
			case 'weekly':
				return '每周'
			case 'custom':
				return `自定义时间:${subscription.frequency.interval?.start} - ${subscription.frequency.interval?.end}`
			default:
				return ''
		}
	}, [selectedRepo, subscriptions])

	const handleOnSubscriptionChange = () => {}
	const handleGenerate = trpc.report.submitReportGeneration.useMutation()
	trpc.report.generateReport.useSubscription(undefined, {
		onStarted: () => {
			console.log('订阅报告进度')
		},
		onData: (data) => {
			console.log('订阅报告进度', data.type)
			if (data.type !== 'complete') {
				requestframe(data.content)
			} else {
				setLoading(false)
			}
		},
		onError: (err) => {
			message.error('订阅报告进度失败：' + err.message)
		}
	})
	const handleSubmit = async () => {
		const values = await form.validateFields()
		const [owner, repo] = values.repository.split('/')
		setLoading(true)
		setDisplayText('')
		handleGenerate.mutate({
			repo,
			owner,
			modelType: values.modelType,
			modelConfig: {
				model: values.model
			}
		})
	}

	return (
		<div className="space-y-6 relative pb-20">
			<SubscriptionManager
				onSubscriptionChange={handleOnSubscriptionChange}
			/>
			<div className="p-6 bg-white rounded-lg shadow">
				<h2 className="text-xl font-bold mb-6">
					GitHub 项目进展
				</h2>
				<Form
					form={form}
					layout="vertical"
					initialValues={{
						modelType: 'openai',
						reportPeriod: 2
					}}
					onFinish={handleSubmit}
					className="space-y-4"
				>
					<ModelSelect form={form} />

					<Form.Item
						name="repository"
						label="订阅列表"
						rules={[
							{
								required: true,
								message: '请选择要生成报告的仓库'
							}
						]}
					>
						<Select
							placeholder="请选择仓库"
							options={subscriptions?.map(
								(sub) => ({
									label: `${sub.owner}/${sub.repo}`,
									value: `${sub.owner}/${sub.repo}`
								})
							)}
							className="w-full"
						/>
					</Form.Item>

					<Form.Item
						label="报告周期"
						style={{
							display: frequencyText
								? 'normal'
								: 'none'
						}}
					>
						<div className="p-2 bg-gray-50 rounded">
							{frequencyText}
						</div>
					</Form.Item>
				</Form>

				<StreamOutput displayText={displayText} />

				<div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4">
					<Button
						loading={loading}
						htmlType="submit"
						type="primary"
						className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
						onClick={handleSubmit}
					>
						生成报告
					</Button>
				</div>
			</div>
		</div>
	)
}
