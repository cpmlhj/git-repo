import { FC, useState } from 'react'
import { Button, Form, Input, Modal, Select, DatePicker } from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { trpc } from '../utils/trpc'
import { GithubEventSelections } from './constants'
import dayjs from 'dayjs'

interface SubscriptionManagerProps {
	onSubscriptionChange?: () => void
}

const { RangePicker } = DatePicker

export const SubscriptionManager: FC<SubscriptionManagerProps> = ({
	onSubscriptionChange
}) => {
	const [form] = Form.useForm()
	const [isModalVisible, setIsModalVisible] = useState(false)
	const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
	const [selectedRepo, setSelectedRepo] = useState('')

	const utils = trpc.useUtils()
	const { data: subscriptions } = trpc.subscriptions.list.useQuery()
	const addSubscription = trpc.subscriptions.add.useMutation({
		onSuccess: () => {
			utils.subscriptions.list.invalidate()
			onSubscriptionChange?.()
			handleCancel()
		}
	})
	const removeSubscription = trpc.subscriptions.remove.useMutation({
		onSuccess: () => {
			utils.subscriptions.list.invalidate()
			onSubscriptionChange?.()
		}
	})
	const updateSubscription = trpc.subscriptions.update.useMutation({
		onSuccess: () => {
			utils.subscriptions.list.invalidate()
			onSubscriptionChange?.()
			handleCancel()
		}
	})

	const showModal = (mode: 'add' | 'edit', repo?: string) => {
		setModalMode(mode)
		setIsModalVisible(true)
		if (mode === 'edit' && repo) {
			setSelectedRepo(repo)
			const subscription = subscriptions?.find(
				(s) => s.repo === repo
			)
			if (subscription) {
				form.setFieldsValue({
					...subscription,
					dateRange:
						subscription.frequency.type === 'custom' &&
						subscription.frequency.interval
							? [
									dayjs(
										subscription
											.frequency
											.interval
											.start
									),
									dayjs(
										subscription
											.frequency
											.interval.end
									)
								]
							: undefined
				})
			}
		} else {
			form.resetFields()
		}
	}

	const handleCancel = () => {
		setIsModalVisible(false)
		form.resetFields()
	}

	const handleSubmit = async (values: any) => {
		const { owner, repo, frequency, dateRange, eventTypes } = values

		if (frequency === 'custom' && dateRange) {
			const [start, end] = dateRange
			if (
				start.isBefore(dayjs().startOf('month')) ||
				end.isAfter(dayjs())
			) {
				Modal.error({
					title: '时间范围错误',
					content: '自定义时间范围必须在本月1号到今天之间'
				})
				return
			}
		}

		const subscriptionData = {
			owner,
			repo,
			frequency: {
				type: frequency,
				interval:
					frequency === 'custom' && dateRange
						? {
								start: dateRange[0].format(
									'YYYY-MM-DD'
								),
								end: dateRange[1].format(
									'YYYY-MM-DD'
								)
							}
						: undefined
			},
			eventTypes
		}

		if (modalMode === 'add') {
			await addSubscription.mutateAsync(subscriptionData)
		} else {
			await updateSubscription.mutateAsync({
				repo: selectedRepo,
				updateConfig: subscriptionData
			})
		}
	}

	const handleDelete = async (owner: string, repo: string) => {
		await removeSubscription.mutateAsync({ owner, repo })
	}

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h2 className="text-xl font-bold">订阅管理</h2>
				<Button
					type="primary"
					icon={<PlusOutlined />}
					onClick={() => showModal('add')}
				>
					新增订阅
				</Button>
			</div>

			<div className="space-y-2">
				{subscriptions?.map((subscription) => (
					<div
						key={`${subscription.owner}/${subscription.repo}`}
						className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
					>
						<div>
							<div className="font-medium">
								{subscription.owner}/
								{subscription.repo}
							</div>
							<div className="text-sm text-gray-500">
								周期：
								{subscription.frequency.type ===
								'custom'
									? `${subscription.frequency.interval?.start} 至 ${subscription.frequency.interval?.end}`
									: subscription.frequency
												.type ===
										  'daily'
										? '每日'
										: '每周'}
							</div>
						</div>
						<div className="space-x-2">
							<Button
								icon={<EditOutlined />}
								onClick={() =>
									showModal(
										'edit',
										subscription.repo
									)
								}
							>
								编辑
							</Button>
							<Button
								danger
								icon={<DeleteOutlined />}
								onClick={() =>
									handleDelete(
										subscription.owner,
										subscription.repo
									)
								}
							>
								删除
							</Button>
						</div>
					</div>
				))}
			</div>

			<Modal
				title={modalMode === 'add' ? '新增订阅' : '编辑订阅'}
				open={isModalVisible}
				onOk={form.submit}
				onCancel={handleCancel}
			>
				<Form
					form={form}
					layout="vertical"
					onFinish={handleSubmit}
				>
					<Form.Item
						name="owner"
						label="仓库所有者"
						rules={[
							{
								required: true,
								message: '请输入仓库所有者'
							}
						]}
					>
						<Input placeholder="请输入仓库所有者" />
					</Form.Item>

					<Form.Item
						name="repo"
						label="仓库名称"
						rules={[
							{
								required: true,
								message: '请输入仓库名称'
							}
						]}
					>
						<Input placeholder="请输入仓库名称" />
					</Form.Item>

					<Form.Item
						name="frequency"
						label="报告周期"
						rules={[
							{
								required: true,
								message: '请选择报告周期'
							}
						]}
					>
						<Select
							options={[
								{
									label: '每日',
									value: 'daily'
								},
								{
									label: '每周',
									value: 'weekly'
								},
								{
									label: '自定义',
									value: 'custom'
								}
							]}
						/>
					</Form.Item>

					<Form.Item
						noStyle
						shouldUpdate={(prevValues, currentValues) =>
							prevValues.frequency !==
							currentValues.frequency
						}
					>
						{({ getFieldValue }) =>
							getFieldValue('frequency') ===
							'custom' ? (
								<Form.Item
									name="dateRange"
									label="时间范围"
									rules={[
										{
											required: true,
											message: '请选择时间范围'
										}
									]}
								>
									<RangePicker
										disabledDate={(
											current
										) =>
											current &&
											(current.isAfter(
												dayjs()
											) ||
												current.isBefore(
													dayjs().subtract(
														30,
														'days'
													)
												))
										}
										presets={[
											{
												label: '最近一周',
												value: [
													dayjs().subtract(
														7,
														'days'
													),
													dayjs()
												]
											},
											{
												label: '最近三天',
												value: [
													dayjs().subtract(
														3,
														'days'
													),
													dayjs()
												]
											},
											{
												label: '本月',
												value: [
													dayjs().startOf(
														'month'
													),
													dayjs()
												]
											}
										]}
									/>
								</Form.Item>
							) : null
						}
					</Form.Item>

					<Form.Item
						name="eventTypes"
						label="事件类型"
						rules={[
							{
								required: true,
								message: '请选择事件类型'
							}
						]}
					>
						<Select
							mode="multiple"
							options={GithubEventSelections}
						/>
					</Form.Item>
				</Form>
			</Modal>
		</div>
	)
}
