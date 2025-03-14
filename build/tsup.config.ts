import { defineConfig } from 'tsup'

export function createTsupConfig({
	isServer = false,
	entry,
	external = [],
	noExternal = []
}: {
	isServer?: boolean
	entry: string[]
	external?: string[]
	noExternal?: string[]
}) {
	return defineConfig({
		entry,
		format: ['cjs', 'esm'],
		dts: true,
		minify: !isServer,
		clean: true,
		external,
		noExternal,
		treeshake: true,
		splitting: true,
		sourcemap: true,
		outDir: 'dist'
	})
}
