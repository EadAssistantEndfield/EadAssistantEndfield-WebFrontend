/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_PUBLIC_BASE_PATH?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
  readonly VITE_BLUEPRINT_CACHE_ENABLED?: string
  readonly VITE_BLUEPRINT_CACHE_WRITE_ENDPOINT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
