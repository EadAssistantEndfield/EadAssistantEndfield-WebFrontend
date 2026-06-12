import type { BlueprintData, BlueprintSummary, CountEntry } from '@/features/blueprint/types'
import { resolveBlueprintSummaryNodes } from '@/features/blueprint/domain/parser/blueprintDomain'
import { parseBlueprintFile, parseBlueprintNodes } from '@/features/blueprint/domain/parser/blueprintParser'
import { toSafeNumber } from '@/features/blueprint/domain/geometry'

function toCountEntries(counter: Map<string, number>): CountEntry[] {
  return [...counter.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
}

function summarizeCounts(
  data: BlueprintData,
  nodes = resolveBlueprintSummaryNodes(parseBlueprintNodes(data.nodes)),
) {
  const templateCounter = new Map<string, number>()
  const productCounter = new Map<string, number>()
  const payloadCounter = new Map<string, number>()
  const templatePreviewUrls: Record<string, string> = {}

  let maxX = 0
  let maxZ = 0
  let componentCount = 0
  let interactiveCount = 0

  for (const node of nodes) {
    templateCounter.set(node.templateId, (templateCounter.get(node.templateId) ?? 0) + 1)

    if (node.productIcon !== '-') {
      productCounter.set(node.productIcon, (productCounter.get(node.productIcon) ?? 0) + 1)
    }

    for (const payloadType of node.payloadTypes) {
      payloadCounter.set(payloadType, (payloadCounter.get(payloadType) ?? 0) + 1)
    }

    if (!templatePreviewUrls[node.templateId] && node.buildingMeta?.imageUrl) {
      templatePreviewUrls[node.templateId] = node.buildingMeta.imageUrl
    }

    if (node.pathPoints.length > 0) {
      for (const point of node.pathPoints) {
        maxX = Math.max(maxX, point.x)
        maxZ = Math.max(maxZ, point.z)
      }
    } else {
      maxX = Math.max(maxX, node.layoutX + node.layoutWidth - 1)
      maxZ = Math.max(maxZ, node.layoutZ + node.layoutHeight - 1)
    }

    componentCount += node.componentCount
    if (node.interactive) {
      interactiveCount += 1
    }
  }

  return {
    nodes,
    templatePreviewUrls,
    templateCounts: toCountEntries(templateCounter),
    productCounts: toCountEntries(productCounter),
    payloadCounts: toCountEntries(payloadCounter),
    componentCount,
    interactiveCount,
    maxX,
    maxZ,
  }
}

export function buildBlueprintSummary(raw: string, sourceName = 'untitled.json'): BlueprintSummary {
  const file = parseBlueprintFile(raw)
  const data = file.blueprint_data
  const snapSummary = file.snap_summary ?? data.snap_summary ?? null
  const blueprintWidth = Math.max(toSafeNumber(data.bp_size?.x_len), 1)
  const blueprintHeight = Math.max(toSafeNumber(data.bp_size?.z_len), 1)
  const countSummary = summarizeCounts(data)
  const width = Math.max(blueprintWidth, countSummary.maxX + 1)
  const height = Math.max(blueprintHeight, countSummary.maxZ + 1)

  return {
    sourceName,
    title: data.name || sourceName.replace(/\.json$/iu, ''),
    description: data.desc || '',
    shareCode: file.share_code || '-',
    reviewStatus: data.review_status_name || String(data.review_status ?? '-'),
    sourceType: data.bp_param?.source_type_name || String(data.bp_param?.source_type ?? '-'),
    width,
    height,
    nodeCount: countSummary.nodes.length,
    componentCount: countSummary.componentCount,
    interactiveCount: countSummary.interactiveCount,
    templateCounts: countSummary.templateCounts,
    productCounts: countSummary.productCounts,
    payloadCounts: countSummary.payloadCounts,
    templatePreviewUrls: countSummary.templatePreviewUrls,
    nodes: [...countSummary.nodes].sort(
      (left, right) => left.z - right.z || left.x - right.x || left.y - right.y || left.nodeId - right.nodeId,
    ),
    snapSummary,
  }
}
