<script setup lang="ts">
import { useBlueprintI18n } from '@/composables/useBlueprintI18n'
import { colorForTemplate } from '@/utils/blueprint'
import type { BlueprintSummary } from '@/types'

defineProps<{
  summary: BlueprintSummary
}>()

const { t, itemLabel, payloadLabel, buildingLabel } = useBlueprintI18n()

function formatPayloadTypes(payloadTypes: string[]): string {
  if (!payloadTypes.length) {
    return t('noItem')
  }

  return payloadTypes.map((payloadType) => payloadLabel(payloadType)).join(', ')
}

function interactiveText(value: boolean): string {
  return value ? t('trueLabel') : t('falseLabel')
}

function formatPoint(point: { x: number; y: number; z: number } | null | undefined): string {
  if (!point) {
    return '-'
  }

  return `(${point.x}, ${point.y}, ${point.z})`
}

function formatPosition(node: BlueprintSummary['nodes'][number]): string {
  return `(${node.x}, ${node.y}, ${node.z})`
}

function formatLayout(node: BlueprintSummary['nodes'][number]): string {
  return `${t('layoutLabel')}: (${node.layoutX}, ${node.layoutZ}) ${node.layoutWidth}x${node.layoutHeight}`
}

function formatSourceLayout(node: BlueprintSummary['nodes'][number]): string {
  return `${t('sourceLayoutLabel')}: (${node.sourceLayoutX}, ${node.sourceLayoutZ}) ${node.sourceLayoutWidth}x${node.sourceLayoutHeight}`
}

function formatFootprint(node: BlueprintSummary['nodes'][number]): string {
  if (!node.footprint) {
    return ''
  }

  return `${t('footprintLabel')}: ${node.footprint.raw} → ${node.footprint.width}x${node.footprint.height}`
}

function formatPathDetails(node: BlueprintSummary['nodes'][number]): string {
  if (!node.path) {
    return ''
  }

  return [
    `${t('pathRoute')}: ${formatPoint(node.path.start)} → ${formatPoint(node.path.end)}`,
    `${t('pathPoints')}: ${node.path.points.length}`,
    `${t('pathSegments')}: ${node.path.segmentCount}`,
    `${t('pathTurns')}: ${node.path.turnCount}`,
    `${t('pathLength')}: ${node.path.totalLength}`,
  ].join(' | ')
}
</script>

<template>
  <section class="panel-card">
    <div class="panel-header">
      <p class="panel-flag">{{ t('nodeMatrixFlag') }}</p>
      <h2>{{ t('nodeList') }}</h2>
      <p>{{ t('nodeListHint') }}</p>
    </div>

    <div class="table-wrap table-wrap--large">
      <table>
        <thead>
          <tr>
            <th>{{ t('id') }}</th>
            <th>{{ t('building') }}</th>
            <th>{{ t('item') }}</th>
            <th>{{ t('position') }}</th>
            <th>{{ t('componentCount') }}</th>
            <th>{{ t('payloadType') }}</th>
            <th>{{ t('interactive') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="node in summary.nodes" :key="node.nodeId">
            <td>{{ node.nodeId }}</td>
            <td>
              <div class="node-template">
                <span class="color-chip" :style="{ backgroundColor: colorForTemplate(node.templateId) }"></span>
                <div>
                  <strong>{{ buildingLabel(node.templateId) }}</strong>
                  <p>{{ node.templateId }}</p>
                </div>
              </div>
            </td>
            <td>
              <strong>{{ itemLabel(node.productIcon) }}</strong>
              <p v-if="node.productIcon !== '-'" class="table-subtext">{{ node.productIcon }}</p>
            </td>
            <td>
              <strong>{{ formatPosition(node) }}</strong>
              <p v-if="!node.path" class="table-subtext">{{ formatLayout(node) }}</p>
              <p v-if="!node.path" class="table-subtext">{{ formatSourceLayout(node) }}</p>
              <p v-if="!node.path && node.footprint" class="table-subtext">{{ formatFootprint(node) }}</p>
              <p v-if="node.path" class="table-subtext">{{ formatPathDetails(node) }}</p>
            </td>
            <td>{{ node.componentCount }}</td>
            <td>{{ formatPayloadTypes(node.payloadTypes) }}</td>
            <td>{{ interactiveText(node.interactive) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.panel-card {
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  padding: 16px;
}

.panel-header {
  display: grid;
  gap: 4px;
  margin-bottom: 14px;
}

.panel-header h2,
.panel-header p,
.panel-flag {
  margin: 0;
}

.panel-flag {
  color: #c4a35a;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.panel-header h2 {
  color: #ffffff;
}

.panel-header p,
.node-template p {
  color: #a0a0a0;
}

.table-wrap {
  overflow: auto;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  max-height: 420px;
}

.table-wrap--large {
  max-height: 620px;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 720px;
}

th,
td {
  padding: 12px 14px;
  border-bottom: 1px solid #3a3a3a;
  vertical-align: top;
  text-align: left;
}

th {
  position: sticky;
  top: 0;
  background: #2a2a2a;
  color: #c4a35a;
}

.node-template {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-chip {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  flex: 0 0 auto;
}

.table-subtext {
  margin-top: 4px;
  color: #a0a0a0;
  font-size: 12px;
  word-break: break-all;
}
</style>
