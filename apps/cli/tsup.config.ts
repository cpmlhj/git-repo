import { createTsupConfig } from '../../build/tsup.config'

export default createTsupConfig({
	isServer: true,
	entry: ['src/index.ts'],
	external: ['inquirer', 'commander', 'colors'],
	noExternal: ['@github-analytics/core']
})
