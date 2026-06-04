import type {
  BlueprintBuildingMeta,
  BlueprintCardinal,
  BlueprintCell,
  BlueprintInteractiveParam,
  BlueprintPoint,
  BlueprintPosition,
  BlueprintRotation,
  BlueprintSnapHint,
  BlueprintSummaryNode,
} from '@/features/blueprint/types'
import { type ParsedBlueprintNodeInput } from '@/features/blueprint/domain/blueprintParser'
import { getBuildingMetadata } from '@/features/blueprint/domain/buildingCatalog'
import { resolvePathPoints, summarizePath, transportCardinalFromDirection } from '@/features/blueprint/domain/blueprintPath'
import { resolveTemplateAnchorOffset } from '@/features/blueprint/domain/templateAnchorRegistry'
import {
  getPreferredLocalSides,
  getTemplateConnectionRule,
  requiresTemplateCenterSlot,
  resolveTemplatePortRole,
  supportsTemplateConnection,
  toLocalEdgeSide,
  type EdgeSide,
  type TemplatePortRole,
} from '@/features/blueprint/domain/templateConnectionRegistry'
import {
  toSafeNumber,
  detectAdjacentSide,
  isPointOnCenterlineForSide,
  cardinalFromDelta,
  oppositeCardinal,
  pathPointKey,
} from '@/features/blueprint/domain/geometry'

interface ResolvedBlueprintNodeBase {
  nodeId: number
  templateId: string
  productIcon: string
  rotation: BlueprintRotation
  x: number
  y: number
  z: number
  footprint: BlueprintSummaryNode['footprint']
  buildingMeta: BlueprintBuildingMeta | null
  pathPoints: BlueprintSummaryNode['pathPoints']
  path: BlueprintSummaryNode['path']
  directionIn: Record<string, unknown> | null
  directionOut: Record<string, unknown> | null
  flowInHint: BlueprintCardinal | null
  flowOutHint: BlueprintCardinal | null
  componentCount: number
  payloadTypes: BlueprintSummaryNode['payloadTypes']
  interactive: boolean
  interactiveParam: BlueprintInteractiveParam | null
  snapHint: BlueprintSnapHint | null
}

interface BeltLayoutBuildingRef {
  node: ResolvedBlueprintNodeBase
  layoutX: number
  layoutZ: number
  layoutWidth: number
  layoutHeight: number
}

interface BeltEndpointAttachmentCandidate {
  nodeId: number
  score: number
}

function resolveAnchorPoint(
  position: BlueprintPosition | null | undefined,
  pathPoints: BlueprintPoint[],
): BlueprintPosition | BlueprintPoint | undefined {
  return position ?? pathPoints[0]
}

function normalizeRotation(direction: Record<string, unknown> | null | undefined): BlueprintRotation {
  const yValue = typeof direction?.y === 'number' ? direction.y : 0
  const normalized = (((Math.round(yValue / 90) * 90) % 360) + 360) % 360

  if (normalized === 90 || normalized === 180 || normalized === 270) {
    return normalized
  }

  return 0
}

function resolveOccupiedCells(
  layoutX: number,
  layoutZ: number,
  layoutWidth: number,
  layoutHeight: number,
): BlueprintCell[] {
  const cells: BlueprintCell[] = []

  for (let x = layoutX; x < layoutX + layoutWidth; x += 1) {
    for (let z = layoutZ; z < layoutZ + layoutHeight; z += 1) {
      cells.push({ x, z })
    }
  }

  return cells
}

function resolveLayoutBounds(
  templateId: string,
  x: number,
  z: number,
  rotation: BlueprintRotation,
  footprintWidth: number,
  footprintHeight: number,
  sourceWidth?: number,
  sourceHeight?: number,
) {
  const isQuarterTurn = rotation === 90 || rotation === 270
  const layoutWidth = isQuarterTurn ? footprintHeight : footprintWidth
  const layoutHeight = isQuarterTurn ? footprintWidth : footprintHeight
  const anchorOffset = resolveTemplateAnchorOffset(templateId, rotation, {
    sourceWidth,
    sourceHeight,
    layoutWidth,
    layoutHeight,
  })

  return {
    layoutX: x + anchorOffset.x,
    layoutZ: z + anchorOffset.z,
    layoutWidth,
    layoutHeight,
  }
}

function isPointOnLayoutSideCenterSlot(
  point: { x: number; z: number },
  side: EdgeSide,
  layoutX: number,
  layoutZ: number,
  layoutWidth: number,
  layoutHeight: number,
): boolean {
  const epsilon = 1e-6
  const maxCenterOffset = 0.5 + epsilon

  if (side === 'north' || side === 'south') {
    const centerX = layoutX + (layoutWidth - 1) / 2
    return Math.abs(point.x - centerX) <= maxCenterOffset
  }

  const centerZ = layoutZ + (layoutHeight - 1) / 2
  return Math.abs(point.z - centerZ) <= maxCenterOffset
}

function resolveEndpointPoint(
  pathPoints: BlueprintPoint[],
  reversed: boolean,
  endpointRole: 'start' | 'end',
): BlueprintPoint | null {
  if (pathPoints.length === 0) {
    return null
  }

  if (endpointRole === 'start') {
    return reversed ? pathPoints[pathPoints.length - 1] : pathPoints[0]
  }

  return reversed ? pathPoints[0] : pathPoints[pathPoints.length - 1]
}

function resolveEndpointCardinal(
  pathPoints: BlueprintPoint[],
  reversed: boolean,
  endpointRole: 'start' | 'end',
): BlueprintCardinal | null {
  if (pathPoints.length < 2) {
    return null
  }

  if (endpointRole === 'start') {
    const startIndex = reversed ? pathPoints.length - 1 : 0
    const step = reversed ? -1 : 1

    for (let index = startIndex; index + step >= 0 && index + step < pathPoints.length; index += step) {
      const current = pathPoints[index]
      const next = pathPoints[index + step]
      const direction = cardinalFromDelta(next.x - current.x, next.z - current.z)
      if (direction) {
        return direction
      }
    }

    return null
  }

  const startIndex = reversed ? 0 : pathPoints.length - 1
  const step = reversed ? 1 : -1
  for (let index = startIndex; index + step >= 0 && index + step < pathPoints.length; index += step) {
    const current = pathPoints[index + step]
    const next = pathPoints[index]
    const direction = cardinalFromDelta(next.x - current.x, next.z - current.z)
    if (direction) {
      return direction
    }
  }

  return null
}

function scoreCardinalHint(actual: BlueprintCardinal | null, hint: BlueprintCardinal | null): number {
  if (!actual || !hint) {
    return 0
  }

  if (actual === hint) {
    return 8
  }

  if (oppositeCardinal(actual) === hint) {
    return 2
  }

  return -8
}

function resolveBeltHintWeight(node: ResolvedBlueprintNodeBase): number {
  const forwardStart = resolveEndpointCardinal(node.pathPoints, false, 'start')
  const forwardEnd = resolveEndpointCardinal(node.pathPoints, false, 'end')
  const reversedStart = resolveEndpointCardinal(node.pathPoints, true, 'start')
  const reversedEnd = resolveEndpointCardinal(node.pathPoints, true, 'end')
  const forwardScore =
    scoreCardinalHint(forwardStart, node.flowInHint) + scoreCardinalHint(forwardEnd, node.flowOutHint)
  const reversedScore =
    scoreCardinalHint(reversedStart, node.flowInHint) + scoreCardinalHint(reversedEnd, node.flowOutHint)
  const delta = Math.abs(forwardScore - reversedScore)

  if (delta >= 12) {
    return 0.55
  }

  if (delta >= 8) {
    return 0.4
  }

  if (delta >= 4) {
    return 0.25
  }

  return 0
}

function scorePortRole(portRole: TemplatePortRole, endpointRole: 'start' | 'end'): number {
  const expectedRole = endpointRole === 'start' ? 'output' : 'input'

  if (portRole === expectedRole) {
    return 10
  }

  if (portRole === 'bidirectional') {
    return 7
  }

  if (portRole === 'unknown') {
    return 1
  }

  return -10
}

function resolveBeltAttachmentCandidate(
  point: BlueprintPoint,
  endpointRole: 'start' | 'end',
  buildings: BeltLayoutBuildingRef[],
  excludedNodeId?: number,
): BeltEndpointAttachmentCandidate | null {
  let best: BeltEndpointAttachmentCandidate | null = null

  for (const building of buildings) {
    if (excludedNodeId && building.node.nodeId === excludedNodeId) {
      continue
    }

    if (!supportsTemplateConnection(building.node.templateId, 'belt')) {
      continue
    }

    const side = detectAdjacentSide(
      point,
      building.layoutX,
      building.layoutZ,
      building.layoutWidth,
      building.layoutHeight,
    )
    if (!side) {
      continue
    }

    if (!isPointOnCenterlineForSide(point, side)) {
      continue
    }

    const localSide = toLocalEdgeSide(side, building.node.rotation)
    if (
      requiresTemplateCenterSlot(building.node.templateId, 'belt', localSide) &&
      !isPointOnLayoutSideCenterSlot(
        point,
        side,
        building.layoutX,
        building.layoutZ,
        building.layoutWidth,
        building.layoutHeight,
      )
    ) {
      continue
    }

    const preferredSides = getPreferredLocalSides(building.node.templateId, 'belt')
    const preferredScore = preferredSides.length === 0 || preferredSides.includes(localSide) ? 2 : -2
    const priorityScore = (getTemplateConnectionRule(building.node.templateId, 'belt')?.priority ?? 50) * 0.03
    const portRole = resolveTemplatePortRole(building.node.templateId, 'belt', localSide)
    const semanticScore = scorePortRole(portRole, endpointRole)
    const score = semanticScore + preferredScore + priorityScore

    if (!best || score > best.score) {
      best = {
        nodeId: building.node.nodeId,
        score,
      }
    }
  }

  return best
}

function optimizeBeltGraphDirections(nodes: ResolvedBlueprintNodeBase[]): ResolvedBlueprintNodeBase[] {
  const beltNodes = nodes.filter((node) => node.path?.kind === 'belt' && node.pathPoints.length >= 2)
  if (beltNodes.length < 2) {
    return nodes
  }

  const buildings: BeltLayoutBuildingRef[] = nodes
    .filter((node) => node.path === null)
    .map((node) => {
      const layout = resolveLayoutBounds(
        node.templateId,
        node.x,
        node.z,
        node.rotation,
        node.footprint?.width ?? 1,
        node.footprint?.height ?? 1,
        node.footprint?.sourceWidth,
        node.footprint?.sourceHeight,
      )

      return {
        node,
        layoutX: layout.layoutX,
        layoutZ: layout.layoutZ,
        layoutWidth: layout.layoutWidth,
        layoutHeight: layout.layoutHeight,
      }
    })

  const state = new Map<number, boolean>()
  const lockedNodeIds = new Set<number>()
  const hintWeightByNodeId = new Map<number, number>()
  for (const node of beltNodes) {
    hintWeightByNodeId.set(node.nodeId, resolveBeltHintWeight(node))
  }

  function scoreNodeDirectionEvidence(node: ResolvedBlueprintNodeBase, reversed: boolean): number {
    const startPoint = resolveEndpointPoint(node.pathPoints, reversed, 'start')
    const endPoint = resolveEndpointPoint(node.pathPoints, reversed, 'end')
    const startDirection = resolveEndpointCardinal(node.pathPoints, reversed, 'start')
    const endDirection = resolveEndpointCardinal(node.pathPoints, reversed, 'end')
    const hintWeight = hintWeightByNodeId.get(node.nodeId) ?? 0
    let score = 0

    if (hintWeight > 0) {
      score += scoreCardinalHint(startDirection, node.flowInHint) * hintWeight
      score += scoreCardinalHint(endDirection, node.flowOutHint) * hintWeight
    }

    const startAttachment = startPoint ? resolveBeltAttachmentCandidate(startPoint, 'start', buildings) : null
    const endAttachment = endPoint
      ? resolveBeltAttachmentCandidate(endPoint, 'end', buildings, startAttachment?.nodeId)
      : null

    if (startAttachment) {
      score += startAttachment.score
    }

    if (endAttachment) {
      score += endAttachment.score
    }

    return score
  }

  for (const node of beltNodes) {
    const forwardEvidence = scoreNodeDirectionEvidence(node, false)
    const reversedEvidence = scoreNodeDirectionEvidence(node, true)
    const delta = Math.abs(reversedEvidence - forwardEvidence)
    const preferReversed = reversedEvidence > forwardEvidence

    state.set(node.nodeId, preferReversed)

    if (delta >= 9) {
      lockedNodeIds.add(node.nodeId)
    }
  }

  function computeScore(): number {
    const pointRoleCounts = new Map<string, { start: number; end: number; total: number }>()
    let score = 0

    for (const node of beltNodes) {
      const reversed = state.get(node.nodeId) ?? false
      const startPoint = resolveEndpointPoint(node.pathPoints, reversed, 'start')
      const endPoint = resolveEndpointPoint(node.pathPoints, reversed, 'end')

      if (startPoint) {
        const key = pathPointKey(startPoint)
        const counter = pointRoleCounts.get(key) ?? { start: 0, end: 0, total: 0 }
        counter.start += 1
        counter.total += 1
        pointRoleCounts.set(key, counter)
      }

      if (endPoint) {
        const key = pathPointKey(endPoint)
        const counter = pointRoleCounts.get(key) ?? { start: 0, end: 0, total: 0 }
        counter.end += 1
        counter.total += 1
        pointRoleCounts.set(key, counter)
      }
    }

    for (const counter of pointRoleCounts.values()) {
      if (counter.total <= 1) {
        continue
      }

      if (counter.start === 0 || counter.end === 0) {
        score -= 8 + (counter.total - 1) * 3
      } else {
        score += Math.min(counter.start, counter.end) * 2
        score -= Math.abs(counter.start - counter.end) * 3
      }
    }

    for (const node of beltNodes) {
      const reversed = state.get(node.nodeId) ?? false
      const startPoint = resolveEndpointPoint(node.pathPoints, reversed, 'start')
      const endPoint = resolveEndpointPoint(node.pathPoints, reversed, 'end')
      const startKey = startPoint ? pathPointKey(startPoint) : null
      const endKey = endPoint ? pathPointKey(endPoint) : null

      score += scoreNodeDirectionEvidence(node, reversed)

      if (startKey && endKey && startKey === endKey) {
        score -= 12
      }
    }

    return score
  }

  let currentScore = computeScore()

  for (let pass = 0; pass < 8; pass += 1) {
    let improved = false

    for (const node of beltNodes) {
      if (lockedNodeIds.has(node.nodeId)) {
        continue
      }

      const current = state.get(node.nodeId) ?? false
      state.set(node.nodeId, !current)
      const candidateScore = computeScore()

      if (candidateScore > currentScore + 0.01) {
        currentScore = candidateScore
        improved = true
      } else {
        state.set(node.nodeId, current)
      }
    }

    if (!improved) {
      break
    }
  }

  return nodes.map((node) => {
    if (node.path?.kind !== 'belt' || !(state.get(node.nodeId) ?? false)) {
      return node
    }

    const reversedPathPoints = [...node.pathPoints].reverse()

    return {
      ...node,
      pathPoints: reversedPathPoints,
      path: summarizePath(reversedPathPoints, node.templateId, node.directionIn, node.directionOut),
    }
  })
}

function normalizeNodeBase(node: ParsedBlueprintNodeInput): ResolvedBlueprintNodeBase {
  const flowInHint = transportCardinalFromDirection(node.directionIn)
  const flowOutHint = transportCardinalFromDirection(node.directionOut)
  const pathPoints = resolvePathPoints(node.points, node.templateId, node.directionIn, node.directionOut)
  const path = summarizePath(pathPoints, node.templateId, node.directionIn, node.directionOut)
  const anchorPoint = resolveAnchorPoint(node.position, pathPoints)
  const x = toSafeNumber(anchorPoint?.x)
  const y = toSafeNumber(anchorPoint?.y)
  const z = toSafeNumber(anchorPoint?.z)
  const buildingMeta: BlueprintBuildingMeta | null = path ? null : getBuildingMetadata(node.templateId)
  const footprint = buildingMeta?.footprint ?? null
  const rotation = normalizeRotation(node.direction)

  return {
    nodeId: node.nodeId,
    templateId: node.templateId,
    productIcon: node.productIcon,
    rotation,
    x,
    y,
    z,
    footprint,
    buildingMeta,
    pathPoints,
    path,
    directionIn: node.directionIn,
    directionOut: node.directionOut,
    flowInHint,
    flowOutHint,
    componentCount: node.componentCount,
    payloadTypes: node.payloadTypes,
    interactive: node.interactive,
    interactiveParam: node.interactiveParam,
    snapHint: node.snapHint,
  }
}

export function resolveBlueprintSummaryNodes(rawNodes: ParsedBlueprintNodeInput[]): BlueprintSummaryNode[] {
  const baseNodes = optimizeBeltGraphDirections(rawNodes.map(normalizeNodeBase))

  return baseNodes.map<BlueprintSummaryNode>((node) => {
    const sourceLayoutX = node.x
    const sourceLayoutZ = node.z
    const sourceLayoutWidth = 1
    const sourceLayoutHeight = 1

    if (node.path) {
      return {
        ...node,
        layoutX: sourceLayoutX,
        layoutZ: sourceLayoutZ,
        layoutWidth: sourceLayoutWidth,
        layoutHeight: sourceLayoutHeight,
        sourceLayoutX,
        sourceLayoutZ,
        sourceLayoutWidth,
        sourceLayoutHeight,
        occupiedCells: [],
        interactiveParam: node.interactiveParam,
        snapHint: node.snapHint,
      }
    }

    const strictLayout = resolveLayoutBounds(
      node.templateId,
      node.x,
      node.z,
      node.rotation,
      node.footprint?.width ?? 1,
      node.footprint?.height ?? 1,
      node.footprint?.sourceWidth,
      node.footprint?.sourceHeight,
    )
    const layoutX = strictLayout.layoutX
    const layoutZ = strictLayout.layoutZ
    const layoutWidth = strictLayout.layoutWidth
    const layoutHeight = strictLayout.layoutHeight

    return {
      ...node,
      layoutX,
      layoutZ,
      layoutWidth,
      layoutHeight,
      sourceLayoutX,
      sourceLayoutZ,
      sourceLayoutWidth,
      sourceLayoutHeight,
      occupiedCells: resolveOccupiedCells(layoutX, layoutZ, layoutWidth, layoutHeight),
      interactiveParam: node.interactiveParam,
      snapHint: node.snapHint,
    }
  })
}
