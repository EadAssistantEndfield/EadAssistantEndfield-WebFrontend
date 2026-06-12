import type { BlueprintRenderLayoutMode, BlueprintSummaryNode } from '@/features/blueprint/types'
import type { BlueprintNodeLayoutBox } from '@/features/blueprint/domain/path/blueprintPathAttachment'

export function resolveNodeLayoutBox(
  node: BlueprintSummaryNode,
  renderMode: BlueprintRenderLayoutMode,
): BlueprintNodeLayoutBox {
  if (renderMode === 'source') {
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

export function resolveDisplayBounds(
  nodes: BlueprintSummaryNode[],
  blueprintWidth: number,
  blueprintHeight: number,
  renderMode: BlueprintRenderLayoutMode,
): { width: number; height: number } {
  let maxX = blueprintWidth - 1
  let maxZ = blueprintHeight - 1

  for (const node of nodes) {
    if (node.path) {
      for (const point of node.pathPoints) {
        maxX = Math.max(maxX, point.x)
        maxZ = Math.max(maxZ, point.z)
      }
      continue
    }

    const box = resolveNodeLayoutBox(node, renderMode)
    maxX = Math.max(maxX, box.x + box.width - 1)
    maxZ = Math.max(maxZ, box.z + box.height - 1)
  }

  return { width: maxX + 1, height: maxZ + 1 }
}
