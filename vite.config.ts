import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 4173,
    proxy: {
      '/api': {
        target: 'https://beta-api.ead.jamyido.cn',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['dist/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'coverage/**',
        'data/**',
        'dist/**',
        'node_modules/**',
        'scripts/**',
        'tests/**',
        '**/*.json',
        '**/*.png',
        'src/main.ts',
        'src/vite-env.d.ts',
      ],
    },
  },
})
