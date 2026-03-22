import { translateBuilding } from '@/i18n/messages'
import type { BlueprintBuildingFootprint, BlueprintBuildingMeta } from '@/types'
import allBuildingsJson from '../../data/gamekee_buildings/all-buildings.json'

interface BuildingCatalogEntry {
  name: string
  deviceType?: string
  purpose?: string
  footprint?: string
}

interface FootprintOverride {
  raw: string
  sourceWidth: number
  sourceHeight: number
  width: number
  height: number
}

interface MetadataOverride {
  catalogName?: string
  deviceType?: string
  purpose?: string
  footprint?: FootprintOverride
  imageName?: string
  imageUrl?: string
}

const UNKNOWN_BUILDING = '未知建筑'

const templateAliases: Record<string, string[]> = {
  power_station_1: ['热能池', '供电桩', '息壤供电桩'],
  power_diffuser_1: ['供电桩', '息壤供电桩', '中继器', '息壤中继器'],
  furnance_1: ['精炼炉'],
  grinder_1: ['粉碎机', '研磨机'],
  thickener_1: ['研磨机', '粉碎机', '反应池'],
  xiranite_oven_1: ['天有烘炉'],
  planter_1: ['种植机'],
  seedcollector_1: ['采种机'],
  storager_1: ['协议储存箱'],
  component_mc_1: ['配件机'],
  shaper_1: ['塑形机'],
  tools_assebling_mc_1: ['装备原件机'],
  filling_powder_mc_1: ['灌装机'],
  winder_1: ['封装机'],
  unloader_1: ['仓库取货口'],
  log_connector: ['物流桥'],
  log_pipe_splitter: ['管道分流器'],
  log_pipe_conditioner: ['管道汇流器'],
  log_splitter: ['分流器'],
  log_conditioner: ['物品准入口'],
  log_hongs_bus_source: ['物品准入口'],
}

const metadataOverrides: Partial<Record<string, MetadataOverride>> = {
  power_station_1: {
    catalogName: '热电池',
    footprint: {
      raw: '2x2',
      sourceWidth: 2,
      sourceHeight: 2,
      width: 2,
      height: 2,
    },
    imageUrl: 'https://cdnimg-v2.gamekee.com/wiki2.0/images/w_189/h_191/50248/103682/2026/0/17/990125.png',
  },
  power_diffuser_1: {
    catalogName: '供电桩',
    footprint: {
      raw: '2x2',
      sourceWidth: 2,
      sourceHeight: 2,
      width: 2,
      height: 2,
    },
  },
  thickener_1: {
    catalogName: '研磨机',
  },
  grinder_1: {
    catalogName: '粉碎机',
  },
  log_hongs_bus: {
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
  log_hongs_bus_source: {
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
  storager_1: {
    footprint: {
      raw: '3x3',
      sourceWidth: 3,
      sourceHeight: 3,
      width: 3,
      height: 3,
    },
  },
  furnance_1: {
    footprint: {
      raw: '3x3',
      sourceWidth: 3,
      sourceHeight: 3,
      width: 3,
      height: 3,
    },
  },
}

const buildingEntries = (allBuildingsJson as { buildings?: BuildingCatalogEntry[] }).buildings ?? []
const catalogByName = new Map(buildingEntries.map((entry) => [entry.name, entry]))

const imageModules = import.meta.glob('../../data/gamekee_buildings/**/*.{png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const imageByName = new Map<string, string>()
for (const [path, assetUrl] of Object.entries(imageModules)) {
  const filename = path.split('/').pop() ?? ''
  const imageName = filename.replace(/\.[^.]+$/u, '')
  imageByName.set(imageName, assetUrl)
}

const metadataCache = new Map<string, BlueprintBuildingMeta | null>()

function resolveCandidateNames(templateId: string): string[] {
  const translatedName = translateBuilding('zh-CN', templateId)
  const candidates = [...(templateAliases[templateId] ?? [])]

  if (translatedName !== templateId && translatedName !== UNKNOWN_BUILDING) {
    candidates.push(translatedName)
  }

  return [...new Set(candidates)]
}

function parseFootprint(raw: string | undefined): BlueprintBuildingFootprint | null {
  if (!raw) {
    return null
  }

  const match = raw.match(/^\s*(\d+)\s*x\s*(\d+)\s*$/iu)
  if (!match) {
    return null
  }

  const sourceWidth = Number(match[1])
  const sourceHeight = Number(match[2])

  if (!Number.isFinite(sourceWidth) || !Number.isFinite(sourceHeight)) {
    return null
  }

  return {
    raw,
    sourceWidth,
    sourceHeight,
    width: Math.max(1, sourceWidth),
    height: Math.max(1, sourceHeight),
  }
}

function createMetadata(entry: BuildingCatalogEntry): BlueprintBuildingMeta {
  return {
    catalogName: entry.name,
    deviceType: entry.deviceType || '',
    purpose: entry.purpose || '',
    footprint: parseFootprint(entry.footprint),
    imageUrl: imageByName.get(entry.name) ?? null,
  }
}

function applyMetadataOverride(templateId: string, metadata: BlueprintBuildingMeta | null): BlueprintBuildingMeta | null {
  const override = metadataOverrides[templateId]

  if (!override && metadata) {
    return metadata
  }

  if (!override) {
    return null
  }

  return {
    catalogName: override.catalogName ?? metadata?.catalogName ?? templateId,
    deviceType: override.deviceType ?? metadata?.deviceType ?? '',
    purpose: override.purpose ?? metadata?.purpose ?? '',
    footprint: override.footprint ?? metadata?.footprint ?? null,
    imageUrl: override.imageUrl ?? (override.imageName ? imageByName.get(override.imageName) : null) ?? metadata?.imageUrl ?? null,
  }
}

export function getBuildingMetadata(templateId: string): BlueprintBuildingMeta | null {
  if (metadataCache.has(templateId)) {
    return metadataCache.get(templateId) ?? null
  }

  let metadata: BlueprintBuildingMeta | null = null

  for (const name of resolveCandidateNames(templateId)) {
    const entry = catalogByName.get(name)
    if (!entry) {
      continue
    }

    metadata = createMetadata(entry)
    break
  }

  metadata = applyMetadataOverride(templateId, metadata)

  metadataCache.set(templateId, metadata)
  return metadata
}
