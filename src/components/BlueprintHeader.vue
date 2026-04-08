<script setup lang="ts">
import { computed, ref } from 'vue'
import { useBlueprintI18n } from '@/composables/useBlueprintI18n'
import type { Locale } from '@/i18n/messages'

type BlueprintWorkbenchView = 'json' | 'layout'

const props = defineProps<{
  sourceName: string
  shareCode: string
  currentView: BlueprintWorkbenchView
  canViewLayout: boolean
}>()

const emit = defineEmits<{
  rebuild: []
  fileSelected: [file: File]
  viewChange: [view: BlueprintWorkbenchView]
}>()

const { locale, localeOptions, t } = useBlueprintI18n()
const isDragging = ref(false)
const copyState = ref('')
let copyTimer: number | undefined

const statusText = computed(() => (props.currentView === 'json' ? t('headerStatusJson') : t('headerStatusLayout')))
const shareLabel = computed(() => copyState.value || t('shareCode'))

async function emitFile(file?: File) {
  if (!file) {
    return
  }

  emit('fileSelected', file)
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  await emitFile(target.files?.[0])
  target.value = ''
}

async function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false
  await emitFile(event.dataTransfer?.files?.[0])
}

function updateLocale(event: Event) {
  const target = event.target as HTMLSelectElement
  locale.value = target.value as Locale
}

async function copyShareCode() {
  const text = props.shareCode && props.shareCode !== '-' ? props.shareCode : props.sourceName
  if (!text || typeof navigator === 'undefined' || !navigator.clipboard) {
    copyState.value = t('copyUnavailable')
    return
  }

  await navigator.clipboard.writeText(text)
  copyState.value = t('copied')
  window.clearTimeout(copyTimer)
  copyTimer = window.setTimeout(() => {
    copyState.value = ''
  }, 1800)
}
</script>

<template>
  <header class="header">
    <div class="header-left">
      <h1 class="header-title">{{ t('title') }}</h1>
      <span class="header-subtitle">{{ t('headerSubtitle') }}</span>
    </div>

    <div class="header-right">
      <span class="status-text">{{ statusText }}</span>

      <div class="header-actions">
        <div class="view-switch">
          <button
            type="button"
            class="view-switch__button"
            :class="{ 'view-switch__button--active': currentView === 'layout' }"
            :disabled="!canViewLayout"
            @click="emit('viewChange', 'layout')"
          >
            {{ t('viewLayout') }}
          </button>
          <button
            type="button"
            class="view-switch__button"
            :class="{ 'view-switch__button--active': currentView === 'json' }"
            @click="emit('viewChange', 'json')"
          >
            {{ t('viewJson') }}
          </button>
        </div>

        <button type="button" class="btn btn-gold" @click="copyShareCode">
          {{ shareLabel }}
        </button>

        <label
          class="btn btn-outline"
          :class="{ 'drop-zone--active': isDragging }"
          @dragenter.prevent="isDragging = true"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop="handleDrop"
        >
          <input accept=".json,application/json" class="sr-only" type="file" @change="handleFileChange" />
          <span class="btn-icon-text">&#128196;</span>
          {{ t('chooseFile') }}
        </label>

        <label class="locale-switch">
          <select :value="locale" class="locale-select" @change="updateLocale">
            <option v-for="option in localeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  height: 95px;
  width: 100%;
  background: var(--panel-overlay-strong);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.02);
  padding: 0 29px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  shrink: 0;
}

.header-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 0;
}

.header-title {
  color: var(--text-primary);
  font-size: 24px;
  font-weight: 500;
  line-height: 28.13px;
  letter-spacing: 0;
  text-align: left;
  margin: 0;
}

.header-subtitle {
  color: rgba(247, 208, 72, 1);
  font-size: 18px;
  font-weight: 500;
  line-height: 21.1px;
  letter-spacing: 0;
  text-align: left;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.status-text {
  color: var(--text-secondary);
  font-size: 14px;
  white-space: nowrap;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.view-switch {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
}

.view-switch__button {
  min-height: 30px;
  padding: 0 14px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    opacity 0.2s ease;
}

.view-switch__button:hover:not(:disabled) {
  color: var(--text-primary);
}

.view-switch__button--active {
  background: rgba(196, 163, 90, 0.2);
  color: var(--gold);
}

.view-switch__button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 34px;
  padding: 0 18px;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-gold {
  background: transparent;
  border: 1px solid var(--gold);
  color: var(--gold);
}

.btn-gold:hover {
  background: rgba(196, 163, 90, 0.1);
}

.btn-outline {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.btn-outline:hover {
  border-color: var(--gold);
  color: var(--gold);
}

.btn-icon-text {
  font-size: 14px;
}

.drop-zone--active {
  border-color: var(--gold) !important;
  background: rgba(196, 163, 90, 0.1);
}

.sr-only {
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;
}

.locale-switch {
  display: flex;
  align-items: center;
}

.locale-select {
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
}

.locale-select:hover {
  border-color: var(--gold);
}

@media (max-width: 1180px) {
  .header {
    height: auto;
    min-height: 95px;
    padding: 12px 29px;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
  }

  .header-right {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .header-actions {
    flex-wrap: wrap;
  }
}

@media (max-width: 900px) {
  .header {
    padding: 12px 20px;
  }

  .header-left {
    width: 100%;
  }

  .header-right {
    gap: 10px;
  }

  .status-text {
    width: 100%;
    order: 2;
  }

  .header-actions {
    width: 100%;
    order: 1;
  }
}

@media (max-width: 640px) {
  .header-title {
    font-size: 20px;
    line-height: 24px;
  }

  .header-subtitle,
  .status-text {
    font-size: 14px;
  }

  .header-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .view-switch {
    grid-column: 1 / -1;
    justify-content: stretch;
  }

  .view-switch__button {
    flex: 1;
  }

  .btn,
  .locale-switch {
    width: 100%;
  }

  .locale-select {
    width: 100%;
  }
}
</style>
