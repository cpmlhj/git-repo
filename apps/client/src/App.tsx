import { FC } from 'react'
import { Layout, Tabs } from 'antd'
import { GithubOutlined, FireOutlined } from '@ant-design/icons'

import { GitHubProgress } from './components/GitHubProgress'
import { HackerNewsHot } from './components/HackerNewsHot'
import { QueryClientProvider } from '@tanstack/react-query'
import { trpc, browserQueryClient, trpcServer } from './utils/trpc'

const { Content } = Layout

const App: FC = () => {
	return (
		<trpc.Provider client={trpcServer} queryClient={browserQueryClient}>
			<QueryClientProvider client={browserQueryClient}>
				<Layout className="max-h-screen bg-white">
					<Content className="p-6 bg-white">
						<Tabs
							type="card"
							defaultActiveKey="github"
							items={[
								{
									label: (
										<span>
											<GithubOutlined />
											项目进展
										</span>
									),
									key: 'github',
									children: (
										<GitHubProgress />
									)
								},
								{
									label: (
										<span>
											<FireOutlined />
											热点话题
										</span>
									),
									key: 'hackernews',
									children: (
										<HackerNewsHot />
									)
								}
							]}
						/>
					</Content>
				</Layout>
			</QueryClientProvider>
		</trpc.Provider>
	)
}

export default App
