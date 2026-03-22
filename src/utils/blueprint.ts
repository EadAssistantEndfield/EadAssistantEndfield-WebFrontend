import type {
  BlueprintBuildingMeta,
  BlueprintCardinal,
  BlueprintCell,
  BlueprintFile,
  BlueprintNode,
  BlueprintPathKind,
  BlueprintPoint,
  BlueprintPosition,
  BlueprintRotation,
  BlueprintSummary,
  BlueprintSummaryNode,
  CountEntry,
} from '@/types'
import { getBuildingMetadata } from '@/utils/buildingCatalog'
import { resolvePathPoints, summarizePath, transportCardinalFromDirection } from '@/utils/blueprintPath'
import { resolveTemplateAnchorOffset } from '@/utils/templateAnchorRegistry'
import {
  getPreferredLocalSides,
  getTemplateConnectionRule,
  requiresTemplateCenterSlot,
  resolveTemplatePortRole,
  supportsTemplateConnection,
  toLocalEdgeSide,
  type EdgeSide,
  type TemplatePortRole,
} from '@/utils/templateConnectionRegistry'

interface ParsedNodeBase {
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
}

interface PathLayoutPoint {
  x: number
  z: number
  kind: BlueprintPathKind
}

interface LayoutCandidate {
  offsetX: number
  offsetZ: number
  layoutX: number
  layoutZ: number
  layoutWidth: number
  layoutHeight: number
  score: number
}

const STRICT_REGISTRY_LAYOUT_TEMPLATES = new Set(['log_hongs_bus', 'log_hongs_bus_source'])

function toSafeNumber(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function resolveAnchorPoint(position: BlueprintPosition | null | undefined, pathPoints: BlueprintPoint[]): BlueprintPosition | BlueprintPoint | undefined {
  return position ?? pathPoints[0]
}

function toCountEntries(counter: Map<string, number>): CountEntry[] {
  return [...counter.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
}

export function shortTemplateName(templateId: string): string {
  return templateId
    .replace(/_01$/u, '')
    .replace(/_1$/u, '')
    .replace(/^grid_belt/u, 'belt')
    .replace(/^log_/u, '')
}

export function colorForTemplate(templateId: string): string {
  let hash = 0
  for (const char of templateId) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }
  const hue = hash % 360
  return `hsl(${hue} 68% 54%)`
}

export function parseBlueprintFile(raw: string): BlueprintFile {
  const parsed = JSON.parse(raw) as unknown

  if (typeof parsed !== 'object' || parsed === null || !('blueprint_data' in parsed)) {
    throw new Error('MISSING_BLUEPRINT_DATA')
  }

  return parsed as BlueprintFile
}

function normalizeRotation(direction: Record<string, unknown> | null | undefined): BlueprintRotation {
  const yValue = typeof direction?.y === 'number' ? direction.y : 0
  const normalized = ((Math.round(yValue / 90) * 90) % 360 + 360) % 360

  if (normalized === 90 || normalized === 180 || normalized === 270) {
    return normalized
  }

  return 0
}

function resolveOccupiedCells(layoutX: number, layoutZ: number, layoutWidth: number, layoutHeight: number): BlueprintCell[] {
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

function detectAdjacentSide(
  point: { x: number; z: number },
  layoutX: number,
  layoutZ: number,
  layoutWidth: number,
  layoutHeight: number,
): EdgeSide | null {
  const maxX = layoutX + layoutWidth - 1
  const maxZ = layoutZ + layoutHeight - 1
  const epsilon = 1e-6
  const adjacentDistance = 1 + epsilon
  const inRange = (value: number, rangeMin: number, rangeMax: number) => value >= rangeMin - epsilon && value <= rangeMax + epsilon
  const northDistance = layoutZ - point.z
  if (northDistance > epsilon && northDistance <= adjacentDistance && inRange(point.x, layoutX, maxX)) {
    return 'north'
  }

  const eastDistance = point.x - maxX
  if (eastDistance > epsilon && eastDistance <= adjacentDistance && inRange(point.z, layoutZ, maxZ)) {
    return 'east'
  }

  const southDistance = point.z - maxZ
  if (southDistance > epsilon && southDistance <= adjacentDistance && inRange(point.x, layoutX, maxX)) {
    return 'south'
  }

  const westDistance = layoutX - point.x
  if (westDistance > epsilon && westDistance <= adjacentDistance && inRange(point.z, layoutZ, maxZ)) {
    return 'west'
  }

  return null
}

function pathInsideLayout(point: { x: number; z: number }, layoutX: number, layoutZ: number, layoutWidth: number, layoutHeight: number): boolean {
  return point.x >= layoutX && point.x < layoutX + layoutWidth && point.z >= layoutZ && point.z < layoutZ + layoutHeight
}

function createCandidateOffsets(templateId: string, rotation: BlueprintRotation, layoutWidth: number, layoutHeight: number, sourceWidth?: number, sourceHeight?: number) {
  const registryOffset = resolveTemplateAnchorOffset(templateId, rotation, {
    sourceWidth,
    sourceHeight,
    layoutWidth,
    layoutHeight,
  })
  const candidates = new Map<string, { x: number; z: number }>()
  const addCandidate = (x: number, z: number) => {
    candidates.set(`${x},${z}`, { x, z })
  }

  addCandidate(registryOffset.x, registryOffset.z)

  for (let offsetX = -(layoutWidth - 1); offsetX <= 0; offsetX += 1) {
    for (let offsetZ = -(layoutHeight - 1); offsetZ <= 0; offsetZ += 1) {
      addCandidate(offsetX, offsetZ)
    }
  }

  return {
    registryOffset,
    candidates: [...candidates.values()],
  }
}

function scoreLayoutCandidate(
  node: ParsedNodeBase,
  pathPoints: PathLayoutPoint[],
  candidate: Omit<LayoutCandidate, 'score'>,
  registryOffset: { x: number; z: number },
  blueprintWidth: number,
  blueprintHeight: number,
): number {
  let score = 0

  if (candidate.layoutX < 0 || candidate.layoutZ < 0) {
    score += 10_000
  }

  if (candidate.layoutX + candidate.layoutWidth > blueprintWidth) {
    score += 10_000 + (candidate.layoutX + candidate.layoutWidth - blueprintWidth) * 100
  }

  if (candidate.layoutZ + candidate.layoutHeight > blueprintHeight) {
    score += 10_000 + (candidate.layoutZ + candidate.layoutHeight - blueprintHeight) * 100
  }

  score += (Math.abs(candidate.offsetX - registryOffset.x) + Math.abs(candidate.offsetZ - registryOffset.z)) * 6

  for (const pathPoint of pathPoints) {
    if (pathInsideLayout(pathPoint, candidate.layoutX, candidate.layoutZ, candidate.layoutWidth, candidate.layoutHeight)) {
      score += pathPoint.kind === 'pipe' ? 220 : 180
      continue
    }

    const side = detectAdjacentSide(pathPoint, candidate.layoutX, candidate.layoutZ, candidate.layoutWidth, candidate.layoutHeight)
    if (!side) {
      continue
    }

    if (!supportsTemplateConnection(node.templateId, pathPoint.kind)) {
      score += 48
      continue
    }

    const preferredSides = getPreferredLocalSides(node.templateId, pathPoint.kind)
    const localSide = toLocalEdgeSide(side, node.rotation)
    const isPreferred = preferredSides.length === 0 || preferredSides.includes(localSide)

    score -= pathPoint.kind === 'pipe' ? 52 : 44
    score -= isPreferred ? 26 : 8
  }

  return score
}

function resolveSmartLayoutBounds(
  node: ParsedNodeBase,
  blueprintWidth: number,
  blueprintHeight: number,
  pathPoints: PathLayoutPoint[],
) {
  const footprint = node.footprint
  const footprintWidth = footprint?.width ?? 1
  const footprintHeight = footprint?.height ?? 1
  const isQuarterTurn = node.rotation === 90 || node.rotation === 270
  const layoutWidth = isQuarterTurn ? footprintHeight : footprintWidth
  const layoutHeight = isQuarterTurn ? footprintWidth : footprintHeight
  const { registryOffset, candidates } = createCandidateOffsets(
    node.templateId,
    node.rotation,
    layoutWidth,
    layoutHeight,
    footprint?.sourceWidth,
    footprint?.sourceHeight,
  )

  if (STRICT_REGISTRY_LAYOUT_TEMPLATES.has(node.templateId)) {
    return {
      layoutX: node.x + registryOffset.x,
      layoutZ: node.z + registryOffset.z,
      layoutWidth,
      layoutHeight,
    }
  }

  let bestCandidate: LayoutCandidate | null = null

  for (const offset of candidates) {
    const candidate: Omit<LayoutCandidate, 'score'> = {
      offsetX: offset.x,
      offsetZ: offset.z,
      layoutX: node.x + offset.x,
      layoutZ: node.z + offset.z,
      layoutWidth,
      layoutHeight,
    }
    const score = scoreLayoutCandidate(node, pathPoints, candidate, registryOffset, blueprintWidth, blueprintHeight)

    if (!bestCandidate || score < bestCandidate.score) {
      bestCandidate = { ...candidate, score }
    }
  }

  return bestCandidate ?? {
    layoutX: node.x + registryOffset.x,
    layoutZ: node.z + registryOffset.z,
    layoutWidth,
    layoutHeight,
  }
}

interface BeltLayoutBuildingRef {
  node: ParsedNodeBase
  layoutX: number
  layoutZ: number
  layoutWidth: number
  layoutHeight: number
}

interface BeltEndpointAttachmentCandidate {
  nodeId: number
  score: number
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

function pathPointKey(point: { x: number; y: number; z: number }): string {
  return `${Math.round(point.x * 1000)}:${Math.round(point.y * 1000)}:${Math.round(point.z * 1000)}`
}

function resolveEndpointPoint(pathPoints: BlueprintPoint[], reversed: boolean, endpointRole: 'start' | 'end'): BlueprintPoint | null {
  if (pathPoints.length === 0) {
    return null
  }

  if (endpointRole === 'start') {
    return reversed ? pathPoints[pathPoints.length - 1] : pathPoints[0]
  }

  return reversed ? pathPoints[0] : pathPoints[pathPoints.length - 1]
}

function oppositeCardinal(direction: BlueprintCardinal): BlueprintCardinal {
  switch (direction) {
    case 'north':
      return 'south'
    case 'east':
      return 'west'
    case 'south':
      return 'north'
    case 'west':
      return 'east'
  }
}

function cardinalFromDelta(dx: number, dz: number): BlueprintCardinal | null {
  if (dx === 0 && dz === 0) {
    return null
  }

  if (Math.abs(dx) >= Math.abs(dz)) {
    return dx >= 0 ? 'east' : 'west'
  }

  return dz >= 0 ? 'south' : 'north'
}

function resolveEndpointCardinal(pathPoints: BlueprintPoint[], reversed: boolean, endpointRole: 'start' | 'end'): BlueprintCardinal | null {
  if (pathPoints.length < 2) {
    return null
  }

  if (endpointRole === 'start') {
    const startIndex = reversed ? pathPoints.length - 1 : 0
    const step = reversed ? -1 : 1

    for (
      let index = startIndex;
      index + step >= 0 && index + step < pathPoints.length;
      index += step
    ) {
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

function resolveBeltHintWeight(node: ParsedNodeBase): number {
  const forwardStart = resolveEndpointCardinal(node.pathPoints, false, 'start')
  const forwardEnd = resolveEndpointCardinal(node.pathPoints, false, 'end')
  const reversedStart = resolveEndpointCardinal(node.pathPoints, true, 'start')
  const reversedEnd = resolveEndpointCardinal(node.pathPoints, true, 'end')
  const forwardScore = scoreCardinalHint(forwardStart, node.flowInHint) + scoreCardinalHint(forwardEnd, node.flowOutHint)
  const reversedScore = scoreCardinalHint(reversedStart, node.flowInHint) + scoreCardinalHint(reversedEnd, node.flowOutHint)
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

    const side = detectAdjacentSide(point, building.layoutX, building.layoutZ, building.layoutWidth, building.layoutHeight)
    if (!side) {
      continue
    }

    if (!isPointOnCenterlineForSide(point, side)) {
      continue
    }

    const localSide = toLocalEdgeSide(side, building.node.rotation)
    if (
      requiresTemplateCenterSlot(building.node.templateId, 'belt', localSide) &&
      !isPointOnLayoutSideCenterSlot(point, side, building.layoutX, building.layoutZ, building.layoutWidth, building.layoutHeight)
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

function optimizeBeltGraphDirections(nodes: ParsedNodeBase[]): ParsedNodeBase[] {
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

  function scoreNodeDirectionEvidence(node: ParsedNodeBase, reversed: boolean): number {
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

function normalizeNodeBase(node: BlueprintNode): ParsedNodeBase {
  const position = node.transform?.position
  const templateId = node.template_id || 'unknown'
  const directionIn = node.transform?.direction_in ?? null
  const directionOut = node.transform?.direction_out ?? null
  const flowInHint = transportCardinalFromDirection(directionIn)
  const flowOutHint = transportCardinalFromDirection(directionOut)
  const pathPoints = resolvePathPoints(node.transform?.points, templateId, directionIn, directionOut)
  const path = summarizePath(pathPoints, templateId, directionIn, directionOut)
  const anchorPoint = resolveAnchorPoint(position, pathPoints)
  const components = node.components ?? []
  const x = toSafeNumber(anchorPoint?.x)
  const y = toSafeNumber(anchorPoint?.y)
  const z = toSafeNumber(anchorPoint?.z)
  const buildingMeta: BlueprintBuildingMeta | null = path ? null : getBuildingMetadata(templateId)
  const footprint = buildingMeta?.footprint ?? null
  const rotation = normalizeRotation(node.transform?.direction)

  return {
    nodeId: toSafeNumber(node.node_id),
    templateId,
    productIcon: node.product_icon || '-',
    rotation,
    x,
    y,
    z,
    footprint,
    buildingMeta,
    pathPoints,
    path,
    directionIn,
    directionOut,
    flowInHint,
    flowOutHint,
    componentCount: components.length,
    payloadTypes: components.map((component) => component.payload_type || 'unknown'),
    interactive: Boolean(node.transform?.has_interactive_param),
  }
}

export function summarizeBlueprint(raw: string, sourceName = 'untitled.json'): BlueprintSummary {
  const file = parseBlueprintFile(raw)
  const data = file.blueprint_data
  const rawNodes = (data.nodes ?? []).map(normalizeNodeBase)
  const blueprintWidth = Math.max(toSafeNumber(data.bp_size?.x_len), 1)
  const blueprintHeight = Math.max(toSafeNumber(data.bp_size?.z_len), 1)
  const baseNodes = optimizeBeltGraphDirections(rawNodes)
  const pathLayoutPoints: PathLayoutPoint[] = []

  for (const node of baseNodes) {
    if (!node.path || node.path.kind === 'path') {
      continue
    }

    for (const point of node.pathPoints) {
      pathLayoutPoints.push({
        x: point.x,
        z: point.z,
        kind: node.path.kind,
      })
    }
  }

  const nodes = baseNodes.map<BlueprintSummaryNode>((node) => {
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
    }
  })

  const templateCounter = new Map<string, number>()
  const productCounter = new Map<string, number>()
  const payloadCounter = new Map<string, number>()
  const grid = new Map<string, BlueprintSummaryNode[]>()

  let maxX = 0
  let maxZ = 0
  let componentCount = 0
  let interactiveCount = 0

  for (const node of nodes) {
    templateCounter.set(node.templateId, (templateCounter.get(node.templateId) ?? 0) + 1)

    if (node.productIcon !== '-') {
      productCounter.set(node.productIcon, (productCounter.get(node.productIcon) ?? 0) + 1)
    }

    for (const payloadType of node.payloadTypes) {
      payloadCounter.set(payloadType, (payloadCounter.get(payloadType) ?? 0) + 1)
    }

    if (node.pathPoints.length === 0) {
      const key = `${node.layoutX},${node.layoutZ}`
      const stack = grid.get(key) ?? []
      stack.push(node)
      grid.set(key, stack)
    }

    if (node.pathPoints.length > 0) {
      for (const point of node.pathPoints) {
        maxX = Math.max(maxX, point.x)
        maxZ = Math.max(maxZ, point.z)
      }
    } else {
      maxX = Math.max(maxX, node.layoutX + node.layoutWidth - 1)
      maxZ = Math.max(maxZ, node.layoutZ + node.layoutHeight - 1)
    }

    componentCount += node.componentCount
    if (node.interactive) {
      interactiveCount += 1
    }
  }

  const width = Math.max(blueprintWidth, maxX + 1)
  const height = Math.max(blueprintHeight, maxZ + 1)

  return {
    sourceName,
    title: data.name || sourceName.replace(/\.json$/iu, ''),
    description: data.desc || '',
    shareCode: file.share_code || '-',
    reviewStatus: data.review_status_name || String(data.review_status ?? '-'),
    sourceType: data.bp_param?.source_type_name || String(data.bp_param?.source_type ?? '-'),
    width,
    height,
    nodeCount: nodes.length,
    componentCount,
    interactiveCount,
    templateCounts: toCountEntries(templateCounter),
    productCounts: toCountEntries(productCounter),
    payloadCounts: toCountEntries(payloadCounter),
    nodes: [...nodes].sort((left, right) => left.z - right.z || left.x - right.x || left.y - right.y || left.nodeId - right.nodeId),
    grid,
    rawJson: JSON.stringify(file, null, 2),
  }
}
