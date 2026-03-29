import type {
  BlueprintCardinal,
  BlueprintPathKind,
  BlueprintPathSummary,
  BlueprintPoint,
  BlueprintPosition,
} from '@/types'
import { toSafeNumber, cardinalFromDelta, oppositeCardinal } from '@/utils/geometry'

function samePoint(left: BlueprintPoint, right: BlueprintPoint): boolean {
  return left.x === right.x && left.y === right.y && left.z === right.z
}

function normalizeDirection(delta: number): number {
  if (delta === 0) {
    return 0
  }

  return delta > 0 ? 1 : -1
}

function directionBetween(start: BlueprintPoint, end: BlueprintPoint): string {
  return [
    normalizeDirection(end.x - start.x),
    normalizeDirection(end.y - start.y),
    normalizeDirection(end.z - start.z),
  ].join(',')
}

function normalizeRotationY(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }

  return ((Math.round(value / 90) * 90) % 360 + 360) % 360
}

export function transportCardinalFromDirection(direction?: Record<string, unknown> | null): BlueprintCardinal | null {
  const rotationY = normalizeRotationY(direction?.y)

  switch (rotationY) {
    case 0:
      return 'south'
    case 90:
      return 'west'
    case 180:
      return 'north'
    case 270:
      return 'east'
    default:
      return null
  }
}

function movePoint(point: BlueprintPoint, direction: BlueprintCardinal, distance: number): BlueprintPoint {
  switch (direction) {
    case 'north':
      return { ...point, z: point.z - distance }
    case 'east':
      return { ...point, x: point.x + distance }
    case 'south':
      return { ...point, z: point.z + distance }
    case 'west':
      return { ...point, x: point.x - distance }
  }
}

function segmentCardinal(points: BlueprintPoint[], role: 'start' | 'end'): BlueprintCardinal | null {
  if (points.length < 2) {
    return null
  }

  if (role === 'start') {
    for (let index = 1; index < points.length; index += 1) {
      const previous = points[index - 1]
      const current = points[index]
      const direction = cardinalFromDelta(current.x - previous.x, current.z - previous.z)
      if (direction) {
        return direction
      }
    }

    return null
  }

  for (let index = points.length - 1; index >= 1; index -= 1) {
    const previous = points[index - 1]
    const current = points[index]
    const direction = cardinalFromDelta(current.x - previous.x, current.z - previous.z)
    if (direction) {
      return direction
    }
  }

  return null
}

function orientationScore(points: BlueprintPoint[], flowIn: BlueprintCardinal | null, flowOut: BlueprintCardinal | null): number {
  const startDirection = segmentCardinal(points, 'start')
  const endDirection = segmentCardinal(points, 'end')
  let score = 0

  if (flowIn && startDirection) {
    score += startDirection === flowIn ? 3 : oppositeCardinal(startDirection) === flowIn ? 1 : -2
  }

  if (flowOut && endDirection) {
    score += endDirection === flowOut ? 3 : oppositeCardinal(endDirection) === flowOut ? 1 : -2
  }

  return score
}

function orientTransportPathPoints(pathPoints: BlueprintPoint[], flowIn: BlueprintCardinal | null, flowOut: BlueprintCardinal | null): BlueprintPoint[] {
  if (pathPoints.length < 2 || (!flowIn && !flowOut)) {
    return pathPoints
  }

  const forwardScore = orientationScore(pathPoints, flowIn, flowOut)
  const reversed = [...pathPoints].reverse()
  const reversedScore = orientationScore(reversed, flowIn, flowOut)

  return reversedScore > forwardScore ? reversed : pathPoints
}

export function normalizePathPoints(points?: BlueprintPosition[] | null): BlueprintPoint[] {
  const normalized = (points ?? []).map<BlueprintPoint>((point) => ({
    x: toSafeNumber(point?.x),
    y: toSafeNumber(point?.y),
    z: toSafeNumber(point?.z),
  }))

  return normalized.filter((point, index) => index === 0 || !samePoint(point, normalized[index - 1]))
}

function isSinglePointTransportPath(templateId: string, points: BlueprintPoint[]): boolean {
  return classifyPathKind(templateId) === 'belt' && points.length === 1
}

function expandSinglePointTransportPath(
  center: BlueprintPoint,
  flowIn: BlueprintCardinal | null,
  flowOut: BlueprintCardinal | null,
  edgeOffset = 0.5,
): BlueprintPoint[] {
  if (flowIn && flowOut && flowIn !== flowOut) {
    return [movePoint(center, flowIn, edgeOffset), center, movePoint(center, flowOut, edgeOffset)]
  }

  if (flowOut) {
    return [movePoint(center, oppositeCardinal(flowOut), edgeOffset), movePoint(center, flowOut, edgeOffset)]
  }

  if (flowIn) {
    return [movePoint(center, flowIn, edgeOffset), center]
  }

  return [center]
}

export function resolvePathPoints(
  points: BlueprintPosition[] | null | undefined,
  templateId: string,
  directionIn?: Record<string, unknown> | null,
  directionOut?: Record<string, unknown> | null,
): BlueprintPoint[] {
  const normalized = normalizePathPoints(points)
  const kind = classifyPathKind(templateId)
  const flowIn = transportCardinalFromDirection(directionIn)
  const flowOut = transportCardinalFromDirection(directionOut)

  const resolvedPoints = isSinglePointTransportPath(templateId, normalized)
    ? expandSinglePointTransportPath(normalized[0], flowIn, flowOut)
    : normalized

  if (kind !== 'belt') {
    return resolvedPoints
  }

  return orientTransportPathPoints(resolvedPoints, flowIn, flowOut)
}

export function classifyPathKind(templateId: string): BlueprintPathKind {
  if (templateId.startsWith('grid_belt')) {
    return 'belt'
  }

  if (templateId.startsWith('log_pipe')) {
    return 'pipe'
  }

  return 'path'
}

export function summarizePath(
  pathPoints: BlueprintPoint[],
  templateId: string,
  directionIn?: Record<string, unknown> | null,
  directionOut?: Record<string, unknown> | null,
): BlueprintPathSummary | null {
  if (pathPoints.length === 0) {
    return null
  }

  let totalLength = 0
  let turnCount = 0
  let previousDirection = ''

  for (let index = 1; index < pathPoints.length; index += 1) {
    const previousPoint = pathPoints[index - 1]
    const currentPoint = pathPoints[index]
    totalLength +=
      Math.abs(currentPoint.x - previousPoint.x) +
      Math.abs(currentPoint.y - previousPoint.y) +
      Math.abs(currentPoint.z - previousPoint.z)

    const currentDirection = directionBetween(previousPoint, currentPoint)
    if (previousDirection && currentDirection !== previousDirection) {
      turnCount += 1
    }

    previousDirection = currentDirection
  }

  const explicitFlowIn = transportCardinalFromDirection(directionIn)
  const explicitFlowOut = transportCardinalFromDirection(directionOut)
  const inferredFlowIn = segmentCardinal(pathPoints, 'start')
  const inferredFlowOut = segmentCardinal(pathPoints, 'end')

  return {
    kind: classifyPathKind(templateId),
    points: pathPoints,
    start: pathPoints[0],
    end: pathPoints[pathPoints.length - 1],
    flowIn: explicitFlowIn ?? inferredFlowIn,
    flowOut: explicitFlowOut ?? inferredFlowOut,
    segmentCount: Math.max(pathPoints.length - 1, 0),
    turnCount,
    totalLength,
  }
}
