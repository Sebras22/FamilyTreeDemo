import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import checker from 'vite-plugin-checker'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [
    react(),
    mode === 'development' && checker({ typescript: true, eslint: { lintCommand: 'eslint "./src/**/*.{ts,tsx}"', useFlatConfig: true } }),
    mode === 'analyze' && visualizer({ open: true, gzipSize: true }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'vendor-react'
          if (id.includes('@mantine') || id.includes('@floating-ui') || id.includes('react-remove-scroll') || id.includes('react-textarea-autosize')) return 'vendor-mantine'
          if (id.includes('@xyflow') || id.includes('@dagrejs') || id.includes('d3-')) return 'vendor-graph'
          if (id.includes('motion')) return 'vendor-motion'
          return undefined
        },
      },
    },
  },
  server: {
    port: 5173,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}))
