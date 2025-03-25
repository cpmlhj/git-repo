import { FC } from 'react'
import { Form, Select, Radio, FormInstance } from 'antd'
import { trpc, RouterInputs } from '../utils/trpc'

export type ModelType = RouterInputs['llm']['getModels']['modelType']

/**
 * 模型选择组件
 * 用于选择模型类型和具体模型
 */
export const ModelSelect: FC<{ form: FormInstance }> = ({ form }) => {
	const { setFieldsValue } = form
	const modelType = Form.useWatch('modelType', form)
	// 获取模型列表
	const { data: models, error } = trpc.llm.getModels.useQuery({
		modelType: modelType || 'openai'
	})
	const handleModelTypeChange = (type: ModelType) => {
		setFieldsValue({ modelType: type, model: '' })
	}

	const handleModelChange = (selectedModel: string) => {
		setFieldsValue({ model: selectedModel })
	}

	return (
		<>
			<Form.Item
				name="modelType"
				label="模型选型"
				rules={[{ required: true, message: '请选择模型类型' }]}
			>
				<Radio.Group
					onChange={(e) =>
						handleModelTypeChange(e.target.value)
					}
				>
					<Radio.Button value="openai">
						OpenAI GPT API
					</Radio.Button>
					<Radio.Button value="ollama">
						Ollama 私有化模型服务
					</Radio.Button>
				</Radio.Group>
			</Form.Item>

			<Form.Item
				name="model"
				label="选择模型"
				rules={[{ required: true, message: '请选择模型' }]}
				validateStatus={error ? 'error' : undefined}
				help={error?.message}
			>
				<Select
					placeholder="请选择模型"
					options={models?.map((m) => ({
						label: m,
						value: m
					}))}
					onChange={handleModelChange}
				/>
			</Form.Item>
		</>
	)
}
