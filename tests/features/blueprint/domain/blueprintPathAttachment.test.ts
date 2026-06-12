import { describe, expect, it } from 'vitest'
import type { BlueprintSummaryNode } from '@/features/blueprint/types'
import {
  resolvePathAttachment,
  resolvePathAttachmentCandidate,
  type BlueprintNodeLayoutBox,
} from '@/features/blueprint/domain/blueprintPathAttachment'

function makeBuildingNode(
  templateId: string,
  nodeId: number,
  layout: BlueprintNodeLayoutBox,
  rotation: BlueprintSummaryNode['rotation'] = 0,
): BlueprintSummaryNode {
  return {
    nodeId,
    templateId,
    productIcon: '-',
    rotation,
    x: layout.x,
    y: 0,
    z: layout.z,
    layoutX: layout.x,
    layoutZ: layout.z,
    layoutWidth: layout.width,
    layoutHeight: layout.height,
    sourceLayoutX: layout.x,
    sourceLayoutZ: layout.z,
    sourceLayoutWidth: layout.width,
    sourceLayoutHeight: layout.height,
    footprint: null,
    buildingMeta: null,
    occupiedCells: [],
    pathPoints: [],
    path: null,
    componentCount: 0,
    payloadTypes: [],
    interactive: false,
    interactiveParam: null,
    snapHint: null,
  }
}

const context = {
  cellSize: 10,
  cellX: (x: number) => x * 10,
  cellZ: (z: number) => z * 10,
  nodeLayout: (node: BlueprintSummaryNode) => ({
    x: node.layoutX,
    z: node.layoutZ,
    width: node.layoutWidth,
    height: node.layoutHeight,
  }),
}

describe('blueprintPathAttachment', () => {
  it('prefers the candidate with the better semantic side rule', () => {
    const splitter = makeBuildingNode('log_splitter', 1, { x: 0, z: 0, width: 2, height: 1 })
    const storage = makeBuildingNode('storager_1', 2, { x: 3, z: 0, width: 1, height: 1 })

    const candidate = resolvePathAttachmentCandidate({ x: 2, z: 0 }, 'belt', 'start', [splitter, storage], context)

    expect(candidate).toMatchObject({
      nodeId: 1,
      side: 'east',
    })
    expect(candidate?.point).toEqual({
      x: 16,
      y: 5,
    })
  })

  it('honors center-slot requirements when attaching to special templates', () => {
    const unloader = makeBuildingNode('unloader_1', 9, { x: 0, z: 0, width: 3, height: 3 })

    const offCenter = resolvePathAttachmentCandidate(
      { x: 0, z: -0.5 },
      'belt',
      'start',
      [unloader],
      context,
      { requireCenterline: true },
    )
    const centered = resolvePathAttachment(
      { x: 1, z: -0.5 },
      'belt',
      'start',
      [unloader],
      context,
    )

    expect(offCenter).toBeNull()
    expect(centered).toEqual({
      x: 15,
      y: 4,
    })
  })
})
