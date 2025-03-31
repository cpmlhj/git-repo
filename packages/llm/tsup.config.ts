import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['cjs', 'esm'],
	dts: {
		resolve: true,
		compilerOptions: {
			moduleResolution: 'NodeNext',
			preserveSymlinks: true
		}
	},
	clean: true,
	external: [],
	treeshake: true,
	splitting: false,
	sourcemap: false
})
