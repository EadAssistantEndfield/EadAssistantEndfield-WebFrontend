export interface PixelPoint {
  x: number
  y: number
}

export function samePixelPoint(left: PixelPoint | null | undefined, right: PixelPoint | null | undefined): boolean {
  return Boolean(left && right && left.x === right.x && left.y === right.y)
}

export function appendUniquePoint(target: PixelPoint[], point: PixelPoint) {
  const previous = target[target.length - 1]
  if (!samePixelPoint(previous, point)) {
    target.push(point)
  }
}

export function buildRenderedPathPixels(
  basePoints: PixelPoint[],
  snappedStart: PixelPoint | null,
  snappedEnd: PixelPoint | null,
): PixelPoint[] {
  const snappedPoints = [...basePoints]

  if (snappedStart) {
    snappedPoints[0] = snappedStart
  }

  if (snappedEnd) {
    snappedPoints[snappedPoints.length - 1] = snappedEnd
  }

  const expanded: PixelPoint[] = []

  snappedPoints.forEach((point, index) => {
    const originalPoint = basePoints[index]

    if (index === 0 && snappedStart) {
      appendUniquePoint(expanded, point)
      if (!samePixelPoint(point, originalPoint)) {
        appendUniquePoint(expanded, originalPoint)
      }
      return
    }

    if (index === snappedPoints.length - 1 && snappedEnd) {
      if (!samePixelPoint(point, originalPoint)) {
        appendUniquePoint(expanded, originalPoint)
      }
      appendUniquePoint(expanded, point)
      return
    }

    appendUniquePoint(expanded, point)
  })

  return expanded
}

export function toPolylinePoints(points: PixelPoint[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(' ')
}

export function resolveBeltArrowPoints(points: PixelPoint[], cellSize: number): string | null {
  if (points.length < 2) {
    return null
  }

  const tipPoint = points[points.length - 1]
  const basePoint = [...points].reverse().find((point) => !samePixelPoint(point, tipPoint))

  if (!tipPoint || !basePoint) {
    return null
  }

  const dx = tipPoint.x - basePoint.x
  const dy = tipPoint.y - basePoint.y
  const length = Math.hypot(dx, dy)

  if (!length) {
    return null
  }

  const ux = dx / length
  const uy = dy / length
  const baseX = tipPoint.x - ux * cellSize * 0.34
  const baseY = tipPoint.y - uy * cellSize * 0.34
  const wingX = -uy * cellSize * 0.18
  const wingY = ux * cellSize * 0.18

  return [
    `${tipPoint.x},${tipPoint.y}`,
    `${baseX + wingX},${baseY + wingY}`,
    `${baseX - wingX},${baseY - wingY}`,
  ].join(' ')
}
