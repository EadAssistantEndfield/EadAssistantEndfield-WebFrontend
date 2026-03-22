import type { BlueprintRotation } from '@/types'

interface LayoutOffset {
  x: number
  z: number
}

export interface TemplateAnchorContext {
  sourceWidth?: number
  sourceHeight?: number
  layoutWidth: number
  layoutHeight: number
}

function resolveUnrotatedDimensions(rotation: BlueprintRotation, context: TemplateAnchorContext) {
  if (typeof context.sourceWidth === 'number' && typeof context.sourceHeight === 'number') {
    return {
      width: context.sourceWidth,
      height: context.sourceHeight,
    }
  }

  if (rotation === 90 || rotation === 270) {
    return {
      width: context.layoutHeight,
      height: context.layoutWidth,
    }
  }

  return {
    width: context.layoutWidth,
    height: context.layoutHeight,
  }
}

function topLeftPivotOffset(rotation: BlueprintRotation, widthAt0: number, heightAt0: number): LayoutOffset {
  switch (rotation) {
    case 90:
      return { x: 0, z: -(widthAt0 - 1) }
    case 180:
      return { x: -(widthAt0 - 1), z: -(heightAt0 - 1) }
    case 270:
      return { x: -(heightAt0 - 1), z: 0 }
    case 0:
    default:
      return { x: 0, z: 0 }
  }
}

export function resolveTemplateAnchorOffset(
  _templateId: string,
  rotation: BlueprintRotation,
  context: TemplateAnchorContext,
): LayoutOffset {
  const { width, height } = resolveUnrotatedDimensions(rotation, context)
  return topLeftPivotOffset(rotation, width, height)
}
