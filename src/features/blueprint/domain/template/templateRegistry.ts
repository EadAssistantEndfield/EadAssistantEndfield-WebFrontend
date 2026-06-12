import type { BlueprintBuildingFootprint, BlueprintPathKind } from '@/features/blueprint/types'

export type EdgeSide = 'north' | 'east' | 'south' | 'west'
export type TemplateConnectionTag = 'belt_logistics'
export type TemplatePortRole = 'input' | 'output' | 'bidirectional' | 'unknown'

export interface TemplateConnectionRule {
  priority: number
  start?: EdgeSide[]
  end?: EdgeSide[]
}

export interface TemplateMetadataOverride {
  catalogName?: string
  deviceType?: string
  purpose?: string
  footprint?: BlueprintBuildingFootprint
  imageName?: string
  imageUrl?: string
}

interface TemplateRegistryEntry {
  aliases?: string[]
  metadata?: TemplateMetadataOverride
  connectionTags?: TemplateConnectionTag[]
  connectionRules?: Partial<Record<Exclude<BlueprintPathKind, 'path'>, TemplateConnectionRule>>
  beltPortRoleOverrides?: Partial<Record<EdgeSide, TemplatePortRole>>
  beltCenterSlotLocalSides?: EdgeSide[]
  useDirectScreenRotation?: boolean
}

const BELT_TAG_DEFAULT_RULES: Record<TemplateConnectionTag, TemplateConnectionRule> = {
  belt_logistics: {
    priority: 92,
    start: ['north', 'east', 'south', 'west'],
    end: ['north', 'east', 'south', 'west'],
  },
}

const TEMPLATE_REGISTRY: Partial<Record<string, TemplateRegistryEntry>> = {
  power_station_1: {
    aliases: ['热能池', '供电桩', '息壤供电桩'],
    metadata: {
      catalogName: '热电池',
      footprint: {
        raw: '2x2',
        sourceWidth: 2,
        sourceHeight: 2,
        width: 2,
        height: 2,
      },
      imageName: '热能池',
    },
  },
  power_diffuser_1: {
    aliases: ['供电桩', '息壤供电桩', '中继器', '息壤中继器'],
    metadata: {
      catalogName: '供电桩',
      footprint: {
        raw: '2x2',
        sourceWidth: 2,
        sourceHeight: 2,
        width: 2,
        height: 2,
      },
    },
    useDirectScreenRotation: true,
  },
  furnance_1: {
    aliases: ['精炼炉'],
    metadata: {
      footprint: {
        raw: '3x3',
        sourceWidth: 3,
        sourceHeight: 3,
        width: 3,
        height: 3,
      },
    },
    connectionRules: {
      belt: { priority: 88, start: ['south', 'north'], end: ['south', 'north'] },
    },
  },
  grinder_1: {
    aliases: ['粉碎机', '研磨机'],
    metadata: {
      catalogName: '粉碎机',
    },
    connectionRules: {
      belt: { priority: 90, start: ['north', 'east'], end: ['north'] },
    },
  },
  thickener_1: {
    aliases: ['研磨机', '粉碎机', '反应池'],
    metadata: {
      catalogName: '研磨机',
    },
    connectionRules: {
      belt: { priority: 86, start: ['north'], end: ['north', 'west'] },
      pipe: { priority: 84, start: ['west', 'north'], end: ['west', 'north'] },
    },
  },
  xiranite_oven_1: {
    aliases: ['天有烘炉'],
    connectionRules: {
      belt: { priority: 84, start: ['north'], end: ['north', 'west'] },
      pipe: { priority: 90, start: ['west'], end: ['west'] },
    },
  },
  planter_1: {
    aliases: ['种植机'],
    connectionRules: {
      belt: { priority: 82, start: ['north'], end: ['north'] },
      pipe: { priority: 88, start: ['west'], end: ['west'] },
    },
  },
  seedcollector_1: {
    aliases: ['采种机'],
    connectionRules: {
      belt: { priority: 82, start: ['north'], end: ['north'] },
      pipe: { priority: 88, start: ['north', 'west'], end: ['north', 'west'] },
    },
  },
  storager_1: {
    aliases: ['协议储存箱'],
    metadata: {
      footprint: {
        raw: '3x3',
        sourceWidth: 3,
        sourceHeight: 3,
        width: 3,
        height: 3,
      },
    },
    connectionRules: {
      belt: { priority: 95, start: ['north'], end: ['north'] },
      pipe: { priority: 86, start: ['west', 'north'], end: ['west', 'north'] },
    },
  },
  component_mc_1: {
    aliases: ['配件机'],
  },
  shaper_1: {
    aliases: ['塑形机'],
  },
  tools_assebling_mc_1: {
    aliases: ['装备原件机'],
  },
  filling_powder_mc_1: {
    aliases: ['灌装机'],
  },
  winder_1: {
    aliases: ['封装机'],
  },
  unloader_1: {
    aliases: ['仓库取货口'],
    connectionRules: {
      belt: { priority: 100, start: ['north', 'south'], end: ['north', 'south'] },
    },
    beltCenterSlotLocalSides: ['north', 'south'],
  },
  log_connector: {
    aliases: ['物流桥'],
    connectionRules: {
      belt: { priority: 120, start: ['north', 'south', 'west', 'east'], end: ['north', 'south', 'west', 'east'] },
    },
  },
  log_pipe_splitter: {
    aliases: ['管道分流器'],
    connectionRules: {
      pipe: { priority: 120, start: ['north', 'east'], end: ['south', 'east'] },
    },
  },
  log_pipe_conditioner: {
    aliases: ['管道汇流器'],
    connectionRules: {
      pipe: { priority: 115, start: ['south', 'west'], end: ['north', 'west'] },
    },
  },
  log_splitter: {
    aliases: ['分流器'],
    connectionTags: ['belt_logistics'],
    connectionRules: {
      belt: { priority: 115, start: ['east', 'north', 'south'], end: ['west', 'north', 'south'] },
    },
    beltPortRoleOverrides: {
      west: 'input',
      east: 'output',
      north: 'output',
      south: 'output',
    },
  },
  log_conditioner: {
    aliases: ['物品准入口'],
    connectionTags: ['belt_logistics'],
    connectionRules: {
      belt: { priority: 112, start: ['east', 'west'], end: ['east', 'west'] },
    },
  },
  log_hongs_bus: {
    metadata: {
      catalogName: '仓库存取线基段',
      footprint: {
        raw: '4x8',
        sourceWidth: 4,
        sourceHeight: 8,
        width: 4,
        height: 8,
      },
      imageName: '仓库存取线基段',
    },
    connectionRules: {
      belt: { priority: 105, start: ['east', 'west'], end: ['east', 'west'] },
    },
  },
  log_hongs_bus_source: {
    aliases: ['物品准入口'],
    metadata: {
      catalogName: '仓库存取线源桩',
      footprint: {
        raw: '4x4',
        sourceWidth: 4,
        sourceHeight: 4,
        width: 4,
        height: 4,
      },
      imageName: '仓库存取线源桩',
    },
    connectionTags: ['belt_logistics'],
    connectionRules: {
      belt: { priority: 110, start: ['east', 'west'], end: ['east', 'west'] },
    },
  },
}

function getTemplateEntry(templateId: string): TemplateRegistryEntry | undefined {
  return TEMPLATE_REGISTRY[templateId]
}

export function getTemplateAliases(templateId: string): string[] {
  return [...(getTemplateEntry(templateId)?.aliases ?? [])]
}

export function getTemplateMetadataOverride(templateId: string): TemplateMetadataOverride | undefined {
  return getTemplateEntry(templateId)?.metadata
}

export function supportsTemplateConnection(templateId: string, kind: BlueprintPathKind): boolean {
  if (kind === 'path') {
    return false
  }

  const entry = getTemplateEntry(templateId)
  if (entry?.connectionRules?.[kind]) {
    return true
  }

  if (kind === 'belt') {
    return (entry?.connectionTags ?? []).some((tag) => Boolean(BELT_TAG_DEFAULT_RULES[tag]))
  }

  return false
}

export function getTemplateConnectionRule(
  templateId: string,
  kind: BlueprintPathKind,
): TemplateConnectionRule | undefined {
  if (kind === 'path') {
    return undefined
  }

  const entry = getTemplateEntry(templateId)
  const explicitRule = entry?.connectionRules?.[kind]
  if (explicitRule) {
    return explicitRule
  }

  if (kind !== 'belt') {
    return undefined
  }

  for (const tag of entry?.connectionTags ?? []) {
    const fallbackRule = BELT_TAG_DEFAULT_RULES[tag]
    if (fallbackRule) {
      return fallbackRule
    }
  }

  return undefined
}

export function resolveTemplatePortRole(
  templateId: string,
  kind: BlueprintPathKind,
  localSide: EdgeSide,
): TemplatePortRole {
  if (kind !== 'belt') {
    return 'unknown'
  }

  const override = getTemplateEntry(templateId)?.beltPortRoleOverrides?.[localSide]
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

  return getTemplateEntry(templateId)?.beltCenterSlotLocalSides?.includes(localSide) ?? false
}

export function usesDirectScreenRotation(templateId: string): boolean {
  return getTemplateEntry(templateId)?.useDirectScreenRotation ?? false
}
