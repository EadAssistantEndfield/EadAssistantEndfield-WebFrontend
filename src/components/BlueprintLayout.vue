<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useBlueprintI18n } from '@/composables/useBlueprintI18n'
import { useBlueprintLayout } from '@/composables/useBlueprintLayout'
import { useBlueprintLayoutScene } from '@/composables/useBlueprintLayoutScene'
import { useBlueprintPathLayer } from '@/composables/useBlueprintPathLayer'
import type { BlueprintRenderLayoutMode, BlueprintSummary, BlueprintSummaryNode } from '@/types'
import { pathMarkerRadius, pathStrokeDasharray, pathStrokeWidth } from '@/utils/blueprintPathPresentation'

const props = defineProps<{
  summary: BlueprintSummary
}>()

const { t, itemLabel, buildingLabel: translateBuildingLabel } = useBlueprintI18n()
const renderMode = ref<BlueprintRenderLayoutMode>('normalized')
const showDebug = ref(false)
const summaryRef = computed(() => props.summary)
const scrollerRef = ref<HTMLElement | null>(null)
const scrollerWidth = ref(0)
const scrollerHeight = ref(0)
let scrollerResizeObserver: ResizeObserver | null = null

function buildingLabel(node: BlueprintSummaryNode): string {
  return translateBuildingLabel(node.templateId)
}

const sceneForBounds = useBlueprintLayoutScene(summaryRef, renderMode, 28, (x) => 32 + x * 28, (z) => 32 + z * 28, buildingLabel, itemLabel)
const displayBounds = sceneForBounds.displayBounds
const { svgWidth, svgHeight, cellSize, cellX, cellZ } = useBlueprintLayout(displayBounds)
const {
  buildingNodes,
  occupiedCells,
  layoutBox,
  clipId,
  labelX,
  labelY,
  showImage,
  showLabel,
  showSubtitle,
  anchorX,
  anchorZ,
  sourceAnchorX,
  sourceAnchorZ,
  imageBox,
  imageTransform,
  nodeTitle,
  cellTheme,
} = useBlueprintLayoutScene(summaryRef, renderMode, cellSize, cellX, cellZ, buildingLabel, itemLabel)
const { pathNodes, polylinePoints, beltArrowPoints, startMarker, endMarker } = useBlueprintPathLayer(
  summaryRef,
  renderMode,
  cellSize,
  cellX,
  cellZ,
)

const underlayPathNodes = computed(() => pathNodes.value.filter((node) => node.path?.kind !== 'pipe'))
const overlayPipeNodes = computed(() => pathNodes.value.filter((node) => node.path?.kind === 'pipe'))

function updateScrollerSize() {
  const element = scrollerRef.value
  if (!element) {
    return
  }

  scrollerWidth.value = Math.max(0, element.clientWidth)
  scrollerHeight.value = Math.max(0, element.clientHeight)
}

onMounted(() => {
  updateScrollerSize()

  if (typeof ResizeObserver === 'undefined' || !scrollerRef.value) {
    return
  }

  scrollerResizeObserver = new ResizeObserver(() => {
    updateScrollerSize()
  })

  scrollerResizeObserver.observe(scrollerRef.value)
})

onBeforeUnmount(() => {
  scrollerResizeObserver?.disconnect()
})

const svgScale = computed(() => {
  if (!svgWidth.value || !svgHeight.value) {
    return 1
  }

  const widthScale = scrollerWidth.value > 0 ? scrollerWidth.value / svgWidth.value : 1
  const heightScale = scrollerHeight.value > 0 ? scrollerHeight.value / svgHeight.value : 1

  return Math.min(widthScale, heightScale)
})

const renderedSvgWidth = computed(() => Math.max(0, Math.round(svgWidth.value * svgScale.value)))
const renderedSvgHeight = computed(() => Math.max(0, Math.round(svgHeight.value * svgScale.value)))
</script>

<template>
  <section class="panel-card">
    <div class="panel-header">
      <div class="panel-header__row">
        <div>
          <p class="panel-flag">{{ t('layoutViewFlag') }}</p>
          <h2>{{ t('layout') }}</h2>
          <p>{{ t('layoutHint') }} · {{ t('layoutInferenceHint') }}</p>
        </div>
        <div class="layout-toolbar">
          <div class="mode-switch">
            <button
              type="button"
              class="mode-button"
            :class="{ 'mode-button--active': renderMode === 'normalized' }"
            @click="renderMode = 'normalized'"
          >
            {{ t('layoutModeNormalized') }}
          </button>
            <button
              type="button"
              class="mode-button"
            :class="{ 'mode-button--active': renderMode === 'source' }"
            @click="renderMode = 'source'"
          >
            {{ t('layoutModeSource') }}
          </button>
        </div>
        <label class="debug-toggle">
          <input v-model="showDebug" type="checkbox" />
          <span>{{ t('debugOverlay') }}</span>
        </label>
      </div>
      </div>
    </div>

    <div ref="scrollerRef" class="svg-scroller">
      <svg
        :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
        :width="renderedSvgWidth || svgWidth"
        :height="renderedSvgHeight || svgHeight"
        class="blueprint-svg"
        role="img"
        aria-label="blueprint layout"
      >
        <rect :width="svgWidth" :height="svgHeight" rx="22" fill="#0f0d0b" />

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
            :stroke-width="pathStrokeWidth(node.path?.kind)"
            :stroke-dasharray="pathStrokeDasharray(node.path?.kind, cellSize)"
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
            :r="pathMarkerRadius(node.path?.kind)"
            :fill="cellTheme(node).stroke"
            class="path-marker path-marker--start"
          />

          <circle
            v-if="endMarker(node) && node.path?.kind !== 'belt'"
            :cx="endMarker(node)?.x"
            :cy="endMarker(node)?.y"
            :r="pathMarkerRadius(node.path?.kind)"
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
              fill="rgba(0, 0, 0, 0.3)"
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
              fill="rgba(8, 8, 8, 0.16)"
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

            <circle
              :cx="anchorX(node)"
              :cy="anchorZ(node)"
              r="3.5"
              :fill="cellTheme(node).stroke"
              class="anchor-marker"
            />
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
            :stroke-width="pathStrokeWidth(node.path?.kind)"
            :stroke-dasharray="pathStrokeDasharray(node.path?.kind, cellSize)"
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
            :r="pathMarkerRadius(node.path?.kind)"
            :fill="cellTheme(node).stroke"
            class="path-marker path-marker--start"
          />

          <circle
            v-if="endMarker(node)"
            :cx="endMarker(node)?.x"
            :cy="endMarker(node)?.y"
            :r="pathMarkerRadius(node.path?.kind)"
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
  background: var(--page-background);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  padding: 16px;
  border-bottom: 1px solid #3a3a3a;
  min-height: 100%;
  height: 100%;
}

.panel-header {
  display: grid;
  gap: 6px;
  margin-bottom: 16px;
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
  margin-bottom: 6px;
}

.panel-header h2 {
  color: #ffffff;
  font-size: 18px;
}

.panel-header__row {
  display: flex;
  gap: 16px;
  justify-content: space-between;
  align-items: flex-start;
}

.panel-header p {
  color: #a0a0a0;
  font-size: 12px;
}

.layout-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.mode-switch {
  display: inline-flex;
  gap: 8px;
  padding: 4px;
  border-radius: 8px;
  border: 1px solid rgba(196, 163, 90, 0.2);
  background: #2a2a2a;
}

.mode-button {
  border: 0;
  border-radius: 6px;
  padding: 6px 12px;
  background: transparent;
  color: #a0a0a0;
  cursor: pointer;
  font-weight: 600;
  font-size: 12px;
  transition: all 0.2s ease;
}

.mode-button--active {
  background: rgba(196, 163, 90, 0.2);
  color: #c4a35a;
}

.debug-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #a0a0a0;
  font-size: 13px;
  font-weight: 500;
}

.debug-toggle input {
  accent-color: #c4a35a;
}

.svg-scroller {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 8px;
  border: 1px solid #3a3a3a;
  background: var(--page-background);
  min-height: 320px;
  height: 100%;
}

.blueprint-svg {
  display: block;
  max-width: 100%;
  max-height: 100%;
}

.grid-line {
  stroke: rgba(196, 163, 90, 0.08);
  stroke-width: 1;
}

.axis-label {
  fill: #6e6559;
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
  opacity: 0.96;
}

.path-marker {
  stroke: rgba(12, 10, 9, 0.95);
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
  stroke: rgba(10, 10, 10, 0.92);
  stroke-width: 3px;
  stroke-linejoin: round;
}

.building-subtitle {
  font-size: 10px;
  font-weight: 600;
  opacity: 0.88;
}

.anchor-marker {
  stroke: rgba(10, 10, 10, 0.96);
  stroke-width: 2;
}

.source-anchor-outline {
  fill: none;
  stroke: rgba(249, 115, 22, 0.85);
  stroke-width: 2;
  stroke-dasharray: 5 4;
}

.source-anchor-marker {
  stroke: rgba(10, 10, 10, 0.96);
  stroke-width: 1.5;
}

@media (max-width: 980px) {
  .panel-header__row {
    flex-direction: column;
  }

  .layout-toolbar {
    width: 100%;
    justify-content: flex-start;
  }

  .svg-scroller {
    min-height: 280px;
  }
}

@media (max-width: 720px) {
  .panel-card {
    padding: 12px;
  }

  .panel-header {
    margin-bottom: 12px;
  }

  .panel-header h2 {
    font-size: 16px;
  }

  .panel-header p {
    font-size: 11px;
  }

  .mode-switch {
    width: 100%;
  }

  .mode-button {
    flex: 1;
    padding: 7px 10px;
  }

  .debug-toggle {
    font-size: 12px;
  }

  .svg-scroller {
    min-height: 240px;
  }
}
</style>
