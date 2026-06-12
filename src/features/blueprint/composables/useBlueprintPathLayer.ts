import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import type { BlueprintRenderLayoutMode, BlueprintSummary, BlueprintSummaryNode } from '@/features/blueprint/types'
import { useBlueprintPathRendering } from '@/features/blueprint/composables/useBlueprintPathRendering'
import { useBlueprintPathTopology } from '@/features/blueprint/composables/useBlueprintPathTopology'

export function useBlueprintPathLayer(
  summarySource: MaybeRefOrGetter<BlueprintSummary>,
  renderModeSource: MaybeRefOrGetter<BlueprintRenderLayoutMode>,
  cellSize: number,
  cellX: (x: number) => number,
  cellZ: (z: number) => number,
  buildingNodesSource?: MaybeRefOrGetter<BlueprintSummaryNode[]>,
) {
  const summary = computed(() => toValue(summarySource))
  const { pathNodes, buildingNodes, hasPathPeerAtEndpoint } = useBlueprintPathTopology(summary, buildingNodesSource)
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
