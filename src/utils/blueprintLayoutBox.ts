import type { BlueprintRenderLayoutMode, BlueprintSummaryNode } from '@/types'
import type { BlueprintNodeLayoutBox } from '@/utils/blueprintPathAttachment'

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
