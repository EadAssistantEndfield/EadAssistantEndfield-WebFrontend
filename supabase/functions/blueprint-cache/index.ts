import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

const shareCodePattern = /^[A-Za-z0-9_-]{3,128}$/u

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

function normalizeShareCode(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('INVALID_SHARE_CODE')
  }

  const normalized = value.trim().replace(/\s+/gu, '')
  if (!shareCodePattern.test(normalized)) {
    throw new Error('INVALID_SHARE_CODE')
  }

  return normalized
}

function hasBlueprintData(value: unknown): value is { blueprint_data: unknown; share_code?: string } {
  return Boolean(value && typeof value === 'object' && 'blueprint_data' in value)
}

function isExpired(expiresAt: unknown): boolean {
  return typeof expiresAt === 'string' && Date.parse(expiresAt) <= Date.now()
}

async function sha256(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value))
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(500, { error: 'CACHE_SERVICE_NOT_CONFIGURED' })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  try {
    if (request.method === 'GET') {
      const url = new URL(request.url)
      const shareCode = normalizeShareCode(url.searchParams.get('share_code'))
      const { data, error } = await supabase
        .from('blueprint_cache')
        .select('share_code, raw_response, hit_count, last_refreshed_at, expires_at')
        .eq('share_code', shareCode)
        .eq('status', 'ready')
        .maybeSingle()

      if (error) {
        return jsonResponse(500, { error: error.message })
      }

      if (!data || isExpired(data.expires_at) || !hasBlueprintData(data.raw_response)) {
        return jsonResponse(404, { error: 'CACHE_MISS' })
      }

      const now = new Date().toISOString()
      await supabase
        .from('blueprint_cache')
        .update({
          hit_count: Number(data.hit_count ?? 0) + 1,
          last_accessed_at: now,
        })
        .eq('share_code', shareCode)

      return jsonResponse(200, {
        share_code: data.share_code,
        raw_response: data.raw_response,
        last_refreshed_at: data.last_refreshed_at,
        expires_at: data.expires_at,
      })
    }

    if (request.method === 'POST') {
      const writeSecret = Deno.env.get('BLUEPRINT_CACHE_WRITE_SECRET')
      const authorization = request.headers.get('Authorization')
      if (!writeSecret || authorization !== `Bearer ${writeSecret}`) {
        return jsonResponse(401, { error: 'UNAUTHORIZED_CACHE_WRITE' })
      }

      const body = await request.json()
      const shareCode = normalizeShareCode(body.share_code)
      const rawResponse = body.raw_response

      if (!hasBlueprintData(rawResponse)) {
        return jsonResponse(400, { error: 'MISSING_BLUEPRINT_DATA' })
      }

      const now = new Date().toISOString()
      const { error } = await supabase.from('blueprint_cache').upsert(
        {
          share_code: shareCode,
          raw_response: {
            ...rawResponse,
            share_code: rawResponse.share_code ?? shareCode,
          },
          source: 'upstream_api',
          status: 'ready',
          response_hash: await sha256(rawResponse),
          last_refreshed_at: now,
          updated_at: now,
        },
        { onConflict: 'share_code' },
      )

      if (error) {
        return jsonResponse(500, { error: error.message })
      }

      await supabase.from('blueprint_cache_events').insert({
        share_code: shareCode,
        event_type: 'cache_write',
        event_payload: { source: 'edge_function' },
      })

      return jsonResponse(200, { ok: true, share_code: shareCode })
    }

    return jsonResponse(405, { error: 'METHOD_NOT_ALLOWED' })
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_SHARE_CODE') {
      return jsonResponse(400, { error: 'INVALID_SHARE_CODE' })
    }

    return jsonResponse(500, {
      error: error instanceof Error ? error.message : 'UNKNOWN_CACHE_ERROR',
    })
  }
})
