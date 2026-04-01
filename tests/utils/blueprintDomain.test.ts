import { describe, expect, it } from 'vitest'
import type { ParsedBlueprintNodeInput } from '@/utils/blueprintParser'
import { resolveBlueprintSummaryNodes } from '@/utils/blueprintDomain'

function makeNode(overrides: Partial<ParsedBlueprintNodeInput>): ParsedBlueprintNodeInput {
  return {
    nodeId: 0,
    templateId: 'unknown',
    productIcon: '-',
    position: { x: 0, y: 0, z: 0 },
    direction: null,
    directionIn: null,
    directionOut: null,
    points: null,
    componentCount: 0,
    payloadTypes: [],
    interactive: false,
    interactiveParam: null,
    snapHint: null,
    ...overrides,
  }
}

describe('blueprintDomain', () => {
  it('normalizes rotated building layouts into occupied cells', () => {
    const [node] = resolveBlueprintSummaryNodes([
      makeNode({
        nodeId: 1,
        templateId: 'power_station_1',
        position: { x: 2, y: 0, z: 3 },
        direction: { y: 90 },
      }),
    ])

    expect(node).toMatchObject({
      x: 2,
      z: 3,
      sourceLayoutX: 2,
      sourceLayoutZ: 3,
      layoutX: 2,
      layoutZ: 2,
      layoutWidth: 2,
      layoutHeight: 2,
      rotation: 90,
    })
    expect(node.occupiedCells).toEqual([
      { x: 2, z: 2 },
      { x: 2, z: 3 },
      { x: 3, z: 2 },
      { x: 3, z: 3 },
    ])
  })

  it('optimizes belt directions using building attachment evidence', () => {
    const nodes = resolveBlueprintSummaryNodes([
      makeNode({
        nodeId: 1,
        templateId: 'log_splitter',
        position: { x: 0, y: 0, z: 0 },
      }),
      makeNode({
        nodeId: 2,
        templateId: 'log_conditioner',
        position: { x: 3, y: 0, z: 0 },
      }),
      makeNode({
        nodeId: 3,
        templateId: 'log_splitter',
        position: { x: 6, y: 0, z: 0 },
      }),
      makeNode({
        nodeId: 11,
        templateId: 'grid_belt_01',
        position: null,
        points: [
          { x: 2, y: 0, z: 0 },
          { x: 1, y: 0, z: 0 },
        ],
      }),
      makeNode({
        nodeId: 12,
        templateId: 'grid_belt_01',
        position: null,
        points: [
          { x: 5, y: 0, z: 0 },
          { x: 4, y: 0, z: 0 },
        ],
      }),
    ])

    const firstBelt = nodes.find((node) => node.nodeId === 11)
    const secondBelt = nodes.find((node) => node.nodeId === 12)

    expect(firstBelt?.pathPoints).toEqual([
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
    ])
    expect(secondBelt?.pathPoints).toEqual([
      { x: 4, y: 0, z: 0 },
      { x: 5, y: 0, z: 0 },
    ])
    expect(firstBelt?.path?.flowOut).toBe('east')
    expect(secondBelt?.path?.flowOut).toBe('east')
  })
})
