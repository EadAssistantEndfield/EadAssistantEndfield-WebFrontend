export const supportedLocales = ['zh-CN', 'en-US', 'ja-JP'] as const
export type Locale = (typeof supportedLocales)[number]

export function isLocale(value: string | null | undefined): value is Locale {
  return Boolean(value && supportedLocales.includes(value as Locale))
}
