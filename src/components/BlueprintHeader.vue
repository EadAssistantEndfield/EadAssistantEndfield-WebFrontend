<script setup lang="ts">
import { ref } from 'vue'
import { localeOptions, type Locale } from '@/i18n/messages'
import { useBlueprintI18n } from '@/composables/useBlueprintI18n'

defineProps<{
  sourceName: string
}>()

const emit = defineEmits<{
  rebuild: []
  fileSelected: [file: File]
}>()

const { locale, t } = useBlueprintI18n()
const isDragging = ref(false)

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
</script>

<template>
  <section class="hero-card panel-card">
    <div class="hero-copy">
      <p class="eyebrow">Vite + Vue Blueprint Analysis</p>
      <h1>{{ t('title') }}</h1>
      <p class="hero-text">{{ t('subtitle') }}</p>
    </div>

    <div class="hero-actions">
      <label
        class="drop-zone"
        :class="{ 'drop-zone--active': isDragging }"
        @dragenter.prevent="isDragging = true"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop="handleDrop"
      >
        <input accept=".json,application/json" class="sr-only" type="file" @change="handleFileChange" />
        <strong>{{ t('dropPrimary') }}</strong>
        <span>{{ t('dropSecondary') }}</span>
      </label>

      <div class="toolbar">
        <button class="primary-button" type="button" @click="emit('rebuild')">{{ t('reload') }}</button>
        <label class="locale-switch">
          <span>{{ t('locale') }}</span>
          <select :value="locale" class="locale-select" @change="updateLocale">
            <option v-for="option in localeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
        <span class="source-pill">{{ t('currentFile') }}：{{ sourceName }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-card {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(300px, 0.85fr);
  gap: 18px;
  align-items: center;
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 24px;
  backdrop-filter: blur(18px);
  box-shadow: 0 24px 60px rgba(2, 6, 23, 0.36);
  padding: 20px 22px;
}

.eyebrow {
  margin: 0 0 10px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 12px;
  font-weight: 800;
  color: #f8c44f;
}

h1,
p {
  margin: 0;
}

h1 {
  font-size: clamp(30px, 4vw, 46px);
  line-height: 1.05;
}

.hero-text {
  color: #9fb0c8;
}

.hero-actions {
  display: grid;
  gap: 12px;
}

.drop-zone {
  display: grid;
  place-items: center;
  gap: 6px;
  min-height: 164px;
  border: 1px dashed rgba(125, 211, 252, 0.36);
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.18), rgba(59, 130, 246, 0.14));
  color: #dbeafe;
  cursor: pointer;
  text-align: center;
  padding: 18px;
}

.drop-zone--active {
  border-color: rgba(250, 204, 21, 0.68);
  background: linear-gradient(135deg, rgba(217, 119, 6, 0.2), rgba(14, 165, 233, 0.18));
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.locale-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #cbd5e1;
}

.locale-select {
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.88);
  color: #e2e8f0;
  padding: 8px 12px;
}

.primary-button,
.source-pill {
  border-radius: 999px;
  padding: 10px 16px;
}

.primary-button {
  border: 0;
  background: linear-gradient(135deg, #f59e0b, #ea580c);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.source-pill {
  background: rgba(148, 163, 184, 0.14);
  border: 1px solid rgba(148, 163, 184, 0.22);
  color: #cbd5e1;
}

@media (max-width: 1180px) {
  .hero-card {
    grid-template-columns: 1fr;
  }
}
</style>
