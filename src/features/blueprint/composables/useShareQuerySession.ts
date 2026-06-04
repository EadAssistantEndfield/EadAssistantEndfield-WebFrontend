import { ref } from 'vue'
import type { UiMessageKey } from '@/features/blueprint/i18n/messages'
import {
  clearStoredPassportCredentials,
  loadStoredPassportCredentials,
  storePassportCredentials,
  type SessionPassportCredentials,
} from '@/features/blueprint/services/shareQuery/passportCredentials'
import { generateQrDataUrl } from '@/features/blueprint/services/shareQuery/qrcodeService'
import {
  resolveApiUrl,
  type SessionPassportCredentialsResponse,
  type SessionSnapshot,
} from '@/features/blueprint/services/shareQuery/sessionClient'

export type QueryStage = 'idle' | 'checking_cache' | 'creating_session' | 'waiting_scan' | 'querying'

type Translate = (key: UiMessageKey) => string

const SESSION_READY_TIMEOUT_MS = 2 * 60 * 1000
const SESSION_CREDENTIALS_READY_TIMEOUT_MS = 30 * 1000
const SESSION_CREDENTIALS_BACKGROUND_TIMEOUT_MS = 1000
const SESSION_CREDENTIALS_POLL_INTERVAL_MS = 500
const SESSION_STOP_TIMEOUT_MS = 5 * 1000
const INITIAL_POLL_INTERVAL_MS = 1500
const MAX_POLL_INTERVAL_MS = 5000

function waitWithAbort(ms: number, signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve(false)
      return
    }

    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve(true)
    }, ms)

    const onAbort = () => {
      clearTimeout(timer)
      signal.removeEventListener('abort', onAbort)
      resolve(false)
    }

    signal.addEventListener('abort', onAbort, { once: true })
  })
}

function isAbortError(error: unknown, signal: AbortSignal): boolean {
  return signal.aborted || (error instanceof DOMException && error.name === 'AbortError')
}

export function useShareQuerySession(t: Translate) {
  const queryLoading = ref(false)
  const queryStage = ref<QueryStage>('idle')
  const qrcodeUrl = ref('')

  let pollAbortController: AbortController | null = null
  let activeSessionId: string | null = null

  function resetQueryState() {
    queryStage.value = 'idle'
    qrcodeUrl.value = ''
    if (pollAbortController) {
      pollAbortController.abort()
      pollAbortController = null
    }
    void stopActiveSession()
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

  async function stopActiveSession(): Promise<void> {
    const sessionId = activeSessionId
    activeSessionId = null

    if (!sessionId) {
      return
    }

    await stopSession(sessionId)
  }

  async function pollUntilReady(sessionId: string, signal: AbortSignal): Promise<void> {
    const deadline = Date.now() + SESSION_READY_TIMEOUT_MS
    let pollInterval = INITIAL_POLL_INTERVAL_MS

    while (!signal.aborted) {
      const remaining = deadline - Date.now()
      if (remaining <= 0) {
        throw new Error('QUERY_SESSION_TIMEOUT')
      }

      const didWait = await waitWithAbort(Math.min(pollInterval, remaining), signal)

      if (!didWait || signal.aborted) {
        return
      }

      const response = await fetch(resolveApiUrl(`/api/v1/sessions/${sessionId}`), { signal })
      if (!response.ok) {
        throw new Error(t('querySessionError'))
      }

      const session: SessionSnapshot = await response.json()

      if (session.session_closed || session.error) {
        throw new Error(session.error ?? t('querySessionError'))
      }

      if (session.scan_url && !qrcodeUrl.value) {
        qrcodeUrl.value = await generateQrDataUrl(session.scan_url)
      }

      if (session.ready) {
        return
      }

      pollInterval = Math.min(MAX_POLL_INTERVAL_MS, Math.round(pollInterval * 1.5))
    }
  }

  async function syncPassportCredentials(sessionId: string, signal: AbortSignal): Promise<void> {
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
      return
    }
  }

  function refreshPassportCredentialsInBackground(sessionId: string, parentSignal: AbortSignal) {
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

  async function createFreshSession(signal: AbortSignal): Promise<{
    sessionId: string
    usedStoredCredentials: boolean
    requiredScan: boolean
  }> {
    const storedCredentials = loadStoredPassportCredentials()

    if (!storedCredentials) {
      return createSessionAndWait(signal, null)
    }

    try {
      return await createSessionAndWait(signal, storedCredentials)
    } catch {
      clearStoredPassportCredentials()
      await stopActiveSession()
      if (signal.aborted) {
        throw new Error('QUERY_ABORTED')
      }

      return createSessionAndWait(signal, null)
    }
  }

  async function createSessionAndWait(
    signal: AbortSignal,
    credentials: SessionPassportCredentials | null,
  ): Promise<{ sessionId: string; usedStoredCredentials: boolean; requiredScan: boolean }> {
    queryStage.value = 'creating_session'
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
      throw new Error(t('querySessionError'))
    }

    const session: SessionSnapshot = await sessionResponse.json()
    if (session.session_closed || session.error) {
      throw new Error(session.error ?? t('querySessionError'))
    }

    const sessionId = session.session_id
    activeSessionId = sessionId

    if (session.ready) {
      return {
        sessionId,
        usedStoredCredentials: Boolean(credentials),
        requiredScan: false,
      }
    }

    queryStage.value = 'waiting_scan'
    if (session.scan_url) {
      qrcodeUrl.value = await generateQrDataUrl(session.scan_url)
    } else {
      const scanDeadline = Date.now() + 10 * 1000
      while (!signal.aborted && Date.now() < scanDeadline) {
        const didWait = await waitWithAbort(500, signal)
        if (!didWait || signal.aborted) {
          break
        }

        const pollResponse = await fetch(resolveApiUrl(`/api/v1/sessions/${sessionId}`), { signal })
        if (pollResponse.ok) {
          const pollData: SessionSnapshot = await pollResponse.json()
          if (pollData.scan_url) {
            qrcodeUrl.value = await generateQrDataUrl(pollData.scan_url)
            break
          }
          if (pollData.ready || pollData.session_closed || pollData.error) {
            break
          }
        }
      }
    }

    if (signal.aborted) {
      return {
        sessionId,
        usedStoredCredentials: Boolean(credentials),
        requiredScan: true,
      }
    }

    await pollUntilReady(sessionId, signal)

    return {
      sessionId,
      usedStoredCredentials: Boolean(credentials),
      requiredScan: true,
    }
  }

  async function queryBlueprint(sessionId: string, shareCode: string, signal: AbortSignal): Promise<unknown> {
    queryStage.value = 'querying'
    const bpResponse = await fetch(resolveApiUrl('/api/v1/blueprints/query'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        share_code: shareCode,
        timeout: 30,
      }),
      signal,
    })

    if (!bpResponse.ok) {
      const errorBody = await bpResponse.text().catch(() => '')
      let errorMsg = t('queryErrorNetwork')
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

    return bpResponse.json()
  }

  async function loadBlueprintFromShareCode(shareCode: string): Promise<unknown | null> {
    queryLoading.value = true
    resetQueryState()

    pollAbortController = new AbortController()
    const { signal } = pollAbortController

    try {
      const session = await createFreshSession(signal)

      if (signal.aborted) {
        throw new DOMException('Aborted', 'AbortError')
      }

      if (session.requiredScan) {
        const oldCredentials = loadStoredPassportCredentials()
        await syncPassportCredentials(session.sessionId, signal)

        const newCredentials = loadStoredPassportCredentials()
        if (session.usedStoredCredentials && (!newCredentials || newCredentials.token === oldCredentials?.token)) {
          clearStoredPassportCredentials()
        }
      } else {
        refreshPassportCredentialsInBackground(session.sessionId, signal)
      }

      if (signal.aborted) {
        throw new DOMException('Aborted', 'AbortError')
      }

      return await queryBlueprint(session.sessionId, shareCode, signal)
    } catch (error) {
      if (isAbortError(error, signal)) {
        return null
      }

      throw error
    } finally {
      queryLoading.value = false
      queryStage.value = 'idle'
      qrcodeUrl.value = ''
      pollAbortController = null
      await stopActiveSession()
    }
  }

  function cancelQuery() {
    resetQueryState()
    queryLoading.value = false
  }

  return {
    queryLoading,
    queryStage,
    qrcodeUrl,
    loadBlueprintFromShareCode,
    cancelQuery,
  }
}
