import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import type { BlueprintSummary, BlueprintSummaryNode } from '@/features/blueprint/types'
import { pathPointKey } from '@/features/blueprint/domain/geometry'

export type EndpointRole = 'start' | 'end'

interface EndpointPeerState {
  start: boolean
  end: boolean
}

function endpointPoint(node: BlueprintSummaryNode, role: EndpointRole) {
  if (node.pathPoints.length === 0) {
    return null
  }

  return role === 'start' ? node.pathPoints[0] : node.pathPoints[node.pathPoints.length - 1]
}

export function useBlueprintPathTopology(
  summarySource: MaybeRefOrGetter<BlueprintSummary>,
  buildingNodesSource?: MaybeRefOrGetter<BlueprintSummaryNode[]>,
) {
  const summary = computed(() => toValue(summarySource))
  const pathNodes = computed(() => summary.value.nodes.filter((node) => node.path !== null))
  const buildingNodes = computed(() =>
    buildingNodesSource ? toValue(buildingNodesSource) : summary.value.nodes.filter((node) => node.path === null),
  )

  const endpointPeersByNodeId = computed(() => {
    const endpointOwners = new Map<
      string,
      Array<{ nodeId: number; kind: NonNullable<BlueprintSummaryNode['path']>['kind'] }>
    >()
    const peerMap = new Map<number, EndpointPeerState>()

    for (const node of pathNodes.value) {
      if (!node.path) {
        continue
      }

      for (const role of ['start', 'end'] as const) {
        const point = endpointPoint(node, role)
        if (!point) {
          continue
        }

        const key = pathPointKey(point)
        const owners = endpointOwners.get(key) ?? []
        owners.push({ nodeId: node.nodeId, kind: node.path.kind })
        endpointOwners.set(key, owners)
      }
    }

    for (const node of pathNodes.value) {
      if (!node.path) {
        continue
      }

      const startPoint = endpointPoint(node, 'start')
      const endPoint = endpointPoint(node, 'end')
      const startOwners = startPoint ? (endpointOwners.get(pathPointKey(startPoint)) ?? []) : []
      const endOwners = endPoint ? (endpointOwners.get(pathPointKey(endPoint)) ?? []) : []
      const start = startOwners.some((owner) => owner.nodeId !== node.nodeId && owner.kind === node.path?.kind)
      const end = endOwners.some((owner) => owner.nodeId !== node.nodeId && owner.kind === node.path?.kind)

      peerMap.set(node.nodeId, { start, end })
    }

    return peerMap
  })

  function hasPathPeerAtEndpoint(node: BlueprintSummaryNode, role: EndpointRole): boolean {
    return endpointPeersByNodeId.value.get(node.nodeId)?.[role] ?? false
  }

  return {
    pathNodes,
    buildingNodes,
    endpointPeersByNodeId,
    hasPathPeerAtEndpoint,
  }
}
