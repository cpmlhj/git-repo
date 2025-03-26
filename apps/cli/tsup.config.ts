import { createTsupConfig } from '../../build/tsup.config'

export default createTsupConfig({
	isServer: true,
	format: ['cjs'],
	entry: ['src/index.ts', 'src/scheduler.ts'],
	external: ['inquirer', 'commander', 'colors'],
	noExternal: ['@github-analytics/core'],
	splitting: false,
	sourcemap: false
})
