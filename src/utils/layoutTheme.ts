import type { BlueprintSummaryNode } from '@/types'
import { colorForTemplate } from '@/utils/blueprint'

interface LayoutTheme {
  fill: string
  stroke: string
  text: string
  cellFill: string
}

const deviceTypeThemes: Record<string, LayoutTheme> = {
  电力供应: { fill: 'rgba(147, 51, 234, 0.18)', stroke: '#9333ea', text: '#581c87', cellFill: 'rgba(147, 51, 234, 0.08)' },
  基础生产: { fill: 'rgba(34, 197, 94, 0.18)', stroke: '#16a34a', text: '#14532d', cellFill: 'rgba(34, 197, 94, 0.08)' },
  合成制造: { fill: 'rgba(249, 115, 22, 0.18)', stroke: '#ea580c', text: '#7c2d12', cellFill: 'rgba(249, 115, 22, 0.08)' },
  仓储存取: { fill: 'rgba(59, 130, 246, 0.18)', stroke: '#2563eb', text: '#1e3a8a', cellFill: 'rgba(59, 130, 246, 0.08)' },
  功能设备: { fill: 'rgba(168, 85, 247, 0.18)', stroke: '#7c3aed', text: '#4c1d95', cellFill: 'rgba(168, 85, 247, 0.08)' },
  物流设备: { fill: 'rgba(234, 179, 8, 0.18)', stroke: '#ca8a04', text: '#713f12', cellFill: 'rgba(234, 179, 8, 0.08)' },
  资源开采: { fill: 'rgba(16, 185, 129, 0.18)', stroke: '#059669', text: '#14532d', cellFill: 'rgba(16, 185, 129, 0.08)' },
  种植调配: { fill: 'rgba(132, 204, 22, 0.18)', stroke: '#65a30d', text: '#365314', cellFill: 'rgba(132, 204, 22, 0.08)' },
  战斗辅助: { fill: 'rgba(239, 68, 68, 0.18)', stroke: '#dc2626', text: '#7f1d1d', cellFill: 'rgba(239, 68, 68, 0.08)' },
}

export function getLayoutTheme(node: BlueprintSummaryNode): LayoutTheme {
  if (node.path?.kind === 'belt') {
    return { fill: 'rgba(251, 191, 36, 0.18)', stroke: '#d97706', text: '#78350f', cellFill: 'rgba(251, 191, 36, 0.08)' }
  }

  if (node.path?.kind === 'pipe') {
    return { fill: 'rgba(59, 130, 246, 0.18)', stroke: '#2563eb', text: '#1e3a8a', cellFill: 'rgba(59, 130, 246, 0.08)' }
  }

  const deviceType = node.buildingMeta?.deviceType ?? ''
  const theme = deviceTypeThemes[deviceType]
  if (theme) {
    return theme
  }

  const fallback = colorForTemplate(node.templateId)
  return {
    fill: fallback,
    stroke: fallback,
    text: '#0f172a',
    cellFill: 'rgba(15, 23, 42, 0.05)',
  }
}
