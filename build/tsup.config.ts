import { defineConfig, Options } from 'tsup'

export function createTsupConfig(option: Options & { isServer?: boolean }) {
	return defineConfig({
		format: ['cjs', 'esm'],
		dts: true,
		minify: !option.isServer,
		clean: true,
		external: [],
		noExternal: [],
		treeshake: true,
		splitting: true,
		sourcemap: true,
		outDir: 'dist',
		...option
	})
}
