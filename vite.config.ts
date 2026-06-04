import { defineConfig } from 'vite-plus'
import { loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import type { ConfigEnv, PluginOption, UserConfig } from 'vite-plus'

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

export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
  const env = loadEnv(mode, process.cwd(), '')

  const config: UserConfig = {
    // Vite rewrites built asset URLs against `base`, which is required for subpath deployments.
    base: normalizePublicBasePath(env.VITE_PUBLIC_BASE_PATH),
    plugins: [vue() as unknown as PluginOption],
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
  }
  return config
})
