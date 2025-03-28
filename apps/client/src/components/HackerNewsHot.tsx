import { FC, useState } from 'react'
import { Form, Button } from 'antd'
import { ModelSelect } from './ModelSelect'
import { trpc } from '../utils/trpc'
import { StreamOutput } from './renderOutput'

interface HackerNewsHotProps {
	/** 选择的模型类型 */
	modelType?: 'openai' | 'ollama'
	/** 选择的模型 */
	model?: string
}

/**
 * Hacker News热点话题组件
 * 用于配置和生成Hacker News热点话题
 */
export const HackerNewsHot: FC<HackerNewsHotProps> = ({
	modelType = 'openai',
	model
}) => {
	const [form] = Form.useForm()
	const [loading, setLoading] = useState(false)
	const [displayText, setDisplayText] = useState('')

	const handleGenerate = trpc.report.subscribeHackerNews.useMutation()

	trpc.report.generateHackerNewsReport.useSubscription(undefined, {
		onStarted: () => {
			console.log('订阅HackerNews进度')
		},
		onData: (data) => {
			console.log('订阅HackerNews', data.type)
			if (data.type !== 'complete') {
				requestAnimationFrame(() => {
					setDisplayText((prev) => prev + data.content)
				})
			} else {
				setLoading(false)
			}
		}
	})

	const handleSubmit = async () => {
		const values = await form.validateFields()
		setLoading(true)
		setDisplayText('')
		handleGenerate.mutate({
			modelType: values.modelType,
			modelConfig: {
				model: values.model
			}
		})
	}

	return (
		<div className="p-6 bg-white rounded-lg shadow">
			<h2 className="text-xl font-bold mb-requestframe6">
				Hacker News 热点话题
			</h2>
			<Form
				form={form}
				layout="vertical"
				initialValues={{
					modelType,
					model
				}}
				onFinish={handleSubmit}
			>
				<ModelSelect form={form} />
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
					生成最新热点话题
				</Button>
			</div>
		</div>
	)
}
