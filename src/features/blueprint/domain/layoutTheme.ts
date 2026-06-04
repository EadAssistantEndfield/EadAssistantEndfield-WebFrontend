import type { BlueprintSummaryNode } from '@/features/blueprint/types'
import { colorForTemplate } from '@/features/blueprint/domain/blueprint'

interface LayoutTheme {
  fill: string
  stroke: string
  text: string
  cellFill: string
}

const deviceTypeThemes: Record<string, LayoutTheme> = {
  电力供应: {
    fill: 'rgba(147, 51, 234, 0.22)',
    stroke: '#b06eff',
    text: '#f5e9ff',
    cellFill: 'rgba(147, 51, 234, 0.08)',
  },
  基础生产: {
    fill: 'rgba(34, 197, 94, 0.22)',
    stroke: '#44d17f',
    text: '#ecfff4',
    cellFill: 'rgba(34, 197, 94, 0.08)',
  },
  合成制造: {
    fill: 'rgba(249, 115, 22, 0.22)',
    stroke: '#ff9b4d',
    text: '#fff0e2',
    cellFill: 'rgba(249, 115, 22, 0.08)',
  },
  仓储存取: {
    fill: 'rgba(59, 130, 246, 0.22)',
    stroke: '#69adff',
    text: '#edf6ff',
    cellFill: 'rgba(59, 130, 246, 0.08)',
  },
  功能设备: {
    fill: 'rgba(168, 85, 247, 0.22)',
    stroke: '#c088ff',
    text: '#f6ebff',
    cellFill: 'rgba(168, 85, 247, 0.08)',
  },
  物流设备: {
    fill: 'rgba(234, 179, 8, 0.22)',
    stroke: '#e9c15d',
    text: '#fff6da',
    cellFill: 'rgba(234, 179, 8, 0.08)',
  },
  资源开采: {
    fill: 'rgba(16, 185, 129, 0.22)',
    stroke: '#40d1a4',
    text: '#eafff9',
    cellFill: 'rgba(16, 185, 129, 0.08)',
  },
  种植调配: {
    fill: 'rgba(132, 204, 22, 0.22)',
    stroke: '#a8d84d',
    text: '#f5ffdf',
    cellFill: 'rgba(132, 204, 22, 0.08)',
  },
  战斗辅助: {
    fill: 'rgba(239, 68, 68, 0.22)',
    stroke: '#ff8a8a',
    text: '#fff0f0',
    cellFill: 'rgba(239, 68, 68, 0.08)',
  },
}

export function getLayoutTheme(node: BlueprintSummaryNode): LayoutTheme {
  if (node.path?.kind === 'belt') {
    return {
      fill: 'rgba(251, 191, 36, 0.22)',
      stroke: '#f0b444',
      text: '#fff5de',
      cellFill: 'rgba(251, 191, 36, 0.08)',
    }
  }

  if (node.path?.kind === 'pipe') {
    return {
      fill: 'rgba(59, 130, 246, 0.22)',
      stroke: '#67a7ff',
      text: '#edf5ff',
      cellFill: 'rgba(59, 130, 246, 0.08)',
    }
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
    text: '#f8f2e7',
    cellFill: 'rgba(15, 23, 42, 0.05)',
  }
}
