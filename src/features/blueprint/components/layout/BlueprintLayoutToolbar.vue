<script setup lang="ts">
import type { BlueprintRenderLayoutMode } from '@/features/blueprint/types'

const renderMode = defineModel<BlueprintRenderLayoutMode>('renderMode', { required: true })
const showDebug = defineModel<boolean>('showDebug', { required: true })

defineProps<{
  normalizedLabel: string
  sourceLabel: string
  debugLabel: string
  resetZoomLabel: string
  zoomPercent: number
}>()

const emit = defineEmits<{
  resetZoom: []
}>()
</script>

<template>
  <div class="layout-toolbar">
    <div class="mode-switch">
      <button
        type="button"
        class="mode-button"
        :class="{ 'mode-button--active': renderMode === 'normalized' }"
        @click="renderMode = 'normalized'"
      >
        {{ normalizedLabel }}
      </button>
      <button
        type="button"
        class="mode-button"
        :class="{ 'mode-button--active': renderMode === 'source' }"
        @click="renderMode = 'source'"
      >
        {{ sourceLabel }}
      </button>
    </div>
    <label class="debug-toggle">
      <input v-model="showDebug" type="checkbox" />
      <span>{{ debugLabel }}</span>
    </label>
    <div class="zoom-controls">
      <span class="zoom-label">{{ zoomPercent }}%</span>
      <button v-if="zoomPercent !== 100" type="button" class="zoom-reset" @click="emit('resetZoom')">
        {{ resetZoomLabel }}
      </button>
    </div>
  </div>
</template>

<style scoped>
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
  background: var(--bg-panel);
}

.mode-button {
  border: 0;
  border-radius: 6px;
  padding: 6px 12px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-weight: 600;
  font-size: 12px;
  transition: all 0.2s ease;
}

.mode-button--active {
  background: var(--gold-border);
  color: var(--gold);
}

.debug-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
}

.debug-toggle input {
  accent-color: var(--gold);
}

.zoom-controls {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.zoom-label {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  min-width: 36px;
  text-align: center;
}

.zoom-reset {
  border: 0;
  border-radius: 6px;
  padding: 4px 10px;
  background: var(--gold-border);
  color: var(--gold);
  cursor: pointer;
  font-weight: 600;
  font-size: 11px;
  transition: all 0.2s ease;
}

.zoom-reset:hover {
  background: rgba(196, 163, 90, 0.35);
}

@media (max-width: 980px) {
  .layout-toolbar {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 720px) {
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
}
</style>
