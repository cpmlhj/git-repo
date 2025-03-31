import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	build: {
		outDir: '../server/dist/client',
		emptyOutDir: true,
		rollupOptions: {
			treeshake: 'smallest',
			output: {
				manualChunks: {
					antd: ['antd'],
					'react-syntax-highlighter': [
						'react-syntax-highlighter'
					]
				}
			}
		}
	},
	server: {
		proxy: {
			'/api': {
				target: 'http://localhost:3000',
				changeOrigin: true
			}
		}
	}
})
