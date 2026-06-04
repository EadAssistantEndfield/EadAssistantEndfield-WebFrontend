import { getBlueprintCacheEnv, getSupabaseClient, isBlueprintCacheReadEnabled } from './supabaseClient'
import { normalizeShareCode } from './shareCode'

interface BlueprintCacheRow {
  share_code: string
  raw_response: unknown
  last_refreshed_at: string | null
  expires_at: string | null
}

export interface BlueprintCacheHit {
  shareCode: string
  rawResponse: { blueprint_data: unknown; share_code?: string }
  lastRefreshedAt: string | null
  expiresAt: string | null
}

export interface BlueprintCacheWriteInput {
  shareCode: string
  rawResponse: { blueprint_data: unknown; share_code?: string }
}

function hasBlueprintData(value: unknown): value is { blueprint_data: unknown; share_code?: string } {
  return Boolean(value && typeof value === 'object' && 'blueprint_data' in value)
}

function isExpired(expiresAt: string | null): boolean {
  return Boolean(expiresAt && Date.parse(expiresAt) <= Date.now())
}

export { isBlueprintCacheReadEnabled }

export async function getCachedBlueprint(shareCode: string): Promise<BlueprintCacheHit | null> {
  const normalizedShareCode = normalizeShareCode(shareCode)
  const client = getSupabaseClient()
  if (!client) {
    return null
  }

  const { data, error } = await client
    .from('blueprint_cache')
    .select('share_code, raw_response, last_refreshed_at, expires_at')
    .eq('share_code', normalizedShareCode)
    .eq('status', 'ready')
    .maybeSingle<BlueprintCacheRow>()

  if (error) {
    throw new Error(`BLUEPRINT_CACHE_READ_FAILED:${error.message}`)
  }

  if (!data || isExpired(data.expires_at) || !hasBlueprintData(data.raw_response)) {
    return null
  }

  return {
    shareCode: data.share_code,
    rawResponse: data.raw_response,
    lastRefreshedAt: data.last_refreshed_at,
    expiresAt: data.expires_at,
  }
}

export async function storeBlueprintCache(input: BlueprintCacheWriteInput): Promise<boolean> {
  const env = getBlueprintCacheEnv()
  if (!env.enabled || !env.writeEndpoint) {
    return false
  }

  const normalizedShareCode = normalizeShareCode(input.shareCode)
  const response = await fetch(env.writeEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      share_code: normalizedShareCode,
      raw_response: input.rawResponse,
    }),
  })

  return response.ok
}
