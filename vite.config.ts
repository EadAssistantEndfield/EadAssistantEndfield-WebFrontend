import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

function normalizePublicBasePath(rawBasePath?: string): string {
  const basePath = rawBasePath?.trim()

  if (!basePath || basePath === '/') {
    return '/'
  }

  if (basePath === '.' || basePath === './') {
    return './'
  }

  if (/^https?:\/\//i.test(basePath)) {
    return basePath.endsWith('/') ? basePath : `${basePath}/`
  }

  const withLeadingSlash = basePath.startsWith('/') ? basePath : `/${basePath}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    // Vite rewrites built asset URLs against `base`, which is required for subpath deployments.
    base: normalizePublicBasePath(env.VITE_PUBLIC_BASE_PATH),
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
  }
})
