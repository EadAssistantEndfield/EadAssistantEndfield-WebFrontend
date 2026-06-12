import type { UiMessageKey } from '@/features/blueprint/i18n/messages'
import {
  clearStoredPassportCredentials,
  loadStoredPassportCredentials,
  storePassportCredentials,
  type SessionPassportCredentials,
} from '@/features/blueprint/services/shareQuery/passportCredentials'
import {
  resolveApiUrl,
  type SessionPassportCredentialsResponse,
  type SessionSnapshot,
} from '@/features/blueprint/services/shareQuery/sessionClient'
import {
  pollUntilReady,
  waitForSessionScanUrl,
  waitWithAbort,
} from '@/features/blueprint/services/shareQuery/sessionPolling'

export type QueryStage = 'idle' | 'checking_cache' | 'creating_session' | 'waiting_scan' | 'querying'

export interface SessionLifecycleContext {
  sessionId: string | null
}

type Translate = (key: UiMessageKey) => string

interface SessionLifecycleOptions {
  signal: AbortSignal
  translate: Translate
  setStage: (stage: QueryStage) => void
  setQrCodeFromScanUrl: (scanUrl: string) => Promise<void>
}

const SESSION_CREDENTIALS_READY_TIMEOUT_MS = 30 * 1000
const SESSION_CREDENTIALS_BACKGROUND_TIMEOUT_MS = 1000
const SESSION_CREDENTIALS_POLL_INTERVAL_MS = 500
const SESSION_STOP_TIMEOUT_MS = 5 * 1000

export function isAbortError(error: unknown, signal: AbortSignal): boolean {
  return signal.aborted || (error instanceof DOMException && error.name === 'AbortError')
}

function isStoredCredentialRejection(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return ['credential', 'passport', 'token', 'expired', 'unauthorized', 'forbidden', 'invalid'].some((marker) =>
    message.includes(marker),
  )
}

async function stopSession(sessionId: string): Promise<void> {
  const controller = new AbortController()
  const timer = setTimeout(() => {
    controller.abort()
  }, SESSION_STOP_TIMEOUT_MS)

  try {
    await fetch(resolveApiUrl(`/api/v1/sessions/${sessionId}/stop`), {
      method: 'POST',
      signal: controller.signal,
    })
  } catch {
    // Closing the backend session is best-effort cleanup.
  } finally {
    clearTimeout(timer)
  }
}

export async function stopQuerySession(query: SessionLifecycleContext | null): Promise<void> {
  if (!query) {
    return
  }

  const sessionId = query.sessionId
  query.sessionId = null

  if (!sessionId) {
    return
  }

  await stopSession(sessionId)
}

export async function syncPassportCredentials(sessionId: string, signal: AbortSignal): Promise<void> {
  try {
    const deadline = Date.now() + SESSION_CREDENTIALS_READY_TIMEOUT_MS

    while (!signal.aborted) {
      if (Date.now() >= deadline) {
        return
      }

      let data: SessionPassportCredentialsResponse | null = null
      try {
        const response = await fetch(resolveApiUrl(`/api/v1/sessions/${sessionId}/passport-credentials`), { signal })
        if (response.ok) {
          data = await response.json()
        }
      } catch {
        // Network error - retry after interval.
      }

      if (data && data.available && data.token && data.device_token) {
        storePassportCredentials({
          token: data.token,
          deviceToken: data.device_token,
        })
        return
      }

      const didWait = await waitWithAbort(SESSION_CREDENTIALS_POLL_INTERVAL_MS, signal)
      if (!didWait || signal.aborted) {
        return
      }
    }
  } catch {
    // Persisting passport credentials is best-effort and should not break the query flow.
  }
}

export function refreshPassportCredentialsInBackground(sessionId: string, parentSignal: AbortSignal) {
  if (parentSignal.aborted) {
    return
  }

  const controller = new AbortController()
  const timer = setTimeout(() => {
    controller.abort()
  }, SESSION_CREDENTIALS_BACKGROUND_TIMEOUT_MS)

  const onParentAbort = () => {
    controller.abort()
  }

  parentSignal.addEventListener('abort', onParentAbort, { once: true })
  void syncPassportCredentials(sessionId, controller.signal).finally(() => {
    clearTimeout(timer)
    parentSignal.removeEventListener('abort', onParentAbort)
  })
}

export async function createFreshSession(
  query: SessionLifecycleContext,
  options: SessionLifecycleOptions,
): Promise<{
  sessionId: string
  usedStoredCredentials: boolean
  requiredScan: boolean
}> {
  const storedCredentials = loadStoredPassportCredentials()

  if (!storedCredentials) {
    return createSessionAndWait(query, options, null)
  }

  try {
    return await createSessionAndWait(query, options, storedCredentials)
  } catch (error) {
    await stopQuerySession(query)
    if (isAbortError(error, options.signal)) {
      throw error
    }

    if (isStoredCredentialRejection(error)) {
      clearStoredPassportCredentials()
    }

    return createSessionAndWait(query, options, null)
  }
}

async function createSessionAndWait(
  query: SessionLifecycleContext,
  options: SessionLifecycleOptions,
  credentials: SessionPassportCredentials | null,
): Promise<{ sessionId: string; usedStoredCredentials: boolean; requiredScan: boolean }> {
  const { signal, translate, setStage, setQrCodeFromScanUrl } = options

  setStage('creating_session')
  const sessionResponse = await fetch(resolveApiUrl('/api/v1/sessions'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: 'web_query',
      server_id: 'web',
      ...(credentials
        ? {
            passport_token: credentials.token,
            passport_device_token: credentials.deviceToken,
          }
        : {}),
      enabled_plugins: ['blueprint-query'],
    }),
    signal,
  })

  if (!sessionResponse.ok) {
    throw new Error(translate('querySessionError'))
  }

  const session: SessionSnapshot = await sessionResponse.json()
  const sessionId = session.session_id
  query.sessionId = sessionId

  if (signal.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }

  if (session.session_closed || session.error) {
    throw new Error(session.error ?? translate('querySessionError'))
  }

  if (session.ready) {
    return {
      sessionId,
      usedStoredCredentials: Boolean(credentials),
      requiredScan: false,
    }
  }

  setStage('waiting_scan')
  if (session.scan_url) {
    await setQrCodeFromScanUrl(session.scan_url)
  } else {
    await waitForSessionScanUrl(sessionId, {
      signal,
      translate,
      onScanUrl: setQrCodeFromScanUrl,
    })
  }

  if (signal.aborted) {
    return {
      sessionId,
      usedStoredCredentials: Boolean(credentials),
      requiredScan: true,
    }
  }

  await pollUntilReady(sessionId, {
    signal,
    translate,
    onScanUrl: setQrCodeFromScanUrl,
  })

  return {
    sessionId,
    usedStoredCredentials: Boolean(credentials),
    requiredScan: true,
  }
}

export async function queryBlueprint(
  sessionId: string,
  shareCode: string,
  options: Pick<SessionLifecycleOptions, 'signal' | 'translate' | 'setStage'>,
): Promise<unknown> {
  const { signal, translate, setStage } = options

  setStage('querying')
  const response = await fetch(resolveApiUrl('/api/v1/blueprints/query'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      share_code: shareCode,
      timeout: 30,
    }),
    signal,
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    let errorMsg = translate('queryErrorNetwork')
    try {
      const parsed = JSON.parse(errorBody)
      if (parsed.error) {
        errorMsg = parsed.error
      }
    } catch {
      // Use default error message.
    }
    throw new Error(errorMsg)
  }

  return response.json()
}
