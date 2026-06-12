import { ref } from 'vue'
import type { UiMessageKey } from '@/features/blueprint/i18n/messages'
import {
  clearStoredPassportCredentials,
  loadStoredPassportCredentials,
} from '@/features/blueprint/services/shareQuery/passportCredentials'
import { generateQrDataUrl } from '@/features/blueprint/services/shareQuery/qrcodeService'
import {
  createFreshSession,
  isAbortError,
  queryBlueprint,
  refreshPassportCredentialsInBackground,
  stopQuerySession,
  syncPassportCredentials,
  type QueryStage,
  type SessionLifecycleContext,
} from '@/features/blueprint/services/shareQuery/sessionLifecycle'

type Translate = (key: UiMessageKey) => string
type QueryContext = SessionLifecycleContext & {
  controller: AbortController
}

export type { QueryStage } from '@/features/blueprint/services/shareQuery/sessionLifecycle'

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
    if (qrcodeUrl.value) {
      return
    }

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

  function createLifecycleOptions(query: QueryContext, signal: AbortSignal) {
    return {
      signal,
      translate: t,
      setStage: (stage: QueryStage) => setQueryStage(query, signal, stage),
      setQrCodeFromScanUrl: (scanUrl: string) => setQrCodeFromScanUrl(query, signal, scanUrl),
    }
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
    const lifecycleOptions = createLifecycleOptions(query, signal)

    try {
      const session = await createFreshSession(query, lifecycleOptions)

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

      return await queryBlueprint(session.sessionId, shareCode, lifecycleOptions)
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
