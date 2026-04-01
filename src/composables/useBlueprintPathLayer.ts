import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import type { BlueprintRenderLayoutMode, BlueprintSummary } from '@/types'
import { useBlueprintPathRendering } from '@/composables/useBlueprintPathRendering'
import { useBlueprintPathTopology } from '@/composables/useBlueprintPathTopology'

export function useBlueprintPathLayer(
  summarySource: MaybeRefOrGetter<BlueprintSummary>,
  renderModeSource: MaybeRefOrGetter<BlueprintRenderLayoutMode>,
  cellSize: number,
  cellX: (x: number) => number,
  cellZ: (z: number) => number,
) {
  const summary = computed(() => toValue(summarySource))
  const { pathNodes, buildingNodes, hasPathPeerAtEndpoint } = useBlueprintPathTopology(summary)
  const { polylinePoints, beltArrowPoints, startMarker, endMarker } = useBlueprintPathRendering(
    pathNodes,
    buildingNodes,
    renderModeSource,
    cellSize,
    cellX,
    cellZ,
    hasPathPeerAtEndpoint,
  )

  return {
    pathNodes,
    polylinePoints,
    beltArrowPoints,
    startMarker,
    endMarker,
  }
}
