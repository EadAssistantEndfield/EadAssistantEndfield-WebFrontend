import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn(async (text: string) => `qr:${text}`),
  },
}))

import { useBlueprintParser } from '@/composables/useBlueprintParser'

function makeTranslator(key: string) {
  return key
}

function makeBlueprintResponse(shareCode: string) {
  return {
    share_code: shareCode,
    blueprint_data: {
      name: 'Test Blueprint',
      desc: 'session cleanup',
      bp_size: { x_len: 6, z_len: 6 },
      review_status_name: 'Reviewed',
      bp_param: { source_type_name: 'Remote' },
      nodes: [
        {
          node_id: 1,
          template_id: 'power_station_1',
          transform: {
            position: { x: 1, y: 0, z: 1 },
            has_interactive_param: true,
            interactive_param: {
              position: { x: 1, y: 0, z: 1 },
              rotation: { x: 0, y: 0, z: 0 },
              properties: {},
              property_count: 0,
            },
          },
          components: [],
        },
      ],
    },
  }
}

function makeJsonResponse(body: unknown, ok = true): Response {
  return {
    ok,
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
  } as unknown as Response
}

function parseRequestBody(callIndex: number, fetchMock: ReturnType<typeof vi.fn>) {
  const [, init] = fetchMock.mock.calls[callIndex] as [string, RequestInit]
  return JSON.parse(String(init.body))
}

function createCookieJar(initialCookies: Record<string, string> = {}) {
  const jar = new Map(Object.entries(initialCookies))

  const documentStub = {}
  Object.defineProperty(documentStub, 'cookie', {
    configurable: true,
    get() {
      return Array.from(jar.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join('; ')
    },
    set(value: string) {
      const [pair, ...attributes] = value.split(';').map((part) => part.trim())
      const separatorIndex = pair.indexOf('=')
      const name = pair.slice(0, separatorIndex)
      const cookieValue = pair.slice(separatorIndex + 1)
      const maxAge = attributes.find((attribute) => attribute.toLowerCase().startsWith('max-age='))

      if (maxAge && Number(maxAge.split('=')[1]) <= 0) {
        jar.delete(name)
        return
      }

      jar.set(name, cookieValue)
    },
  })

  vi.stubGlobal('document', documentStub as Document)
  vi.stubGlobal('window', { location: { protocol: 'https:' } })

  return {
    get(name: string) {
      return jar.get(name) ?? null
    },
  }
}

describe('useBlueprintParser session credentials', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    vi.useFakeTimers()
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('stores passport credentials in a cookie after a QR login completes', async () => {
    const cookieJar = createCookieJar()

    fetchMock
      .mockResolvedValueOnce(
        makeJsonResponse({
          session_id: 'session-1',
          ready: false,
          stage: 'waiting_scan',
        }),
      )
      .mockResolvedValueOnce(
        makeJsonResponse({
          session_id: 'session-1',
          ready: false,
          stage: 'waiting_scan',
          scan_url: 'https://scan.example/session-1',
        }),
      )
      .mockResolvedValueOnce(
        makeJsonResponse({
          session_id: 'session-1',
          ready: true,
          stage: 'ready',
          scan_url: 'https://scan.example/session-1',
        }),
      )
      .mockResolvedValueOnce(
        makeJsonResponse({
          session_id: 'session-1',
          available: true,
          token: 'passport-1',
          device_token: 'device-1',
        }),
      )
      .mockResolvedValueOnce(makeJsonResponse(makeBlueprintResponse('share-123')))
      .mockResolvedValueOnce(makeJsonResponse({ session_id: 'session-1', stage: 'stopped' }))

    const parser = useBlueprintParser(makeTranslator)
    const loadPromise = parser.loadFromShareCode('share-123')

    await vi.advanceTimersByTimeAsync(2500)
    await loadPromise

    expect(parseRequestBody(0, fetchMock)).toEqual({
      user_id: 'web_query',
      server_id: 'web',
      enabled_plugins: ['blueprint-query'],
    })
    expect(fetchMock).toHaveBeenNthCalledWith(4, '/api/v1/sessions/session-1/passport-credentials', {
      signal: expect.any(AbortSignal),
    })
    expect(fetchMock).toHaveBeenNthCalledWith(
      6,
      '/api/v1/sessions/session-1/stop',
      expect.objectContaining({
        method: 'POST',
      }),
    )
    expect(cookieJar.get('ead_passport_credentials')).toBe(
      encodeURIComponent(JSON.stringify({ token: 'passport-1', deviceToken: 'device-1' })),
    )
    expect(parser.sourceName.value).toBe('share-123')
    expect(parser.summary.value?.shareCode).toBe('share-123')
  })

  it('reuses cookie-backed passport credentials to skip QR scanning', async () => {
    const cookieJar = createCookieJar({
      ead_passport_credentials: encodeURIComponent(
        JSON.stringify({ token: 'saved-token', deviceToken: 'saved-device' }),
      ),
    })

    fetchMock
      .mockResolvedValueOnce(
        makeJsonResponse({
          session_id: 'session-2',
          ready: true,
          stage: 'ready',
        }),
      )
      .mockResolvedValueOnce(makeJsonResponse(makeBlueprintResponse('share-456')))
      .mockResolvedValueOnce(makeJsonResponse({ session_id: 'session-2', stage: 'stopped' }))

    const parser = useBlueprintParser(makeTranslator)
    await parser.loadFromShareCode('share-456')

    expect(parseRequestBody(0, fetchMock)).toEqual({
      user_id: 'web_query',
      server_id: 'web',
      passport_token: 'saved-token',
      passport_device_token: 'saved-device',
      enabled_plugins: ['blueprint-query'],
    })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(cookieJar.get('ead_passport_credentials')).toBe(
      encodeURIComponent(JSON.stringify({ token: 'saved-token', deviceToken: 'saved-device' })),
    )
    expect(parser.qrcodeUrl.value).toBe('')
  })

  it('drops stale cookie credentials and falls back to a fresh QR login', async () => {
    const cookieJar = createCookieJar({
      ead_passport_credentials: encodeURIComponent(
        JSON.stringify({ token: 'stale-token', deviceToken: 'stale-device' }),
      ),
    })

    fetchMock
      .mockResolvedValueOnce(
        makeJsonResponse({
          session_id: 'session-stale',
          ready: false,
          stage: 'waiting_scan',
          error: 'expired credentials',
        }),
      )
      .mockResolvedValueOnce(
        makeJsonResponse({
          session_id: 'session-3',
          ready: false,
          stage: 'waiting_scan',
          scan_url: 'https://scan.example/session-3',
        }),
      )
      .mockResolvedValueOnce(
        makeJsonResponse({
          session_id: 'session-3',
          ready: true,
          stage: 'ready',
          scan_url: 'https://scan.example/session-3',
        }),
      )
      .mockResolvedValueOnce(
        makeJsonResponse({
          session_id: 'session-3',
          available: true,
          token: 'fresh-token',
          device_token: 'fresh-device',
        }),
      )
      .mockResolvedValueOnce(makeJsonResponse(makeBlueprintResponse('share-789')))
      .mockResolvedValueOnce(makeJsonResponse({ session_id: 'session-3', stage: 'stopped' }))

    const parser = useBlueprintParser(makeTranslator)
    const loadPromise = parser.loadFromShareCode('share-789')

    await vi.advanceTimersByTimeAsync(1500)
    await loadPromise

    expect(parseRequestBody(0, fetchMock)).toEqual({
      user_id: 'web_query',
      server_id: 'web',
      passport_token: 'stale-token',
      passport_device_token: 'stale-device',
      enabled_plugins: ['blueprint-query'],
    })
    expect(parseRequestBody(1, fetchMock)).toEqual({
      user_id: 'web_query',
      server_id: 'web',
      enabled_plugins: ['blueprint-query'],
    })
    expect(cookieJar.get('ead_passport_credentials')).toBe(
      encodeURIComponent(JSON.stringify({ token: 'fresh-token', deviceToken: 'fresh-device' })),
    )
    expect(parser.summary.value?.shareCode).toBe('share-789')
  })

  it('stops the backend session when the QR flow is cancelled', async () => {
    createCookieJar()

    fetchMock
      .mockResolvedValueOnce(
        makeJsonResponse({
          session_id: 'session-4',
          ready: false,
          stage: 'waiting_scan',
          scan_url: 'https://scan.example/session-4',
        }),
      )
      .mockResolvedValueOnce(makeJsonResponse({ session_id: 'session-4', stage: 'stopped' }))

    const parser = useBlueprintParser(makeTranslator)
    const loadPromise = parser.loadFromShareCode('share-000')

    parser.cancelQuery()
    await loadPromise

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/v1/sessions/session-4/stop',
      expect.objectContaining({
        method: 'POST',
      }),
    )
    expect(parser.queryLoading.value).toBe(false)
    expect(parser.queryStage.value).toBe('idle')
  })
})
