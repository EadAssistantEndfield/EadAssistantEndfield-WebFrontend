import { computed, type MaybeRefOrGetter, toValue } from 'vue'
interface BlueprintLayoutBounds {
  width: number
  height: number
}

export function useBlueprintLayout(boundsSource: MaybeRefOrGetter<BlueprintLayoutBounds | null>, cellSize = 28) {
  const bounds = computed(() => toValue(boundsSource))

  const svgWidth = computed(() => (bounds.value ? bounds.value.width * cellSize + 48 : 0))
  const svgHeight = computed(() => (bounds.value ? bounds.value.height * cellSize + 48 : 0))

  function cellX(x: number): number {
    return 32 + x * cellSize
  }

  function cellZ(z: number): number {
    return 32 + z * cellSize
  }

  function stackedRectHeight(count: number): number {
    return Math.max(6, (cellSize - 8) / Math.max(count, 1) - 2)
  }

  return {
    cellSize,
    svgWidth,
    svgHeight,
    cellX,
    cellZ,
    stackedRectHeight,
  }
}
