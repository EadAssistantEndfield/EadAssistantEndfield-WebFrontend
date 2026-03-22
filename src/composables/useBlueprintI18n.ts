import { computed, ref, watch } from 'vue'
import {
  translateBuilding,
  localeOptions,
  translateItem,
  translatePayloadType,
  translateUi,
  type Locale,
} from '@/i18n/messages'

const STORAGE_KEY = 'blueprint-analysis-locale'

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') {
    return 'zh-CN'
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'zh-CN' || stored === 'en-US') {
    return stored
  }

  return navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US'
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
  const t = (key: string): string => translateUi(locale.value, key)
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
