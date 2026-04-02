import type { BlueprintPathKind } from '@/types'

export function pathStrokeWidth(kind: BlueprintPathKind | null | undefined): number {
  return kind === 'pipe' ? 6 : 8
}

export function pathStrokeDasharray(kind: BlueprintPathKind | null | undefined, cellSize: number): string | undefined {
  if (kind !== 'pipe') {
    return undefined
  }

  return `${cellSize * 0.45} ${cellSize * 0.25}`
}

export function pathMarkerRadius(kind: BlueprintPathKind | null | undefined): number {
  return kind === 'pipe' ? 3 : 4
}
