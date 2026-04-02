import { describe, expect, it } from 'vitest'
import { classifyPathKind, resolvePathPoints, summarizePath } from '@/utils/blueprintPath'

describe('blueprintPath', () => {
  it('expands single-point belt paths using explicit flow directions', () => {
    const points = resolvePathPoints([{ x: 5, y: 0, z: 5 }], 'grid_belt_01', { y: 180 }, { y: 0 })

    expect(points).toEqual([
      { x: 5, y: 0, z: 4.5 },
      { x: 5, y: 0, z: 5 },
      { x: 5, y: 0, z: 5.5 },
    ])
  })

  it('orients belt paths to better match explicit in and out hints', () => {
    const points = resolvePathPoints(
      [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 1, y: 0, z: 1 },
      ],
      'grid_belt_01',
      { y: 180 },
      { y: 90 },
    )

    expect(points).toEqual([
      { x: 1, y: 0, z: 1 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
    ])
  })

  it('summarizes path geometry consistently', () => {
    const points = [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 1, y: 0, z: 1 },
    ]
    const summary = summarizePath(points, 'grid_belt_01')

    expect(classifyPathKind('grid_belt_01')).toBe('belt')
    expect(summary).toMatchObject({
      kind: 'belt',
      segmentCount: 2,
      turnCount: 1,
      totalLength: 2,
      start: { x: 0, y: 0, z: 0 },
      end: { x: 1, y: 0, z: 1 },
    })
  })
})
