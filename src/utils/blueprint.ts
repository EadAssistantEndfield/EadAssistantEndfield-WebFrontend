export { parseBlueprintFile } from '@/utils/blueprintParser'
import { buildBlueprintSummary } from '@/utils/blueprintSummaryBuilder'

export function shortTemplateName(templateId: string): string {
  return templateId
    .replace(/_01$/u, '')
    .replace(/_1$/u, '')
    .replace(/^grid_belt/u, 'belt')
    .replace(/^log_/u, '')
}

export function colorForTemplate(templateId: string): string {
  let hash = 0
  for (const char of templateId) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }
  const hue = hash % 360
  return `hsl(${hue} 68% 54%)`
}

export const summarizeBlueprint = buildBlueprintSummary
