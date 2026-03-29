import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import type { BlueprintRenderLayoutMode, BlueprintSummary, BlueprintSummaryNode } from '@/types'
import { resolvePathAttachmentCandidate, type BlueprintNodeLayoutBox } from '@/utils/blueprintPathAttachment'
import {
  buildRenderedPathPixels,
  resolveBeltArrowPoints,
  toPolylinePoints,
  type PixelPoint,
} from '@/utils/blueprintPathGeometry'
import { pathPointKey } from '@/utils/geometry'

type EndpointRole = 'start' | 'end'
interface EndpointPeerState {
  start: boolean
  end: boolean
}

export function useBlueprintPathLayer(
  summarySource: MaybeRefOrGetter<BlueprintSummary>,
  renderModeSource: MaybeRefOrGetter<BlueprintRenderLayoutMode>,
  cellSize: number,
  cellX: (x: number) => number,
  cellZ: (z: number) => number,
) {
  const summary = computed(() => toValue(summarySource))
  const renderMode = computed(() => toValue(renderModeSource))
  const pathNodes = computed(() => summary.value.nodes.filter((node) => node.path !== null))
  const buildingNodes = computed(() => summary.value.nodes.filter((node) => node.path === null))

  function endpointPoint(node: BlueprintSummaryNode, role: EndpointRole) {
    if (node.pathPoints.length === 0) {
      return null
    }

    return role === 'start' ? node.pathPoints[0] : node.pathPoints[node.pathPoints.length - 1]
  }

  const endpointPeersByNodeId = computed(() => {
    const endpointOwners = new Map<string, Array<{ nodeId: number; kind: NonNullable<BlueprintSummaryNode['path']>['kind'] }>>()
    const peerMap = new Map<number, EndpointPeerState>()

    for (const node of pathNodes.value) {
      if (!node.path) {
        continue
      }

      for (const role of ['start', 'end'] as const) {
        const point = endpointPoint(node, role)
        if (!point) {
          continue
        }

        const key = pathPointKey(point)
        const owners = endpointOwners.get(key) ?? []
        owners.push({ nodeId: node.nodeId, kind: node.path.kind })
        endpointOwners.set(key, owners)
      }
    }

    for (const node of pathNodes.value) {
      if (!node.path) {
        continue
      }

      const startPoint = endpointPoint(node, 'start')
      const endPoint = endpointPoint(node, 'end')
      const startOwners = startPoint ? endpointOwners.get(pathPointKey(startPoint)) ?? [] : []
      const endOwners = endPoint ? endpointOwners.get(pathPointKey(endPoint)) ?? [] : []
      const start = startOwners.some((owner) => owner.nodeId !== node.nodeId && owner.kind === node.path?.kind)
      const end = endOwners.some((owner) => owner.nodeId !== node.nodeId && owner.kind === node.path?.kind)

      peerMap.set(node.nodeId, { start, end })
    }

    return peerMap
  })

  function hasPathPeerAtEndpoint(node: BlueprintSummaryNode, role: EndpointRole): boolean {
    return endpointPeersByNodeId.value.get(node.nodeId)?.[role] ?? false
  }

  function nodeLayout(node: BlueprintSummaryNode): BlueprintNodeLayoutBox {
    if (renderMode.value === 'source') {
      return {
        x: node.sourceLayoutX,
        z: node.sourceLayoutZ,
        width: node.sourceLayoutWidth,
        height: node.sourceLayoutHeight,
      }
    }

    return {
      x: node.layoutX,
      z: node.layoutZ,
      width: node.layoutWidth,
      height: node.layoutHeight,
    }
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
    const excludedForEnd = node.path.kind === 'belt' && startAttachment ? new Set<number>([startAttachment.nodeId]) : undefined
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

  function strokeWidth(node: BlueprintSummaryNode): number {
    return node.path?.kind === 'pipe' ? 6 : 8
  }

  function strokeDasharray(node: BlueprintSummaryNode): string | undefined {
    if (node.path?.kind !== 'pipe') {
      return undefined
    }

    return `${cellSize * 0.45} ${cellSize * 0.25}`
  }

  function markerRadius(node: BlueprintSummaryNode): number {
    return node.path?.kind === 'pipe' ? 3 : 4
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
    pathNodes,
    polylinePoints,
    strokeWidth,
    strokeDasharray,
    markerRadius,
    beltArrowPoints,
    startMarker,
    endMarker,
  }
}
