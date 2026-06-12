import { buildingMessages } from '@/features/blueprint/i18n/buildingMessages'
import { itemMessages } from '@/features/blueprint/i18n/itemMessages'
import type { Locale } from '@/features/blueprint/i18n/locales'
import { payloadTypeMessages } from '@/features/blueprint/i18n/payloadTypeMessages'
import { uiMessages, type UiMessages } from '@/features/blueprint/i18n/uiMessages'

export { itemMessages } from '@/features/blueprint/i18n/itemMessages'
export { payloadTypeMessages } from '@/features/blueprint/i18n/payloadTypeMessages'
export { supportedLocales, isLocale, type Locale } from '@/features/blueprint/i18n/locales'
export { uiMessages, type UiMessages } from '@/features/blueprint/i18n/uiMessages'

export type UiMessageKey = keyof UiMessages

function humanizeIdentifier(id: string): string {
  return id
    .replace(/^item_/u, '')
    .replace(/^log_/u, '')
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function getLocaleOptions(displayLocale: Locale): Array<{ value: Locale; label: string }> {
  return [
    { value: 'zh-CN', label: translateUi(displayLocale, 'localeNameZhCN') },
    { value: 'en-US', label: translateUi(displayLocale, 'localeNameEnUS') },
    { value: 'ja-JP', label: translateUi(displayLocale, 'localeNameJaJP') },
  ]
}

export function translateUi(locale: Locale, key: UiMessageKey): string {
  return uiMessages[locale][key] ?? uiMessages['en-US'][key] ?? key
}

export function translateItem(locale: Locale, itemId: string): string {
  if (!itemId || itemId === '-') {
    return translateUi(locale, 'noItem')
  }

  return itemMessages[locale][itemId] ?? itemMessages['en-US'][itemId] ?? humanizeIdentifier(itemId)
}

export function translateBuilding(locale: Locale, templateId: string): string {
  if (!templateId) {
    return buildingMessages[locale].unknown
  }

  return buildingMessages[locale][templateId] ?? buildingMessages['en-US'][templateId] ?? humanizeIdentifier(templateId)
}

export function translatePayloadType(locale: Locale, payloadType: string): string {
  if (!payloadType || payloadType === '-') {
    return translateUi(locale, 'noItem')
  }

  return payloadTypeMessages[locale][payloadType] ?? payloadTypeMessages['en-US'][payloadType] ?? payloadType
}
