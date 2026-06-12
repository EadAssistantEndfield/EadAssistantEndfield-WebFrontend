import type { BlueprintBuildingFootprint, BlueprintBuildingMeta } from '@/features/blueprint/types'
import { lookupBuildingMessage } from '@/features/blueprint/i18n/buildingMessages'
import { getTemplateAliases, getTemplateMetadataOverride } from '@/features/blueprint/domain/template/templateRegistry'
import allBuildingsJson from '../../../../../data/gamekee_buildings/all-buildings.json'

interface BuildingCatalogEntry {
  name: string
  deviceType?: string
  purpose?: string
  footprint?: string
  image_url?: string
}

const UNKNOWN_BUILDING = '未知建筑'

const buildingEntries = (allBuildingsJson as { buildings?: BuildingCatalogEntry[] }).buildings ?? []
const catalogByName = new Map(buildingEntries.map((entry) => [entry.name, entry]))

const imageModules = import.meta.glob('../../../../../data/gamekee_buildings/**/*.webp', {
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
  const translatedName = lookupBuildingMessage('zh-CN', templateId) ?? templateId
  const candidates = getTemplateAliases(templateId)

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

function normalizeCdnUrl(raw: string | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  return trimmed.startsWith('//') ? `https:${trimmed}` : trimmed
}

function createMetadata(entry: BuildingCatalogEntry): BlueprintBuildingMeta {
  return {
    catalogName: entry.name,
    deviceType: entry.deviceType || '',
    purpose: entry.purpose || '',
    footprint: parseFootprint(entry.footprint),
    imageUrl: imageByName.get(entry.name) ?? normalizeCdnUrl(entry.image_url) ?? null,
  }
}

function applyMetadataOverride(
  templateId: string,
  metadata: BlueprintBuildingMeta | null,
): BlueprintBuildingMeta | null {
  const override = getTemplateMetadataOverride(templateId)

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
    imageUrl:
      override.imageUrl ??
      (override.imageName ? imageByName.get(override.imageName) : null) ??
      metadata?.imageUrl ??
      null,
  }
}

export function getBuildingMetadata(templateId: string): BlueprintBuildingMeta | null {
  if (metadataCache.has(templateId)) {
    return metadataCache.get(templateId) ?? null
  }

  let metadata: BlueprintBuildingMeta | null = null

  for (const name of resolveCandidateNames(templateId)) {
    const entry = catalogByName.get(name)
    if (entry) {
      metadata = createMetadata(entry)
      break
    }

    const imageUrl = imageByName.get(name)
    if (imageUrl) {
      metadata = { catalogName: name, deviceType: '', purpose: '', footprint: null, imageUrl }
      break
    }
  }

  metadata = applyMetadataOverride(templateId, metadata)

  metadataCache.set(templateId, metadata)
  return metadata
}
