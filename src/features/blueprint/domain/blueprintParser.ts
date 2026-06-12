import type {
  BlueprintComponent,
  BlueprintFile,
  BlueprintInteractiveParam,
  BlueprintNode,
  BlueprintPosition,
  BlueprintSnapHint,
} from '@/features/blueprint/types'
import { toSafeNumber } from '@/features/blueprint/domain/geometry'

export interface ParsedBlueprintNodeInput {
  nodeId: number
  templateId: string
  productIcon: string
  position: BlueprintPosition | null | undefined
  direction: Record<string, unknown> | null
  directionIn: Record<string, unknown> | null
  directionOut: Record<string, unknown> | null
  points: BlueprintPosition[] | null | undefined
  componentCount: number
  payloadTypes: string[]
  interactive: boolean
  interactiveParam: BlueprintInteractiveParam | null
  snapHint: BlueprintSnapHint | null
}

export function parseBlueprintFile(raw: string): BlueprintFile {
  const parsed = JSON.parse(raw) as unknown

  if (typeof parsed !== 'object' || parsed === null || !('blueprint_data' in parsed)) {
    throw new Error('MISSING_BLUEPRINT_DATA')
  }

  return parsed as BlueprintFile
}

function normalizeComponents(components?: BlueprintComponent[] | null): BlueprintComponent[] {
  return components ?? []
}

export function parseBlueprintNode(node: BlueprintNode): ParsedBlueprintNodeInput {
  const transform = (node.transform as Record<string, unknown> | null | undefined) ?? null
  const components = normalizeComponents(node.components)

  return {
    nodeId: toSafeNumber(node.node_id),
    templateId: node.template_id || 'unknown',
    productIcon: node.product_icon || '-',
    position: node.transform?.position,
    direction: node.transform?.direction ?? null,
    directionIn: node.transform?.direction_in ?? null,
    directionOut: node.transform?.direction_out ?? null,
    points: node.transform?.points,
    componentCount: components.length,
    payloadTypes: components.map((component) => component.payload_type || 'unknown'),
    interactive: Boolean(node.transform?.has_interactive_param),
    interactiveParam: (transform?.interactive_param as BlueprintInteractiveParam | null) ?? null,
    snapHint: (transform?.snap_hint as BlueprintSnapHint | null) ?? null,
  }
}

export function parseBlueprintNodes(nodes?: BlueprintNode[] | null): ParsedBlueprintNodeInput[] {
  return (nodes ?? []).map(parseBlueprintNode)
}
