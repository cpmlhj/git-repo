import { FC } from 'react'
import { Form } from 'antd'
import { ModelSelect } from './ModelSelect'

interface HackerNewsHotProps {
	/** 选择的模型类型 */
	modelType?: 'openai' | 'ollama'
	/** 选择的模型 */
	model?: string
	/** 提交更改回调 */
	onSubmit?: (values: any) => void
}

/**
 * Hacker News热点话题组件
 * 用于配置和生成Hacker News热点话题
 */
export const HackerNewsHot: FC<HackerNewsHotProps> = ({
	modelType = 'openai',
	model,
	onSubmit
}) => {
	const [form] = Form.useForm()

	const handleModelChange = (values: {
		modelType: 'openai' | 'ollama'
		model: string
	}) => {
		form.setFieldsValue(values)
	}

	const handleSubmit = (values: any) => {
		onSubmit?.(values)
	}

	return (
		<div className="p-6 bg-white rounded-lg shadow">
			<h2 className="text-xl font-bold mb-6">
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
				<ModelSelect
					modelType={modelType}
					model={model}
					onChange={handleModelChange}
				/>

				<Form.Item>
					<button
						type="submit"
						className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
					>
						生成最新热点话题
					</button>
				</Form.Item>
			</Form>
		</div>
	)
}
