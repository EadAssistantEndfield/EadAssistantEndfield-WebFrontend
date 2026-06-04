import type { BlueprintCardinal } from '@/features/blueprint/types'
import type { EdgeSide } from '@/features/blueprint/domain/templateConnectionRegistry'

export function toSafeNumber(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

export function isNearlyInteger(value: number, epsilon = 1e-6): boolean {
  return Math.abs(value - Math.round(value)) <= epsilon
}

export function isPointOnCenterlineForSide(point: { x: number; z: number }, side: EdgeSide): boolean {
  if (side === 'north' || side === 'south') {
    return isNearlyInteger(point.x)
  }

  return isNearlyInteger(point.z)
}

export function cardinalFromDelta(dx: number, dz: number): BlueprintCardinal | null {
  if (dx === 0 && dz === 0) {
    return null
  }

  if (Math.abs(dx) >= Math.abs(dz)) {
    return dx >= 0 ? 'east' : 'west'
  }

  return dz >= 0 ? 'south' : 'north'
}

export function oppositeCardinal(direction: BlueprintCardinal): BlueprintCardinal {
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

export function detectAdjacentSide(
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
  const inRange = (value: number, rangeMin: number, rangeMax: number) =>
    value >= rangeMin - epsilon && value <= rangeMax + epsilon
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

export function pathPointKey(point: { x: number; y: number; z: number }): string {
  return `${Math.round(point.x * 1000)}:${Math.round(point.y * 1000)}:${Math.round(point.z * 1000)}`
}
