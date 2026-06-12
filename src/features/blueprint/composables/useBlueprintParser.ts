import { computed, ref } from 'vue'
import type { UiMessageKey } from '@/features/blueprint/i18n/messages'
import { useShareQuerySession } from '@/features/blueprint/composables/useShareQuerySession'
import type { QueryStage } from '@/features/blueprint/composables/useShareQuerySession'
import { summarizeBlueprint } from '@/features/blueprint/domain/blueprint'
import {
  getCachedBlueprint,
  isBlueprintCacheReadEnabled,
  storeBlueprintCache,
} from '@/features/blueprint/services/cache/blueprintCacheRepository'
import { INVALID_SHARE_CODE_ERROR, normalizeShareCode } from '@/features/blueprint/services/cache/shareCode'
import type { BlueprintSummary } from '@/features/blueprint/types'
import defaultBlueprintData from '@/features/blueprint/domain/parser/defaultBlueprint.json'

export type { QueryStage } from '@/features/blueprint/composables/useShareQuerySession'

const defaultJson = JSON.stringify(defaultBlueprintData)

type Translate = (key: UiMessageKey) => string

function hasBlueprintData(data: unknown): data is { blueprint_data: unknown; share_code?: string } {
  return Boolean(data && typeof data === 'object' && 'blueprint_data' in data)
}

export function useBlueprintParser(t: Translate) {
  const rawText = ref(defaultJson)
  const sourceName = ref('demo.json')
  const summary = ref<BlueprintSummary | null>(null)
  const errorKey = ref<UiMessageKey | null>(null)
  const errorFallback = ref('')
  const cacheLoading = ref(false)
  const cacheStage = ref<QueryStage>('idle')
  const {
    queryLoading: sessionQueryLoading,
    queryStage: sessionQueryStage,
    qrcodeUrl,
    loadBlueprintFromShareCode,
    cancelQuery: cancelSessionQuery,
  } = useShareQuerySession(t)

  let cacheRequestToken = 0

  const queryLoading = computed(() => cacheLoading.value || sessionQueryLoading.value)
  const queryStage = computed<QueryStage>(() => (cacheStage.value === 'idle' ? sessionQueryStage.value : cacheStage.value))

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

    if (error.message === INVALID_SHARE_CODE_ERROR) {
      errorKey.value = 'queryInvalidShareCode'
      errorFallback.value = ''
      return
    }

    errorKey.value = null
    errorFallback.value = error.message || t('parseError')
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
      if (parsed && typeof parsed === 'object' && 'blueprint_data' in parsed) {
        rawText.value = text
      } else if (parsed && typeof parsed === 'object' && 'nodes' in parsed) {
        rawText.value = JSON.stringify({ share_code: '', blueprint_data: parsed })
      } else {
        rawText.value = text
      }
    } catch {
      rawText.value = text
    }
    rebuildSummary()
  }

  async function loadFromShareCode(shareCode: string) {
    errorKey.value = null
    errorFallback.value = ''
    const requestToken = ++cacheRequestToken

    try {
      const normalizedShareCode = normalizeShareCode(shareCode)

      if (isBlueprintCacheReadEnabled()) {
        cacheLoading.value = true
        cacheStage.value = 'checking_cache'

        try {
          const cached = await getCachedBlueprint(normalizedShareCode)
          if (requestToken !== cacheRequestToken) {
            return
          }

          if (cached) {
            sourceName.value = cached.shareCode
            rawText.value = JSON.stringify({
              ...cached.rawResponse,
              share_code: cached.rawResponse.share_code ?? cached.shareCode,
            })
            rebuildSummary()
            return
          }
        } catch {
          // Cache reads are an optimization; failures must not block the existing API flow.
        } finally {
          if (requestToken === cacheRequestToken) {
            cacheLoading.value = false
            cacheStage.value = 'idle'
          }
        }
      }

      const data = await loadBlueprintFromShareCode(normalizedShareCode)
      if (!data) {
        return
      }

      if (!hasBlueprintData(data)) {
        throw new Error(t('queryErrorNoData'))
      }

      const normalizedData = {
        ...data,
        share_code: data.share_code ?? normalizedShareCode,
      }

      sourceName.value = normalizedShareCode
      rawText.value = JSON.stringify(normalizedData)
      rebuildSummary()
      void storeBlueprintCache({
        shareCode: normalizedShareCode,
        rawResponse: normalizedData,
      }).catch(() => {
        // Cache writes are best-effort and should never affect the visible query result.
      })
    } catch (error) {
      summary.value = null
      localizeError(error)
    }
  }

  function cancelQuery() {
    cacheRequestToken += 1
    cacheLoading.value = false
    cacheStage.value = 'idle'
    cancelSessionQuery()
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
