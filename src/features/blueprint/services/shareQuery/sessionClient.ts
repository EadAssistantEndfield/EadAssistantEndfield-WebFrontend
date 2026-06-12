const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

export interface SessionSnapshot {
  session_id: string
  ready: boolean
  stage: string
  qrcode_url?: string
  scan_url?: string
  session_closed?: boolean
  error?: string | null
}

export interface SessionPassportCredentialsResponse {
  available?: boolean
  token?: string
  device_token?: string
}

export function resolveApiUrl(path: string): string {
  if (path.startsWith('http')) {
    return path
  }

  const base = API_BASE || ''
  if (!base) {
    return path
  }

  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return `${normalizedBase}${normalizedPath}`
}
