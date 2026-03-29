<script setup lang="ts">
import { computed, ref } from 'vue'
import { useBlueprintI18n } from '@/composables/useBlueprintI18n'
import { useBlueprintLayout } from '@/composables/useBlueprintLayout'
import { useBlueprintPathLayer } from '@/composables/useBlueprintPathLayer'
import type { BlueprintCell, BlueprintRenderLayoutMode, BlueprintSummary, BlueprintSummaryNode } from '@/types'
import { shortTemplateName } from '@/utils/blueprint'
import { getLayoutTheme } from '@/utils/layoutTheme'

const props = defineProps<{
  summary: BlueprintSummary
}>()

const { t, itemLabel } = useBlueprintI18n()
const renderMode = ref<BlueprintRenderLayoutMode>('normalized')
const showDebug = ref(false)
const summaryRef = computed(() => props.summary)

function layoutBox(node: BlueprintSummaryNode) {
  if (renderMode.value === 'source') {
    return {
      x: node.sourceLayoutX,
      z: node.sourceLayoutZ,
      width: node.sourceLayoutWidth,
      height: node.sourceLayoutHeight,
    }
  }

  return {
    x: node.layoutX,
    z: node.layoutZ,
    width: node.layoutWidth,
    height: node.layoutHeight,
  }
}

const displayBounds = computed(() => {
  let maxX = props.summary.width - 1
  let maxZ = props.summary.height - 1

  for (const node of props.summary.nodes) {
    if (node.path) {
      for (const point of node.pathPoints) {
        maxX = Math.max(maxX, point.x)
        maxZ = Math.max(maxZ, point.z)
      }
      continue
    }

    const box = layoutBox(node)
    maxX = Math.max(maxX, box.x + box.width - 1)
    maxZ = Math.max(maxZ, box.z + box.height - 1)
  }

  return {
    width: maxX + 1,
    height: maxZ + 1,
  }
})

const { svgWidth, svgHeight, cellSize, cellX, cellZ } = useBlueprintLayout(displayBounds)
const { pathNodes, polylinePoints, strokeWidth, strokeDasharray, markerRadius, beltArrowPoints, startMarker, endMarker } = useBlueprintPathLayer(
  summaryRef,
  renderMode,
  cellSize,
  cellX,
  cellZ,
)

const underlayPathNodes = computed(() => pathNodes.value.filter((node) => node.path?.kind !== 'pipe'))
const overlayPipeNodes = computed(() => pathNodes.value.filter((node) => node.path?.kind === 'pipe'))

const buildingNodes = computed(() =>
  [...props.summary.nodes]
    .filter((node) => node.path === null)
    .sort((left, right) => layoutBox(right).width * layoutBox(right).height - layoutBox(left).width * layoutBox(left).height || left.nodeId - right.nodeId),
)

const occupiedCells = computed(() => {
  const cells: Array<{ key: string; cell: BlueprintCell; node: BlueprintSummaryNode }> = []

  for (const node of buildingNodes.value) {
    const box = layoutBox(node)
    for (let x = box.x; x < box.x + box.width; x += 1) {
      for (let z = box.z; z < box.z + box.height; z += 1) {
        const cell = { x, z }
        cells.push({ key: `${node.nodeId}-${x}-${z}-${renderMode.value}`, cell, node })
      }
    }
  }

  return cells
})

function buildingLabel(node: BlueprintSummaryNode): string {
  return node.buildingMeta?.catalogName || shortTemplateName(node.templateId)
}

function clipId(node: BlueprintSummaryNode): string {
  return `building-clip-${node.nodeId}`
}

function labelX(node: BlueprintSummaryNode): number {
  return cellX(layoutBox(node).x) + 10
}

function labelY(node: BlueprintSummaryNode): number {
  return cellZ(layoutBox(node).z) + 20
}

function showImage(node: BlueprintSummaryNode): boolean {
  return Boolean(node.buildingMeta?.imageUrl)
}

function showLabel(node: BlueprintSummaryNode): boolean {
  const box = layoutBox(node)
  return box.width >= 2 || box.height >= 2
}

function showSubtitle(node: BlueprintSummaryNode): boolean {
  const box = layoutBox(node)
  return box.width >= 3 || box.height >= 3
}

function anchorX(node: BlueprintSummaryNode): number {
  return cellX(node.x) + cellSize / 2
}

function anchorZ(node: BlueprintSummaryNode): number {
  return cellZ(node.z) + cellSize / 2
}

function sourceAnchorX(node: BlueprintSummaryNode): number {
  const box = layoutBox(node)
  return cellX(box.x) + (box.width * cellSize) / 2
}

function sourceAnchorZ(node: BlueprintSummaryNode): number {
  const box = layoutBox(node)
  return cellZ(box.z) + (box.height * cellSize) / 2
}

function imageBox(node: BlueprintSummaryNode) {
  const box = layoutBox(node)
  const layoutPixelWidth = box.width * cellSize
  const layoutPixelHeight = box.height * cellSize

  if (renderMode.value === 'source') {
    return {
      x: cellX(box.x) + 4,
      y: cellZ(box.z) + 4,
      width: layoutPixelWidth - 8,
      height: layoutPixelHeight - 8,
    }
  }

  const sourceWidth = node.footprint?.sourceWidth ?? box.width
  const sourceHeight = node.footprint?.sourceHeight ?? box.height
  const imageWidth = sourceWidth * cellSize - 8
  const imageHeight = sourceHeight * cellSize - 8

  return {
    x: cellX(box.x) + (layoutPixelWidth - imageWidth) / 2,
    y: cellZ(box.z) + (layoutPixelHeight - imageHeight) / 2,
    width: imageWidth,
    height: imageHeight,
  }
}

function imageTransform(node: BlueprintSummaryNode): string | undefined {
  if (renderMode.value === 'source' || node.rotation === 0) {
    return undefined
  }

  const box = layoutBox(node)
  const centerX = cellX(box.x) + (box.width * cellSize) / 2
  const centerZ = cellZ(box.z) + (box.height * cellSize) / 2
  const useDirectRotation = node.templateId === 'power_diffuser_1'
  const screenRotation = useDirectRotation ? node.rotation : (360 - node.rotation) % 360

  return `rotate(${screenRotation} ${centerX} ${centerZ})`
}

function nodeTitle(node: BlueprintSummaryNode): string {
  const box = layoutBox(node)
  return [
    `#${node.nodeId}`,
    buildingLabel(node),
    node.templateId,
    `anchor=(${node.x}, ${node.y}, ${node.z})`,
    `layout=(${box.x}, ${box.z}) ${box.width}x${box.height}`,
    node.productIcon !== '-' ? itemLabel(node.productIcon) : '',
  ]
    .filter(Boolean)
    .join(' | ')
}

function cellTheme(node: BlueprintSummaryNode) {
  return getLayoutTheme(node)
}
</script>

<template>
  <section class="panel-card">
    <div class="panel-header">
      <div class="panel-header__row">
        <div>
          <h2>{{ t('layout') }}</h2>
          <p>{{ t('layoutHint') }} · 游戏还原模式会结合 footprint、旋转和邻近路径自动推断占地。</p>
        </div>
        <div class="layout-toolbar">
          <div class="mode-switch">
            <button type="button" class="mode-button" :class="{ 'mode-button--active': renderMode === 'normalized' }" @click="renderMode = 'normalized'">
              游戏还原模式
            </button>
            <button type="button" class="mode-button" :class="{ 'mode-button--active': renderMode === 'source' }" @click="renderMode = 'source'">
              JSON 原始模式
            </button>
          </div>
          <label class="debug-toggle">
            <input v-model="showDebug" type="checkbox" />
            <span>调试覆盖</span>
          </label>
        </div>
      </div>
    </div>

    <div class="svg-scroller">
      <svg :viewBox="`0 0 ${svgWidth} ${svgHeight}`" class="blueprint-svg" role="img" aria-label="blueprint layout">
        <rect :width="svgWidth" :height="svgHeight" rx="22" fill="#fffaf4" />

        <template v-for="xIndex in displayBounds.width + 1" :key="`x-line-${xIndex}`">
          <line
            :x1="32 + (xIndex - 1) * cellSize"
            y1="32"
            :x2="32 + (xIndex - 1) * cellSize"
            :y2="32 + displayBounds.height * cellSize"
            class="grid-line"
          />
        </template>

        <template v-for="zIndex in displayBounds.height + 1" :key="`z-line-${zIndex}`">
          <line
            x1="32"
            :y1="32 + (zIndex - 1) * cellSize"
            :x2="32 + displayBounds.width * cellSize"
            :y2="32 + (zIndex - 1) * cellSize"
            class="grid-line"
          />
        </template>

        <template v-for="xIndex in displayBounds.width" :key="`x-label-${xIndex}`">
          <text :x="cellX(xIndex - 1) + cellSize / 2" y="20" class="axis-label">
            {{ xIndex - 1 }}
          </text>
        </template>

        <template v-for="zIndex in displayBounds.height" :key="`z-label-${zIndex}`">
          <text x="16" :y="cellZ(zIndex - 1) + cellSize / 2 + 4" class="axis-label">
            {{ zIndex - 1 }}
          </text>
        </template>

        <template v-for="entry in occupiedCells" :key="entry.key">
          <rect
            :x="cellX(entry.cell.x) + 2"
            :y="cellZ(entry.cell.z) + 2"
            :width="cellSize - 4"
            :height="cellSize - 4"
            rx="6"
            :fill="cellTheme(entry.node).cellFill"
            class="occupied-cell"
          />
        </template>

        <template v-for="node in underlayPathNodes" :key="`path-underlay-${node.nodeId}`">
          <polyline
            :points="polylinePoints(node)"
            :stroke="cellTheme(node).stroke"
            :stroke-width="strokeWidth(node)"
            :stroke-dasharray="strokeDasharray(node)"
            class="path-line"
          >
            <title>
              #{{ node.nodeId }} | {{ node.templateId }} | {{ itemLabel(node.productIcon) }} |
              {{ node.path?.segmentCount ?? 0 }} segments | {{ node.path?.totalLength ?? 0 }} length
            </title>
          </polyline>

          <circle
            v-if="startMarker(node) && node.path?.kind !== 'belt'"
            :cx="startMarker(node)?.x"
            :cy="startMarker(node)?.y"
            :r="markerRadius(node)"
            :fill="cellTheme(node).stroke"
            class="path-marker path-marker--start"
          />

          <circle
            v-if="endMarker(node) && node.path?.kind !== 'belt'"
            :cx="endMarker(node)?.x"
            :cy="endMarker(node)?.y"
            :r="markerRadius(node)"
            :fill="cellTheme(node).stroke"
            class="path-marker path-marker--end"
          />

          <polygon
            v-if="beltArrowPoints(node)"
            :points="beltArrowPoints(node) ?? undefined"
            :fill="cellTheme(node).stroke"
            class="belt-arrow"
          />
        </template>

        <template v-for="node in buildingNodes" :key="`building-${node.nodeId}`">
          <defs>
            <clipPath :id="clipId(node)">
              <rect
                :x="cellX(layoutBox(node).x) + 4"
                :y="cellZ(layoutBox(node).z) + 4"
                :width="layoutBox(node).width * cellSize - 8"
                :height="layoutBox(node).height * cellSize - 8"
                rx="10"
              />
            </clipPath>
          </defs>

          <g class="building-node">
            <rect
              v-if="showDebug && renderMode === 'normalized'"
              :x="cellX(node.sourceLayoutX) + 6"
              :y="cellZ(node.sourceLayoutZ) + 6"
              :width="cellSize - 12"
              :height="cellSize - 12"
              rx="8"
              class="source-anchor-outline"
            />

            <rect
              :x="cellX(layoutBox(node).x) + 5"
              :y="cellZ(layoutBox(node).z) + 7"
              :width="layoutBox(node).width * cellSize - 10"
              :height="layoutBox(node).height * cellSize - 10"
              rx="10"
              fill="rgba(15, 23, 42, 0.08)"
            />

            <rect
              :x="cellX(layoutBox(node).x) + 4"
              :y="cellZ(layoutBox(node).z) + 4"
              :width="layoutBox(node).width * cellSize - 8"
              :height="layoutBox(node).height * cellSize - 8"
              rx="10"
              :fill="cellTheme(node).fill"
              :stroke="cellTheme(node).stroke"
              stroke-width="2"
            >
              <title>{{ nodeTitle(node) }}</title>
            </rect>

            <image
              v-if="showImage(node)"
              :href="node.buildingMeta?.imageUrl ?? undefined"
              :x="imageBox(node).x"
              :y="imageBox(node).y"
              :width="imageBox(node).width"
              :height="imageBox(node).height"
              :clip-path="`url(#${clipId(node)})`"
              :transform="imageTransform(node)"
              preserveAspectRatio="xMidYMid slice"
              opacity="0.96"
            />

            <rect
              :x="cellX(layoutBox(node).x) + 4"
              :y="cellZ(layoutBox(node).z) + 4"
              :width="layoutBox(node).width * cellSize - 8"
              :height="layoutBox(node).height * cellSize - 8"
              rx="10"
              fill="rgba(255, 250, 244, 0.36)"
            />

            <text
              v-if="showLabel(node)"
              :x="labelX(node)"
              :y="labelY(node)"
              class="building-label"
              :fill="cellTheme(node).text"
            >
              {{ buildingLabel(node) }}
            </text>

            <text
              v-if="showSubtitle(node)"
              :x="labelX(node)"
              :y="labelY(node) + 14"
              class="building-subtitle"
              :fill="cellTheme(node).text"
            >
              #{{ node.nodeId }} · {{ layoutBox(node).width }}x{{ layoutBox(node).height }}
            </text>

            <circle :cx="anchorX(node)" :cy="anchorZ(node)" r="3.5" :fill="cellTheme(node).stroke" class="anchor-marker" />
            <circle
              v-if="showDebug && renderMode === 'normalized'"
              :cx="sourceAnchorX(node)"
              :cy="sourceAnchorZ(node)"
              r="3"
              fill="#f97316"
              class="source-anchor-marker"
            />
          </g>
        </template>

        <template v-for="node in overlayPipeNodes" :key="`path-overlay-${node.nodeId}`">
          <polyline
            :points="polylinePoints(node)"
            :stroke="cellTheme(node).stroke"
            :stroke-width="strokeWidth(node)"
            :stroke-dasharray="strokeDasharray(node)"
            class="path-line"
          >
            <title>
              #{{ node.nodeId }} | {{ node.templateId }} | {{ itemLabel(node.productIcon) }} |
              {{ node.path?.segmentCount ?? 0 }} segments | {{ node.path?.totalLength ?? 0 }} length
            </title>
          </polyline>

          <circle
            v-if="startMarker(node)"
            :cx="startMarker(node)?.x"
            :cy="startMarker(node)?.y"
            :r="markerRadius(node)"
            :fill="cellTheme(node).stroke"
            class="path-marker path-marker--start"
          />

          <circle
            v-if="endMarker(node)"
            :cx="endMarker(node)?.x"
            :cy="endMarker(node)?.y"
            :r="markerRadius(node)"
            :fill="cellTheme(node).stroke"
            class="path-marker path-marker--end"
          />
        </template>
      </svg>
    </div>
  </section>
</template>

<style scoped>
.panel-card {
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 24px;
  backdrop-filter: blur(18px);
  box-shadow: 0 24px 60px rgba(2, 6, 23, 0.36);
  padding: 20px 22px;
}

.panel-header {
  display: grid;
  gap: 4px;
  margin-bottom: 14px;
}

.panel-header__row {
  display: flex;
  gap: 16px;
  justify-content: space-between;
  align-items: flex-start;
}

.panel-header p {
  color: #9fb0c8;
}

.layout-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.mode-switch {
  display: inline-flex;
  gap: 8px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.08);
}

.mode-button {
  border: 0;
  border-radius: 999px;
  padding: 8px 12px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  font-weight: 700;
}

.mode-button--active {
  background: rgba(15, 23, 42, 0.88);
  color: #f8fafc;
}

.debug-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
}

.debug-toggle input {
  accent-color: #0f172a;
}

.svg-scroller {
  overflow: auto;
  border-radius: 22px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(255, 250, 244, 0.98);
}

.blueprint-svg {
  display: block;
  min-width: 100%;
}

.grid-line {
  stroke: rgba(100, 116, 139, 0.18);
  stroke-width: 1;
}

.axis-label {
  fill: #64748b;
  font-size: 10px;
  text-anchor: middle;
}

.occupied-cell {
  opacity: 0.9;
}

.path-line {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.94;
}

.path-marker {
  stroke: rgba(255, 250, 244, 0.95);
  stroke-width: 2;
}

.path-marker--end {
  opacity: 0.74;
}

.belt-arrow {
  opacity: 0.96;
}

.building-node {
  isolation: isolate;
}

.building-label,
.building-subtitle {
  font-size: 11px;
  font-weight: 700;
  paint-order: stroke;
  stroke: rgba(255, 250, 244, 0.9);
  stroke-width: 3px;
  stroke-linejoin: round;
}

.building-subtitle {
  font-size: 10px;
  font-weight: 600;
  opacity: 0.88;
}

.anchor-marker {
  stroke: rgba(255, 250, 244, 0.96);
  stroke-width: 2;
}

.source-anchor-outline {
  fill: none;
  stroke: rgba(249, 115, 22, 0.85);
  stroke-width: 2;
  stroke-dasharray: 5 4;
}

.source-anchor-marker {
  stroke: rgba(255, 250, 244, 0.96);
  stroke-width: 1.5;
}

@media (max-width: 980px) {
  .panel-header__row {
    flex-direction: column;
  }
}
</style>
