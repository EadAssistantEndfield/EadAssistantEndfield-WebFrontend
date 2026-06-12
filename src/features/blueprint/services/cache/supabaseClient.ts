import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = 'https://bykzldmcqzgpmwjjpdtl.supabase.co'
const DISABLED_VALUES = new Set(['0', 'false', 'off', 'disabled'])

export interface BlueprintCacheEnv {
  enabled: boolean
  supabaseUrl: string
  publishableKey: string
  writeEndpoint: string
}

let cachedClient: { cacheKey: string; client: SupabaseClient } | null = null

function readEnv(name: keyof ImportMetaEnv): string {
  return String(import.meta.env[name] ?? '').trim()
}

export function getBlueprintCacheEnv(): BlueprintCacheEnv {
  const enabledValue = readEnv('VITE_BLUEPRINT_CACHE_ENABLED').toLowerCase()
  const supabaseUrl = readEnv('VITE_SUPABASE_URL') || DEFAULT_SUPABASE_URL
  const publishableKey = readEnv('VITE_SUPABASE_PUBLISHABLE_KEY')

  return {
    enabled: !DISABLED_VALUES.has(enabledValue),
    supabaseUrl,
    publishableKey,
    writeEndpoint: readEnv('VITE_BLUEPRINT_CACHE_WRITE_ENDPOINT'),
  }
}

export function isBlueprintCacheReadEnabled(): boolean {
  const env = getBlueprintCacheEnv()
  return env.enabled && Boolean(env.supabaseUrl && env.publishableKey)
}

export function getSupabaseClient(): SupabaseClient | null {
  const env = getBlueprintCacheEnv()
  if (!env.enabled || !env.supabaseUrl || !env.publishableKey) {
    return null
  }

  const cacheKey = `${env.supabaseUrl}:${env.publishableKey}`
  if (!cachedClient || cachedClient.cacheKey !== cacheKey) {
    cachedClient = {
      cacheKey,
      client: createClient(env.supabaseUrl, env.publishableKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }),
    }
  }

  return cachedClient.client
}
