import { computed, ref, watch } from 'vue'
import {
  getLocaleOptions,
  isLocale,
  supportedLocales,
  translateBuilding,
  translateItem,
  translatePayloadType,
  translateUi,
  type Locale,
  type UiMessageKey,
} from '@/features/blueprint/i18n/messages'

const STORAGE_KEY = 'blueprint-analysis-locale'

function normalizeLocale(value: string | null | undefined): Locale | null {
  if (!value) {
    return null
  }

  if (isLocale(value)) {
    return value
  }

  const normalized = value.toLowerCase()
  if (normalized.startsWith('zh')) {
    return 'zh-CN'
  }

  if (normalized.startsWith('ja')) {
    return 'ja-JP'
  }

  if (normalized.startsWith('en')) {
    return 'en-US'
  }

  return null
}

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') {
    return 'zh-CN'
  }

  const stored = normalizeLocale(window.localStorage.getItem(STORAGE_KEY))
  if (stored) {
    return stored
  }

  for (const language of navigator.languages ?? [navigator.language]) {
    const resolved = normalizeLocale(language)
    if (resolved) {
      return resolved
    }
  }

  return supportedLocales[0]
}

const locale = ref<Locale>(getInitialLocale())

watch(
  locale,
  (value) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, value)
    }
  },
  { immediate: true },
)

export function useBlueprintI18n() {
  const localeOptions = computed(() => getLocaleOptions(locale.value))
  const t = (key: UiMessageKey): string => translateUi(locale.value, key)
  const itemLabel = (itemId: string): string => translateItem(locale.value, itemId)
  const buildingLabel = (templateId: string): string => translateBuilding(locale.value, templateId)
  const payloadLabel = (payloadType: string): string => translatePayloadType(locale.value, payloadType)

  return {
    locale,
    localeOptions,
    t,
    itemLabel,
    buildingLabel,
    payloadLabel,
    isChinese: computed(() => locale.value === 'zh-CN'),
  }
}
