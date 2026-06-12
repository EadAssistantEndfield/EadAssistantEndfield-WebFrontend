import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
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
        'src/app/main.ts',
        'src/vite-env.d.ts',
      ],
    },
  },
})
