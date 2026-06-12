const SHARE_CODE_PATTERN = /^[A-Za-z0-9_-]{3,128}$/u
const SHARE_CODE_QUERY_KEYS = ['share_code', 'shareCode', 'code', 'bp', 'blueprint']

export const INVALID_SHARE_CODE_ERROR = 'INVALID_SHARE_CODE'

function isShareCodeCandidate(value: string): boolean {
  return SHARE_CODE_PATTERN.test(value)
}

function sanitizeCandidate(value: string): string {
  return value.trim().replace(/\s+/gu, '')
}

function extractFromUrl(value: string): string | null | undefined {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return undefined
  }

  for (const key of SHARE_CODE_QUERY_KEYS) {
    const queryValue = url.searchParams.get(key)
    if (queryValue) {
      return queryValue
    }
  }

  const pathCandidates = url.pathname
    .split('/')
    .map((part) => sanitizeCandidate(decodeURIComponent(part)))
    .filter(Boolean)
    .reverse()

  return pathCandidates.find(isShareCodeCandidate) ?? null
}

function extractFromText(value: string): string {
  const paramMatch = value.match(/(?:share_code|shareCode|code|bp|blueprint)=([^&\s]+)/u)
  if (paramMatch?.[1]) {
    return paramMatch[1]
  }

  const compact = sanitizeCandidate(value)
  if (isShareCodeCandidate(compact)) {
    return compact
  }

  const candidates = value.match(/[A-Za-z0-9][A-Za-z0-9_-]{2,127}/gu) ?? []
  return candidates.sort((left, right) => right.length - left.length)[0] ?? compact
}

export function normalizeShareCode(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) {
    throw new Error(INVALID_SHARE_CODE_ERROR)
  }

  const urlCandidate = extractFromUrl(trimmed)
  const extracted = urlCandidate === undefined ? extractFromText(trimmed) : urlCandidate
  const normalized = sanitizeCandidate(extracted ?? '')

  if (!isShareCodeCandidate(normalized)) {
    throw new Error(INVALID_SHARE_CODE_ERROR)
  }

  return normalized
}
