export interface BlueprintPosition {
  x?: number | null
  y?: number | null
  z?: number | null
}

export interface BlueprintPoint {
  x: number
  y: number
  z: number
}

export type BlueprintRotation = 0 | 90 | 180 | 270
export type BlueprintCardinal = 'north' | 'east' | 'south' | 'west'
export type BlueprintRenderLayoutMode = 'normalized' | 'source'

export type BlueprintPathKind = 'belt' | 'pipe' | 'path'

export interface BlueprintPathSummary {
  kind: BlueprintPathKind
  points: BlueprintPoint[]
  start: BlueprintPoint | null
  end: BlueprintPoint | null
  flowIn: BlueprintCardinal | null
  flowOut: BlueprintCardinal | null
  segmentCount: number
  turnCount: number
  totalLength: number
}

export interface BlueprintTransform {
  position?: BlueprintPosition | null
  direction?: Record<string, unknown> | null
  direction_in?: Record<string, unknown> | null
  direction_out?: Record<string, unknown> | null
  points?: BlueprintPosition[] | null
  has_interactive_param?: boolean
}

export interface BlueprintComponent {
  com_type?: number
  com_pos?: number
  payload_type?: string
  payload?: Record<string, unknown> | null
}

export interface BlueprintNode {
  node_id?: number
  template_id?: string
  product_icon?: string
  transform?: BlueprintTransform | null
  components?: BlueprintComponent[] | null
}

export interface BlueprintParam {
  source_type?: number
  source_type_name?: string
  payload_type?: string
  payload?: Record<string, unknown> | null
}

export interface BlueprintData {
  name?: string
  desc?: string
  bp_size?: {
    x_len?: number
    z_len?: number
  }
  bp_icon?: {
    icon?: string
    base_color?: number
  }
  bp_tags?: string[]
  review_status?: number
  review_status_name?: string
  bp_param?: BlueprintParam
  use_count?: number
  creator_role_id?: number
  creator_user_id?: string
  nodes?: BlueprintNode[]
  node_count?: number
  component_count?: number
}

export interface BlueprintFile {
  request_index?: string
  share_code?: string
  response_index?: string
  blueprint_data: BlueprintData
}

export interface BlueprintBuildingFootprint {
  raw: string
  sourceWidth: number
  sourceHeight: number
  width: number
  height: number
}

export interface BlueprintCell {
  x: number
  z: number
}

export interface BlueprintBuildingMeta {
  catalogName: string
  deviceType: string
  purpose: string
  footprint: BlueprintBuildingFootprint | null
  imageUrl: string | null
}

export interface BlueprintSummaryNode {
  nodeId: number
  templateId: string
  productIcon: string
  rotation: BlueprintRotation
  x: number
  y: number
  z: number
  layoutX: number
  layoutZ: number
  layoutWidth: number
  layoutHeight: number
  sourceLayoutX: number
  sourceLayoutZ: number
  sourceLayoutWidth: number
  sourceLayoutHeight: number
  footprint: BlueprintBuildingFootprint | null
  buildingMeta: BlueprintBuildingMeta | null
  occupiedCells: BlueprintCell[]
  pathPoints: BlueprintPoint[]
  path: BlueprintPathSummary | null
  componentCount: number
  payloadTypes: string[]
  interactive: boolean
}

export interface CountEntry {
  name: string
  count: number
}

export interface BlueprintSummary {
  sourceName: string
  title: string
  description: string
  shareCode: string
  reviewStatus: string
  sourceType: string
  width: number
  height: number
  nodeCount: number
  componentCount: number
  interactiveCount: number
  templateCounts: CountEntry[]
  productCounts: CountEntry[]
  payloadCounts: CountEntry[]
  nodes: BlueprintSummaryNode[]
  grid: Map<string, BlueprintSummaryNode[]>
  rawJson: string
}
