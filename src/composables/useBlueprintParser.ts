import { computed, ref } from 'vue'
import type { UiMessageKey } from '@/i18n/messages'
import { summarizeBlueprint } from '@/utils/blueprint'
import type { BlueprintSummary } from '@/types'
import QRCode from 'qrcode'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

export type QueryStage = 'idle' | 'creating_session' | 'waiting_scan' | 'querying'

const defaultJson = `{
  "share_code": "demo",
  "blueprint_data": {
    "name": "示例蓝图",
    "desc": "可直接粘贴真实 JSON 替换",
    "bp_size": { "x_len": 6, "z_len": 6 },
    "review_status_name": "Demo",
    "bp_param": { "source_type_name": "Local" },
    "nodes": [
      { "node_id": 1, "template_id": "power_station_1", "transform": { "position": { "x": 1, "y": 0, "z": 1 }, "has_interactive_param": true, "interactive_param": { "position": { "x": 1, "y": 0, "z": 1 }, "rotation": { "x": 0, "y": 0, "z": 0 }, "properties": {}, "property_count": 0 }, "snap_hint": { "mode": "grid_aligned_with_interactive_pose", "uses_grid_transform": true, "uses_interactive_param": true } }, "components": [] },
      { "node_id": 2, "template_id": "grid_belt_01", "transform": { "position": { "x": 2, "y": 0, "z": 1 }, "has_interactive_param": true, "interactive_param": { "position": { "x": 2, "y": 0, "z": 1 }, "rotation": { "x": 0, "y": 0, "z": 0 }, "properties": {}, "property_count": 0 }, "snap_hint": { "mode": "conveyor_path", "uses_grid_transform": false, "uses_interactive_param": false } }, "components": [] },
      { "node_id": 3, "template_id": "furnance_1", "product_icon": "item_carbon_enr", "transform": { "position": { "x": 3, "y": 0, "z": 1 }, "has_interactive_param": true, "interactive_param": { "position": { "x": 3, "y": 0, "z": 1 }, "rotation": { "x": 0, "y": 180, "z": 0 }, "properties": {}, "property_count": 0 }, "snap_hint": { "mode": "grid_aligned_with_interactive_pose", "uses_grid_transform": true, "uses_interactive_param": true } }, "components": [{ "payload_type": "formula_man" }] }
    ]
  }
}`

type Translate = (key: UiMessageKey) => string

interface SessionSnapshot {
  session_id: string
  ready: boolean
  stage: string
  qrcode_url?: string
  scan_url?: string
  session_closed?: boolean
  error?: string | null
}

const SESSION_READY_TIMEOUT_MS = 2 * 60 * 1000
const INITIAL_POLL_INTERVAL_MS = 1500
const MAX_POLL_INTERVAL_MS = 5000

function resolveApiUrl(path: string): string {
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

async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 256,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  })
}

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

export function useBlueprintParser(t: Translate) {
  const rawText = ref(defaultJson)
  const sourceName = ref('demo.json')
  const summary = ref<BlueprintSummary | null>(null)
  const errorKey = ref<UiMessageKey | null>(null)
  const errorFallback = ref('')
  const queryLoading = ref(false)
  const queryStage = ref<QueryStage>('idle')
  const qrcodeUrl = ref('')

  let pollAbortController: AbortController | null = null
  let cachedSessionId: string | null = null

  const errorMessage = computed(() => {
    if (errorKey.value) {
      return t(errorKey.value)
    }

    return errorFallback.value
  })

  function localizeError(error: unknown) {
    if (!(error instanceof Error)) {
      errorKey.value = 'parseError'
      errorFallback.value = ''
      return
    }

    if (error.message === 'MISSING_BLUEPRINT_DATA') {
      errorKey.value = 'missingBlueprintData'
      errorFallback.value = ''
      return
    }

    if (error.message === 'QUERY_SESSION_TIMEOUT') {
      errorKey.value = 'querySessionTimeout'
      errorFallback.value = ''
      return
    }

    errorKey.value = null
    errorFallback.value = error.message || t('parseError')
  }

  function resetQueryState() {
    queryStage.value = 'idle'
    qrcodeUrl.value = ''
    if (pollAbortController) {
      pollAbortController.abort()
      pollAbortController = null
    }
  }

  async function pollUntilReady(
    sessionId: string,
    signal: AbortSignal,
  ): Promise<void> {
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

  async function getReadySessionId(signal: AbortSignal): Promise<string | null> {
    if (!cachedSessionId) {
      return null
    }

    try {
      const response = await fetch(resolveApiUrl(`/api/v1/sessions/${cachedSessionId}`), { signal })
      if (!response.ok) {
        cachedSessionId = null
        return null
      }

      const session: SessionSnapshot = await response.json()
      if (session.ready && !session.session_closed) {
        return cachedSessionId
      }

      cachedSessionId = null
    } catch {
      cachedSessionId = null
    }

    return null
  }

  async function createSessionAndWait(signal: AbortSignal): Promise<string> {
    queryStage.value = 'creating_session'
    const sessionResponse = await fetch(resolveApiUrl('/api/v1/sessions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'web_query',
        server_id: 'web',
        enabled_plugins: ['blueprint-query'],
      }),
      signal,
    })

    if (!sessionResponse.ok) {
      throw new Error(t('querySessionError'))
    }

    const session: SessionSnapshot = await sessionResponse.json()
    const sessionId = session.session_id

    // Wait for login task to initialize
    queryStage.value = 'waiting_scan'
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (signal.aborted) {
      return sessionId
    }

    // Fetch session to get scan_url for QR code generation
    const pollResponse = await fetch(resolveApiUrl(`/api/v1/sessions/${sessionId}`), { signal })
    if (pollResponse.ok) {
      const pollData: SessionSnapshot = await pollResponse.json()
      if (pollData.scan_url) {
        qrcodeUrl.value = await generateQrDataUrl(pollData.scan_url)
      }
    }

    // Wait for user to scan QR code
    await pollUntilReady(sessionId, signal)

    cachedSessionId = sessionId
    return sessionId
  }

  async function loadFromShareCode(shareCode: string) {
    queryLoading.value = true
    errorKey.value = null
    errorFallback.value = ''
    resetQueryState()

    pollAbortController = new AbortController()
    const { signal } = pollAbortController

    try {
      // Step 1: Try to reuse existing session
      let sessionId = await getReadySessionId(signal)

      // Step 2: If no valid session, create one and wait for QR scan
      if (!sessionId) {
        sessionId = await createSessionAndWait(signal)
      }

      if (signal.aborted) {
        return
      }

      // Step 3: Query blueprint
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
          // use default error message
        }
        throw new Error(errorMsg)
      }

      const data = await bpResponse.json()
      if (!data.blueprint_data) {
        throw new Error(t('queryErrorNoData'))
      }

      sourceName.value = shareCode
      rawText.value = JSON.stringify(data)
      rebuildSummary()
    } catch (error) {
      if (signal.aborted) {
        return
      }

      summary.value = null
      localizeError(error)
    } finally {
      queryLoading.value = false
      queryStage.value = 'idle'
      qrcodeUrl.value = ''
      pollAbortController = null
    }
  }

  function cancelQuery() {
    resetQueryState()
    queryLoading.value = false
  }

  function rebuildSummary() {
    try {
      summary.value = summarizeBlueprint(rawText.value, sourceName.value)
      errorKey.value = null
      errorFallback.value = ''
    } catch (error) {
      summary.value = null
      localizeError(error)
    }
  }

  async function loadFile(file: File) {
    sourceName.value = file.name
    const text = await file.text()
    try {
      const parsed = JSON.parse(text)
      // If the file is already in { share_code, blueprint_data } format, use as-is
      if (parsed && typeof parsed === 'object' && 'blueprint_data' in parsed) {
        rawText.value = text
      } else if (parsed && typeof parsed === 'object' && 'nodes' in parsed) {
        // Bare blueprint data — wrap it
        rawText.value = JSON.stringify({ share_code: '', blueprint_data: parsed })
      } else {
        rawText.value = text
      }
    } catch {
      rawText.value = text
    }
    rebuildSummary()
  }

  rebuildSummary()

  return {
    rawText,
    sourceName,
    summary,
    errorMessage,
    rebuildSummary,
    loadFile,
    queryLoading,
    queryStage,
    qrcodeUrl,
    loadFromShareCode,
    cancelQuery,
  }
}
