import type { UiMessageKey } from '@/features/blueprint/i18n/messages'
import { resolveApiUrl, type SessionSnapshot } from '@/features/blueprint/services/shareQuery/sessionClient'

type Translate = (key: UiMessageKey) => string

interface SessionPollingOptions {
  signal: AbortSignal
  translate: Translate
  onScanUrl?: (scanUrl: string) => Promise<void> | void
}

export const SESSION_READY_TIMEOUT_MS = 2 * 60 * 1000
const INITIAL_POLL_INTERVAL_MS = 1500
const MAX_POLL_INTERVAL_MS = 5000
const SCAN_URL_READY_TIMEOUT_MS = 10 * 1000
const SCAN_URL_POLL_INTERVAL_MS = 500

export function waitWithAbort(ms: number, signal: AbortSignal): Promise<boolean> {
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

export async function waitForSessionScanUrl(sessionId: string, options: SessionPollingOptions): Promise<void> {
  const { signal, onScanUrl } = options
  const scanDeadline = Date.now() + SCAN_URL_READY_TIMEOUT_MS

  while (!signal.aborted && Date.now() < scanDeadline) {
    const didWait = await waitWithAbort(SCAN_URL_POLL_INTERVAL_MS, signal)
    if (!didWait || signal.aborted) {
      break
    }

    const response = await fetch(resolveApiUrl(`/api/v1/sessions/${sessionId}`), { signal })
    if (!response.ok) {
      continue
    }

    const session: SessionSnapshot = await response.json()
    if (session.scan_url) {
      await onScanUrl?.(session.scan_url)
      break
    }

    if (session.ready || session.session_closed || session.error) {
      break
    }
  }
}

export async function pollUntilReady(sessionId: string, options: SessionPollingOptions): Promise<void> {
  const { signal, translate, onScanUrl } = options
  const deadline = Date.now() + SESSION_READY_TIMEOUT_MS
  let pollInterval = INITIAL_POLL_INTERVAL_MS
  let hasPublishedScanUrl = false

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
      throw new Error(translate('querySessionError'))
    }

    const session: SessionSnapshot = await response.json()

    if (session.session_closed || session.error) {
      throw new Error(session.error ?? translate('querySessionError'))
    }

    if (session.scan_url && !hasPublishedScanUrl) {
      hasPublishedScanUrl = true
      await onScanUrl?.(session.scan_url)
    }

    if (session.ready) {
      return
    }

    pollInterval = Math.min(MAX_POLL_INTERVAL_MS, Math.round(pollInterval * 1.5))
  }
}
