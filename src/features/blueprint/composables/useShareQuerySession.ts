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
type QueryContext = {
  controller: AbortController
  sessionId: string | null
}

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

function isStoredCredentialRejection(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return ['credential', 'passport', 'token', 'expired', 'unauthorized', 'forbidden', 'invalid'].some((marker) =>
    message.includes(marker),
  )
}

export function useShareQuerySession(t: Translate) {
  const queryLoading = ref(false)
  const queryStage = ref<QueryStage>('idle')
  const qrcodeUrl = ref('')

  let activeQuery: QueryContext | null = null

  function isCurrentQuery(query: QueryContext, signal: AbortSignal): boolean {
    return activeQuery === query && !signal.aborted
  }

  function setQueryStage(query: QueryContext, signal: AbortSignal, stage: QueryStage) {
    if (isCurrentQuery(query, signal)) {
      queryStage.value = stage
    }
  }

  async function setQrCodeFromScanUrl(query: QueryContext, signal: AbortSignal, scanUrl: string) {
    const dataUrl = await generateQrDataUrl(scanUrl)
    if (isCurrentQuery(query, signal)) {
      qrcodeUrl.value = dataUrl
    }
  }

  function resetQueryState() {
    queryStage.value = 'idle'
    qrcodeUrl.value = ''
    const query = activeQuery
    if (query) {
      query.controller.abort()
      activeQuery = null
    }
    void stopQuerySession(query)
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

  async function stopQuerySession(query: QueryContext | null): Promise<void> {
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

  async function pollUntilReady(query: QueryContext, sessionId: string, signal: AbortSignal): Promise<void> {
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

      if (session.scan_url && !qrcodeUrl.value && isCurrentQuery(query, signal)) {
        await setQrCodeFromScanUrl(query, signal, session.scan_url)
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

  async function createFreshSession(query: QueryContext, signal: AbortSignal): Promise<{
    sessionId: string
    usedStoredCredentials: boolean
    requiredScan: boolean
  }> {
    const storedCredentials = loadStoredPassportCredentials()

    if (!storedCredentials) {
      return createSessionAndWait(query, signal, null)
    }

    try {
      return await createSessionAndWait(query, signal, storedCredentials)
    } catch (error) {
      await stopQuerySession(query)
      if (isAbortError(error, signal)) {
        throw error
      }

      if (isStoredCredentialRejection(error)) {
        clearStoredPassportCredentials()
      }

      return createSessionAndWait(query, signal, null)
    }
  }

  async function createSessionAndWait(
    query: QueryContext,
    signal: AbortSignal,
    credentials: SessionPassportCredentials | null,
  ): Promise<{ sessionId: string; usedStoredCredentials: boolean; requiredScan: boolean }> {
    setQueryStage(query, signal, 'creating_session')
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
    const sessionId = session.session_id
    query.sessionId = sessionId

    if (signal.aborted) {
      throw new DOMException('Aborted', 'AbortError')
    }

    if (session.session_closed || session.error) {
      throw new Error(session.error ?? t('querySessionError'))
    }

    if (session.ready) {
      return {
        sessionId,
        usedStoredCredentials: Boolean(credentials),
        requiredScan: false,
      }
    }

    setQueryStage(query, signal, 'waiting_scan')
    if (session.scan_url) {
      await setQrCodeFromScanUrl(query, signal, session.scan_url)
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
            await setQrCodeFromScanUrl(query, signal, pollData.scan_url)
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

    await pollUntilReady(query, sessionId, signal)

    return {
      sessionId,
      usedStoredCredentials: Boolean(credentials),
      requiredScan: true,
    }
  }

  async function queryBlueprint(
    query: QueryContext,
    sessionId: string,
    shareCode: string,
    signal: AbortSignal,
  ): Promise<unknown> {
    setQueryStage(query, signal, 'querying')
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

    const query: QueryContext = {
      controller: new AbortController(),
      sessionId: null,
    }
    activeQuery = query
    const { signal } = query.controller

    try {
      const session = await createFreshSession(query, signal)

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

      return await queryBlueprint(query, session.sessionId, shareCode, signal)
    } catch (error) {
      if (isAbortError(error, signal)) {
        return null
      }

      throw error
    } finally {
      if (activeQuery === query) {
        queryLoading.value = false
        queryStage.value = 'idle'
        qrcodeUrl.value = ''
        activeQuery = null
      }
      await stopQuerySession(query)
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
