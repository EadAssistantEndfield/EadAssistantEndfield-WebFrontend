import type { Locale } from '@/features/blueprint/i18n/locales'

export const payloadTypeMessages: Record<Locale, Record<string, string>> = {
  'zh-CN': {
    formula_man: '配方',
    selector: '选择器',
    fluid_valve: '流体阀',
    unknown: '未知',
  },
  'en-US': {
    formula_man: 'Formula',
    selector: 'Selector',
    fluid_valve: 'Fluid Valve',
    unknown: 'Unknown',
  },
  'ja-JP': {
    formula_man: 'レシピ',
    selector: 'セレクター',
    fluid_valve: '流体バルブ',
    unknown: '不明',
  },
}
