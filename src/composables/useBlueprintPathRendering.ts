import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import type { BlueprintRenderLayoutMode, BlueprintSummaryNode } from '@/types'
import type { EndpointRole } from '@/composables/useBlueprintPathTopology'
import { resolveNodeLayoutBox } from '@/utils/blueprintLayoutBox'
import { resolvePathAttachmentCandidate, type BlueprintNodeLayoutBox } from '@/utils/blueprintPathAttachment'
import {
  buildRenderedPathPixels,
  resolveBeltArrowPoints,
  toPolylinePoints,
  type PixelPoint,
} from '@/utils/blueprintPathGeometry'

export function useBlueprintPathRendering(
  pathNodesSource: MaybeRefOrGetter<BlueprintSummaryNode[]>,
  buildingNodesSource: MaybeRefOrGetter<BlueprintSummaryNode[]>,
  renderModeSource: MaybeRefOrGetter<BlueprintRenderLayoutMode>,
  cellSize: number,
  cellX: (x: number) => number,
  cellZ: (z: number) => number,
  hasPathPeerAtEndpoint: (node: BlueprintSummaryNode, role: EndpointRole) => boolean,
) {
  const pathNodes = computed(() => toValue(pathNodesSource))
  const buildingNodes = computed(() => toValue(buildingNodesSource))
  const renderMode = computed(() => toValue(renderModeSource))

  function nodeLayout(node: BlueprintSummaryNode): BlueprintNodeLayoutBox {
    return resolveNodeLayoutBox(node, renderMode.value)
  }

  function pointToPixel(point: { x: number; z: number }): PixelPoint {
    return {
      x: cellX(point.x) + cellSize / 2,
      y: cellZ(point.z) + cellSize / 2,
    }
  }

  function renderedPathPixels(node: BlueprintSummaryNode): PixelPoint[] {
    const basePoints = node.pathPoints.map(pointToPixel)

    if (!node.path || basePoints.length === 0) {
      return basePoints
    }

    if (renderMode.value === 'source') {
      return basePoints
    }

    const attachmentContext = {
      cellSize,
      cellX,
      cellZ,
      nodeLayout,
    }
    const startPoint = node.pathPoints[0]
    const endPoint = node.pathPoints[node.pathPoints.length - 1]
    const startAttachment =
      startPoint && !hasPathPeerAtEndpoint(node, 'start')
        ? resolvePathAttachmentCandidate(startPoint, node.path.kind, 'start', buildingNodes.value, attachmentContext, {
            requireCenterline: node.path.kind === 'belt',
          })
        : null
    const excludedForEnd =
      node.path.kind === 'belt' && startAttachment ? new Set<number>([startAttachment.nodeId]) : undefined
    const endAttachment =
      endPoint && !hasPathPeerAtEndpoint(node, 'end')
        ? resolvePathAttachmentCandidate(endPoint, node.path.kind, 'end', buildingNodes.value, attachmentContext, {
            excludedNodeIds: excludedForEnd,
            requireCenterline: node.path.kind === 'belt',
          })
        : null

    const snappedStart = startAttachment?.point ?? null
    const snappedEnd = endAttachment?.point ?? null
    return buildRenderedPathPixels(basePoints, snappedStart, snappedEnd)
  }

  const renderedPathPixelsByNodeId = computed(() => {
    const pathMap = new Map<number, PixelPoint[]>()

    for (const node of pathNodes.value) {
      pathMap.set(node.nodeId, renderedPathPixels(node))
    }

    return pathMap
  })

  function getRenderedPathPixels(node: BlueprintSummaryNode): PixelPoint[] {
    return renderedPathPixelsByNodeId.value.get(node.nodeId) ?? []
  }

  function polylinePoints(node: BlueprintSummaryNode): string {
    return toPolylinePoints(getRenderedPathPixels(node))
  }

  function beltArrowPoints(node: BlueprintSummaryNode): string | null {
    if (node.path?.kind !== 'belt' || node.pathPoints.length < 2) {
      return null
    }

    return resolveBeltArrowPoints(getRenderedPathPixels(node), cellSize)
  }

  function startMarker(node: BlueprintSummaryNode): PixelPoint | null {
    if (!node.path) {
      return null
    }

    return getRenderedPathPixels(node)[0] ?? null
  }

  function endMarker(node: BlueprintSummaryNode): PixelPoint | null {
    if (!node.path) {
      return null
    }

    const points = getRenderedPathPixels(node)
    return points[points.length - 1] ?? null
  }

  return {
    polylinePoints,
    beltArrowPoints,
    startMarker,
    endMarker,
  }
}
