export interface SessionPassportCredentials {
  token: string
  deviceToken: string
}

const PASSPORT_COOKIE_NAME = 'ead_passport_credentials'
const PASSPORT_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null
  }

  const prefix = `${name}=`
  const target = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))

  if (!target) {
    return null
  }

  return target.slice(prefix.length)
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === 'undefined') {
    return
  }

  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:'
  document.cookie = [
    `${name}=${value}`,
    'Path=/',
    `Max-Age=${maxAgeSeconds}`,
    'SameSite=Lax',
    secure ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ')
}

function clearCookie(name: string) {
  if (typeof document === 'undefined') {
    return
  }

  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`
}

export function loadStoredPassportCredentials(): SessionPassportCredentials | null {
  const raw = readCookie(PASSPORT_COOKIE_NAME)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(raw))
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.token === 'string' &&
      typeof parsed.deviceToken === 'string' &&
      parsed.token &&
      parsed.deviceToken
    ) {
      return {
        token: parsed.token,
        deviceToken: parsed.deviceToken,
      }
    }
  } catch {
    // Ignore malformed cookie values and fall back to QR login.
  }

  clearCookie(PASSPORT_COOKIE_NAME)
  return null
}

export function storePassportCredentials(credentials: SessionPassportCredentials) {
  writeCookie(
    PASSPORT_COOKIE_NAME,
    encodeURIComponent(JSON.stringify(credentials)),
    PASSPORT_COOKIE_MAX_AGE_SECONDS,
  )
}

export function clearStoredPassportCredentials() {
  clearCookie(PASSPORT_COOKIE_NAME)
}
