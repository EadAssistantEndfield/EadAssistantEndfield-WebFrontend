import type { BlueprintPathKind, BlueprintRotation } from '@/types'

export type EdgeSide = 'north' | 'east' | 'south' | 'west'
export type TemplateConnectionTag = 'belt_logistics'
export type TemplatePortRole = 'input' | 'output' | 'bidirectional' | 'unknown'

export interface TemplateConnectionRule {
  priority: number
  start?: EdgeSide[]
  end?: EdgeSide[]
}

const BELT_CONNECTABLE_TEMPLATES = new Set([
  'furnance_1',
  'grinder_1',
  'thickener_1',
  'xiranite_oven_1',
  'planter_1',
  'seedcollector_1',
  'storager_1',
  'unloader_1',
  'log_connector',
  'log_splitter',
  'log_hongs_bus',
  'log_hongs_bus_source',
])

const TEMPLATE_CONNECTION_TAGS: Partial<Record<string, TemplateConnectionTag[]>> = {
  log_conditioner: ['belt_logistics'],
  log_splitter: ['belt_logistics'],
  log_hongs_bus_source: ['belt_logistics'],
}

const BELT_CONNECTABLE_TAGS = new Set<TemplateConnectionTag>(['belt_logistics'])
const BELT_TAG_DEFAULT_RULES: Record<TemplateConnectionTag, TemplateConnectionRule> = {
  belt_logistics: {
    priority: 92,
    start: ['north', 'east', 'south', 'west'],
    end: ['north', 'east', 'south', 'west'],
  },
}

const PIPE_CONNECTABLE_TEMPLATES = new Set([
  'log_pipe_splitter',
  'log_pipe_conditioner',
  'xiranite_oven_1',
  'thickener_1',
  'planter_1',
  'seedcollector_1',
  'storager_1',
])

const BELT_TEMPLATE_RULES: Partial<Record<string, TemplateConnectionRule>> = {
  log_connector: { priority: 120, start: ['north', 'south', 'west', 'east'], end: ['north', 'south', 'west', 'east'] },
  log_splitter: { priority: 115, start: ['east', 'north', 'south'], end: ['west', 'north', 'south'] },
  log_conditioner: { priority: 112, start: ['east', 'west'], end: ['east', 'west'] },
  log_hongs_bus_source: { priority: 110, start: ['east', 'west'], end: ['east', 'west'] },
  log_hongs_bus: { priority: 105, start: ['east', 'west'], end: ['east', 'west'] },
  unloader_1: { priority: 100, start: ['north', 'south'], end: ['north', 'south'] },
  storager_1: { priority: 95, start: ['north'], end: ['north'] },
  grinder_1: { priority: 90, start: ['north', 'east'], end: ['north'] },
  furnance_1: { priority: 88, start: ['south', 'north'], end: ['south', 'north'] },
  thickener_1: { priority: 86, start: ['north'], end: ['north', 'west'] },
  xiranite_oven_1: { priority: 84, start: ['north'], end: ['north', 'west'] },
  planter_1: { priority: 82, start: ['north'], end: ['north'] },
  seedcollector_1: { priority: 82, start: ['north'], end: ['north'] },
}

const BELT_PORT_ROLE_OVERRIDES: Partial<Record<string, Partial<Record<EdgeSide, TemplatePortRole>>>> = {
  // Splitter: west is input, east/north/south are outputs.
  log_splitter: {
    west: 'input',
    east: 'output',
    north: 'output',
    south: 'output',
  },
}

const BELT_CENTER_SLOT_LOCAL_SIDES: Partial<Record<string, EdgeSide[]>> = {
  // Storage unloader should only connect at edge center cells.
  unloader_1: ['north', 'south'],
}

const PIPE_TEMPLATE_RULES: Partial<Record<string, TemplateConnectionRule>> = {
  log_pipe_splitter: { priority: 120, start: ['north', 'east'], end: ['south', 'east'] },
  log_pipe_conditioner: { priority: 115, start: ['south', 'west'], end: ['north', 'west'] },
  xiranite_oven_1: { priority: 90, start: ['west'], end: ['west'] },
  planter_1: { priority: 88, start: ['west'], end: ['west'] },
  seedcollector_1: { priority: 88, start: ['north', 'west'], end: ['north', 'west'] },
  storager_1: { priority: 86, start: ['west', 'north'], end: ['west', 'north'] },
  thickener_1: { priority: 84, start: ['west', 'north'], end: ['west', 'north'] },
}

function hasTemplateConnectionTag(templateId: string, tag: TemplateConnectionTag): boolean {
  return TEMPLATE_CONNECTION_TAGS[templateId]?.includes(tag) ?? false
}

export function supportsTemplateConnection(templateId: string, kind: BlueprintPathKind): boolean {
  if (kind === 'belt') {
    if (BELT_CONNECTABLE_TEMPLATES.has(templateId)) {
      return true
    }

    for (const tag of BELT_CONNECTABLE_TAGS) {
      if (hasTemplateConnectionTag(templateId, tag)) {
        return true
      }
    }

    return false
  }

  if (kind === 'pipe') {
    return PIPE_CONNECTABLE_TEMPLATES.has(templateId)
  }

  return false
}

export function getTemplateConnectionRule(templateId: string, kind: BlueprintPathKind): TemplateConnectionRule | undefined {
  if (kind === 'belt') {
    const explicitRule = BELT_TEMPLATE_RULES[templateId]
    if (explicitRule) {
      return explicitRule
    }

    const tags = TEMPLATE_CONNECTION_TAGS[templateId] ?? []
    for (const tag of tags) {
      const fallbackRule = BELT_TAG_DEFAULT_RULES[tag]
      if (fallbackRule) {
        return fallbackRule
      }
    }

    return undefined
  }

  if (kind === 'pipe') {
    return PIPE_TEMPLATE_RULES[templateId]
  }

  return undefined
}

export function toLocalEdgeSide(side: EdgeSide, rotation: BlueprintRotation): EdgeSide {
  const sides: EdgeSide[] = ['north', 'east', 'south', 'west']
  const worldIndex = sides.indexOf(side)
  const steps = rotation / 90
  return sides[(worldIndex - steps + 4) % 4]
}

export function getPreferredLocalSides(templateId: string, kind: BlueprintPathKind): EdgeSide[] {
  const rule = getTemplateConnectionRule(templateId, kind)
  return [...new Set([...(rule?.start ?? []), ...(rule?.end ?? [])])]
}

export function resolveTemplatePortRole(templateId: string, kind: BlueprintPathKind, localSide: EdgeSide): TemplatePortRole {
  if (kind !== 'belt') {
    return 'unknown'
  }

  const override = BELT_PORT_ROLE_OVERRIDES[templateId]?.[localSide]
  if (override) {
    return override
  }

  const rule = getTemplateConnectionRule(templateId, kind)
  if (!rule) {
    return 'unknown'
  }

  const inStart = rule.start?.includes(localSide) ?? false
  const inEnd = rule.end?.includes(localSide) ?? false

  if (inStart && inEnd) {
    return 'bidirectional'
  }

  if (inStart) {
    return 'output'
  }

  if (inEnd) {
    return 'input'
  }

  return 'unknown'
}

export function requiresTemplateCenterSlot(templateId: string, kind: BlueprintPathKind, localSide: EdgeSide): boolean {
  if (kind !== 'belt') {
    return false
  }

  return BELT_CENTER_SLOT_LOCAL_SIDES[templateId]?.includes(localSide) ?? false
}
