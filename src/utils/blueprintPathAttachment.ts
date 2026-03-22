import type { BlueprintSummaryNode } from '@/types'
import {
  getTemplateConnectionRule,
  requiresTemplateCenterSlot,
  supportsTemplateConnection,
  toLocalEdgeSide,
  type EdgeSide,
} from '@/utils/templateConnectionRegistry'
import type { PixelPoint } from '@/utils/blueprintPathGeometry'

type EndpointRole = 'start' | 'end'
type PathKind = NonNullable<BlueprintSummaryNode['path']>['kind']
interface ResolveAttachmentOptions {
  excludedNodeIds?: ReadonlySet<number>
  requireCenterline?: boolean
}

export interface ResolvedPathAttachment {
  nodeId: number
  point: PixelPoint
  side: EdgeSide
  score: number
}

export interface BlueprintNodeLayoutBox {
  x: number
  z: number
  width: number
  height: number
}

interface AttachmentContext {
  cellSize: number
  cellX: (x: number) => number
  cellZ: (z: number) => number
  nodeLayout: (node: BlueprintSummaryNode) => BlueprintNodeLayoutBox
}

function pointToPixel(point: { x: number; z: number }, context: AttachmentContext): PixelPoint {
  return {
    x: context.cellX(point.x) + context.cellSize / 2,
    y: context.cellZ(point.z) + context.cellSize / 2,
  }
}

function candidateScore(node: BlueprintSummaryNode, kind: PathKind, endpointRole: EndpointRole, side: EdgeSide, context: AttachmentContext): number {
  const rule = getTemplateConnectionRule(node.templateId, kind)
  const preferredSides = rule?.[endpointRole] ?? []
  const localSide = toLocalEdgeSide(side, node.rotation)
  const preferenceIndex = preferredSides.length > 0 ? preferredSides.indexOf(localSide) : 0
  const preferencePenalty = preferredSides.length > 0 ? (preferenceIndex === -1 ? 10 : preferenceIndex) : 0
  const priorityScore = rule?.priority ?? 50
  const layout = context.nodeLayout(node)
  const areaPenalty = layout.width * layout.height * 0.01

  return preferencePenalty * 100 - priorityScore + areaPenalty
}

function detectAdjacentSide(point: { x: number; z: number }, node: BlueprintSummaryNode, context: AttachmentContext): EdgeSide | null {
  const layout = context.nodeLayout(node)
  const minX = layout.x
  const maxX = layout.x + layout.width - 1
  const minZ = layout.z
  const maxZ = layout.z + layout.height - 1
  const epsilon = 1e-6
  const adjacentDistance = 1 + epsilon
  const inRange = (value: number, rangeMin: number, rangeMax: number) => value >= rangeMin - epsilon && value <= rangeMax + epsilon
  const northDistance = minZ - point.z
  if (northDistance > epsilon && northDistance <= adjacentDistance && inRange(point.x, minX, maxX)) {
    return 'north'
  }

  const eastDistance = point.x - maxX
  if (eastDistance > epsilon && eastDistance <= adjacentDistance && inRange(point.z, minZ, maxZ)) {
    return 'east'
  }

  const southDistance = point.z - maxZ
  if (southDistance > epsilon && southDistance <= adjacentDistance && inRange(point.x, minX, maxX)) {
    return 'south'
  }

  const westDistance = minX - point.x
  if (westDistance > epsilon && westDistance <= adjacentDistance && inRange(point.z, minZ, maxZ)) {
    return 'west'
  }

  return null
}

function isNearlyInteger(value: number, epsilon = 1e-6): boolean {
  return Math.abs(value - Math.round(value)) <= epsilon
}

function isPointOnCenterlineForSide(point: { x: number; z: number }, side: EdgeSide): boolean {
  if (side === 'north' || side === 'south') {
    return isNearlyInteger(point.x)
  }

  return isNearlyInteger(point.z)
}

function isPointOnSideCenterSlot(point: { x: number; z: number }, node: BlueprintSummaryNode, side: EdgeSide, context: AttachmentContext): boolean {
  const layout = context.nodeLayout(node)
  const epsilon = 1e-6
  const maxCenterOffset = 0.5 + epsilon

  if (side === 'north' || side === 'south') {
    const centerX = layout.x + (layout.width - 1) / 2
    return Math.abs(point.x - centerX) <= maxCenterOffset
  }

  const centerZ = layout.z + (layout.height - 1) / 2
  return Math.abs(point.z - centerZ) <= maxCenterOffset
}

function snapPointToNodeEdge(point: { x: number; z: number }, node: BlueprintSummaryNode, side: EdgeSide, context: AttachmentContext): PixelPoint {
  const layout = context.nodeLayout(node)
  const rectLeft = context.cellX(layout.x) + 4
  const rectTop = context.cellZ(layout.z) + 4
  const rectRight = context.cellX(layout.x + layout.width) - 4
  const rectBottom = context.cellZ(layout.z + layout.height) - 4

  switch (side) {
    case 'north':
      return {
        x: pointToPixel(
          {
            x: Math.min(Math.max(point.x, layout.x), layout.x + layout.width - 1),
            z: point.z,
          },
          context,
        ).x,
        y: rectTop,
      }
    case 'east':
      return {
        x: rectRight,
        y: pointToPixel(
          {
            x: point.x,
            z: Math.min(Math.max(point.z, layout.z), layout.z + layout.height - 1),
          },
          context,
        ).y,
      }
    case 'south':
      return {
        x: pointToPixel(
          {
            x: Math.min(Math.max(point.x, layout.x), layout.x + layout.width - 1),
            z: point.z,
          },
          context,
        ).x,
        y: rectBottom,
      }
    case 'west':
      return {
        x: rectLeft,
        y: pointToPixel(
          {
            x: point.x,
            z: Math.min(Math.max(point.z, layout.z), layout.z + layout.height - 1),
          },
          context,
        ).y,
      }
  }
}

export function resolvePathAttachment(
  point: { x: number; z: number },
  pathKind: PathKind,
  endpointRole: EndpointRole,
  buildingNodes: BlueprintSummaryNode[],
  context: AttachmentContext,
): PixelPoint | null {
  const attachment = resolvePathAttachmentCandidate(point, pathKind, endpointRole, buildingNodes, context)
  return attachment?.point ?? null
}

export function resolvePathAttachmentCandidate(
  point: { x: number; z: number },
  pathKind: PathKind,
  endpointRole: EndpointRole,
  buildingNodes: BlueprintSummaryNode[],
  context: AttachmentContext,
  options?: ResolveAttachmentOptions,
): ResolvedPathAttachment | null {
  let bestMatch: { node: BlueprintSummaryNode; side: EdgeSide; score: number } | null = null

  for (const node of buildingNodes) {
    if (options?.excludedNodeIds?.has(node.nodeId)) {
      continue
    }

    if (!supportsTemplateConnection(node.templateId, pathKind)) {
      continue
    }

    const side = detectAdjacentSide(point, node, context)
    if (!side) {
      continue
    }

    if (options?.requireCenterline && !isPointOnCenterlineForSide(point, side)) {
      continue
    }

    const localSide = toLocalEdgeSide(side, node.rotation)
    if (requiresTemplateCenterSlot(node.templateId, pathKind, localSide) && !isPointOnSideCenterSlot(point, node, side, context)) {
      continue
    }

    const score = candidateScore(node, pathKind, endpointRole, side, context)
    if (!bestMatch || score < bestMatch.score) {
      bestMatch = { node, side, score }
    }
  }

  if (!bestMatch) {
    return null
  }

  return {
    nodeId: bestMatch.node.nodeId,
    point: snapPointToNodeEdge(point, bestMatch.node, bestMatch.side, context),
    side: bestMatch.side,
    score: bestMatch.score,
  }
}
