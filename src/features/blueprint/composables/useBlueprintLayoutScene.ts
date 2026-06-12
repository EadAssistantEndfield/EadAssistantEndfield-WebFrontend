import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import type { BlueprintRenderLayoutMode, BlueprintSummary, BlueprintSummaryNode } from '@/features/blueprint/types'
import { resolveNodeLayoutBox } from '@/features/blueprint/domain/blueprintLayoutBox'
import { getLayoutTheme } from '@/features/blueprint/domain/layoutTheme'
import { usesDirectScreenRotation } from '@/features/blueprint/domain/templateRegistry'

type ItemLabel = (itemId: string) => string
interface LayoutBounds {
  width: number
  height: number
}

export function useBlueprintLayoutScene(
  summarySource: MaybeRefOrGetter<BlueprintSummary>,
  renderModeSource: MaybeRefOrGetter<BlueprintRenderLayoutMode>,
  cellSize: number,
  cellX: (x: number) => number,
  cellZ: (z: number) => number,
  buildingLabel: (node: BlueprintSummaryNode) => string,
  itemLabel: ItemLabel,
  displayBoundsSource: MaybeRefOrGetter<LayoutBounds>,
) {
  const summary = computed(() => toValue(summarySource))
  const renderMode = computed(() => toValue(renderModeSource))
  const displayBounds = computed(() => toValue(displayBoundsSource))

  function layoutBox(node: BlueprintSummaryNode) {
    return resolveNodeLayoutBox(node, renderMode.value)
  }

  const buildingNodes = computed(() =>
    [...summary.value.nodes]
      .filter((node) => node.path === null)
      .sort(
        (left, right) =>
          layoutBox(right).width * layoutBox(right).height - layoutBox(left).width * layoutBox(left).height ||
          left.nodeId - right.nodeId,
      ),
  )

  const occupiedCells = computed(() => {
    const cells: Array<{ key: string; cell: { x: number; z: number }; node: BlueprintSummaryNode }> = []

    for (const node of buildingNodes.value) {
      const box = layoutBox(node)
      for (let x = box.x; x < box.x + box.width; x += 1) {
        for (let z = box.z; z < box.z + box.height; z += 1) {
          const cell = { x, z }
          cells.push({ key: `${node.nodeId}-${x}-${z}-${renderMode.value}`, cell, node })
        }
      }
    }

    return cells
  })

  function clipId(node: BlueprintSummaryNode): string {
    return `building-clip-${node.nodeId}`
  }

  function labelX(node: BlueprintSummaryNode): number {
    return cellX(layoutBox(node).x) + 10
  }

  function labelY(node: BlueprintSummaryNode): number {
    return cellZ(layoutBox(node).z) + 20
  }

  function showImage(node: BlueprintSummaryNode): boolean {
    return Boolean(node.buildingMeta?.imageUrl)
  }

  function showLabel(node: BlueprintSummaryNode): boolean {
    const box = layoutBox(node)
    return box.width >= 2 || box.height >= 2
  }

  function showSubtitle(node: BlueprintSummaryNode): boolean {
    const box = layoutBox(node)
    return box.width >= 3 || box.height >= 3
  }

  function anchorX(node: BlueprintSummaryNode): number {
    return cellX(node.x) + cellSize / 2
  }

  function anchorZ(node: BlueprintSummaryNode): number {
    return cellZ(node.z) + cellSize / 2
  }

  function sourceAnchorX(node: BlueprintSummaryNode): number {
    const box = layoutBox(node)
    return cellX(box.x) + (box.width * cellSize) / 2
  }

  function sourceAnchorZ(node: BlueprintSummaryNode): number {
    const box = layoutBox(node)
    return cellZ(box.z) + (box.height * cellSize) / 2
  }

  function imageBox(node: BlueprintSummaryNode) {
    const box = layoutBox(node)
    const layoutPixelWidth = box.width * cellSize
    const layoutPixelHeight = box.height * cellSize

    if (renderMode.value === 'source') {
      return {
        x: cellX(box.x) + 4,
        y: cellZ(box.z) + 4,
        width: layoutPixelWidth - 8,
        height: layoutPixelHeight - 8,
      }
    }

    const sourceWidth = node.footprint?.sourceWidth ?? box.width
    const sourceHeight = node.footprint?.sourceHeight ?? box.height
    const imageWidth = sourceWidth * cellSize - 8
    const imageHeight = sourceHeight * cellSize - 8

    return {
      x: cellX(box.x) + (layoutPixelWidth - imageWidth) / 2,
      y: cellZ(box.z) + (layoutPixelHeight - imageHeight) / 2,
      width: imageWidth,
      height: imageHeight,
    }
  }

  function imageTransform(node: BlueprintSummaryNode): string | undefined {
    if (renderMode.value === 'source' || node.rotation === 0) {
      return undefined
    }

    const box = layoutBox(node)
    const centerX = cellX(box.x) + (box.width * cellSize) / 2
    const centerZ = cellZ(box.z) + (box.height * cellSize) / 2
    const screenRotation = usesDirectScreenRotation(node.templateId) ? node.rotation : (360 - node.rotation) % 360

    return `rotate(${screenRotation} ${centerX} ${centerZ})`
  }

  function nodeTitle(node: BlueprintSummaryNode): string {
    const box = layoutBox(node)
    return [
      `#${node.nodeId}`,
      buildingLabel(node),
      node.templateId,
      `anchor=(${node.x}, ${node.y}, ${node.z})`,
      `layout=(${box.x}, ${box.z}) ${box.width}x${box.height}`,
      node.productIcon !== '-' ? itemLabel(node.productIcon) : '',
    ]
      .filter(Boolean)
      .join(' | ')
  }

  function cellTheme(node: BlueprintSummaryNode) {
    return getLayoutTheme(node)
  }

  return {
    displayBounds,
    buildingNodes,
    occupiedCells,
    layoutBox,
    clipId,
    labelX,
    labelY,
    showImage,
    showLabel,
    showSubtitle,
    anchorX,
    anchorZ,
    sourceAnchorX,
    sourceAnchorZ,
    imageBox,
    imageTransform,
    nodeTitle,
    cellTheme,
  }
}
