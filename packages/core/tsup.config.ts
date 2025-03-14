import { defineConfig } from 'tsup'

export default defineConfig({
	entry: [
		'src/index.ts',
		'src/config/index.ts',
		'src/notification/index.ts',
		'src/github/index.ts',
		'src/scheduler/index.ts',
		'src/subscription/index.ts',
		'src/types/index.ts'
	],
	format: ['cjs', 'esm'],
	dts: true,
	clean: true,
	external: [
		'@octokit/rest',
		'axios',
		'colors',
		'dotenv',
		'https-proxy-agent',
		'natural',
		'node-cron',
		'p-queue',
		'p-retry',
		'yaml'
	],
	treeshake: true,
	splitting: false,
	sourcemap: false
})
